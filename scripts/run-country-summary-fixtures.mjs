import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildCountrySummaryCandidate } from '../supabase/functions/enrich-country/summaryPipeline.js';
import { countrySummaryFixtures } from '../supabase/functions/enrich-country/fixtures/countrySummaryFixtures.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const reportPath = path.resolve(__dirname, '../qa/country-summary-report.json');

function stableSort(value) {
  if (Array.isArray(value)) {
    return value.map((entry) => stableSort(entry));
  }

  if (!value || typeof value !== 'object') {
    return value;
  }

  return Object.keys(value)
    .sort((left, right) => left.localeCompare(right))
    .reduce((accumulator, key) => {
      accumulator[key] = stableSort(value[key]);
      return accumulator;
    }, {});
}

async function readPreviousReport() {
  try {
    const previous = await readFile(reportPath, 'utf8');
    return JSON.parse(previous);
  } catch {
    return null;
  }
}

function buildFixtureReport(fixture) {
  const candidate = buildCountrySummaryCandidate({
    country: fixture.country,
    wikipediaContext: fixture.wikipediaContext,
    wikivoyageContext: fixture.wikivoyageContext,
    contextDestinations: fixture.contextDestinations,
    publishedDestinationCount: fixture.publishedDestinationCount,
  });

  if (!candidate) {
    return {
      slug: fixture.slug,
      name: fixture.country.name,
      classification: 'fail',
      summary: null,
      selected_variant: null,
      selected_anchors: [],
      trip_style_fit: [],
      seasonality: null,
      validation: null,
      score: null,
      review: {
        classification: 'fail',
        issues: [
          {
            key: 'missing-candidate',
            severity: 'fail',
            message: `No candidate generated for ${fixture.slug}.`,
          },
        ],
      },
      debug: {
        travel_identity: null,
        anchors: [],
        trip_styles: [],
        seasonality: null,
        context: {
          featured_destination_names: fixture.contextDestinations.map((destination) => destination.name),
          used_sources: [],
        },
      },
    };
  }

  return {
    slug: fixture.slug,
    name: fixture.country.name,
    classification: candidate.review.classification,
    summary: candidate.summary,
    selected_variant: candidate.selectedVariant,
    selected_anchors: candidate.signals.anchors.map((anchor) => anchor.label),
    proper_noun_anchors: (candidate.signals.editorial?.properNounAnchors ?? []).map((anchor) => anchor.label),
    trip_style_fit: candidate.signals.tripStyles.map((tripStyle) => tripStyle.label),
    seasonality: candidate.signals.seasonality.include
      ? {
        planning_label: candidate.signals.seasonality.planningLabel,
        reason: candidate.signals.seasonality.reason,
        summary_text: candidate.signals.seasonality.summaryText,
      }
      : null,
    validation: {
      is_valid: candidate.validation.isValid,
      errors: candidate.validation.errors,
      warnings: candidate.validation.warnings,
      matched_banned_phrases: candidate.validation.matchedBannedPhrases,
    },
    score: candidate.validation.score,
    review: candidate.review,
    debug: {
      editorial: candidate.signals.editorial ?? null,
      travel_identity: candidate.signals.travelIdentity,
      anchors: candidate.signals.anchors,
      named_anchors: candidate.signals.namedAnchors ?? [],
      trip_styles: candidate.signals.tripStyles,
      seasonality: candidate.signals.seasonality,
      context: candidate.signals.context,
    },
  };
}

function classifyReview(issues) {
  if (issues.some((issue) => issue.severity === 'fail')) {
    return 'fail';
  }

  if (issues.some((issue) => issue.severity === 'warn')) {
    return 'warn';
  }

  return 'pass';
}

function normalizeTemplateFingerprint(countryReport) {
  let normalized = String(countryReport.summary ?? '').toLowerCase();
  const replacementTargets = [
    countryReport.name,
    ...(countryReport.debug?.context?.featuredDestinationNames ?? []),
    ...(countryReport.proper_noun_anchors ?? []),
  ]
    .filter(Boolean)
    .sort((left, right) => right.length - left.length);

  for (const value of replacementTargets) {
    normalized = normalized.replaceAll(String(value).toLowerCase(), '__place__');
  }

  normalized = normalized
    .replace(/\b(?:spring|summer|autumn|winter|late autumn)\b/g, '__time__')
    .replace(/\b(?:january|february|march|april|may|june|july|august|september|october|november|december)\b/g, '__time__')
    .replace(/[^a-z_ ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return normalized;
}

function applySuiteReview(countryReports) {
  const openingCounts = new Map();
  const cadenceCounts = new Map();
  const phraseFamilyCounts = new Map();
  const fingerprintCounts = new Map();
  const openingThreshold = Math.max(4, Math.ceil(countryReports.length * 0.45));
  const phraseFamilyThreshold = Math.max(4, Math.ceil(countryReports.length * 0.4));
  const cadenceThreshold = Math.max(6, Math.ceil(countryReports.length * 0.55));
  const fingerprintThreshold = Math.max(3, Math.ceil(countryReports.length * 0.18));

  for (const country of countryReports) {
    const openingFamily = country.review?.metrics?.opening_family ?? 'other';
    const cadenceSignature = country.review?.metrics?.cadence_signature ?? '';
    const phraseFamilies = country.review?.metrics?.phrase_families ?? [];
    const fingerprint = normalizeTemplateFingerprint(country);

    openingCounts.set(openingFamily, (openingCounts.get(openingFamily) ?? 0) + 1);
    cadenceCounts.set(cadenceSignature, (cadenceCounts.get(cadenceSignature) ?? 0) + 1);
    fingerprintCounts.set(fingerprint, (fingerprintCounts.get(fingerprint) ?? 0) + 1);

    for (const phraseFamily of phraseFamilies) {
      phraseFamilyCounts.set(phraseFamily, (phraseFamilyCounts.get(phraseFamily) ?? 0) + 1);
    }
  }

  const suiteReview = {
    repeated_opening_structures: [],
    repeated_phrase_families: [],
    repeated_cadence_signatures: [],
    swappable_fingerprints: [],
  };

  for (const [openingFamily, count] of openingCounts.entries()) {
    if (openingFamily !== 'other' && count >= openingThreshold) {
      suiteReview.repeated_opening_structures.push({ opening_family: openingFamily, count });
    }
  }

  for (const [phraseFamily, count] of phraseFamilyCounts.entries()) {
    if (count >= phraseFamilyThreshold) {
      suiteReview.repeated_phrase_families.push({ phrase_family: phraseFamily, count });
    }
  }

  for (const [cadenceSignature, count] of cadenceCounts.entries()) {
    if (cadenceSignature && count >= cadenceThreshold) {
      suiteReview.repeated_cadence_signatures.push({ cadence_signature: cadenceSignature, count });
    }
  }

  for (const [fingerprint, count] of fingerprintCounts.entries()) {
    if (fingerprint && count >= fingerprintThreshold) {
      suiteReview.swappable_fingerprints.push({ fingerprint, count });
    }
  }

  const updatedCountries = countryReports.map((country) => {
    const issues = [...(country.review?.issues ?? [])];
    const openingFamily = country.review?.metrics?.opening_family ?? 'other';
    const cadenceSignature = country.review?.metrics?.cadence_signature ?? '';
    const phraseFamilies = country.review?.metrics?.phrase_families ?? [];
    const properNounAnchorCount = country.review?.metrics?.proper_noun_anchor_count ?? 0;
    const availableProperNounAnchorCount = country.review?.metrics?.available_proper_noun_anchor_count ?? 0;
    const fingerprint = normalizeTemplateFingerprint(country);

    if (availableProperNounAnchorCount > 0 && properNounAnchorCount < 1) {
      issues.push({
        key: 'lack-of-proper-noun-anchors',
        severity: 'warn',
        message: 'Summary does not surface any proper-noun anchors.',
      });
    }

    if (openingFamily !== 'other' && (openingCounts.get(openingFamily) ?? 0) >= openingThreshold) {
      issues.push({
        key: 'repeated-opening-structure',
        severity: 'warn',
        message: `Opening family "${openingFamily}" repeats ${openingCounts.get(openingFamily)} times across the fixture set.`,
      });
    }

    const repeatedFamilies = phraseFamilies.filter((phraseFamily) => (phraseFamilyCounts.get(phraseFamily) ?? 0) >= phraseFamilyThreshold);

    if (repeatedFamilies.length > 0) {
      issues.push({
        key: 'repeated-phrase-families',
        severity: 'warn',
        message: `Phrase families repeat across the fixture set: ${repeatedFamilies.join(', ')}.`,
      });
    }

    if ((cadenceCounts.get(cadenceSignature) ?? 0) >= cadenceThreshold && properNounAnchorCount < 2) {
      issues.push({
        key: 'overly-templated-cadence',
        severity: 'warn',
        message: `Cadence signature "${cadenceSignature}" repeats ${cadenceCounts.get(cadenceSignature)} times.`,
      });
    }

    if ((fingerprintCounts.get(fingerprint) ?? 0) >= fingerprintThreshold) {
      issues.push({
        key: 'swappable-country-voice',
        severity: 'warn',
        message: 'Summary still looks too swappable after proper nouns and timing cues are normalized out.',
      });
    }

    const dedupedIssues = issues.filter((issue, index) =>
      issues.findIndex((entry) => entry.key === issue.key && entry.message === issue.message) === index
    );

    return {
      ...country,
      classification: classifyReview(dedupedIssues),
      review: {
        ...country.review,
        classification: classifyReview(dedupedIssues),
        issues: dedupedIssues,
      },
    };
  });

  return {
    countries: updatedCountries,
    suiteReview,
  };
}

function summarizeClassifications(countryReports) {
  return countryReports.reduce(
    (accumulator, report) => {
      accumulator[report.classification] += 1;
      return accumulator;
    },
    { pass: 0, warn: 0, fail: 0 },
  );
}

function diffSummaries(previousReport, currentCountries) {
  if (!previousReport?.countries) {
    return [];
  }

  const previousBySlug = new Map(previousReport.countries.map((country) => [country.slug, country]));
  return currentCountries
    .filter((country) => {
      const previous = previousBySlug.get(country.slug);

      if (!previous) {
        return true;
      }

      return previous.summary !== country.summary
        || previous.classification !== country.classification
        || JSON.stringify(previous.selected_anchors) !== JSON.stringify(country.selected_anchors)
        || JSON.stringify(previous.trip_style_fit) !== JSON.stringify(country.trip_style_fit);
    })
    .map((country) => country.slug);
}

async function main() {
  const previousReport = await readPreviousReport();
  const initialCountries = countrySummaryFixtures.map((fixture) => buildFixtureReport(fixture));
  const { countries, suiteReview } = applySuiteReview(initialCountries);
  const classifications = summarizeClassifications(countries);
  const changedCountries = diffSummaries(previousReport, countries);
  const report = stableSort({
    generated_by: 'country-summary-fixture-harness',
    fixture_count: countries.length,
    classifications,
    countries,
    suite_review: suiteReview,
  });

  await mkdir(path.dirname(reportPath), { recursive: true });
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');

  console.log(`Country summary fixture QA: ${countries.length} countries`);
  console.log(`Pass: ${classifications.pass}  Warn: ${classifications.warn}  Fail: ${classifications.fail}`);

  if (changedCountries.length > 0) {
    console.log(`Changed since last report: ${changedCountries.join(', ')}`);
  } else if (previousReport) {
    console.log('Changed since last report: none');
  }

  for (const country of countries) {
    const issueSummary = country.review.issues.map((issue) => `${issue.severity}:${issue.key}`).join(', ') || 'no issues';
    console.log(`[${country.classification.toUpperCase()}] ${country.name}: ${country.summary}`);
    console.log(`  anchors=${country.selected_anchors.join(' | ')}`);
    console.log(`  tripStyles=${country.trip_style_fit.join(' | ') || 'none'}`);
    console.log(`  issues=${issueSummary}`);
  }

  if (classifications.fail > 0) {
    process.exitCode = 1;
  }
}

await main();
