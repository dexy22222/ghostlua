const http  = require('http');
const https = require('https');
const fs    = require('fs');
const path  = require('path');

const STEAM_API_KEY  = 'FFCB66298DB13D946E747FDFEBB02FCB';
const STEAM_API_BASE = 'https://api.steampowered.com';
const STEAM_STORE    = 'https://store.steampowered.com';

function httpsGetJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'GhostLua/1.0' } }, res => {
      let raw = '';
      res.on('data', c => raw += c);
      res.on('end', () => {
        try { resolve(JSON.parse(raw)); }
        catch (e) { reject(new Error('Invalid JSON from upstream')); }
      });
    }).on('error', reject);
  });
}

function steamApiGet(iface, method, version, params) {
  const q = new URLSearchParams({ key: STEAM_API_KEY, ...params });
  return httpsGetJson(`${STEAM_API_BASE}/${iface}/${method}/${version}/?${q}`);
}

const ROOT = __dirname;
const PORT = 3456;

const MIME = {
  '.html': 'text/html',
  '.css':  'text/css',
  '.js':   'application/javascript',
  '.json': 'application/json',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
  '.webp': 'image/webp',
};

// ── Database helpers ──────────────────────────────────────────────────────────
let _dbCache   = null;
let _dbLoadedAt = 0;

function loadDatabase(cb) {
  const now = Date.now();
  if (_dbCache && now - _dbLoadedAt < 30000) { cb(null, _dbCache); return; }
  fs.readFile(path.join(ROOT, 'data', 'database.json'), 'utf8', (err, data) => {
    if (err) { cb(err, null); return; }
    try {
      _dbCache    = JSON.parse(data);
      _dbLoadedAt = now;
      cb(null, _dbCache);
    } catch (e) { cb(e, null); }
  });
}

function sendJSON(res, status, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(status, {
    'Content-Type':  'application/json',
    'Cache-Control': 'no-cache',
  });
  res.end(body);
}

// ── Request handler ───────────────────────────────────────────────────────────
http.createServer((req, res) => {
  // CORS pre-flight (for any external tools)
  if (req.method === 'OPTIONS') {
    res.writeHead(204, { 'Access-Control-Allow-Origin': '*' });
    res.end(); return;
  }

  const [rawPath, qs = ''] = req.url.split('?');

  // ── API routes ──────────────────────────────────────────────────────────────
  if (rawPath.startsWith('/api/')) {

    // GET /api/check?appid=XXXXXXX
    if (rawPath === '/api/check') {
      const params = new URLSearchParams(qs);
      const appId  = params.get('appid') || '';
      if (!appId) { sendJSON(res, 400, { error: 'Missing appid parameter' }); return; }

      loadDatabase((err, db) => {
        if (err) { sendJSON(res, 500, { error: 'Database unavailable' }); return; }
        const game = db.find(g => String(g.appId) === String(appId));
        sendJSON(res, 200, { exists: !!game, game: game || null });
      });
      return;
    }

    // GET /api/games/top
    if (rawPath === '/api/games/top') {
      fs.readFile(path.join(ROOT, 'data', 'top-games.json'), 'utf8', (err, data) => {
        if (err) { sendJSON(res, 500, { error: 'Not available' }); return; }
        res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'max-age=60' });
        res.end(data);
      });
      return;
    }

    // GET /api/games/trending
    if (rawPath === '/api/games/trending') {
      fs.readFile(path.join(ROOT, 'data', 'trending.json'), 'utf8', (err, data) => {
        if (err) { sendJSON(res, 500, { error: 'Not available' }); return; }
        res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'max-age=60' });
        res.end(data);
      });
      return;
    }

    // GET /api/stats  (simple aggregate for display)
    if (rawPath === '/api/stats') {
      loadDatabase((err, db) => {
        if (err) { sendJSON(res, 500, { error: 'Database unavailable' }); return; }
        sendJSON(res, 200, { totalGames: db.length });
      });
      return;
    }

    // GET /api/steam/search?q=QUERY  — Steam store search (server-side, no CORS proxy needed)
    if (rawPath === '/api/steam/search') {
      const params  = new URLSearchParams(qs);
      const q       = params.get('q') || '';
      if (!q) { sendJSON(res, 400, { error: 'Missing q parameter' }); return; }
      const storeUrl = `${STEAM_STORE}/api/storesearch/?term=${encodeURIComponent(q)}&l=english&cc=US`;
      httpsGetJson(storeUrl).then(data => {
        sendJSON(res, 200, data);
      }).catch(() => sendJSON(res, 502, { error: 'Steam store unavailable' }));
      return;
    }

    // GET /api/steam/resolve?vanity=NAME
    if (rawPath === '/api/steam/resolve') {
      const params = new URLSearchParams(qs);
      const vanity = params.get('vanity') || '';
      if (!vanity) { sendJSON(res, 400, { error: 'Missing vanity' }); return; }
      steamApiGet('ISteamUser', 'ResolveVanityURL', 'v1', { vanityurl: vanity })
        .then(data => sendJSON(res, 200, data))
        .catch(() => sendJSON(res, 502, { error: 'Steam API unavailable' }));
      return;
    }

    // GET /api/steam/summary?steamids=ID,ID,...
    if (rawPath === '/api/steam/summary') {
      const params   = new URLSearchParams(qs);
      const steamids = params.get('steamids') || '';
      if (!steamids) { sendJSON(res, 400, { error: 'Missing steamids' }); return; }
      steamApiGet('ISteamUser', 'GetPlayerSummaries', 'v2', { steamids })
        .then(data => sendJSON(res, 200, data))
        .catch(() => sendJSON(res, 502, { error: 'Steam API unavailable' }));
      return;
    }

    // GET /api/steam/games?steamid=ID
    if (rawPath === '/api/steam/games') {
      const params  = new URLSearchParams(qs);
      const steamid = params.get('steamid') || '';
      if (!steamid) { sendJSON(res, 400, { error: 'Missing steamid' }); return; }
      steamApiGet('IPlayerService', 'GetOwnedGames', 'v1', {
        steamid, include_appinfo: 1, include_played_free_games: 1,
      }).then(data => sendJSON(res, 200, data))
        .catch(() => sendJSON(res, 502, { error: 'Steam API unavailable' }));
      return;
    }

    // GET /api/steam/friends?steamid=ID
    if (rawPath === '/api/steam/friends') {
      const params  = new URLSearchParams(qs);
      const steamid = params.get('steamid') || '';
      if (!steamid) { sendJSON(res, 400, { error: 'Missing steamid' }); return; }
      steamApiGet('ISteamUser', 'GetFriendList', 'v1', { steamid })
        .then(data => sendJSON(res, 200, data))
        .catch(() => sendJSON(res, 502, { error: 'Steam API unavailable' }));
      return;
    }

    // GET /api/community/members
    if (rawPath === '/api/community/members') {
      const commFile = path.join(ROOT, 'data', 'community.json');
      fs.readFile(commFile, 'utf8', (err, data) => {
        if (err) { sendJSON(res, 200, { members: [] }); return; }
        try { sendJSON(res, 200, JSON.parse(data)); }
        catch { sendJSON(res, 200, { members: [] }); }
      });
      return;
    }

    // POST /api/community/join  — body: { steamid }
    if (rawPath === '/api/community/join' && req.method === 'POST') {
      let body = '';
      req.on('data', c => body += c);
      req.on('end', () => {
        let payload;
        try { payload = JSON.parse(body); } catch { sendJSON(res, 400, { error: 'Invalid JSON' }); return; }
        const steamid = String(payload.steamid || '').trim();
        if (!/^\d{17}$/.test(steamid)) { sendJSON(res, 400, { error: 'Invalid Steam ID (must be 17 digits)' }); return; }

        // Fetch player summary from Steam
        steamApiGet('ISteamUser', 'GetPlayerSummaries', 'v2', { steamids: steamid })
          .then(data => {
            const player = data?.response?.players?.[0];
            if (!player) { sendJSON(res, 404, { error: 'Steam profile not found' }); return; }

            const commFile = path.join(ROOT, 'data', 'community.json');
            fs.readFile(commFile, 'utf8', (err, raw) => {
              let store = { members: [] };
              if (!err) { try { store = JSON.parse(raw); } catch {} }
              if (!Array.isArray(store.members)) store.members = [];

              const exists = store.members.find(m => m.steamid === steamid);
              if (!exists) {
                store.members.unshift({
                  steamid,
                  name:   player.personaname,
                  avatar: player.avatarfull,
                  state:  player.personastate,
                  joined: Date.now(),
                });
                // Keep max 500 members
                store.members = store.members.slice(0, 500);
                fs.writeFile(commFile, JSON.stringify(store, null, 2), () => {});
              }

              sendJSON(res, 200, {
                ok: true,
                member: {
                  steamid,
                  name:   player.personaname,
                  avatar: player.avatarfull,
                  state:  player.personastate,
                  joined: exists?.joined || Date.now(),
                  existing: !!exists,
                },
              });
            });
          })
          .catch(() => sendJSON(res, 502, { error: 'Steam API unavailable' }));
      });
      return;
    }

    sendJSON(res, 404, { error: 'Unknown API endpoint' });
    return;
  }

  // ── Static file serving ────────────────────────────────────────────────────
  let urlPath = rawPath;
  if (urlPath === '/') urlPath = '/index.html';

  const filePath = path.join(ROOT, urlPath);

  // Security: prevent path traversal
  if (!filePath.startsWith(ROOT + path.sep) && filePath !== ROOT) {
    res.writeHead(403); res.end('Forbidden'); return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not found');
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'text/plain' });
    res.end(data);
  });

}).listen(PORT, () => {
  console.log(`\n  GhostLua  →  http://localhost:${PORT}\n`);
});
