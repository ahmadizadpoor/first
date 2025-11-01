#!/bin/bash

# Jabama/Jajiga Crawler - Browser Mode Setup Script
# This script sets up and runs the crawler in browser automation mode

echo "╔══════════════════════════════════════════════════════╗"
echo "║   Jabama/Jajiga Crawler - Browser Mode Setup       ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed!"
    echo "📥 Please install Node.js 18+ from https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js found: $(node --version)"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed!"
    exit 1
fi

echo "✅ npm found: $(npm --version)"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "✅ Dependencies installed"
echo ""

# Install Chrome
echo "🌐 Installing Chrome for Puppeteer..."
npx puppeteer browsers install chrome

if [ $? -ne 0 ]; then
    echo "⚠️  Chrome installation failed, but continuing..."
    echo "💡 You can set PUPPETEER_EXECUTABLE_PATH to use system Chrome"
    echo ""
fi

# Update config to browser mode
echo "⚙️  Configuring browser mode..."

# Create a temporary config update
cat > /tmp/update-config.js << 'EOF'
const fs = require('fs');
const configPath = './src/config.ts';
let config = fs.readFileSync(configPath, 'utf-8');

// Update scrapingMethod to browser
config = config.replace(
  /scrapingMethod:\s*['"]manual['"]/,
  "scrapingMethod: 'browser'"
);

fs.writeFileSync(configPath, config);
console.log('✅ Config updated to browser mode');
EOF

node /tmp/update-config.js
echo ""

# Display configuration
echo "📋 Current Configuration:"
echo "   Scraping method: browser"
echo "   Headless mode: true"
echo "   Concurrency: 3"
echo "   Request delay: 2000ms"
echo ""

# Ask user if they want to proceed
read -p "🚀 Ready to run the crawler? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Cancelled. Run 'npm run dev' when ready."
    exit 0
fi

echo ""
echo "🏃 Starting crawler..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Run the crawler
npm run dev

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check if output files were created
if [ -d "output" ]; then
    echo "✅ Crawl complete!"
    echo ""
    echo "📊 Generated files:"
    ls -lh output/ | tail -n +2 | awk '{print "   " $9 " (" $5 ")"}'
    echo ""
    echo "📖 View the report:"
    echo "   cat output/comparison-report.txt"
    echo ""
    echo "📈 View statistics:"
    echo "   cat output/crawler-stats.json"
else
    echo "⚠️  No output directory found. Check for errors above."
fi

echo ""
echo "🎉 Done!"
