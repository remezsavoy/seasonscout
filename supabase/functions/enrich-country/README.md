# `enrich-country`

Backend-only country enrichment for SeasonScout.

This function enriches one country, or a very small curated batch, with backend-stored fields:

- `summary`
- `hero_image_url`
- `seasonal_overview`

It uses Wikipedia for baseline country identity, Wikivoyage for traveler-oriented framing, deterministic backend signal building for final country summaries, Unsplash for country hero image candidates, writes country source snapshots for traceability, and updates `is_published` only after backend country publish-readiness rules pass.

Country summary snapshots now include:

- raw source context from Wikipedia and Wikivoyage
- extracted summary signals
- validation output, including banned-phrase matches
- a summary score object for specificity, differentiation, and traveler usefulness
- review classification and issue flags for weak outputs

## Local QA

Fixture-based summary QA lives in:

- `supabase/functions/enrich-country/fixtures/countrySummaryFixtures.js`
- `scripts/run-country-summary-fixtures.mjs`
- `qa/country-summary-report.json`

Run it from the project root:

```bash
npm run qa:country-summaries
npm run qa:country-summaries:verify
```

The harness uses local source-context fixtures only, writes a stable JSON report for diffing, and prints per-country pass or warn or fail output with selected anchors, proper-noun anchors, trip-style fit, seasonality, validation, score, and review flags.

The report also includes suite-level review for:

- repeated opening structures
- repeated phrase families
- overly templated cadence
- swappable summary fingerprints

Contributor workflow:

- run `npm run qa:country-summaries` whenever the deterministic summary generator, fixtures, scoring, or review thresholds change
- commit `qa/country-summary-report.json` whenever the generated report changes
- use `npm run qa:country-summaries:verify` for a strict local check before pushing

CI fails when:

- the report artifact is missing or incomplete
- any fixture is classified as `warn` or `fail`
- the committed report is out of date with the current generator output
- the frontend build fails

## Required Secrets

This function requires the following Supabase project secrets:

- `SEASONSCOUT_INGESTION_SECRET`
- `UNSPLASH_ACCESS_KEY`

Recommended backend config:

- `SEASONSCOUT_WIKIMEDIA_USER_AGENT`
  Use a descriptive user agent string for Wikimedia requests.

Do not store real secret values in committed files.

## Invocation

HTTP method:

- `POST`

Request body:

- Empty body enriches the next country with `enrichment_status = 'pending'`.
- `{"slug":"japan"}` enriches one explicit country.
- `{"slugs":["japan","iceland"]}` enriches a very small explicit batch.
- `{"slug":"japan","allow_non_pending":true}` allows retrying one explicit country in another enrichment status, such as `failed` or `enriched`.
- `{"slug":"japan","allow_non_pending":true,"overwrite_existing":true}` safely re-enriches one explicit non-pending country and refreshes stored summary/image/overview fields instead of filling blanks only.
- `{"slugs":["japan","italy","iceland"],"allow_non_pending":true,"overwrite_existing":true,"dry_run":true}` previews a reviewed re-enrichment batch for countries that already have stored backend fields.
- `{"slugs":["japan","italy"],"dry_run":true}` previews staged summary changes without writing snapshots or country rows.
- `{"slugs":["japan","italy"],"dry_run":true,"require_publish_ready":true}` previews only the countries that would stay publish-ready after the write.
- `{"slugs":["japan","italy"],"require_publish_ready":true}` writes a small reviewed batch and skips countries that would still fail publish readiness.

Request body rules:

- Pending queue mode only selects countries with `enrichment_status = 'pending'`.
- Explicit selection mode is capped at `3` countries.
- Queue mode accepts `limit`, capped at `3`.
- Queue mode stays pending-only.
- Explicit `slugs` batches can use `allow_non_pending` and `overwrite_existing` for reviewed staged re-enrichment.
- `dry_run` works in queue mode and explicit selection mode.
- `require_publish_ready` keeps the run reviewable by skipping writes for countries that would still miss required publish fields after generation.

Response highlights:

- `dry_run` and `require_publish_ready` echo the staged-ingestion mode used for the run.
- `review_summary` rolls up how many countries already had summaries, would be updated, would be skipped for readiness, or stayed unchanged.
- Each `countries_processed` entry includes:
  - `slug`
  - `old_summary`
  - `new_summary`
  - `summary_change`
  - `write_action`
  - `publish_readiness_before`
  - `publish_readiness_after`
  - `fields_planned`
  - `fields_updated`

Required request headers:

- `content-type: application/json`
- `x-seasonscout-ingestion-secret: <SEASONSCOUT_INGESTION_SECRET>`

Example:

```bash
curl -X POST "https://<project-ref>.supabase.co/functions/v1/enrich-country" \
  -H "content-type: application/json" \
  -H "x-seasonscout-ingestion-secret: $SEASONSCOUT_INGESTION_SECRET" \
  -d '{"slug":"japan"}'
```

Recommended staged rollout:

1. Run a dry-run against `3` explicit slugs with `allow_non_pending: true` and `overwrite_existing: true` when you are refreshing already-enriched countries for summary quality review.
2. Inspect `old_summary`, `new_summary`, `summary_change`, and `publish_readiness_after` in the response.
3. Re-run the same batch without `dry_run` and with `require_publish_ready: true` so any country that would still fail readiness is skipped rather than written blindly.
