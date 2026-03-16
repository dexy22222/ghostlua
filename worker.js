// Cloudflare Worker — Steam API proxy (optional)
// Add your Steam API key: wrangler secret put STEAM_API_KEY
// Get a key at https://steamcommunity.com/dev/apikey

const STEAM_BASE = 'https://api.steampowered.com';

async function steamApi(path, params, key) {
  const url = new URL(STEAM_BASE + path);
  url.searchParams.set('key', key);
  Object.entries(params || {}).forEach(([k, v]) => url.searchParams.set(k, String(v)));
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Steam API ${res.status}`);
  return res.json();
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname.startsWith('/api/steam/') && env.STEAM_API_KEY) {
      try {
        const key = env.STEAM_API_KEY;
        let data;

        if (url.pathname === '/api/steam/resolve') {
          const vanity = url.searchParams.get('vanity');
          if (!vanity) return json({ error: 'Missing vanity' }, 400);
          data = await steamApi('/ISteamUser/ResolveVanityURL/v1/', { vanityurl: vanity }, key);
        } else if (url.pathname === '/api/steam/summary') {
          const steamids = url.searchParams.get('steamids');
          if (!steamids) return json({ error: 'Missing steamids' }, 400);
          data = await steamApi('/ISteamUser/GetPlayerSummaries/v2/', { steamids }, key);
        } else if (url.pathname === '/api/steam/games') {
          const steamid = url.searchParams.get('steamid');
          if (!steamid) return json({ error: 'Missing steamid' }, 400);
          data = await steamApi('/IPlayerService/GetOwnedGames/v1/', {
            steamid,
            include_appinfo: 1,
            include_played_free_games: 1,
          }, key);
        } else if (url.pathname === '/api/steam/friends') {
          const steamid = url.searchParams.get('steamid');
          if (!steamid) return json({ error: 'Missing steamid' }, 400);
          data = await steamApi('/ISteamUser/GetFriendList/v1/', { steamid }, key);
        } else {
          return json({ error: 'Unknown endpoint' }, 404);
        }

        return json(data);
      } catch (e) {
        return json({ error: e.message || 'Steam API error' }, 500);
      }
    }

    if (env.ASSETS) return env.ASSETS.fetch(request);
    return new Response('Not found', { status: 404 });
  },
};

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  });
}
