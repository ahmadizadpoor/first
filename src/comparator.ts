import type { Listing, ComparisonResult } from './types.js';
import { calculateSimilarity, normalizeText } from './utils.js';

export class ListingComparator {
  private readonly EXACT_MATCH_THRESHOLD = 0.95;
  private readonly PARTIAL_MATCH_THRESHOLD = 0.7;

  compareListings(jabamaListings: Listing[], jajigaListings: Listing[]): ComparisonResult[] {
    console.log('\nComparing listings...');
    console.log(`Jabama listings: ${jabamaListings.length}`);
    console.log(`Jajiga listings: ${jajigaListings.length}`);

    const results: ComparisonResult[] = [];

    for (const jabamaListing of jabamaListings) {
      const bestMatch = this.findBestMatch(jabamaListing, jajigaListings);
      results.push(bestMatch);
    }

    return results;
  }

  private findBestMatch(jabamaListing: Listing, jajigaListings: Listing[]): ComparisonResult {
    let bestScore = 0;
    let bestMatch: Listing | undefined;

    for (const jajigaListing of jajigaListings) {
      const score = this.calculateMatchScore(jabamaListing, jajigaListing);
      if (score > bestScore) {
        bestScore = score;
        bestMatch = jajigaListing;
      }
    }

    const matchType = this.getMatchType(bestScore);
    const differences = bestMatch ? this.findDifferences(jabamaListing, bestMatch) : [];

    return {
      jabamaListing,
      jajigaListing: bestMatch,
      match: matchType,
      matchScore: bestScore,
      differences: differences.length > 0 ? differences : undefined
    };
  }

  private calculateMatchScore(listing1: Listing, listing2: Listing): number {
    const weights = {
      title: 0.3,
      location: 0.25,
      price: 0.15,
      bedrooms: 0.1,
      capacity: 0.1,
      description: 0.1
    };

    let totalScore = 0;
    let totalWeight = 0;

    // Compare title
    if (listing1.title && listing2.title) {
      const titleSimilarity = calculateSimilarity(listing1.title, listing2.title);
      totalScore += titleSimilarity * weights.title;
      totalWeight += weights.title;
    }

    // Compare location
    if (listing1.location && listing2.location) {
      const locationSimilarity = calculateSimilarity(listing1.location, listing2.location);
      totalScore += locationSimilarity * weights.location;
      totalWeight += weights.location;
    }

    // Compare price (with tolerance)
    if (listing1.price && listing2.price) {
      const priceDiff = Math.abs(listing1.price - listing2.price);
      const avgPrice = (listing1.price + listing2.price) / 2;
      const priceScore = Math.max(0, 1 - (priceDiff / avgPrice));
      totalScore += priceScore * weights.price;
      totalWeight += weights.price;
    }

    // Compare bedrooms
    if (listing1.bedrooms && listing2.bedrooms) {
      const bedroomScore = listing1.bedrooms === listing2.bedrooms ? 1 : 0;
      totalScore += bedroomScore * weights.bedrooms;
      totalWeight += weights.bedrooms;
    }

    // Compare capacity
    if (listing1.capacity && listing2.capacity) {
      const capacityScore = listing1.capacity === listing2.capacity ? 1 : 0;
      totalScore += capacityScore * weights.capacity;
      totalWeight += weights.capacity;
    }

    // Compare description
    if (listing1.description && listing2.description) {
      const descSimilarity = calculateSimilarity(
        listing1.description.substring(0, 200),
        listing2.description.substring(0, 200)
      );
      totalScore += descSimilarity * weights.description;
      totalWeight += weights.description;
    }

    return totalWeight > 0 ? totalScore / totalWeight : 0;
  }

  private getMatchType(score: number): 'exact' | 'partial' | 'none' {
    if (score >= this.EXACT_MATCH_THRESHOLD) return 'exact';
    if (score >= this.PARTIAL_MATCH_THRESHOLD) return 'partial';
    return 'none';
  }

  private findDifferences(listing1: Listing, listing2: Listing): Array<{
    field: string;
    jabamaValue: any;
    jajigaValue: any;
  }> {
    const differences: Array<{
      field: string;
      jabamaValue: any;
      jajigaValue: any;
    }> = [];

    // Compare price
    if (listing1.price !== listing2.price) {
      differences.push({
        field: 'price',
        jabamaValue: listing1.price,
        jajigaValue: listing2.price
      });
    }

    // Compare title
    if (normalizeText(listing1.title || '') !== normalizeText(listing2.title || '')) {
      differences.push({
        field: 'title',
        jabamaValue: listing1.title,
        jajigaValue: listing2.title
      });
    }

    // Compare location
    if (normalizeText(listing1.location || '') !== normalizeText(listing2.location || '')) {
      differences.push({
        field: 'location',
        jabamaValue: listing1.location,
        jajigaValue: listing2.location
      });
    }

    // Compare capacity
    if (listing1.capacity !== listing2.capacity) {
      differences.push({
        field: 'capacity',
        jabamaValue: listing1.capacity,
        jajigaValue: listing2.capacity
      });
    }

    // Compare bedrooms
    if (listing1.bedrooms !== listing2.bedrooms) {
      differences.push({
        field: 'bedrooms',
        jabamaValue: listing1.bedrooms,
        jajigaValue: listing2.bedrooms
      });
    }

    // Compare bathrooms
    if (listing1.bathrooms !== listing2.bathrooms) {
      differences.push({
        field: 'bathrooms',
        jabamaValue: listing1.bathrooms,
        jajigaValue: listing2.bathrooms
      });
    }

    return differences;
  }

  generateReport(results: ComparisonResult[]): string {
    const exactMatches = results.filter(r => r.match === 'exact').length;
    const partialMatches = results.filter(r => r.match === 'partial').length;
    const noMatches = results.filter(r => r.match === 'none').length;

    let report = '\n' + '='.repeat(60) + '\n';
    report += 'LISTING COMPARISON REPORT\n';
    report += '='.repeat(60) + '\n\n';
    report += `Total Jabama listings analyzed: ${results.length}\n`;
    report += `Exact matches found: ${exactMatches} (${((exactMatches / results.length) * 100).toFixed(1)}%)\n`;
    report += `Partial matches found: ${partialMatches} (${((partialMatches / results.length) * 100).toFixed(1)}%)\n`;
    report += `No matches found: ${noMatches} (${((noMatches / results.length) * 100).toFixed(1)}%)\n`;
    report += '\n' + '='.repeat(60) + '\n\n';

    // Show some example matches
    report += 'EXAMPLE MATCHES:\n\n';

    const exactMatchExamples = results.filter(r => r.match === 'exact').slice(0, 3);
    if (exactMatchExamples.length > 0) {
      report += 'Exact Matches:\n';
      exactMatchExamples.forEach((result, idx) => {
        report += `\n${idx + 1}. ${result.jabamaListing.title}\n`;
        report += `   Jabama: ${result.jabamaListing.url}\n`;
        report += `   Jajiga: ${result.jajigaListing?.url}\n`;
        report += `   Match Score: ${(result.matchScore * 100).toFixed(1)}%\n`;
      });
    }

    const partialMatchExamples = results.filter(r => r.match === 'partial').slice(0, 3);
    if (partialMatchExamples.length > 0) {
      report += '\nPartial Matches:\n';
      partialMatchExamples.forEach((result, idx) => {
        report += `\n${idx + 1}. ${result.jabamaListing.title}\n`;
        report += `   Jabama: ${result.jabamaListing.url}\n`;
        report += `   Jajiga: ${result.jajigaListing?.url}\n`;
        report += `   Match Score: ${(result.matchScore * 100).toFixed(1)}%\n`;
        if (result.differences && result.differences.length > 0) {
          report += `   Differences: ${result.differences.map(d => d.field).join(', ')}\n`;
        }
      });
    }

    report += '\n' + '='.repeat(60) + '\n';

    return report;
  }
}
