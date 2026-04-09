# `ingest-destination-batch`

Backend-only curated seed importer for SeasonScout destinations.

## Required Secret

This function requires the Supabase project secret `SEASONSCOUT_INGESTION_SECRET`.

- The secret is read at runtime from `Deno.env` in `index.ts`.
- Callers must send the same value in the `x-seasonscout-ingestion-secret` request header.
- Do not store the real secret value in committed files such as `.env` or `.env.example`.

## Other Runtime Secrets

Supabase provides these server-side values to the function environment:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Those are used to write `ingestion_runs`, `countries`, `destinations`, and `destination_source_snapshots`.

## Invocation

HTTP method:

- `POST`

Request body:

- Empty body or `{}` imports the full curated seed batch.
- `{"slugs":["kyoto","reykjavik"]}` imports only the listed curated seed destinations.

Required request headers:

- `content-type: application/json`
- `x-seasonscout-ingestion-secret: <SEASONSCOUT_INGESTION_SECRET>`

Example:

```bash
curl -X POST "https://<project-ref>.supabase.co/functions/v1/ingest-destination-batch" \
  -H "content-type: application/json" \
  -H "x-seasonscout-ingestion-secret: $SEASONSCOUT_INGESTION_SECRET" \
  -d '{"slugs":["kyoto","reykjavik"]}'
```
