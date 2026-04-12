# `compose-country-full`

Unified backend-only country composition for SeasonScout.

This function replaces the old multi-step manual workflow by doing one country run end to end:

1. generate country summary, seasonal overview, and destination discovery with Gemini
2. generate a country hero-image query with Gemini
3. fetch the country hero image from Unsplash
4. upsert the `countries` row and country source snapshots
5. batch-generate destination summaries, tags, seasonal insight, and hero queries with Gemini
6. fetch destination hero images from Unsplash
7. upsert destination rows plus destination source snapshots
8. import monthly climate from Open-Meteo for each destination
9. refresh destination climate derivatives and publish-readiness
10. refresh country publish-readiness

## Required secrets

- `SEASONSCOUT_INGESTION_SECRET`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `GEMINI_API_KEY`
- `UNSPLASH_ACCESS_KEY`

Optional:

- `SEASONSCOUT_GEMINI_COUNTRY_FULL_MODEL`
- `SEASONSCOUT_GEMINI_COUNTRY_EDITORIAL_MODEL`
- `GEMINI_MODEL`

## Invocation

HTTP method:

- `POST`

Required header:

- `x-seasonscout-ingestion-secret: <SEASONSCOUT_INGESTION_SECRET>`

Request body examples:

```json
{"country":"Japan"}
```

```json
{"country":"Japan","max_destinations":6}
```

```json
{"country":"Japan","allow_non_pending":true,"overwrite_existing":true}
```

```json
{"action":"regenerate_destination","destination_id":"<uuid>","overwrite_existing":true}
```

```json
{"action":"regenerate_destination","destination_slug":"kyoto","overwrite_existing":true}
```

## Output

The response includes:

- top-level run status
- final country record summary
- per-destination publish and climate status
- aggregate stats and duration
