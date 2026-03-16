const http = require('http');
const fs   = require('fs');
const path = require('path');

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
