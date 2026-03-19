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

**Do not put your Steam key in `wrangler.toml`, `wrangler.toml.local`, or any committed file.** It would be public on [GitHub](https://github.com/dexy22222/ghostlua) and bundled into the Worker.

For improved profile lookup (custom URLs, faster loading):

1. Get a key at https://steamcommunity.com/dev/apikey
2. **Production / deploy:** `npx wrangler secret put STEAM_API_KEY` and paste the key when prompted  
   **Cloudflare Dashboard:** Workers → your worker → Settings → Variables → Secrets → add `STEAM_API_KEY`
3. **Local `wrangler dev`:** copy [`.dev.vars.example`](./.dev.vars.example) to `.dev.vars`, add `STEAM_API_KEY=...` (`.dev.vars` is gitignored)

See [SECURITY.md](./SECURITY.md) for tokens and rotation if something was ever committed.

Without the key, profile search falls back to Steam community scraping.

## Real `.lua` files from your own API (optional)

Downloads call `GET /api/lua/file?appid=APPID` (and `&name=` for the main game). By default the worker returns a generated `addappid(...)` script. To serve **your** canonical scripts (e.g. from R2, your API, or a licensed partner), set a **HTTPS** URL template that contains the literal substring `{appid}`:

- **Wrangler / Pages:** set variable `LUA_UPSTREAM_TEMPLATE`, for example `https://cdn.yourdomain.com/lua/{appid}.lua`
- **Local `server.js`:** `LUA_UPSTREAM_TEMPLATE="https://..." node server.js`

If the upstream fetch fails or returns empty, the site falls back to the generated snippet. Only point this at hosts you control or are allowed to use.

## Performance tips

- **Production:** replace `cdn.tailwindcss.com` with a pre-built CSS file (Tailwind CLI or Windi) so the browser does not run the JIT compiler on every load.
- Game art already uses `preconnect` to Steam CDNs on the home page; keep images `loading="lazy"` where they are off-screen.

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
