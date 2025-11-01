import type { CrawlerConfig } from './types.js';

export const config: CrawlerConfig = {
  maxConcurrency: 5,
  requestDelay: 1000, // 1 second between requests
  timeout: 30000, // 30 seconds
  retryAttempts: 3,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
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
