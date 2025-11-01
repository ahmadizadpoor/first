export interface Listing {
  id: string;
  title: string;
  url: string;
  price?: number;
  location?: string;
  description?: string;
  features?: string[];
  images?: string[];
  host?: string;
  rating?: number;
  reviews?: number;
  capacity?: number;
  bedrooms?: number;
  bathrooms?: number;
  source: 'jabama' | 'jajiga';
  scrapedAt: Date;
}

export interface ComparisonResult {
  jabamaListing: Listing;
  jajigaListing?: Listing;
  match: 'exact' | 'partial' | 'none';
  matchScore: number;
  differences?: {
    field: string;
    jabamaValue: any;
    jajigaValue: any;
  }[];
}

export interface CrawlerConfig {
  maxConcurrency: number;
  requestDelay: number;
  timeout: number;
  retryAttempts: number;
  userAgent: string;
  // Scraping method: 'http' (axios), 'browser' (puppeteer), 'manual' (local HTML files)
  scrapingMethod: 'http' | 'browser' | 'manual';
  // Browser-specific options
  headless: boolean;
  browserTimeout: number;
  // Proxy settings
  useProxy: boolean;
  proxyList?: string[];
  // Cookie and session management
  cookieFile?: string;
  // Manual mode settings
  manualHtmlDir?: string;
}

export interface CrawlerStats {
  totalJabamaListings: number;
  totalJajigaListings: number;
  exactMatches: number;
  partialMatches: number;
  noMatches: number;
  errors: number;
  startTime: Date;
  endTime?: Date;
}
