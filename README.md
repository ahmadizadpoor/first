# Jabama vs Jajiga Listing Comparison Crawler

A comprehensive TypeScript-based web crawler that scrapes property listings from Jabama.com and Jajiga.com, then intelligently compares and matches them to identify duplicate listings across both platforms.

## 🌟 Features

- **Multiple Scraping Methods**:
  - 🌐 **Browser Automation** (Puppeteer with stealth) - Most reliable
  - 🔌 **HTTP Requests** (Enhanced axios with cookies) - Fastest
  - 📁 **Manual Mode** (Load from saved HTML files) - For testing

- **Anti-Detection Measures**:
  - Stealth browser mode to avoid bot detection
  - Realistic headers and user agents
  - Cookie persistence across sessions
  - Proxy rotation support
  - Random delays and human-like scrolling

- **Intelligent Matching**:
  - Fuzzy string matching with weighted scoring
  - Compares titles, locations, prices, capacity, bedrooms, description
  - Classifies matches as exact, partial, or none

- **Additional Tools**:
  - API detection utility
  - Screenshot capture
  - Detailed reporting and statistics
  - Progress tracking

## 📋 Prerequisites

- Node.js 18+ (includes npm)
- For browser mode: Chrome/Chromium will be installed automatically by Puppeteer

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Run the Crawler

The crawler defaults to browser automation mode for best results:

```bash
npm run dev
```

## ⚙️ Configuration

Edit `src/config.ts` to customize the crawler:

```typescript
export const config: CrawlerConfig = {
  // Scraping method: 'browser', 'http', or 'manual'
  scrapingMethod: 'browser',

  // Browser settings
  headless: true,              // Set false to see browser
  browserTimeout: 60000,       // Browser operation timeout

  // Request settings
  maxConcurrency: 3,           // Simultaneous requests
  requestDelay: 2000,          // Delay between requests (ms)
  timeout: 30000,              // Request timeout
  retryAttempts: 3,            // Retry failed requests

  // Proxy settings
  useProxy: false,
  proxyList: [
    // 'http://proxy1:8080',
    // 'http://user:pass@proxy2:8080'
  ],

  // Cookie persistence
  cookieFile: 'cookies.json',

  // Manual mode directory
  manualHtmlDir: 'manual-html'
};
```

## 🔧 Usage Modes

### Mode 1: Browser Automation (Default - Recommended)

Uses Puppeteer with stealth plugin to bypass anti-bot protections.

```bash
# Run with browser automation
npm run crawl:browser
```

**Advantages:**
- Best success rate against anti-bot measures
- Handles JavaScript-rendered content
- Can solve basic anti-bot challenges
- Realistic browser fingerprint

**Configuration:**
```typescript
scrapingMethod: 'browser'
headless: true  // or false to see the browser
```

### Mode 2: Enhanced HTTP Requests

Uses axios with enhanced headers, cookies, and optional proxies.

```bash
# Run with HTTP mode
npm run crawl:http
```

First, update config:
```typescript
scrapingMethod: 'http'
```

**Advantages:**
- Much faster than browser mode
- Lower resource usage
- Good for sites without strong anti-bot measures

**Disadvantages:**
- May be blocked by anti-bot systems
- Cannot execute JavaScript

### Mode 3: Manual HTML Files

Perfect for development and testing. Save HTML files manually and test your selectors.

```bash
# Run with manual mode
npm run crawl:manual
```

**Setup:**

1. Update config:
```typescript
scrapingMethod: 'manual'
```

2. Create `manual-html/` directory (done automatically)

3. Save HTML files:
   - `jabama-search.html` - Search page from Jabama
   - `jabama-listing-*.html` - Individual listing pages
   - `jajiga-search.html` - Search page from Jajiga
   - `jajiga-listing-*.html` - Individual listing pages

4. Run crawler

**How to save HTML:**
- Method 1: Browser → Right-click → "View Page Source" → Save
- Method 2: Browser → Ctrl+S → "Webpage, HTML Only"
- Method 3: curl command (see manual-html/README.md)

## 🔍 API Detection

Before scraping, check if the sites have public APIs:

```bash
npm run detect-api
```

This will:
- Check common API endpoints
- Analyze robots.txt
- Look for API documentation
- Provide guidance for finding APIs using DevTools

## 🛡️ Anti-Bot Bypass Techniques

### 1. Stealth Browser Mode

Puppeteer-extra with stealth plugin makes the browser undetectable:

```typescript
// Automatically enabled in browser mode
import puppeteerExtra from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
puppeteerExtra.use(StealthPlugin());
```

### 2. Realistic Headers

Enhanced HTTP client sends browser-like headers:

```typescript
'User-Agent': 'Mozilla/5.0...',
'Accept-Language': 'en-US,en;q=0.9,fa;q=0.8',
'Sec-Fetch-Dest': 'document',
'Sec-Fetch-Mode': 'navigate',
// ... and more
```

### 3. Cookie Persistence

Cookies are automatically saved and reloaded:

```typescript
cookieFile: 'cookies.json'
```

You can manually add cookies from your browser for authentication.

### 4. Proxy Rotation

Configure proxies to rotate IPs:

```typescript
useProxy: true,
proxyList: [
  'http://proxy1.example.com:8080',
  'http://username:password@proxy2.example.com:8080'
]
```

### 5. Human-like Behavior

Browser mode includes:
- Random delays between actions
- Automatic page scrolling
- Realistic viewport sizes
- Mouse movement (can be added)

## 📊 Output

The crawler creates an `output/` directory with:

- **jabama-listings.json** - All Jabama listings
- **jajiga-listings.json** - All Jajiga listings
- **comparison-results.json** - Detailed comparison with match scores
- **comparison-report.txt** - Human-readable summary
- **crawler-stats.json** - Runtime statistics
- **cookies.json** - Saved cookies (if enabled)

### Example Output

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
Scraped Jabama listing: Luxury Villa in Tehran
...
Successfully scraped 145 listings from Jabama

Step 2/3: Scraping Jajiga listings...
...

Step 3/3: Comparing listings...

============================================================
LISTING COMPARISON REPORT
============================================================

Total Jabama listings analyzed: 145
Exact matches found: 87 (60.0%)
Partial matches found: 42 (29.0%)
No matches found: 16 (11.0%)
```

## 🎯 How The Matching Works

The comparison algorithm uses weighted scoring:

| Attribute | Weight | Description |
|-----------|--------|-------------|
| Title | 30% | Fuzzy string matching |
| Location | 25% | Fuzzy string matching |
| Price | 15% | Proximity match (with tolerance) |
| Bedrooms | 10% | Exact match |
| Capacity | 10% | Exact match |
| Description | 10% | First 200 chars comparison |

**Match Classifications:**
- **Exact Match** (≥95%): Very likely the same property
- **Partial Match** (70-95%): Possibly the same with differences
- **No Match** (<70%): Different properties

## 🔧 Customization

### Update Selectors

If websites change their HTML structure, update selectors in:

- `src/scrapers/jabama.ts`
- `src/scrapers/jajiga.ts`

Look for the selector arrays and adjust based on current site structure.

### Adjust Match Thresholds

In `src/comparator.ts`:

```typescript
private readonly EXACT_MATCH_THRESHOLD = 0.95;
private readonly PARTIAL_MATCH_THRESHOLD = 0.7;
```

### Change Attribute Weights

In `src/comparator.ts`, modify the `calculateMatchScore` method:

```typescript
const weights = {
  title: 0.3,
  location: 0.25,
  price: 0.15,
  // ...
};
```

## 🐛 Troubleshooting

### 403 Forbidden Errors

If you get "Access denied" errors:

1. **Switch to browser mode** (recommended):
   ```typescript
   scrapingMethod: 'browser'
   ```

2. **Add cookies manually**:
   - Visit the site in your browser
   - Copy cookies from DevTools
   - Add to `cookies.json`

3. **Use proxies**:
   ```typescript
   useProxy: true
   proxyList: ['http://proxy:8080']
   ```

4. **Try manual mode** for testing:
   - Save HTML files manually
   - Set `scrapingMethod: 'manual'`

### No Listings Found

If the crawler finds no listings:

1. Check if selectors are correct:
   - Inspect the website HTML
   - Update selectors in scraper files

2. Use manual mode to test:
   - Save a search page HTML
   - Run in manual mode
   - Check console output

3. Run API detection:
   ```bash
   npm run detect-api
   ```

### Browser Issues

If Puppeteer fails to launch:

```bash
# Install dependencies (Linux)
sudo apt-get install -y chromium-browser

# Or use system Chrome
export PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
export PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
```

### Memory Issues

For large-scale scraping:

```bash
# Increase Node.js memory
NODE_OPTIONS="--max-old-space-size=4096" npm run dev

# Or reduce concurrency in config
maxConcurrency: 1
```

## 📚 Project Structure

```
.
├── src/
│   ├── scrapers/
│   │   ├── jabama.ts           # Jabama scraper
│   │   └── jajiga.ts           # Jajiga scraper
│   ├── api-detector.ts         # API detection utility
│   ├── browser.ts              # Puppeteer browser manager
│   ├── comparator.ts           # Listing comparison engine
│   ├── config.ts               # Configuration
│   ├── fetcher.ts              # Unified fetch utility
│   ├── http-enhanced.ts        # Enhanced HTTP client
│   ├── manual-parser.ts        # Manual HTML loader
│   ├── types.ts                # TypeScript interfaces
│   ├── utils.ts                # Helper functions
│   └── index.ts                # Main entry point
├── manual-html/                # Manual HTML files (manual mode)
├── output/                     # Generated results
├── package.json
├── tsconfig.json
└── README.md
```

## 🔐 Legal & Ethical Considerations

**IMPORTANT**: Always follow these guidelines:

1. **Terms of Service**: Review and comply with target websites' ToS
2. **robots.txt**: Respect the robots.txt directives
3. **Rate Limiting**: Use reasonable delays (configured by default)
4. **Personal Use**: This tool is for educational and research purposes only
5. **Data Privacy**: Be responsible with scraped data
6. **Attribution**: Don't claim scraped data as your own
7. **Commercial Use**: Seek permission before commercial use

### Checking robots.txt

```bash
curl https://www.jabama.com/robots.txt
curl https://www.jajiga.com/robots.txt
```

### Responsible Scraping

- ✅ Use reasonable request delays (2+ seconds)
- ✅ Scrape during off-peak hours
- ✅ Cache results to avoid repeated requests
- ✅ Respect rate limits
- ❌ Don't scrape personal information
- ❌ Don't overwhelm servers with requests
- ❌ Don't bypass CAPTCHAs programmatically

## 🚀 Advanced Usage

### Using with Proxies

```typescript
// config.ts
useProxy: true,
proxyList: [
  'http://10.10.1.10:8080',
  'socks5://username:password@proxy.example.com:1080'
]
```

### Adding Custom Cookies

```json
// cookies.json
[
  {
    "name": "session_id",
    "value": "abc123",
    "domain": ".jabama.com",
    "path": "/",
    "expires": 1735689600
  }
]
```

### Taking Screenshots

```typescript
import { getBrowserManager } from './browser.js';

const browser = await getBrowserManager();
await browser.screenshot(
  'https://www.jabama.com',
  'output/screenshot.png'
);
```

### Finding APIs with DevTools

1. Open the website in Chrome
2. Open DevTools (F12) → Network tab
3. Filter by "XHR" or "Fetch"
4. Browse the site
5. Look for JSON responses
6. Copy the Request URL and headers
7. Use those endpoints directly

## 📝 Scripts Reference

```bash
# Development
npm run dev              # Run in development mode
npm run build            # Build TypeScript
npm start                # Run built version

# Different modes
npm run crawl:browser    # Browser automation
npm run crawl:http       # HTTP requests
npm run crawl:manual     # Manual HTML files

# Utilities
npm run detect-api       # Detect APIs
```

## 🤝 Contributing

Contributions welcome! Please ensure:

- Code follows TypeScript best practices
- All types are properly defined
- Error handling is comprehensive
- Comments explain complex logic

## 📄 License

MIT License - See LICENSE file for details

## ⚠️ Disclaimer

This tool is for educational and research purposes only. Users are responsible for ensuring their use complies with all applicable laws and the terms of service of the websites being accessed. The authors assume no liability for misuse of this software.

---

**Made with ❤️ for web scraping enthusiasts and data scientists**
