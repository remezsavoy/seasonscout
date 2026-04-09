# `compose-country-editorial`

Backend-only country enrichment for SeasonScout.

This is a new country action that stays intentionally thin:

1. load the country row and light destination context
2. load the description markdown prompt
3. call Gemini and store the returned description
4. load the hero-image markdown prompt
5. call Gemini and store the returned image query/result
6. fetch the first Unsplash result for that query
7. persist the final result and minimal metadata

Success for this action is based only on whether it stores:

- a country description
- a hero image result

Country publish-readiness remains a separate concern. Missing fields such as `seasonal_overview` do not cause this action itself to be marked as failed.

## Prompt Source Of Truth

This action is self-contained and imports its prompt assets from local TypeScript modules:

- [`countryDescriptionPrompt.ts`](/C:/Users/remez/Desktop/SeasonScout/supabase/functions/compose-country-editorial/prompts/countryDescriptionPrompt.ts)
- [`heroImageQueryPrompt.ts`](/C:/Users/remez/Desktop/SeasonScout/supabase/functions/compose-country-editorial/prompts/heroImageQueryPrompt.ts)

## Required Secrets

- `SEASONSCOUT_INGESTION_SECRET`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `GEMINI_API_KEY`
- `UNSPLASH_ACCESS_KEY`

Optional:

- `SEASONSCOUT_GEMINI_COUNTRY_EDITORIAL_MODEL`

## Invocation

HTTP method:

- `POST`

Request body:

- Empty body enriches the next pending country.
- `{"slug":"japan"}` enriches one explicit country.
- `{"slugs":["japan","iceland"]}` enriches a very small explicit batch.
- `{"slug":"japan","allow_non_pending":true}` retries one explicit non-pending country.
- `{"slug":"japan","allow_non_pending":true,"overwrite_existing":true}` refreshes existing summary and hero fields instead of filling blanks only.
