# SeasonScout

[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=061922)](https://react.dev/)
[![TypeScript Edge Functions](https://img.shields.io/badge/TypeScript-Edge%20Functions-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Backend-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com/)
[![Gemini](https://img.shields.io/badge/Gemini-AI%20Pipeline-4285F4?logo=google-gemini&logoColor=white)](https://ai.google.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)

> A travel climate planner with a backend content pipeline that can expand its own country coverage.

SeasonScout is a production-style travel planning app built with Vite, React, Tailwind CSS, and Supabase. It combines live weather, short forecasts, stored monthly climate data, favorites, and editorial country pages. The strongest part of the project is its backend enrichment system: curated country records can be expanded into publishable country content through Supabase Edge Functions, Gemini-generated editorial copy, and Unsplash hero imagery.

## What Makes This Different

Most travel apps stop at search and weather. SeasonScout treats content generation as part of the product architecture:

1. A curated destination or country is added through backend ingestion.
2. Supabase Edge Functions enrich the record with climate data, editorial context, and imagery.
3. `compose-country-editorial` batches Gemini requests to generate country descriptions and hero-image queries.
4. The function fetches a matching Unsplash image, stores attribution metadata, and updates the country row.
5. The frontend reads prepared data through thin service layers instead of recomputing business logic in React.

The result is a travel app that can scale its editorial layer with backend workflows instead of manual page-by-page writing.

## Architecture

### Frontend

- Vite + React 18
- JavaScript/JSX UI layer with Tailwind CSS
- React Router routes for home, destination, country, favorites, auth, and not-found flows
- Thin service modules under `src/services/` for destinations, countries, weather, auth, favorites, and home content

### Backend

- Supabase Postgres for destinations, countries, monthly climate, profiles, favorites, and ingestion snapshots
- Supabase Auth for email/password sign-in
- Supabase Edge Functions for ingestion, enrichment, and AI-assisted editorial generation
- Open-Meteo for live weather and climate-source imports
- Wikimedia + Wikivoyage-backed enrichment for travel context
- Unsplash for hero photography and attribution metadata

### Thin Frontend, Smart Backend

The project intentionally keeps durable logic off the page components:

- React renders UI, owns local state, and shows loading/error/empty states
- Supabase and Edge Functions own ingestion, enrichment, publish-readiness, and climate derivation
- Postgres owns data integrity, RLS, and future aggregate/RPC reads

## The AI Content Pipeline

The core AI workflow lives in [`supabase/functions/compose-country-editorial/index.ts`](/C:/Users/remez/Documents/Projects/SeasonScout/supabase/functions/compose-country-editorial/index.ts).

Current behavior:

1. Load the target `countries` row plus light published-destination context.
2. Build a structured Gemini description prompt from [`countryDescriptionPrompt.ts`](/C:/Users/remez/Documents/Projects/SeasonScout/supabase/functions/compose-country-editorial/prompts/countryDescriptionPrompt.ts).
3. Generate country descriptions in batch with a higher-temperature pass (`0.9`) for richer editorial variation.
4. Generate Unsplash hero-image queries in batch with a lower-temperature pass (`0.2`) for tighter, more stable search terms.
5. Query Unsplash, store the selected hero image, and persist attribution/source metadata.
6. Refresh country publish-readiness after the write.

What makes the prompt strategy credible:

- The description prompt is strict: exactly two sentences, concrete details, no marketing language, no generic “best for travelers who…” filler, and no transport-first openings.
- The prompt examples are curated and excluded dynamically when the country being generated is itself one of the examples.
- The image prompt is optimized for search quality rather than prose: 1 to 3 word queries, landmark-first, no stuffed adjectives.
- The function records prompt file names, source versions, model metadata, hero queries, and selected photo IDs in enrichment metadata.

This AI layer is part of a broader backend system rather than a standalone gimmick. Country pages also depend on curated destination coverage, backend publish-readiness rules, and stored attribution fields consumed by the frontend.

## Current Product Surface

Implemented user-facing flows:

- Home page with backend-fed featured destinations and hero media
- Destination search across destinations and countries
- Destination detail pages with live weather, short forecast, stored climate rows, best-month guidance, and seasonal insight
- Country pages with AI-assisted editorial summaries and curated featured destinations
- Supabase Auth email/password flows
- Favorites for signed-in users

Implemented backend workflows:

- `ingest-destination-batch`
- `import-destination-climate`
- `enrich-destination`
- `enrich-country`
- `compose-country-editorial`
- `extract-country-tourism`

## Database Schema

Core serving tables:

- `destinations`: destination identity, coordinates, summary, hero image, travel tags, best months, publication state
- `monthly_climate`: one row per destination per month with temperatures, precipitation, optional humidity/sunshine, comfort score, and recommendation label
- `countries`: country-level editorial content, hero image, seasonal overview, and publication state
- `country_featured_destinations`: curated destination ordering for country pages
- `profiles`: user profile records linked to Supabase Auth
- `favorites`: saved destinations with a unique `(user_id, destination_id)` constraint

Audit and ingestion tables:

- `ingestion_runs`
- `destination_source_snapshots`
- `climate_source_snapshots`

RLS posture in the committed migrations:

- Public reads are limited to `is_published` destinations and countries
- `monthly_climate` is only readable when its destination is published
- `profiles` and `favorites` are owner-scoped
- Ingestion/audit tables are backend-only by default

Relevant schema files:

- [`20260312120000_phase1_core_schema.sql`](/C:/Users/remez/Documents/Projects/SeasonScout/supabase/migrations/20260312120000_phase1_core_schema.sql)
- [`20260313103000_phase10_5_ingestion_schema.sql`](/C:/Users/remez/Documents/Projects/SeasonScout/supabase/migrations/20260313103000_phase10_5_ingestion_schema.sql)

## Generated Content Example

The repo includes a committed QA artifact for country-summary generation at [`qa/country-summary-report.json`](/C:/Users/remez/Documents/Projects/SeasonScout/qa/country-summary-report.json). One generated Japan summary currently reads:

> A trip through Japan threads together Kyoto's shrine-and-temple quarters, Hakone's hot-spring inns, and Tokyo's city districts into a single, varied route. It rewards culture-heavy itineraries and food-first city breaks, balancing major landmarks with quieter, local corners.

That report currently records `16` passing fixtures, `1` warning, and `0` failures, and CI verifies both the report freshness and the app build.

## Prompt Engineering Notes

This repository shows a real iterative prompt workflow rather than a single one-off prompt:

- The country-summary system has multiple pipeline revisions, including a committed deterministic generator at [`summaryPipelineV4.js`](/C:/Users/remez/Documents/Projects/SeasonScout/supabase/functions/enrich-country/summaryPipelineV4.js).
- `compose-country-editorial` separates editorial writing from image-query generation so each model call has one job.
- The description prompt intentionally pushes for grounded, practical travel voice: closer to an experienced traveler than a marketing site.
- QA is fixture-based, committed to the repo, and enforced in CI through [`country-summary-qa.yml`](/C:/Users/remez/Documents/Projects/SeasonScout/.github/workflows/country-summary-qa.yml).

## Getting Started

### Prerequisites

- Node.js 18+
- npm
- A Supabase project
- Gemini API access
- Unsplash API access

### Installation

1. Clone the repository.

   ```bash
   git clone https://github.com/YOUR_USERNAME/seasonscout.git
   cd seasonscout
   ```

2. Install dependencies.

   ```bash
   npm install
   ```

3. Create your local environment file.

   ```bash
   cp .env.example .env
   ```

4. Fill in the required values in `.env`.

5. Start the dev server.

   ```bash
   npm run dev
   ```

6. Build for production when needed.

   ```bash
   npm run build
   ```

### Frontend Environment Variables

The browser app reads:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_OPEN_METEO_BASE_URL` (optional, defaults to `https://api.open-meteo.com/v1`)

### Supabase Setup

1. Create a Supabase project.
2. Add the Vite public keys to `.env`.
3. Link the project with the Supabase CLI.

   ```bash
   npx supabase link --project-ref YOUR_PROJECT_REF
   ```

4. Push the committed schema migrations.

   ```bash
   npx supabase db push
   ```

5. Set the required Edge Function secrets.

   ```bash
   npx supabase secrets set SEASONSCOUT_INGESTION_SECRET=... GEMINI_API_KEY=... UNSPLASH_ACCESS_KEY=...
   ```

6. Deploy the Edge Functions you need.

   ```bash
   npx supabase functions deploy ingest-destination-batch
   npx supabase functions deploy import-destination-climate
   npx supabase functions deploy enrich-destination
   npx supabase functions deploy enrich-country
   npx supabase functions deploy compose-country-editorial
   npx supabase functions deploy extract-country-tourism
   ```

Windows note: prefer `npx supabase ...` rather than relying on a global CLI install.

### Edge Function Secrets

The committed code references these server-side variables:

- `SEASONSCOUT_INGESTION_SECRET`
- `GEMINI_API_KEY`
- `UNSPLASH_ACCESS_KEY`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SEASONSCOUT_GEMINI_COUNTRY_EDITORIAL_MODEL` (optional)
- `GEMINI_MODEL` (optional)
- `SEASONSCOUT_WIKIMEDIA_USER_AGENT` (recommended)

`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are normally provided inside the Supabase Edge Function runtime. They only need manual local setup if you run functions outside that managed environment.

## Local Admin Scripts

The repo includes a few helper scripts under `scripts/` for curated canary workflows:

- [`seed-canary.mjs`](/C:/Users/remez/Documents/Projects/SeasonScout/scripts/seed-canary.mjs)
- [`backup-canary.mjs`](/C:/Users/remez/Documents/Projects/SeasonScout/scripts/backup-canary.mjs)
- [`enrich-canary.mjs`](/C:/Users/remez/Documents/Projects/SeasonScout/scripts/enrich-canary.mjs)

These scripts expect Node environment variables such as `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, and `SEASONSCOUT_INGESTION_SECRET`.

## Quality Checks

Available project scripts:

- `npm run dev`
- `npm run build`
- `npm run qa:country-summaries`
- `npm run qa:country-summaries:verify`

The committed GitHub Actions workflow currently:

- installs dependencies
- regenerates the country summary fixture report
- verifies the report is committed and up to date
- runs the production build

## Screenshots

Screenshots are not committed in the current repository state. Add real app captures here before publishing the project on GitHub or using the repository in a portfolio review.

Suggested future additions:

- Home page hero and featured destinations
- Destination detail page with weather and climate table
- Country page showing AI-generated editorial content and hero imagery

## Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend | Vite, React 18, JavaScript/JSX, Tailwind CSS, React Router |
| Backend | Supabase Postgres, Auth, Edge Functions, Storage-ready architecture |
| Live Weather | Open-Meteo |
| Editorial Sources | Wikimedia, Wikivoyage |
| AI Engine | Google Gemini |
| Images | Unsplash |
| QA | Fixture-based summary QA + GitHub Actions |

## Roadmap

- [ ] Add backend aggregate reads for country pages
- [ ] Move more destination and country reads behind RPCs/views
- [ ] Expand curated destination coverage within each country
- [ ] Add more country screenshots and polished GitHub assets
- [ ] Add destination-level AI-assisted editorial generation
- [ ] Add compare/browse flows from the product backlog
- [ ] Add user personalization and trip-planning features

## License

No license file is committed yet. Add a project license before publishing the repository broadly.
