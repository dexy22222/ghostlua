# GhostLua Deployment Fix

The deployment is failing because of asset size and configuration issues. Here's the complete fix:

## Method 1: Simple Worker Deployment (Recommended)

Replace your `wrangler.toml` with this simplified version:

```toml
name = "ghostlua"
main = "worker.js"
compatibility_date = "2024-01-01"

[ai]
binding = "AI"

[vars]
STEAM_API_KEY = ""
```

## Method 2: Manual Deployment via Cloudflare Dashboard

1. Go to https://dash.cloudflare.com/workers
2. Click "Create Application"
3. Name it "ghostlua"
4. Copy the entire content of `worker.js`
5. Paste it into the editor
6. Click "Deploy"

## Method 3: Use Pages Instead (Easiest)

Since you have static files, use Cloudflare Pages:

1. Push your code to GitHub
2. Go to https://dash.cloudflare.com/pages
3. Connect your GitHub repository
4. Deploy from the `main` branch
5. Set build command: `echo "No build needed"`
6. Set output directory: `.`

## Current Issues Fixed

1. **Asset Size**: Removed assets directory configuration
2. **API Token**: Need to set CLOUDFLARE_API_TOKEN
3. **Configuration**: Simplified wrangler.toml
4. **Dependencies**: Excluded node_modules properly

## Quick Deploy Commands

```bash
# Set your API token first
set CLOUDFLARE_API_TOKEN=your_actual_token_here

# Then deploy
cd "c:\Users\daviq\Downloads\website\openlua-clone"
npx wrangler deploy
```

## Alternative: Use Git Integration

1. Install Wrangler CLI globally:
   ```bash
   npm install -g wrangler
   ```

2. Login to Cloudflare:
   ```bash
   wrangler login
   ```

3. Deploy:
   ```bash
   wrangler deploy
   ```

This should resolve all deployment issues!
