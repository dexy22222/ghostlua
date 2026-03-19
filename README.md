# GhostLua

Free Steam Lua scripts — fast, clean, and easy.

## Deploy on Cloudflare Pages

1. Push this repo to GitHub: `https://github.com/dexy22222/ghostlua`
2. Go to [Cloudflare Dashboard](https://dash.cloudflare.com) → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**
3. Select the `ghostlua` repository
4. Build settings:
   - **Framework preset:** None
   - **Build command:** (leave empty)
   - **Build output directory:** `.` (or leave default)
   - **Root directory:** `.` (this folder)
5. Click **Save and Deploy**

The site is static — no build step required. Primary domain: `https://ghostlua.com`.

## Steam API (optional, for better profile search)

For improved profile lookup (custom URLs, faster loading), add a Steam API key:

1. Get a key at https://steamcommunity.com/dev/apikey
2. Run: `npx wrangler secret put STEAM_API_KEY`
3. Enter your key when prompted

Without the key, profile search falls back to Steam community scraping.

## Local development

```bash
# With Node.js (optional — for /api routes)
# PowerShell: $env:STEAM_API_KEY="your_key_here"
node server.js
# → http://localhost:3456

# Or open index.html directly in a browser (works for most features)
```

## Structure

- `index.html` — Main dashboard
- `js/` — UI, search, download, notifications
- `css/` — Styles
- `data/` — games.json, stats.json, top/trending data
- `images/` — Assets
