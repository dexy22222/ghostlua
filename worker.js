// ═══════════════════════════════════════════════════════════════
// GhostLua Cloudflare Worker — Security + Steam API + AI Chat
// ═══════════════════════════════════════════════════════════════

const STEAM_BASE = 'https://api.steampowered.com';

// ── Security Headers (Rust Protection) ──────────────────────────
const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'SAMEORIGIN',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' cdn.tailwindcss.com cdnjs.cloudflare.com fonts.googleapis.com",
    "style-src 'self' 'unsafe-inline' cdnjs.cloudflare.com fonts.googleapis.com fonts.gstatic.com",
    "img-src * data: blob:",
    "connect-src *",
    "font-src * data:",
    "frame-ancestors 'none'",
  ].join('; '),
};

// ── Rate Limiting ────────────────────────────────────────────────
const rateLimitStore = new Map();
const RATE_WINDOW    = 60_000; // 1 minute window
const RATE_MAX_AI    = 20;     // AI: 20 req/min per IP
const RATE_MAX_API   = 120;    // API: 120 req/min per IP

function checkRateLimit(ip, type = 'api') {
  const now = Date.now();
  const key = `${type}:${ip || 'unknown'}`;
  let rec = rateLimitStore.get(key);
  if (!rec || now > rec.resetAt) {
    rec = { count: 0, resetAt: now + RATE_WINDOW };
  }
  rec.count++;
  rateLimitStore.set(key, rec);
  const max = type === 'ai' ? RATE_MAX_AI : RATE_MAX_API;
  return {
    allowed:    rec.count <= max,
    remaining:  Math.max(0, max - rec.count),
    retryAfter: Math.ceil((rec.resetAt - now) / 1000),
  };
}

// ── CORS ─────────────────────────────────────────────────────────
function corsHeaders(origin) {
  return {
    'Access-Control-Allow-Origin':  '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age':       '86400',
  };
}

// ── Response helpers ─────────────────────────────────────────────
function addSecHeaders(response) {
  const h = new Headers(response.headers);
  Object.entries(SECURITY_HEADERS).forEach(([k, v]) => h.set(k, v));
  return new Response(response.body, { status: response.status, headers: h });
}

function json(obj, status = 200, extra = {}) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...SECURITY_HEADERS,
      ...extra,
    },
  });
}

function rateLimitResp(rl) {
  return json(
    { error: 'Too many requests. Please slow down.' },
    429,
    { 'Retry-After': String(rl.retryAfter), 'X-RateLimit-Remaining': '0' }
  );
}

// ── Steam API helper ─────────────────────────────────────────────
async function steamApi(path, params, key) {
  const url = new URL(STEAM_BASE + path);
  url.searchParams.set('key', key);
  Object.entries(params || {}).forEach(([k, v]) => url.searchParams.set(k, String(v)));
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Steam API ${res.status}`);
  return res.json();
}

// ── GhostBot system prompt ───────────────────────────────────────
const GHOSTBOT_PROMPT = `You are GhostBot, the helpful AI assistant for GhostLua (ghostlua.com).
GhostLua is a free platform for downloading Lua scripts for Steam games used with SteamTools.
Keep responses short, friendly, and under 150 words.
Installation: 1) Install SteamTools 2) Find game on GhostLua 3) Click Download 4) Drag .lua file onto the floating SteamTools icon 5) Restart Steam.
If a game isn't found, suggest using the search bar or trying SteamRip as a fallback.
Do not discuss illegal activities. Be concise.`;

// ════════════════════════════════════════════════════════════════
export default {
  async fetch(request, env, ctx) {
    const url    = new URL(request.url);
    const origin = request.headers.get('Origin') || '';
    const ip     = request.headers.get('CF-Connecting-IP') || 'unknown';

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: { ...corsHeaders(origin), ...SECURITY_HEADERS },
      });
    }

    // ── AI Chat ──────────────────────────────────────────────────
    if (url.pathname === '/api/ai/chat' && request.method === 'POST') {
      const rl = checkRateLimit(ip, 'ai');
      if (!rl.allowed) return rateLimitResp(rl);

      if (!env.AI) {
        return json(
          { error: 'AI not available. Ensure [ai] binding is in wrangler.toml and site is deployed to Cloudflare.' },
          503, corsHeaders(origin)
        );
      }

      try {
        const body     = await request.json();
        const messages = (body.messages || []).slice(-8);
        if (!messages.length) return json({ error: 'No messages' }, 400, corsHeaders(origin));

        const response = await env.AI.run('@cf/meta/llama-4-scout-17b-16e-instruct', {
          messages: [{ role: 'system', content: GHOSTBOT_PROMPT }, ...messages],
          max_tokens: 256,
        });

        return json(
          { response: response.response || 'Sorry, I could not generate a response.' },
          200, corsHeaders(origin)
        );
      } catch (e) {
        return json({ error: e.message || 'AI error' }, 500, corsHeaders(origin));
      }
    }

    // ── Steam API proxy ──────────────────────────────────────────
    if (url.pathname.startsWith('/api/steam/') && env.STEAM_API_KEY) {
      const rl = checkRateLimit(ip, 'api');
      if (!rl.allowed) return rateLimitResp(rl);

      try {
        const key = env.STEAM_API_KEY;
        let data;

        if (url.pathname === '/api/steam/resolve') {
          const vanity = url.searchParams.get('vanity');
          if (!vanity) return json({ error: 'Missing vanity' }, 400, corsHeaders(origin));
          data = await steamApi('/ISteamUser/ResolveVanityURL/v1/', { vanityurl: vanity }, key);
        } else if (url.pathname === '/api/steam/summary') {
          const steamids = url.searchParams.get('steamids');
          if (!steamids) return json({ error: 'Missing steamids' }, 400, corsHeaders(origin));
          data = await steamApi('/ISteamUser/GetPlayerSummaries/v2/', { steamids }, key);
        } else if (url.pathname === '/api/steam/games') {
          const steamid = url.searchParams.get('steamid');
          if (!steamid) return json({ error: 'Missing steamid' }, 400, corsHeaders(origin));
          data = await steamApi('/IPlayerService/GetOwnedGames/v1/', {
            steamid, include_appinfo: 1, include_played_free_games: 1,
          }, key);
        } else if (url.pathname === '/api/steam/friends') {
          const steamid = url.searchParams.get('steamid');
          if (!steamid) return json({ error: 'Missing steamid' }, 400, corsHeaders(origin));
          data = await steamApi('/ISteamUser/GetFriendList/v1/', { steamid }, key);
        } else {
          return json({ error: 'Unknown endpoint' }, 404, corsHeaders(origin));
        }

        return json(data, 200, corsHeaders(origin));
      } catch (e) {
        return json({ error: e.message || 'Steam API error' }, 500, corsHeaders(origin));
      }
    }

    // ── Static assets ────────────────────────────────────────────
    if (env.ASSETS) {
      const res = await env.ASSETS.fetch(request);
      return addSecHeaders(res);
    }

    return json({ error: 'Not found' }, 404);
  },
};
