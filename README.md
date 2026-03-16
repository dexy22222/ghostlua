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

The site is static — no build step required. It will be live at `https://ghostlua.pages.dev` (or your custom domain).

## Local development

```bash
# With Node.js (optional — for /api routes)
node server.js
# → http://localhost:3456

# Or open index.html directly in a browser (works for most features)
```

## Structure

- `index.html` — Main dashboard
- `js/` — UI, search, download, notifications
- `css/` — Styles
- `data/` — database.json, stats.json, top/trending data
- `images/` — Assets
