import { buildCountrySummaryCandidate } from '../supabase/functions/enrich-country/summaryPipeline.js';
import { countrySummaryFixtures } from '../supabase/functions/enrich-country/fixtures/countrySummaryFixtures.js';

const results = countrySummaryFixtures.map(fixture => {
  const summary = buildCountrySummaryCandidate({
    country: fixture.country,
    wikipediaContext: fixture.wikipediaContext,
    wikivoyageContext: fixture.wikivoyageContext,
    contextDestinations: fixture.contextDestinations,
    publishedDestinationCount: fixture.publishedDestinationCount
  });
  return {
    fixture: fixture.slug,
    country: fixture.country.name,
    summary: summary.summary,
    classification: summary.review.classification,
    issues: summary.review.issues,
    patternFamily: summary.signals.editorial.patternFamily,
    length: summary.summary.length,
    opening: summary.summary.split('.')[0]
  };
});

// 1. Archetype distribution
const archetypeDist = {};
results.forEach(r => {
  archetypeDist[r.patternFamily] = (archetypeDist[r.patternFamily] || 0) + 1;
});

// 2. Warning counts
const warningCounts = {};
results.forEach(r => {
  r.issues.forEach(issue => {
    if (issue.severity === 'warn') {
      warningCounts[issue.key] = (warningCounts[issue.key] || 0) + 1;
    }
  });
});

// 3. Warn/Fail countries
const problematic = results.filter(r => r.classification !== 'pass');

// 4. Longest summaries
const longest = [...results].sort((a, b) => b.length - a.length).slice(0, 5);

// 5. Opening patterns
const openings = {};
results.forEach(r => {
  const words = r.opening.split(' ');
  const pattern = words.slice(0, 3).join(' ');
  openings[pattern] = (openings[pattern] || 0) + 1;
});

console.log('--- DRY RUN REPORT ---');
console.log('\nArchetype Distribution:');
console.log(JSON.stringify(archetypeDist, null, 2));

console.log('\nWarning Counts:');
console.log(JSON.stringify(warningCounts, null, 2));

console.log('\nProblematic Countries (Warn/Fail):');
problematic.forEach(p => {
  console.log(`- ${p.country} (${p.classification}): ${p.issues.map(i => i.message).join(', ')}`);
});

console.log('\nLongest Summaries:');
longest.forEach(l => {
  console.log(`- ${l.country} (${l.length} chars): "${l.summary}"`);
});

console.log('\nRepeated Opening Patterns:');
const repeatedOpenings = Object.entries(openings)
  .filter(([_, count]) => count > 1)
  .sort((a, b) => b[1] - a[1]);

repeatedOpenings.forEach(([pattern, count]) => {
  console.log(`- "${pattern}...": ${count} times`);
});
