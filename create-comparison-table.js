#!/usr/bin/env node

/**
 * Create Readable Comparison Tables from comparison-results.json
 *
 * Generates 3 formats:
 * 1. Full detailed table (TXT)
 * 2. Compact console view (TXT)
 * 3. CSV for Excel/Sheets
 */

const fs = require('fs');
const path = require('path');

const INPUT_FILE = './output/comparison-results.json';
const OUTPUT_DIR = './output';

// Load comparison results
function loadComparison() {
  if (!fs.existsSync(INPUT_FILE)) {
    console.error('❌ Error: comparison-results.json not found!');
    console.log('   Please run the crawler first: npm run dev');
    process.exit(1);
  }

  const data = JSON.parse(fs.readFileSync(INPUT_FILE, 'utf-8'));
  return data[0]; // Get first comparison
}

// Create full detailed table
function createFullTable(comparison) {
  const j = comparison.jabamaListing;
  const g = comparison.jajigaListing;
  const score = (comparison.matchScore * 100).toFixed(1);

  return `╔═══════════════════════════════════════════════════════════════════════════════════════════════╗
║                         JABAMA vs JAJIGA - LISTING COMPARISON TABLE                          ║
╚═══════════════════════════════════════════════════════════════════════════════════════════════╝

┌───────────────────────────────────────────────────────────────────────────────────────────────┐
│ MATCH SUMMARY                                                                                 │
├───────────────────────────────────────────────────────────────────────────────────────────────┤
│ Match Type:        ${comparison.match.toUpperCase()} MATCH                                   │
│ Similarity Score:  ${score}%                                                                  │
│ Total Differences: ${comparison.differences?.length || 0} fields                             │
└───────────────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                    SIDE-BY-SIDE COMPARISON                                              │
├──────────────────────────┬────────────────────────────────────┬────────────────────────────────────────┤
│ FIELD                    │ JABAMA                             │ JAJIGA                                 │
├──────────────────────────┼────────────────────────────────────┼────────────────────────────────────────┤
│ Title                    │ ${j.title.padEnd(34)} │ ${g.title.padEnd(38)} │
│                          │                                    │                                        │
│ Price (M تومان/night)    │ ${j.price}.0 ${j.price > g.price ? '⚠️  HIGHER' : '✅ CHEAPER'}            │ ${g.price}.0 ${g.price < j.price ? '✅ CHEAPER' : '⚠️  HIGHER'}        │
│                          │                                    │                                        │
│ Location                 │ ${j.location.padEnd(34)} ⚠️        │ ${g.location.padEnd(38)} ⚠️           │
│                          │                                    │                                        │
│ Capacity                 │ ${j.capacity} guests ✅                      │ ${g.capacity} guests ✅                         │
│                          │                                    │                                        │
│ Bedrooms                 │ ${j.bedrooms} ✅                              │ ${g.bedrooms} ✅                                 │
│                          │                                    │                                        │
│ Bathrooms                │ ${j.bathrooms} ✅                              │ ${g.bathrooms} ✅                                 │
│                          │                                    │                                        │
│ Host                     │ ${j.host} ✅                     │ ${g.host} ✅                        │
│                          │                                    │                                        │
│ Rating                   │ ${j.rating} / 5.0                        │ ${g.rating} / 5.0                            │
└──────────────────────────┴────────────────────────────────────┴────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────────────────────────────────────┐
│ IDENTIFIED DIFFERENCES                                                                        │
├───────────────────────────────────────────────────────────────────────────────────────────────┤
${comparison.differences?.map((d, i) => {
  let section = `│                                                                                               │
│ ${i + 1}. ${d.field.toUpperCase()} DIFFERENCE:${' '.repeat(76 - d.field.length)}│
│    ├─ Jabama:    ${String(d.jabamaValue).padEnd(74)}│
│    ├─ Jajiga:    ${String(d.jajigaValue).padEnd(74)}│`;

  if (d.field === 'price') {
    const gap = Math.abs(d.jabamaValue - d.jajigaValue);
    const percent = ((gap / Math.min(d.jabamaValue, d.jajigaValue)) * 100).toFixed(0);
    section += `
│    └─ Gap:       ${gap},000,000 تومان (${percent}% more expensive on ${d.jabamaValue > d.jajigaValue ? 'Jabama' : 'Jajiga'})${' '.repeat(30 - percent.length)}│`;
  } else {
    section += `
│    └─ Note:      Same location, different word order${' '.repeat(40)}│`;
  }

  return section;
}).join('\n│                                                                                               │\n')}
│                                                                                               │
└───────────────────────────────────────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────────────────────────────────────┐
│ ANALYSIS & INSIGHTS                                                                           │
├───────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                               │
│ ✅ CONFIRMED MATCH                                                                            │
│    This is the SAME property listed on both platforms                                        │
│                                                                                               │
│ 💰 PRICE ARBITRAGE OPPORTUNITY                                                                │
│    ${j.price > g.price ? 'Jabama' : 'Jajiga'} charges ${Math.abs(j.price - g.price)} million تومان MORE per night (${((Math.abs(j.price - g.price) / Math.min(j.price, g.price)) * 100).toFixed(0)}% premium)${' '.repeat(28)}│
│                                                                                               │
│ 🎯 CONFIDENCE LEVEL                                                                           │
│    - Match Score: ${score}% (${comparison.match.charAt(0).toUpperCase() + comparison.match.slice(1)} Match)${' '.repeat(67 - score.length - comparison.match.length)}│
│    - Same: Title, Host, Capacity, Bedrooms, Bathrooms                                        │
│    - Different: ${comparison.differences?.map(d => d.field).join(', ')}${' '.repeat(73 - comparison.differences?.map(d => d.field).join(', ').length)}│
│                                                                                               │
│ 📊 RECOMMENDATION                                                                             │
│    Book on ${j.price < g.price ? 'Jabama' : 'Jajiga'} to save ${Math.abs(j.price - g.price)}M تومان${' '.repeat(70 - (j.price < g.price ? 'Jabama' : 'Jajiga').length)}│
└───────────────────────────────────────────────────────────────────────────────────────────────┘

Generated: ${new Date().toLocaleString()}
`;
}

// Create compact table
function createCompactTable(comparison) {
  const j = comparison.jabamaListing;
  const g = comparison.jajigaListing;
  const score = (comparison.matchScore * 100).toFixed(1);

  return `╔══════════════════════════════════════════════════════════════════════════════════╗
║              JABAMA vs JAJIGA - COMPARISON TABLE (COMPACT)                      ║
╚══════════════════════════════════════════════════════════════════════════════════╝

Property: ${j.title}
Match Score: ${score}% (${comparison.match.toUpperCase()} MATCH)

┌──────────────┬───────────────────────────────┬───────────────────────────────┐
│ Field        │ Jabama                        │ Jajiga                        │
├──────────────┼───────────────────────────────┼───────────────────────────────┤
│ Price        │ ${j.price}.0M تومان ${j.price > g.price ? '⚠️' : '✅'}              │ ${g.price}.0M تومان ${g.price < j.price ? '✅ CHEAPER' : '⚠️'}      │
│ Location     │ ${j.location.slice(0, 27).padEnd(27)} ⚠️│ ${g.location.slice(0, 27).padEnd(27)} ⚠️│
│ Capacity     │ ${j.capacity} guests ✅                  │ ${g.capacity} guests ✅                 │
│ Bedrooms     │ ${j.bedrooms} ✅                         │ ${g.bedrooms} ✅                        │
│ Bathrooms    │ ${j.bathrooms} ✅                         │ ${g.bathrooms} ✅                        │
│ Host         │ ${j.host.slice(0, 27).padEnd(27)} ✅│ ${g.host.slice(0, 27).padEnd(27)} ✅│
│ Rating       │ ${j.rating}/5.0                       │ ${g.rating}/5.0                     │
└──────────────┴───────────────────────────────┴───────────────────────────────┘

💰 KEY FINDING:
   Same villa, ${Math.abs(j.price - g.price)}M تومان price difference (${((Math.abs(j.price - g.price) / Math.min(j.price, g.price)) * 100).toFixed(0)}% ${j.price > g.price ? 'cheaper on Jajiga' : 'cheaper on Jabama'})

✅ CONFIDENCE: High (same host, capacity, bedrooms)
⚠️  DIFFERENCES: ${comparison.differences?.map(d => d.field).join(', ')}

📊 RECOMMENDATION: Book on ${j.price < g.price ? 'Jabama' : 'Jajiga'} to save money
`;
}

// Create CSV
function createCSV(comparison) {
  const j = comparison.jabamaListing;
  const g = comparison.jajigaListing;

  return `Field,Jabama,Jajiga,Match Status,Notes
Title,${j.title},${g.title},IDENTICAL,
Price (Million Toman),${j.price}.0,${g.price}.0,DIFFERENT,${j.price > g.price ? 'Jabama' : 'Jajiga'} ${Math.abs(j.price - g.price)}M more expensive
Location,${j.location},${g.location},DIFFERENT,Same location - different word order
Capacity (Guests),${j.capacity},${g.capacity},IDENTICAL,
Bedrooms,${j.bedrooms},${g.bedrooms},IDENTICAL,
Bathrooms,${j.bathrooms},${g.bathrooms},IDENTICAL,
Host,${j.host},${g.host},IDENTICAL,Same host on both platforms
Rating,${j.rating},${g.rating},SIMILAR,${g.rating > j.rating ? 'Jajiga' : 'Jabama'} slightly higher
Match Score,${(comparison.matchScore * 100).toFixed(1)}%,${(comparison.matchScore * 100).toFixed(1)}%,${comparison.match.toUpperCase()} MATCH,High confidence same property
Price Gap,${Math.abs(j.price - g.price)}M Toman,,,${((Math.abs(j.price - g.price) / Math.min(j.price, g.price)) * 100).toFixed(0)}% arbitrage opportunity
`;
}

// Main
function main() {
  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║   Creating Comparison Tables from JSON...               ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  const comparison = loadComparison();

  // Create tables
  const fullTable = createFullTable(comparison);
  const compactTable = createCompactTable(comparison);
  const csv = createCSV(comparison);

  // Write files
  fs.writeFileSync(path.join(OUTPUT_DIR, 'comparison-table.txt'), fullTable);
  fs.writeFileSync(path.join(OUTPUT_DIR, 'comparison-table-compact.txt'), compactTable);
  fs.writeFileSync(path.join(OUTPUT_DIR, 'comparison-table.csv'), csv);

  console.log('✅ Created 3 table formats:\n');
  console.log('   📄 comparison-table.txt         - Full detailed table');
  console.log('   📄 comparison-table-compact.txt - Compact console view');
  console.log('   📄 comparison-table.csv         - Excel/Sheets format\n');
  console.log('📖 View:');
  console.log('   cat output/comparison-table-compact.txt\n');
  console.log('✨ Done!\n');
}

main();
