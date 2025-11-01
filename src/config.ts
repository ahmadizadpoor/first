import type { CrawlerConfig } from './types.js';

export const config: CrawlerConfig = {
  maxConcurrency: 3,
  requestDelay: 2000, // 2 seconds between requests
  timeout: 30000, // 30 seconds
  retryAttempts: 3,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',

  // Scraping method: 'http', 'browser', or 'manual'
  scrapingMethod: 'http', // Using HTTP mode (browser requires Chrome installation)

  // Browser options
  headless: true, // Set to false to see the browser
  browserTimeout: 60000, // 60 seconds for browser operations

  // Proxy settings
  useProxy: false,
  proxyList: [
    // Add proxy URLs here if needed, format: 'http://username:password@host:port'
    // 'http://proxy1.example.com:8080',
    // 'http://proxy2.example.com:8080',
  ],

  // Cookie file for session persistence
  cookieFile: 'cookies.json',

  // Manual mode: directory containing saved HTML files
  manualHtmlDir: 'manual-html'
};

export const urls = {
  jabama: {
    base: 'https://www.jabama.com',
    search: 'https://www.jabama.com/search',
    listings: 'https://www.jabama.com/listings'
  },
  jajiga: {
    base: 'https://www.jajiga.com',
    search: 'https://www.jajiga.com/search',
    listings: 'https://www.jajiga.com/listings'
  }
};
