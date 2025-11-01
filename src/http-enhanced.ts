import axios, { AxiosRequestConfig } from 'axios';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { CookieJar } from 'tough-cookie';
import { config } from './config.js';
import { sleep } from './utils.js';
import * as fs from 'fs';

export class EnhancedHttpClient {
  private cookieJar: CookieJar;
  private currentProxyIndex = 0;

  constructor() {
    this.cookieJar = new CookieJar();
    this.loadCookies();
  }

  private getRealisticHeaders(url: string): Record<string, string> {
    const urlObj = new URL(url);

    return {
      'User-Agent': config.userAgent,
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9,fa-IR;q=0.8,fa;q=0.7',
      'Accept-Encoding': 'gzip, deflate, br',
      'DNT': '1',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-User': '?1',
      'Cache-Control': 'max-age=0',
      'sec-ch-ua': '"Chromium";v="120", "Google Chrome";v="120", "Not-A.Brand";v="99"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"Windows"',
      'Referer': urlObj.origin,
    };
  }

  private getNextProxy(): string | undefined {
    if (!config.useProxy || !config.proxyList || config.proxyList.length === 0) {
      return undefined;
    }
    const proxy = config.proxyList[this.currentProxyIndex];
    this.currentProxyIndex = (this.currentProxyIndex + 1) % config.proxyList.length;
    return proxy;
  }

  async fetch(url: string, retries = config.retryAttempts): Promise<string> {
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const headers = this.getRealisticHeaders(url);

        // Add cookies from jar
        const cookies = await this.cookieJar.getCookies(url);
        if (cookies.length > 0) {
          headers['Cookie'] = cookies.map(c => c.cookieString()).join('; ');
        }

        const requestConfig: AxiosRequestConfig = {
          headers,
          timeout: config.timeout,
          maxRedirects: 5,
          validateStatus: (status) => status < 500, // Don't throw on 4xx errors
        };

        // Add proxy if enabled
        const proxyUrl = this.getNextProxy();
        if (proxyUrl) {
          requestConfig.httpsAgent = new HttpsProxyAgent(proxyUrl);
          requestConfig.httpAgent = new HttpsProxyAgent(proxyUrl);
          console.log(`🔄 Using proxy: ${proxyUrl}`);
        }

        const response = await axios.get(url, requestConfig);

        // Save cookies
        const setCookies = response.headers['set-cookie'];
        if (setCookies) {
          for (const cookieStr of setCookies) {
            await this.cookieJar.setCookie(cookieStr, url);
          }
          this.saveCookies();
        }

        if (response.status === 403 || response.status === 401) {
          throw new Error(`Access denied (${response.status}): ${response.statusText}`);
        }

        if (response.status >= 400) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return response.data;

      } catch (error) {
        console.error(`Attempt ${attempt + 1}/${retries} failed for ${url}:`,
          error instanceof Error ? error.message : 'Unknown error');

        if (attempt === retries - 1) {
          throw error;
        }

        // Exponential backoff
        await sleep(config.requestDelay * Math.pow(2, attempt));
      }
    }

    throw new Error(`Failed to fetch ${url} after ${retries} attempts`);
  }

  private loadCookies(): void {
    if (!config.cookieFile || !fs.existsSync(config.cookieFile)) {
      return;
    }

    try {
      const cookieData = JSON.parse(fs.readFileSync(config.cookieFile, 'utf-8'));
      this.cookieJar = CookieJar.deserializeSync(cookieData);
      console.log('🍪 Loaded cookies from file');
    } catch (error) {
      console.warn('Could not load cookies:', error instanceof Error ? error.message : 'Unknown error');
    }
  }

  private saveCookies(): void {
    if (!config.cookieFile) return;

    try {
      const serialized = this.cookieJar.serializeSync();
      fs.writeFileSync(config.cookieFile, JSON.stringify(serialized, null, 2));
    } catch (error) {
      console.warn('Could not save cookies:', error instanceof Error ? error.message : 'Unknown error');
    }
  }
}

// Singleton instance
let httpClientInstance: EnhancedHttpClient | null = null;

export function getEnhancedHttpClient(): EnhancedHttpClient {
  if (!httpClientInstance) {
    httpClientInstance = new EnhancedHttpClient();
  }
  return httpClientInstance;
}
