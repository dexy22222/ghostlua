@echo off
echo 🚀 GhostLua Deployment Script
echo ==========================

REM Check if API token is set
if "%CLOUDFLARE_API_TOKEN%"=="" (
    echo ❌ ERROR: CLOUDFLARE_API_TOKEN environment variable not set
    echo.
    echo Please set your Cloudflare API token:
    echo set CLOUDFLARE_API_TOKEN=your_token_here
    echo.
    echo Then run this script again
    pause
    exit /b 1
)

echo ✅ API token found
echo 📦 Installing dependencies...
call npm install

echo 🔧 Deploying to Cloudflare Workers...
call npx wrangler deploy

echo ✅ Deployment complete!
echo.
echo Your GhostLua should be live at:
echo https://ghostlua.your-subdomain.workers.dev
pause
