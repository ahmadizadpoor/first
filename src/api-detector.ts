import axios from 'axios';
import * as cheerio from 'cheerio';
import { config } from './config.js';

/**
 * API Detector
 *
 * This module attempts to detect if a website has public APIs
 * that can be used instead of scraping HTML.
 */

export interface ApiEndpoint {
  url: string;
  method: string;
  description: string;
  parameters?: string[];
}

export class ApiDetector {
  async detectApis(baseUrl: string): Promise<ApiEndpoint[]> {
    console.log(`\n🔍 Detecting APIs for ${baseUrl}...`);

    const endpoints: ApiEndpoint[] = [];

    // Check common API paths
    await this.checkCommonPaths(baseUrl, endpoints);

    // Check robots.txt for hints
    await this.checkRobotsTxt(baseUrl, endpoints);

    // Check for API documentation
    await this.checkApiDocs(baseUrl, endpoints);

    // Check network requests (would need browser automation)
    console.log('💡 Tip: Use browser DevTools Network tab to find API endpoints');
    console.log('   1. Open the website in Chrome/Firefox');
    console.log('   2. Open DevTools (F12) → Network tab');
    console.log('   3. Filter by XHR/Fetch');
    console.log('   4. Browse the site and look for JSON responses');

    return endpoints;
  }

  private async checkCommonPaths(baseUrl: string, endpoints: ApiEndpoint[]): Promise<void> {
    const commonPaths = [
      '/api',
      '/api/v1',
      '/api/v2',
      '/api/listings',
      '/api/search',
      '/api/properties',
      '/graphql',
      '/rest',
      '/v1',
      '/v2',
      '/_api',
      '/public-api',
      '/mobile-api',
      '/app-api'
    ];

    for (const apiPath of commonPaths) {
      try {
        const url = new URL(apiPath, baseUrl).toString();
        const response = await axios.get(url, {
          timeout: 5000,
          headers: { 'User-Agent': config.userAgent },
          validateStatus: () => true
        });

        if (response.status === 200 || response.status === 401 || response.status === 403) {
          const contentType = response.headers['content-type'] || '';

          if (contentType.includes('json') || contentType.includes('application/json')) {
            endpoints.push({
              url,
              method: 'GET',
              description: `Possible API endpoint (${response.status})`,
              parameters: []
            });
            console.log(`✅ Found potential API: ${url}`);
          }
        }
      } catch (error) {
        // Silently continue
      }
    }
  }

  private async checkRobotsTxt(baseUrl: string, endpoints: ApiEndpoint[]): Promise<void> {
    try {
      const robotsUrl = new URL('/robots.txt', baseUrl).toString();
      const response = await axios.get(robotsUrl, {
        timeout: 5000,
        headers: { 'User-Agent': config.userAgent }
      });

      if (response.status === 200) {
        const lines = response.data.split('\n');
        console.log('\n📋 robots.txt analysis:');

        const apiPaths = lines.filter((line: string) =>
          line.toLowerCase().includes('api') ||
          line.toLowerCase().includes('disallow')
        );

        if (apiPaths.length > 0) {
          console.log('Found API-related entries:');
          apiPaths.forEach((line: string) => console.log(`  ${line}`));
        }
      }
    } catch (error) {
      // robots.txt not found or inaccessible
    }
  }

  private async checkApiDocs(baseUrl: string, endpoints: ApiEndpoint[]): Promise<void> {
    const docPaths = [
      '/api-docs',
      '/api/docs',
      '/swagger',
      '/swagger-ui',
      '/docs',
      '/documentation',
      '/api/documentation',
      '/developers',
      '/dev',
      '/api-reference'
    ];

    for (const docPath of docPaths) {
      try {
        const url = new URL(docPath, baseUrl).toString();
        const response = await axios.get(url, {
          timeout: 5000,
          headers: { 'User-Agent': config.userAgent },
          validateStatus: (status) => status < 500
        });

        if (response.status === 200) {
          console.log(`✅ Found API documentation: ${url}`);
          endpoints.push({
            url,
            method: 'GET',
            description: 'API documentation page'
          });
        }
      } catch (error) {
        // Continue
      }
    }
  }

  async analyzeNetworkRequests(html: string, baseUrl: string): Promise<ApiEndpoint[]> {
    const endpoints: ApiEndpoint[] = [];
    const $ = cheerio.load(html);

    // Look for script tags that might contain API endpoints
    $('script').each((_, element) => {
      const scriptContent = $(element).html() || '';

      // Look for common API patterns in JavaScript
      const apiPatterns = [
        /fetch\(['"]([^'"]+)['"]/g,
        /axios\.get\(['"]([^'"]+)['"]/g,
        /\$\.ajax\(\{[^}]*url:\s*['"]([^'"]+)['"]/g,
        /api[/:]?\s*['"]([^'"]+)['"]/gi,
        /endpoint\s*:\s*['"]([^'"]+)['"]/gi,
      ];

      for (const pattern of apiPatterns) {
        let match;
        while ((match = pattern.exec(scriptContent)) !== null) {
          const endpoint = match[1];
          if (endpoint.startsWith('http') || endpoint.startsWith('/')) {
            try {
              const fullUrl = endpoint.startsWith('http')
                ? endpoint
                : new URL(endpoint, baseUrl).toString();

              if (!endpoints.find(e => e.url === fullUrl)) {
                endpoints.push({
                  url: fullUrl,
                  method: 'GET',
                  description: 'Found in JavaScript code'
                });
              }
            } catch (error) {
              // Invalid URL, skip
            }
          }
        }
      }
    });

    return endpoints;
  }

  generateReport(site: string, endpoints: ApiEndpoint[]): string {
    let report = `\n${'='.repeat(60)}\n`;
    report += `API Detection Report for ${site}\n`;
    report += `${'='.repeat(60)}\n\n`;

    if (endpoints.length === 0) {
      report += '❌ No public APIs detected\n\n';
      report += 'Recommendations:\n';
      report += '1. Use browser DevTools to inspect network requests\n';
      report += '2. Check for mobile app APIs (often less protected)\n';
      report += '3. Look for GraphQL endpoints\n';
      report += '4. Consider using browser automation instead\n';
    } else {
      report += `✅ Found ${endpoints.length} potential endpoint(s):\n\n`;
      endpoints.forEach((endpoint, index) => {
        report += `${index + 1}. ${endpoint.method} ${endpoint.url}\n`;
        report += `   ${endpoint.description}\n`;
        if (endpoint.parameters && endpoint.parameters.length > 0) {
          report += `   Parameters: ${endpoint.parameters.join(', ')}\n`;
        }
        report += '\n';
      });
    }

    report += `${'='.repeat(60)}\n`;
    return report;
  }
}

export async function detectAndReportApis(sites: { name: string; url: string }[]): Promise<void> {
  const detector = new ApiDetector();

  for (const site of sites) {
    const endpoints = await detector.detectApis(site.url);
    const report = detector.generateReport(site.name, endpoints);
    console.log(report);
  }
}
