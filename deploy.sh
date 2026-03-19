#!/bin/bash

echo "🚀 GhostLua Deployment Script"
echo "=========================="

# Check if API token is set
if [ -z "$CLOUDFLARE_API_TOKEN" ]; then
    echo "❌ ERROR: CLOUDFLARE_API_TOKEN environment variable not set"
    echo ""
    echo "Please set your Cloudflare API token:"
    echo "export CLOUDFLARE_API_TOKEN=your_token_here"
    echo ""
    echo "Or for Windows:"
    echo "set CLOUDFLARE_API_TOKEN=your_token_here"
    exit 1
fi

echo "✅ API token found"
echo "📦 Installing dependencies..."
npm install

echo "🔧 Deploying to Cloudflare Workers..."
npx wrangler deploy

echo "✅ Deployment complete!"
echo ""
echo "Your GhostLua should be live at:"
echo "https://ghostlua.your-subdomain.workers.dev"
