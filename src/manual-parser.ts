import * as fs from 'fs';
import * as path from 'path';
import { config } from './config.js';

/**
 * Manual HTML Parser
 *
 * This module allows you to test the scraper with locally saved HTML files.
 * Useful for development and testing when websites block automated requests.
 *
 * Usage:
 * 1. Manually save HTML files to the manual-html/ directory
 * 2. Name them descriptively (e.g., jabama-search.html, jajiga-listing-123.html)
 * 3. Set config.scrapingMethod = 'manual'
 * 4. Run the crawler
 */

export class ManualHtmlLoader {
  private htmlDir: string;

  constructor() {
    this.htmlDir = config.manualHtmlDir || 'manual-html';
    this.ensureDirectoryExists();
  }

  private ensureDirectoryExists(): void {
    if (!fs.existsSync(this.htmlDir)) {
      fs.mkdirSync(this.htmlDir, { recursive: true });
      console.log(`📁 Created manual HTML directory: ${this.htmlDir}`);
      this.createReadme();
    }
  }

  private createReadme(): void {
    const readmePath = path.join(this.htmlDir, 'README.md');
    const readmeContent = `# Manual HTML Files

This directory is used for manual HTML file parsing during testing and development.

## Usage

1. **Save HTML files**: Manually visit the target websites and save the HTML source
2. **Naming convention**:
   - For search pages: \`jabama-search.html\`, \`jajiga-search.html\`
   - For listing pages: \`jabama-listing-[id].html\`, \`jajiga-listing-[id].html\`
3. **Configure**: Set \`scrapingMethod: 'manual'\` in \`src/config.ts\`
4. **Run**: Execute the crawler normally

## How to Save HTML

### Method 1: Browser Developer Tools
1. Open the page in your browser
2. Right-click → "View Page Source" or press Ctrl+U
3. Copy all HTML
4. Save to a .html file in this directory

### Method 2: Browser Save As
1. Open the page in your browser
2. Press Ctrl+S or Cmd+S
3. Choose "Webpage, HTML Only"
4. Save to this directory

### Method 3: curl
\`\`\`bash
curl -H "User-Agent: Mozilla/5.0..." "https://example.com" > manual-html/page.html
\`\`\`

## Example Files

- \`jabama-search.html\` - Main search/listing page from Jabama
- \`jabama-listing-villa-123.html\` - Individual listing page
- \`jajiga-search.html\` - Main search/listing page from Jajiga
- \`jajiga-listing-456.html\` - Individual listing page

The crawler will automatically detect and use these files when in manual mode.
`;

    fs.writeFileSync(readmePath, readmeContent);
  }

  /**
   * Load HTML from a file
   */
  loadHtml(filename: string): string {
    const filePath = path.join(this.htmlDir, filename);

    if (!fs.existsSync(filePath)) {
      throw new Error(`HTML file not found: ${filePath}`);
    }

    console.log(`📄 Loading manual HTML: ${filename}`);
    return fs.readFileSync(filePath, 'utf-8');
  }

  /**
   * Get all HTML files for a specific site
   */
  getFilesForSite(site: 'jabama' | 'jajiga'): string[] {
    if (!fs.existsSync(this.htmlDir)) {
      return [];
    }

    const files = fs.readdirSync(this.htmlDir)
      .filter(f => f.endsWith('.html'))
      .filter(f => f.toLowerCase().includes(site));

    return files;
  }

  /**
   * Get search page HTML
   */
  getSearchPage(site: 'jabama' | 'jajiga'): string | null {
    const searchFiles = [
      `${site}-search.html`,
      `${site}-listings.html`,
      `${site}-home.html`,
    ];

    for (const filename of searchFiles) {
      const filePath = path.join(this.htmlDir, filename);
      if (fs.existsSync(filePath)) {
        return this.loadHtml(filename);
      }
    }

    return null;
  }

  /**
   * Get all listing page HTMLs
   */
  getListingPages(site: 'jabama' | 'jajiga'): Map<string, string> {
    const listings = new Map<string, string>();
    const files = this.getFilesForSite(site);

    for (const filename of files) {
      if (filename.includes('listing') || filename.includes('villa') || filename.includes('room')) {
        try {
          const html = this.loadHtml(filename);
          const id = filename.replace('.html', '').replace(`${site}-`, '');
          listings.set(id, html);
        } catch (error) {
          console.warn(`Could not load ${filename}:`, error);
        }
      }
    }

    return listings;
  }

  /**
   * Check if manual mode is properly configured
   */
  validate(): { valid: boolean; message: string } {
    if (!fs.existsSync(this.htmlDir)) {
      return {
        valid: false,
        message: `Manual HTML directory not found: ${this.htmlDir}`
      };
    }

    const jabamaFiles = this.getFilesForSite('jabama');
    const jajigaFiles = this.getFilesForSite('jajiga');

    if (jabamaFiles.length === 0 && jajigaFiles.length === 0) {
      return {
        valid: false,
        message: `No HTML files found in ${this.htmlDir}. Please add some HTML files first.`
      };
    }

    return {
      valid: true,
      message: `Found ${jabamaFiles.length} Jabama files and ${jajigaFiles.length} Jajiga files`
    };
  }

  /**
   * Save HTML to manual directory (helper for testing)
   */
  saveHtml(filename: string, html: string): void {
    const filePath = path.join(this.htmlDir, filename);
    fs.writeFileSync(filePath, html, 'utf-8');
    console.log(`💾 Saved HTML to: ${filePath}`);
  }
}

// Singleton instance
let manualLoaderInstance: ManualHtmlLoader | null = null;

export function getManualHtmlLoader(): ManualHtmlLoader {
  if (!manualLoaderInstance) {
    manualLoaderInstance = new ManualHtmlLoader();
  }
  return manualLoaderInstance;
}
