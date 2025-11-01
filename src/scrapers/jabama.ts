import * as cheerio from 'cheerio';
import type { Listing } from '../types.js';
import { sleep, normalizeText, extractNumber, sanitizeUrl } from '../utils.js';
import { config, urls } from '../config.js';
import { fetchUrl } from '../fetcher.js';
import { getManualHtmlLoader } from '../manual-parser.js';
import pLimit from 'p-limit';

export class JabamaScraper {
  private limit = pLimit(config.maxConcurrency);
  private listings: Listing[] = [];

  async scrapeAll(): Promise<Listing[]> {
    console.log('Starting Jabama scraper...');
    this.listings = [];

    try {
      // Get listing URLs from search/category pages
      const listingUrls = await this.getListingUrls();
      console.log(`Found ${listingUrls.length} listing URLs on Jabama`);

      // Scrape each listing with concurrency control
      const promises = listingUrls.map(url =>
        this.limit(async () => {
          try {
            await sleep(config.requestDelay);
            return await this.scrapeListing(url);
          } catch (error) {
            console.error(`Error scraping ${url}:`, error instanceof Error ? error.message : 'Unknown error');
            return null;
          }
        })
      );

      const results = await Promise.all(promises);
      this.listings = results.filter((listing): listing is Listing => listing !== null);

      console.log(`Successfully scraped ${this.listings.length} listings from Jabama`);
      return this.listings;
    } catch (error) {
      console.error('Error in Jabama scraper:', error);
      throw error;
    }
  }

  private async getListingUrls(): Promise<string[]> {
    const listingUrls: string[] = [];

    try {
      // In manual mode, get listings from saved HTML files
      if (config.scrapingMethod === 'manual') {
        const loader = getManualHtmlLoader();
        const listingPages = loader.getListingPages('jabama');

        // Return the filenames directly - the fetcher will handle manual mode
        for (const [id, _] of listingPages) {
          listingUrls.push(`manual://${id}`);
        }

        return listingUrls;
      }

      // Try to get listings from the main search/listings page
      // This is a generic implementation - adjust based on actual site structure
      const html = await fetchUrl(urls.jabama.search || urls.jabama.base);
      const $ = cheerio.load(html);

      // Common selectors for listing links - adjust based on actual site
      const selectors = [
        'a[href*="/room/"]',
        'a[href*="/villa/"]',
        'a[href*="/suite/"]',
        'a[href*="/apartment/"]',
        'a.listing-link',
        '.listing-card a',
        '[data-listing-id] a'
      ];

      for (const selector of selectors) {
        $(selector).each((_, element) => {
          const href = $(element).attr('href');
          if (href) {
            const fullUrl = sanitizeUrl(href, urls.jabama.base);
            if (!listingUrls.includes(fullUrl)) {
              listingUrls.push(fullUrl);
            }
          }
        });

        if (listingUrls.length > 0) break; // If we found URLs with this selector, stop
      }

      // If no URLs found, return a sample set for testing
      if (listingUrls.length === 0) {
        console.warn('No listing URLs found on Jabama. Site structure may have changed.');
        // You might want to manually add some known URLs here for testing
      }

      return [...new Set(listingUrls)]; // Remove duplicates
    } catch (error) {
      console.error('Error getting Jabama listing URLs:', error);
      return [];
    }
  }

  private async scrapeListing(url: string): Promise<Listing | null> {
    try {
      const html = await fetchUrl(url);
      const $ = cheerio.load(html);

      // Extract listing ID from URL
      const id = url.split('/').filter(Boolean).pop() || url;

      // Extract title
      const title = $('h1').first().text().trim() ||
        $('[class*="title"]').first().text().trim() ||
        $('title').text().split('|')[0].trim();

      // Extract price
      let price: number | undefined;
      const priceText = $('[class*="price"]').first().text() ||
        $('[data-price]').first().text();
      if (priceText) {
        price = extractNumber(priceText);
      }

      // Extract location
      const location = $('[class*="location"]').first().text().trim() ||
        $('[class*="address"]').first().text().trim();

      // Extract description
      const description = $('[class*="description"]').first().text().trim() ||
        $('meta[name="description"]').attr('content')?.trim();

      // Extract features/amenities
      const features: string[] = [];
      $('[class*="amenity"], [class*="feature"]').each((_, el) => {
        const feature = $(el).text().trim();
        if (feature) features.push(feature);
      });

      // Extract images
      const images: string[] = [];
      $('img[src*="jabama"], [class*="gallery"] img, [class*="photo"] img').each((_, el) => {
        const src = $(el).attr('src');
        if (src) {
          images.push(sanitizeUrl(src, urls.jabama.base));
        }
      });

      // Extract capacity, bedrooms, bathrooms
      const capacity = extractNumber($('[class*="capacity"], [class*="guest"]').first().text());
      const bedrooms = extractNumber($('[class*="bedroom"]').first().text());
      const bathrooms = extractNumber($('[class*="bathroom"]').first().text());

      // Extract host
      const host = $('[class*="host"]').first().text().trim();

      // Extract rating
      let rating: number | undefined;
      const ratingText = $('[class*="rating"]').first().text();
      if (ratingText) {
        const match = ratingText.match(/[\d.]+/);
        rating = match ? parseFloat(match[0]) : undefined;
      }

      const listing: Listing = {
        id,
        title,
        url,
        price,
        location,
        description,
        features,
        images,
        host,
        rating,
        capacity,
        bedrooms,
        bathrooms,
        source: 'jabama',
        scrapedAt: new Date()
      };

      console.log(`Scraped Jabama listing: ${title}`);
      return listing;
    } catch (error) {
      console.error(`Error scraping Jabama listing ${url}:`, error);
      return null;
    }
  }
}
