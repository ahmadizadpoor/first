import puppeteer, { Browser, Page } from 'puppeteer';
import puppeteerExtra from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { config } from './config.js';
import { sleep } from './utils.js';
import * as fs from 'fs';
import { Cookie } from 'tough-cookie';

// Add stealth plugin to avoid detection
puppeteerExtra.use(StealthPlugin());

export class BrowserManager {
  private browser: Browser | null = null;
  private pages: Map<string, Page> = new Map();
  private currentProxyIndex = 0;

  async init(): Promise<void> {
    if (this.browser) return;

    console.log('🌐 Initializing browser...');

    const launchOptions: any = {
      headless: config.headless ? 'new' : false,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu',
        '--window-size=1920,1080',
        '--user-agent=' + config.userAgent
      ]
    };

    // Add proxy if enabled
    if (config.useProxy && config.proxyList && config.proxyList.length > 0) {
      const proxy = this.getNextProxy();
      console.log(`Using proxy: ${proxy}`);
      launchOptions.args.push(`--proxy-server=${proxy}`);
    }

    this.browser = await puppeteerExtra.launch(launchOptions);
    console.log('✅ Browser initialized');
  }

  private getNextProxy(): string {
    if (!config.proxyList || config.proxyList.length === 0) {
      throw new Error('No proxies configured');
    }
    const proxy = config.proxyList[this.currentProxyIndex];
    this.currentProxyIndex = (this.currentProxyIndex + 1) % config.proxyList.length;
    return proxy;
  }

  async fetchPage(url: string, waitForSelector?: string): Promise<string> {
    if (!this.browser) {
      await this.init();
    }

    const page = await this.browser!.newPage();

    try {
      // Load cookies if available
      await this.loadCookies(page, url);

      // Set realistic viewport
      await page.setViewport({
        width: 1920,
        height: 1080,
        deviceScaleFactor: 1
      });

      // Set additional headers
      await page.setExtraHTTPHeaders({
        'Accept-Language': 'en-US,en;q=0.9,fa;q=0.8',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      });

      console.log(`📄 Fetching: ${url}`);

      // Navigate to page
      await page.goto(url, {
        waitUntil: 'networkidle2',
        timeout: config.browserTimeout
      });

      // Wait for specific selector if provided
      if (waitForSelector) {
        try {
          await page.waitForSelector(waitForSelector, { timeout: 10000 });
        } catch (error) {
          console.warn(`Selector "${waitForSelector}" not found, continuing anyway...`);
        }
      }

      // Random delay to appear more human-like
      await sleep(1000 + Math.random() * 2000);

      // Scroll to load lazy images
      await this.autoScroll(page);

      // Save cookies
      await this.saveCookies(page);

      // Get the HTML content
      const html = await page.content();

      await page.close();

      return html;

    } catch (error) {
      await page.close();
      throw error;
    }
  }

  private async autoScroll(page: Page): Promise<void> {
    await page.evaluate(async () => {
      await new Promise<void>((resolve) => {
        let totalHeight = 0;
        const distance = 100;
        const timer = setInterval(() => {
          const scrollHeight = document.body.scrollHeight;
          window.scrollBy(0, distance);
          totalHeight += distance;

          if (totalHeight >= scrollHeight) {
            clearInterval(timer);
            resolve();
          }
        }, 100);
      });
    });
  }

  private async loadCookies(page: Page, url: string): Promise<void> {
    if (!config.cookieFile || !fs.existsSync(config.cookieFile)) {
      return;
    }

    try {
      const cookieData = JSON.parse(fs.readFileSync(config.cookieFile, 'utf-8'));
      const domain = new URL(url).hostname;

      // Filter cookies for this domain
      const relevantCookies = cookieData.filter((cookie: any) => {
        return cookie.domain === domain || cookie.domain === '.' + domain;
      });

      if (relevantCookies.length > 0) {
        await page.setCookie(...relevantCookies);
        console.log(`🍪 Loaded ${relevantCookies.length} cookies for ${domain}`);
      }
    } catch (error) {
      console.warn('Could not load cookies:', error instanceof Error ? error.message : 'Unknown error');
    }
  }

  private async saveCookies(page: Page): Promise<void> {
    if (!config.cookieFile) return;

    try {
      const cookies = await page.cookies();
      let existingCookies: any[] = [];

      if (fs.existsSync(config.cookieFile)) {
        existingCookies = JSON.parse(fs.readFileSync(config.cookieFile, 'utf-8'));
      }

      // Merge cookies (new ones override old ones)
      const cookieMap = new Map();
      existingCookies.forEach(c => cookieMap.set(`${c.domain}:${c.name}`, c));
      cookies.forEach(c => cookieMap.set(`${c.domain}:${c.name}`, c));

      fs.writeFileSync(config.cookieFile, JSON.stringify(Array.from(cookieMap.values()), null, 2));
    } catch (error) {
      console.warn('Could not save cookies:', error instanceof Error ? error.message : 'Unknown error');
    }
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      console.log('🔒 Browser closed');
    }
  }

  async screenshot(url: string, outputPath: string): Promise<void> {
    if (!this.browser) {
      await this.init();
    }

    const page = await this.browser!.newPage();
    await page.goto(url, { waitUntil: 'networkidle2' });
    await page.screenshot({ path: outputPath, fullPage: true });
    await page.close();
    console.log(`📸 Screenshot saved to ${outputPath}`);
  }
}

// Singleton instance
let browserInstance: BrowserManager | null = null;

export async function getBrowserManager(): Promise<BrowserManager> {
  if (!browserInstance) {
    browserInstance = new BrowserManager();
    await browserInstance.init();
  }
  return browserInstance;
}

export async function closeBrowser(): Promise<void> {
  if (browserInstance) {
    await browserInstance.close();
    browserInstance = null;
  }
}
