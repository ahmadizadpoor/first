#!/usr/bin/env node

import { JabamaScraper } from './scrapers/jabama.js';
import { JajigaScraper } from './scrapers/jajiga.js';
import { ListingComparator } from './comparator.js';
import { saveToFile } from './utils.js';
import type { CrawlerStats } from './types.js';
import { config, urls } from './config.js';
import { closeBrowser } from './browser.js';
import { detectAndReportApis } from './api-detector.js';
import { getManualHtmlLoader } from './manual-parser.js';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
  console.log('\n╔══════════════════════════════════════════════════════╗');
  console.log('║   Jabama vs Jajiga Listing Comparison Crawler      ║');
  console.log('╚══════════════════════════════════════════════════════╝\n');

  // Show configuration
  console.log(`⚙️  Configuration:`);
  console.log(`   Scraping method: ${config.scrapingMethod}`);
  console.log(`   Concurrency: ${config.maxConcurrency}`);
  console.log(`   Request delay: ${config.requestDelay}ms`);
  console.log(`   Headless mode: ${config.headless}`);
  if (config.useProxy) {
    console.log(`   Proxy: Enabled (${config.proxyList?.length || 0} proxies)`);
  }
  console.log('');

  // Check for API detection mode
  const args = process.argv.slice(2);
  if (args.includes('--detect-api')) {
    console.log('🔍 Running in API detection mode...\n');
    await detectAndReportApis([
      { name: 'Jabama', url: urls.jabama.base },
      { name: 'Jajiga', url: urls.jajiga.base }
    ]);
    return;
  }

  // Validate manual mode
  if (config.scrapingMethod === 'manual') {
    const loader = getManualHtmlLoader();
    const validation = loader.validate();
    if (!validation.valid) {
      console.error(`❌ ${validation.message}`);
      console.log('\nPlease add HTML files to the manual-html/ directory first.');
      process.exit(1);
    }
    console.log(`✅ ${validation.message}\n`);
  }

  const stats: CrawlerStats = {
    totalJabamaListings: 0,
    totalJajigaListings: 0,
    exactMatches: 0,
    partialMatches: 0,
    noMatches: 0,
    errors: 0,
    startTime: new Date()
  };

  try {
    // Step 1: Scrape Jabama
    console.log('Step 1/3: Scraping Jabama listings...\n');
    const jabamaScraper = new JabamaScraper();
    const jabamaListings = await jabamaScraper.scrapeAll();
    stats.totalJabamaListings = jabamaListings.length;

    if (jabamaListings.length === 0) {
      console.warn('⚠️  No listings found on Jabama. Please check the site structure.');
      console.warn('You may need to update the scraper selectors in src/scrapers/jabama.ts');
    }

    // Save Jabama listings
    saveToFile('output/jabama-listings.json', jabamaListings);

    // Step 2: Scrape Jajiga
    console.log('\nStep 2/3: Scraping Jajiga listings...\n');
    const jajigaScraper = new JajigaScraper();
    const jajigaListings = await jajigaScraper.scrapeAll();
    stats.totalJajigaListings = jajigaListings.length;

    if (jajigaListings.length === 0) {
      console.warn('⚠️  No listings found on Jajiga. Please check the site structure.');
      console.warn('You may need to update the scraper selectors in src/scrapers/jajiga.ts');
    }

    // Save Jajiga listings
    saveToFile('output/jajiga-listings.json', jajigaListings);

    // Step 3: Compare listings
    if (jabamaListings.length > 0 && jajigaListings.length > 0) {
      console.log('\nStep 3/3: Comparing listings...\n');
      const comparator = new ListingComparator();
      const comparisonResults = comparator.compareListings(jabamaListings, jajigaListings);

      // Update stats
      stats.exactMatches = comparisonResults.filter(r => r.match === 'exact').length;
      stats.partialMatches = comparisonResults.filter(r => r.match === 'partial').length;
      stats.noMatches = comparisonResults.filter(r => r.match === 'none').length;

      // Save comparison results
      saveToFile('output/comparison-results.json', comparisonResults);

      // Generate and display report
      const report = comparator.generateReport(comparisonResults);
      console.log(report);

      // Save report
      const reportPath = 'output/comparison-report.txt';
      const dir = path.dirname(reportPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(reportPath, report, 'utf-8');
      console.log(`\nReport saved to ${reportPath}`);
    } else {
      console.log('\nSkipping comparison - insufficient data from one or both sites.');
    }

    // Final stats
    stats.endTime = new Date();
    const duration = (stats.endTime.getTime() - stats.startTime.getTime()) / 1000;

    console.log('\n╔══════════════════════════════════════════════════════╗');
    console.log('║                  CRAWL SUMMARY                       ║');
    console.log('╚══════════════════════════════════════════════════════╝\n');
    console.log(`Total runtime: ${duration.toFixed(2)} seconds`);
    console.log(`Jabama listings: ${stats.totalJabamaListings}`);
    console.log(`Jajiga listings: ${stats.totalJajigaListings}`);
    console.log(`Exact matches: ${stats.exactMatches}`);
    console.log(`Partial matches: ${stats.partialMatches}`);
    console.log(`No matches: ${stats.noMatches}`);
    console.log('\nAll results saved to the output/ directory\n');

    saveToFile('output/crawler-stats.json', stats);

  } catch (error) {
    console.error('\n❌ Error during crawl:');
    console.error(error instanceof Error ? error.message : 'Unknown error');
    stats.errors++;
    stats.endTime = new Date();
    saveToFile('output/crawler-stats.json', stats);
    await closeBrowser();
    process.exit(1);
  } finally {
    // Cleanup: close browser if it was used
    if (config.scrapingMethod === 'browser') {
      await closeBrowser();
    }
  }
}

// Run the crawler
main().catch(async (error) => {
  console.error('Fatal error:', error);
  await closeBrowser();
  process.exit(1);
});
