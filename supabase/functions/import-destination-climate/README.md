# `import-destination-climate`

Backend-only monthly climate importer for SeasonScout destinations.

## Weather Source

This function fetches historical climate inputs from the Open-Meteo Historical Weather API and normalizes them into SeasonScout monthly climate rows.

## Required Secret

This function requires the Supabase project secret `SEASONSCOUT_INGESTION_SECRET`.

- The secret is read at runtime from `Deno.env` in `index.ts`.
- Callers must send the same value in the `x-seasonscout-ingestion-secret` request header.
- Do not store the real secret value in committed files such as `.env` or `.env.example`.

## Invocation

HTTP method:

- `POST`

Request body:

- Empty body imports the next pending destination.
- `{"slug":"kyoto"}` imports one explicit destination.
- `{"slugs":["kyoto","reykjavik"]}` imports a very small explicit batch.
- `{"slug":"kyoto","allow_non_pending":true}` allows a non-pending destination to be refreshed explicitly.

Request body rules:

- Only destinations with `climate_import_status = 'pending'` are eligible by default.
- `allow_non_pending` must be explicitly set to `true` to refresh a destination in another status.
- Automatic queue mode accepts `limit`, capped at `3`.
- Explicit selection mode is capped at `3` destinations.

Required request headers:

- `content-type: application/json`
- `x-seasonscout-ingestion-secret: <SEASONSCOUT_INGESTION_SECRET>`

Example:

```bash
curl -X POST "https://<project-ref>.supabase.co/functions/v1/import-destination-climate" \
  -H "content-type: application/json" \
  -H "x-seasonscout-ingestion-secret: $SEASONSCOUT_INGESTION_SECRET" \
  -d '{"slug":"kyoto"}'
```
