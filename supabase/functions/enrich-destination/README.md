# `enrich-destination`

Backend-only destination enrichment for SeasonScout.

This function enriches one imported destination, or a very small curated batch, with backend-stored fields:

- `summary`
- `hero_image_url`
- `travel_tags`
- `seasonal_insight`

It uses Wikimedia for summary candidates, Unsplash for hero image candidates, writes destination source snapshots for traceability, and updates `is_published` only after backend publish-readiness rules pass.

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

- Empty body enriches the next climate-imported destination with `enrichment_status = 'pending'`.
- `{"slug":"kyoto"}` enriches one explicit destination.
- `{"slugs":["kyoto","reykjavik"]}` enriches a very small explicit batch.
- `{"slug":"kyoto","allow_non_pending":true}` allows retrying one explicit destination in another non-published enrichment status, such as `failed`.
- `{"slug":"kyoto","allow_non_pending":true,"overwrite_existing":true}` retries one explicit non-pending destination and refreshes stored summary/image fields instead of filling blanks only.
- `{"slug":"kyoto","allow_reenrich_existing":true}` safely re-enriches one already enriched destination and refreshes its stored enrichment fields.

Request body rules:

- Destinations must already have `climate_import_status = 'imported'`.
- Pending queue mode only selects destinations with `enrichment_status = 'pending'`.
- Explicit selection mode is capped at `3` destinations.
- Queue mode accepts `limit`, capped at `3`.
- `allow_reenrich_existing` requires exactly one explicit `slug`.
- `allow_reenrich_existing` is rejected for `slugs` batches and queue mode.
- Batch and queue runs reject override flags and stay pending-only.
- `allow_non_pending` does not permit re-enriching an already enriched destination. Use `allow_reenrich_existing` for that case.

Required request headers:

- `content-type: application/json`
- `x-seasonscout-ingestion-secret: <SEASONSCOUT_INGESTION_SECRET>`

Example:

```bash
curl -X POST "https://<project-ref>.supabase.co/functions/v1/enrich-destination" \
  -H "content-type: application/json" \
  -H "x-seasonscout-ingestion-secret: $SEASONSCOUT_INGESTION_SECRET" \
  -d '{"slug":"kyoto"}'
```

Single-slug re-enrichment request body:

```json
{"slug":"kyoto","allow_reenrich_existing":true}
```
