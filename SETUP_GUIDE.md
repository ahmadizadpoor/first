# Complete Setup Guide - Jabama/Jajiga Crawler

This guide will help you set up and run the crawler on your own machine with full browser automation.

## 🚀 Quick Setup (5 minutes)

### Step 1: Prerequisites

Make sure you have:
- Node.js 18+ installed ([Download here](https://nodejs.org/))
- Git installed

### Step 2: Clone & Install

```bash
# Clone the repository
git clone <your-repo-url>
cd first

# Install dependencies
npm install

# Install Chrome for Puppeteer
npx puppeteer browsers install chrome
```

### Step 3: Configure for Browser Mode

Edit `src/config.ts` and set:

```typescript
scrapingMethod: 'browser',  // Change from 'manual' to 'browser'
headless: true,              // Set to false to watch it work
```

### Step 4: Run the Crawler

```bash
# Run in development mode
npm run dev

# Or build and run in production
npm run build
npm start
```

## 📋 What Happens Next

The crawler will:

1. **🌐 Initialize Browser**
   - Launch Chrome with stealth mode
   - Load saved cookies (if any)
   - Set realistic headers

2. **📄 Scrape Jabama.com**
   - Visit search page
   - Extract all listing URLs
   - Visit each listing
   - Extract full details (price, location, features, etc.)
   - Save data to `output/jabama-listings.json`

3. **📄 Scrape Jajiga.com**
   - Same process for Jajiga
   - Save to `output/jajiga-listings.json`

4. **🔍 Compare Listings**
   - Match listings using AI algorithm
   - Calculate similarity scores
   - Identify exact matches, partial matches
   - Find price differences
   - Generate comprehensive report

5. **📊 Generate Reports**
   - `output/comparison-results.json` - Full comparison data
   - `output/comparison-report.txt` - Human-readable report
   - `output/crawler-stats.json` - Performance metrics

## 🎯 Expected Results

You should see output like:

```
╔══════════════════════════════════════════════════════╗
║   Jabama vs Jajiga Listing Comparison Crawler      ║
╚══════════════════════════════════════════════════════╝

⚙️  Configuration:
   Scraping method: browser
   Concurrency: 3
   Request delay: 2000ms
   Headless mode: true

🌐 Initializing browser...
✅ Browser initialized

Step 1/3: Scraping Jabama listings...
📄 Fetching: https://www.jabama.com/search
Found 150 listing URLs on Jabama
Scraped Jabama listing: ویلای لوکس در شمال...
Scraped Jabama listing: آپارتمان دنج در...
...
Successfully scraped 145 listings from Jabama

Step 2/3: Scraping Jajiga listings...
...

Step 3/3: Comparing listings...
...

Total Jabama listings analyzed: 145
Exact matches found: 87 (60.0%)
Partial matches found: 42 (29.0%)
No matches found: 16 (11.0%)
```

## 🛠️ Troubleshooting

### Issue: "Chrome not found"

**Solution 1: Install Chrome**
```bash
npx puppeteer browsers install chrome
```

**Solution 2: Use system Chrome**
```bash
# Linux
export PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# macOS
export PUPPETEER_EXECUTABLE_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

# Windows
set PUPPETEER_EXECUTABLE_PATH="C:\Program Files\Google\Chrome\Application\chrome.exe"
```

### Issue: Still getting 403 errors

**Solution: Use proxies**

Edit `src/config.ts`:
```typescript
useProxy: true,
proxyList: [
  'http://proxy1.example.com:8080',
  'http://username:password@proxy2.example.com:8080'
]
```

Get proxies from:
- [BrightData](https://brightdata.com/)
- [Smartproxy](https://smartproxy.com/)
- [Oxylabs](https://oxylabs.io/)

### Issue: Sites changed structure

**Solution: Update selectors**

1. Visit the site in your browser
2. Right-click → Inspect Element
3. Find the HTML structure
4. Update selectors in `src/scrapers/jabama.ts` and `src/scrapers/jajiga.ts`

Example:
```typescript
// Old selector
$('a[href*="/villa/"]')

// New selector (if structure changed)
$('.property-card a')
```

### Issue: Too slow

**Solution: Adjust concurrency**

Edit `src/config.ts`:
```typescript
maxConcurrency: 5,  // Increase from 3
requestDelay: 1000, // Reduce from 2000ms
```

## 🔧 Advanced Configuration

### Use Manual Mode for Testing

```typescript
scrapingMethod: 'manual'
```

Then save HTML files to `manual-html/`:
1. Visit Jabama/Jajiga in browser
2. View Page Source (Ctrl+U)
3. Save as `.html` in `manual-html/`
4. Run crawler

### Watch Browser in Action

```typescript
headless: false  // You'll see Chrome opening and scraping
```

### Add Custom Cookies

Create/edit `cookies.json`:
```json
[
  {
    "name": "session_id",
    "value": "your-session-id",
    "domain": ".jabama.com",
    "path": "/"
  }
]
```

Get cookies from:
1. Open DevTools (F12)
2. Application → Cookies
3. Copy values

### Detect APIs First

```bash
npm run detect-api
```

This might find public APIs you can use instead of scraping HTML.

## 📊 Optimizing Results

### Get More Listings

The scrapers currently look for listings in the search page. To get more:

1. **Multi-page support**: Update scrapers to paginate
2. **Category pages**: Add URLs for different categories (villas, apartments, etc.)
3. **Location-based**: Scrape specific cities/regions

Example:
```typescript
const urls = [
  'https://www.jabama.com/search?location=tehran',
  'https://www.jabama.com/search?location=shiraz',
  'https://www.jabama.com/search?location=isfahan',
  // ...
];
```

### Improve Match Accuracy

Adjust weights in `src/comparator.ts`:
```typescript
const weights = {
  title: 0.4,      // Increase if titles are most important
  location: 0.3,   // Increase if location is key
  price: 0.2,      // etc.
  bedrooms: 0.05,
  capacity: 0.05,
};
```

### Export to Different Formats

Add to `src/index.ts`:
```typescript
// Export to CSV
import { writeFileSync } from 'fs';
const csv = convertToCSV(comparisonResults);
writeFileSync('output/results.csv', csv);

// Export to Excel (install: npm install xlsx)
import XLSX from 'xlsx';
const ws = XLSX.utils.json_to_sheet(comparisonResults);
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, "Comparison");
XLSX.writeFile(wb, 'output/results.xlsx');
```

## 🎓 Understanding the Results

### Match Score Explained

- **95-100%**: Exact match - definitely the same property
- **70-95%**: Partial match - very likely the same, minor differences
- **0-70%**: No match - probably different properties

### Common Differences

Even for the same property, you might see:
- **Price differences**: One site might charge more/less
- **Title variations**: Different wording
- **Feature names**: "WiFi" vs "Internet", "Pool" vs "Swimming Pool"
- **Location format**: "Tehran, Lavasan" vs "Lavasan, Tehran"

### Using the Data

The comparison results help you:
1. **Find arbitrage opportunities**: Buy from cheaper site, list on expensive one
2. **Track price changes**: Run daily and compare
3. **Quality comparison**: See which site has better descriptions/photos
4. **Verify listings**: Ensure they're legitimate (same property exists on both)

## 📅 Running Regularly

### Cron Job (Linux/Mac)

```bash
# Edit crontab
crontab -e

# Add line to run daily at 2 AM
0 2 * * * cd /path/to/first && npm run crawl >> /var/log/crawler.log 2>&1
```

### Windows Task Scheduler

1. Open Task Scheduler
2. Create Basic Task
3. Set schedule (daily)
4. Action: Start a program
5. Program: `npm`
6. Arguments: `run crawl`
7. Start in: `C:\path\to\first`

### Monitoring

Add to `src/index.ts` to get notifications:
```typescript
// Email notification (using nodemailer)
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({...});
await transporter.sendMail({
  to: 'you@example.com',
  subject: `Crawler Complete: ${stats.exactMatches} matches found`,
  text: report
});

// Or Slack/Discord webhook
await fetch('YOUR_WEBHOOK_URL', {
  method: 'POST',
  body: JSON.stringify({ text: report })
});
```

## 🆘 Getting Help

If you encounter issues:

1. Check the console output for errors
2. Look at the generated files in `output/`
3. Try running in non-headless mode: `headless: false`
4. Test with manual mode first
5. Check the troubleshooting section above

## ✅ Success Checklist

- [ ] Node.js 18+ installed
- [ ] Dependencies installed (`npm install`)
- [ ] Chrome installed (`npx puppeteer browsers install chrome`)
- [ ] Config updated (`scrapingMethod: 'browser'`)
- [ ] First run successful (`npm run dev`)
- [ ] Output files generated in `output/`
- [ ] Comparison report looks good

## 🎉 You're Ready!

Run the crawler and watch it automatically:
1. Open Chrome in stealth mode
2. Visit both websites
3. Extract all listings
4. Compare them intelligently
5. Generate comprehensive reports

**Happy crawling! 🚀**
