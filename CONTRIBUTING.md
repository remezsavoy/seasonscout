# Contributing

## Country Summary QA

SeasonScout's country summary QA is fixture-based and fully local. It does not call live Wikimedia or other external content sources during review or CI.

### When to Regenerate the Report

Run the fixture harness whenever you change:

- `supabase/functions/enrich-country/summaryPipeline.js`
- `supabase/functions/enrich-country/fixtures/countrySummaryFixtures.js`
- banned-phrase or review logic that affects summary validation or scoring
- report structure or summary QA output

Use:

```bash
npm run qa:country-summaries
```

This rewrites `qa/country-summary-report.json`. Commit that file whenever the generated output changes.

### Local Validation

Before pushing summary-related changes, run:

```bash
npm run qa:country-summaries
npm run qa:country-summaries:verify
npm run build
```

The verifier fails when:

- `qa/country-summary-report.json` is missing
- required report sections are missing
- any fixture is classified as `warn` or `fail`

### Reviewing Report Diffs

Report diffs are expected when summary generation, fixtures, review thresholds, or output structure change.

Reviewers should focus on:

- the generated summary text
- selected anchors and `proper_noun_anchors`
- trip-style fit and seasonality output
- score and review classification changes
- whether a summary became more generic, swappable, or destination-heavy

The goal is not to freeze copy permanently. The goal is to keep the committed report aligned with the current deterministic generator so PRs expose meaningful editorial changes.

### CI Behavior

GitHub Actions runs:

- `npm run qa:country-summaries`
- `npm run qa:country-summaries:verify`
- `npm run build`

CI also fails if `qa/country-summary-report.json` was not regenerated and committed with the PR.
