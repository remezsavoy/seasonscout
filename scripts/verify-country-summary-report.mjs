import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const reportPath = path.resolve(__dirname, '../qa/country-summary-report.json');

function pushIssue(issues, condition, message) {
  if (!condition) {
    issues.push(message);
  }
}

async function loadReport() {
  try {
    await access(reportPath);
  } catch {
    throw new Error(`Missing report artifact: ${reportPath}`);
  }

  const rawReport = await readFile(reportPath, 'utf8');

  try {
    return JSON.parse(rawReport);
  } catch (error) {
    throw new Error(`Country summary report is not valid JSON: ${error.message}`);
  }
}

function verifyTopLevelReport(report, issues) {
  pushIssue(issues, report?.generated_by === 'country-summary-fixture-harness', 'Unexpected report generator metadata.');
  pushIssue(issues, Array.isArray(report?.countries) && report.countries.length > 0, 'Report is missing country entries.');
  pushIssue(
    issues,
    typeof report?.fixture_count === 'number' && report.fixture_count === report.countries.length,
    'Report fixture_count does not match the number of country entries.',
  );
  pushIssue(
    issues,
    typeof report?.classifications?.pass === 'number'
      && typeof report?.classifications?.warn === 'number'
      && typeof report?.classifications?.fail === 'number',
    'Report classifications block is missing or incomplete.',
  );

  const suiteReview = report?.suite_review;
  const requiredSuiteKeys = [
    'repeated_opening_structures',
    'repeated_phrase_families',
    'repeated_cadence_signatures',
    'swappable_fingerprints',
  ];

  for (const key of requiredSuiteKeys) {
    pushIssue(issues, Array.isArray(suiteReview?.[key]), `Report suite_review.${key} is missing.`);
  }
}

function verifyCountryEntry(country, issues) {
  const label = country?.slug ?? country?.name ?? 'unknown-country';

  pushIssue(issues, typeof country?.summary === 'string' && country.summary.trim().length > 0, `${label}: summary is missing.`);
  pushIssue(issues, Array.isArray(country?.selected_anchors), `${label}: selected_anchors is missing.`);
  pushIssue(issues, Array.isArray(country?.trip_style_fit), `${label}: trip_style_fit is missing.`);
  pushIssue(issues, Array.isArray(country?.proper_noun_anchors), `${label}: proper_noun_anchors is missing.`);
  pushIssue(issues, typeof country?.validation === 'object' && country.validation !== null, `${label}: validation block is missing.`);
  pushIssue(issues, typeof country?.score === 'object' && country.score !== null, `${label}: score block is missing.`);
  pushIssue(issues, typeof country?.review === 'object' && country.review !== null, `${label}: review block is missing.`);
  pushIssue(
    issues,
    typeof country?.classification === 'string' && country.classification === country?.review?.classification,
    `${label}: classification and review.classification are out of sync.`,
  );
}

function verifyCountryClassifications(report, issues) {
  const warnCount = report.classifications?.warn ?? 0;
  const failCount = report.classifications?.fail ?? 0;
  const nonPassCountries = report.countries.filter((country) => country.classification !== 'pass');

  if (warnCount > 0 || failCount > 0) {
    issues.push(`Expected all fixture classifications to pass, found warn=${warnCount} and fail=${failCount}.`);
  }

  if (nonPassCountries.length > 0) {
    for (const country of nonPassCountries) {
      const issueKeys = (country.review?.issues ?? []).map((issue) => issue.key).join(', ') || 'unknown';
      issues.push(`${country.slug ?? country.name}: classification=${country.classification} (${issueKeys}).`);
    }
  }
}

async function main() {
  let report;

  try {
    report = await loadReport();
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }

  const issues = [];

  verifyTopLevelReport(report, issues);

  for (const country of report.countries ?? []) {
    verifyCountryEntry(country, issues);
  }

  verifyCountryClassifications(report, issues);

  if (issues.length > 0) {
    console.error('Country summary report verification failed:');

    for (const issue of issues) {
      console.error(`- ${issue}`);
    }

    process.exit(1);
  }

  console.log(`Country summary report verification passed for ${report.countries.length} fixtures.`);
}

await main();
