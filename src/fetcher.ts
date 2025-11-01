import { config } from './config.js';
import { fetchWithRetry } from './utils.js';
import { getBrowserManager } from './browser.js';
import { getEnhancedHttpClient } from './http-enhanced.js';
import { getManualHtmlLoader } from './manual-parser.js';

/**
 * Unified Fetcher
 *
 * Automatically switches between different fetching methods based on configuration:
 * - 'http': Basic HTTP requests with axios (fast but may be blocked)
 * - 'browser': Browser automation with Puppeteer (slower but more reliable)
 * - 'manual': Load from local HTML files (for testing)
 */

export class UnifiedFetcher {
  async fetch(url: string, options?: { waitForSelector?: string; manualFilename?: string }): Promise<string> {
    console.log(`🔄 Fetching (${config.scrapingMethod} mode): ${url}`);

    switch (config.scrapingMethod) {
      case 'browser':
        return await this.fetchWithBrowser(url, options?.waitForSelector);

      case 'manual':
        return await this.fetchManual(options?.manualFilename || this.urlToFilename(url));

      case 'http':
      default:
        return await this.fetchWithHttp(url);
    }
  }

  private async fetchWithHttp(url: string): Promise<string> {
    try {
      // Try enhanced HTTP client first
      const client = getEnhancedHttpClient();
      return await client.fetch(url);
    } catch (error) {
      console.warn('Enhanced HTTP failed, falling back to basic HTTP...');
      // Fallback to basic fetch
      return await fetchWithRetry(url);
    }
  }

  private async fetchWithBrowser(url: string, waitForSelector?: string): Promise<string> {
    const browser = await getBrowserManager();
    return await browser.fetchPage(url, waitForSelector);
  }

  private async fetchManual(filename: string): Promise<string> {
    const loader = getManualHtmlLoader();
    return loader.loadHtml(filename);
  }

  private urlToFilename(url: string): string {
    // Convert URL to a reasonable filename
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.replace('www.', '');
    const pathname = urlObj.pathname.replace(/\//g, '-').replace(/^-/, '').replace(/-$/, '') || 'index';
    return `${hostname}-${pathname}.html`;
  }

  /**
   * Fetch multiple URLs with concurrency control
   */
  async fetchMultiple(
    urls: string[],
    onProgress?: (completed: number, total: number) => void
  ): Promise<Map<string, string>> {
    const results = new Map<string, string>();
    let completed = 0;

    for (const url of urls) {
      try {
        const html = await this.fetch(url);
        results.set(url, html);
        completed++;

        if (onProgress) {
          onProgress(completed, urls.length);
        }
      } catch (error) {
        console.error(`Failed to fetch ${url}:`, error instanceof Error ? error.message : 'Unknown error');
      }
    }

    return results;
  }
}

// Singleton instance
let fetcherInstance: UnifiedFetcher | null = null;

export function getUnifiedFetcher(): UnifiedFetcher {
  if (!fetcherInstance) {
    fetcherInstance = new UnifiedFetcher();
  }
  return fetcherInstance;
}

/**
 * Convenience function to fetch a URL using the configured method
 */
export async function fetchUrl(url: string, options?: { waitForSelector?: string; manualFilename?: string }): Promise<string> {
  const fetcher = getUnifiedFetcher();
  return await fetcher.fetch(url, options);
}
