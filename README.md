# Jabama vs Jajiga Listing Comparison Crawler

A TypeScript-based web crawler that scrapes property listings from Jabama.com and Jajiga.com, then intelligently compares and matches them to identify duplicate listings across both platforms.

## Features

- **Dual-site scraping**: Automatically scrapes listings from both Jabama.com and Jajiga.com
- **Intelligent matching**: Uses fuzzy string matching and weighted scoring to find matching listings
- **Comprehensive comparison**: Compares titles, locations, prices, capacity, bedrooms, and more
- **Detailed reporting**: Generates human-readable reports and JSON outputs
- **Rate limiting**: Built-in concurrency control and request delays to be respectful to servers
- **Error handling**: Robust retry logic and error recovery
- **TypeScript**: Fully typed codebase for better maintainability

## Prerequisites

- Node.js 18+
- npm or yarn

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd jabama-jajiga-crawler
```

2. Install dependencies:
```bash
npm install
```

## Usage

### Quick Start

Run the crawler with development mode (no build required):
```bash
npm run dev
```

Or build and run in production mode:
```bash
npm run build
npm start
```

Or use the combined command:
```bash
npm run crawl
```

### Output

The crawler will create an `output/` directory with the following files:

- **jabama-listings.json**: All scraped listings from Jabama
- **jajiga-listings.json**: All scraped listings from Jajiga
- **comparison-results.json**: Detailed comparison results with match scores
- **comparison-report.txt**: Human-readable summary report
- **crawler-stats.json**: Statistics about the crawl session

### Example Output

```
╔══════════════════════════════════════════════════════╗
║   Jabama vs Jajiga Listing Comparison Crawler      ║
╚══════════════════════════════════════════════════════╝

Step 1/3: Scraping Jabama listings...
Found 150 listing URLs on Jabama
Successfully scraped 145 listings from Jabama

Step 2/3: Scraping Jajiga listings...
Found 200 listing URLs on Jajiga
Successfully scraped 195 listings from Jajiga

Step 3/3: Comparing listings...

============================================================
LISTING COMPARISON REPORT
============================================================

Total Jabama listings analyzed: 145
Exact matches found: 87 (60.0%)
Partial matches found: 42 (29.0%)
No matches found: 16 (11.0%)

============================================================
```

## Configuration

Edit `src/config.ts` to customize crawler behavior:

```typescript
export const config = {
  maxConcurrency: 5,        // Max simultaneous requests
  requestDelay: 1000,       // Delay between requests (ms)
  timeout: 30000,           // Request timeout (ms)
  retryAttempts: 3,         // Number of retry attempts
  userAgent: '...'          // User agent string
};
```

## How It Works

### 1. Scraping Phase
- The crawler visits Jabama.com and Jajiga.com
- Discovers listing URLs from search/category pages
- Extracts detailed information from each listing:
  - Title, price, location
  - Capacity, bedrooms, bathrooms
  - Description, features, images
  - Host information and ratings

### 2. Comparison Phase
- Uses intelligent matching algorithm with weighted scoring
- Compares multiple attributes:
  - **Title similarity** (30% weight)
  - **Location similarity** (25% weight)
  - **Price proximity** (15% weight)
  - **Bedroom count** (10% weight)
  - **Capacity** (10% weight)
  - **Description** (10% weight)

### 3. Classification
- **Exact match** (≥95% score): Very likely the same property
- **Partial match** (70-95% score): Possibly the same property with differences
- **No match** (<70% score): Different properties

## Project Structure

```
.
├── src/
│   ├── scrapers/
│   │   ├── jabama.ts       # Jabama scraper implementation
│   │   └── jajiga.ts       # Jajiga scraper implementation
│   ├── comparator.ts       # Listing comparison logic
│   ├── config.ts           # Configuration settings
│   ├── types.ts            # TypeScript type definitions
│   ├── utils.ts            # Utility functions
│   └── index.ts            # Main entry point
├── output/                 # Generated output files (created at runtime)
├── package.json
├── tsconfig.json
└── README.md
```

## Customization

### Updating Scrapers

The scrapers use CSS selectors to extract data from the websites. If the site structure changes, you may need to update the selectors in:

- `src/scrapers/jabama.ts`
- `src/scrapers/jajiga.ts`

Look for the selector arrays and DOM queries to adjust them based on the current site structure.

### Adjusting Match Thresholds

In `src/comparator.ts`, you can adjust the matching thresholds:

```typescript
private readonly EXACT_MATCH_THRESHOLD = 0.95;
private readonly PARTIAL_MATCH_THRESHOLD = 0.7;
```

### Changing Match Weights

Modify the weights in the `calculateMatchScore` method in `src/comparator.ts` to prioritize different attributes.

## Important Notes

### Legal and Ethical Considerations

- **Terms of Service**: Always review and comply with the target websites' Terms of Service
- **robots.txt**: Respect the robots.txt file of each website
- **Rate Limiting**: The crawler includes delays to avoid overwhelming servers
- **Personal Use**: This tool is intended for research and personal use only
- **Data Usage**: Be responsible with the scraped data and respect privacy

### Limitations

- The scraper may break if websites change their HTML structure
- Some listings may not be accessible or may require authentication
- Dynamic content loaded by JavaScript may not be captured
- Rate limits and anti-bot measures may affect scraping

## Troubleshooting

### No listings found

If the crawler returns no listings, the site structure may have changed. You'll need to:

1. Inspect the target website's HTML structure
2. Update the CSS selectors in the respective scraper file
3. Look for listing URLs and update the `getListingUrls()` method

### Connection errors

- Check your internet connection
- The websites may be blocking your IP (try adjusting the User-Agent or adding delays)
- Increase the `timeout` value in config

### Memory issues

If scraping large numbers of listings:
- Reduce `maxConcurrency` in config
- Process listings in batches
- Increase Node.js memory limit: `NODE_OPTIONS="--max-old-space-size=4096" npm start`

## Contributing

Contributions are welcome! Please ensure:

- Code follows the existing TypeScript style
- All types are properly defined
- Error handling is comprehensive
- Comments explain complex logic

## License

MIT

## Disclaimer

This tool is for educational and research purposes only. Users are responsible for ensuring their use complies with all applicable laws and the terms of service of the websites being scraped. The authors assume no liability for misuse of this software.
