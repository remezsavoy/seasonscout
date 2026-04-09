# Data Ingestion and Enrichment Plan

## Goal
Define a Phase 10+ backend-first ingestion architecture for destinations, climate records, enrichment, and future country pages so the frontend continues to consume prepared Supabase data instead of orchestrating imports or business logic in the browser.

## Scope
- This document is a plan only.
- No mass import, admin UI, or pipeline implementation is included in this step.
- The near-term target is a curated destination catalog, not a global all-cities dataset.

## Core Principles
- Keep public tables as serving tables for the app, not as raw third-party payload dumps.
- Run imports, normalization, enrichment, deduplication, and derivation in Supabase Edge Functions and SQL.
- Separate external source facts, editorial overrides, and computed fields.
- Make imports idempotent so a destination or climate batch can be retried safely.
- Keep country pages aggregation-driven and editorially curated rather than pretending a whole country has one simple climate profile.

## Proposed Data Layers
1. Source inputs
   - Curated destination seed file or table with the canonical set of destinations to support.
   - External source payloads for summary, imagery, and climate normals.
2. Staging and audit
   - Store normalized source payload snapshots and ingestion-run metadata before or alongside writes to serving tables.
   - Keep enough metadata to retry, diff, and investigate bad source records.
3. Serving tables
   - `destinations`, `monthly_climate`, `countries`, `country_featured_destinations`, `favorites`, and future country-facing rollups.
4. Derived read layer
   - SQL functions, views, or materialized views for `get_destination_full`, `get_country_full`, `search_destinations`, and future country browse queries.

## Destination Population Workflow
### Canonical source of truth
- Start from a curated destination seed dataset maintained by the project owner.
- Each seed row should include the minimum identity fields needed to support search, routing, climate import, and live weather:
  - `slug`
  - `name`
  - `country_code`
  - `country`
  - `continent`
  - `latitude`
  - `longitude`
  - `timezone`
  - optional initial tags or editorial notes

### Backend ingestion path
1. An admin-triggered backend workflow reads the curated seed file.
2. The workflow validates slugs, ISO country codes, coordinates, and timezone presence.
3. The workflow upserts `countries` first so destination rows have a stable country parent.
4. The workflow upserts `destinations` using canonical identity fields.
5. Newly inserted or changed destinations are queued for:
   - summary enrichment
   - image enrichment
   - monthly climate import
6. `is_published` stays false until the destination has the minimum required data quality.

### Why curated first
- It keeps quality control high.
- It avoids weak search results and half-empty destination pages.
- It lets Phase 10+ focus on durable ingestion architecture before scale.

## Monthly Climate Population Workflow
### Input strategy
- Monthly climate should come from a backend-only import pipeline, not browser fetches.
- The first operational version can ingest from a curated CSV or normalized provider export.
- Later versions can fetch directly from an approved climate normals source through an Edge Function.

### Backend import path
1. A backend workflow receives a destination id or small batch of destination ids.
2. It fetches or reads the 12-month climate source data.
3. It normalizes:
   - units into Celsius and millimeters
   - month numbering to `1-12`
   - optional humidity and sunshine fields into nullable columns
4. It stores source metadata for traceability.
5. It upserts 12 rows into `monthly_climate`.
6. After the upsert, SQL derivation functions recompute:
   - `comfort_score`
   - `recommendation_label`
   - `destinations.best_months`
7. If the source payload is incomplete, the destination stays unpublished or receives a quality flag until corrected.

### Import mode for Phase 10+
- Support one destination or a small curated batch at a time.
- Do not build a blind global mass import yet.

## Country Page Support in the Database Model
### Add a `countries` table
Use a dedicated table instead of overloading destination rows with country-page content.

Suggested fields:
- `code` text primary key
- `slug` text unique
- `name` text
- `continent` text
- `summary` text
- `hero_image_url` text
- `seasonal_overview` text
- `is_published` boolean
- `created_at`
- `updated_at`

### Keep destinations attached to countries
- Keep `destinations.country_code` as the country link.
- In a follow-up migration, make `destinations.country_code` reference `countries.code`.

### Add a `country_featured_destinations` table
Suggested fields:
- `country_code`
- `destination_id`
- `rank`
- `created_at`

Purpose:
- Curate which destination cards appear on a country page.
- Avoid inventing one misleading country-wide climate average for countries with multiple climate zones.

### Country climate support
- Do not start with a single country-level monthly climate table by default.
- First country pages should be built from:
  - country editorial content
  - featured destinations in that country
  - backend aggregate counts
- If country pages later need climate summaries, add a derived backend view or materialized view such as `country_climate_rollups`, or model climate zones explicitly.

## Field Ownership: External vs Internal
### External source fields
- Destination identity facts:
  - `name`
  - `country`
  - `country_code`
  - `continent`
  - `latitude`
  - `longitude`
  - `timezone`
- Climate raw metrics:
  - `avg_high_c`
  - `avg_low_c`
  - `avg_precip_mm`
  - `avg_humidity`
  - `sunshine_hours`
- Enrichment candidates:
  - summary candidate text
  - hero image candidate url
  - attribution/source metadata

### Internal editorial fields
- `slug`
- `is_published`
- `featured_rank`
- `travel_tags`
- country-page summaries and hero selections
- manual overrides for destination summary, hero image, and seasonal copy when quality requires human curation

### Internal computed fields
- `monthly_climate.comfort_score`
- `monthly_climate.recommendation_label`
- `destinations.best_months`
- future destination freshness/status fields
- future country aggregate counts and rollups

## How `best_months` Should Eventually Be Derived
### Ownership
- `destinations.best_months` should become a backend-maintained cache, not a hand-authored primary field.

### Proposed derivation flow
1. Compute each month's `comfort_score` in SQL using temperature, precipitation, humidity, and optional sunshine.
2. Map each score to a backend-owned label such as `Ideal`, `Good`, `Okay`, or `Avoid`.
3. Rank months by score.
4. Select the strongest months using consistent backend rules:
   - minimum score threshold
   - near-peak tolerance so tied shoulder months are retained
   - cap the final set to a sensible window, for example two to six months
5. Store the resulting month list in `destinations.best_months`.

### Trigger points
- Recompute when:
  - any monthly climate row changes
  - scoring rules change
  - destination-level climate overrides are introduced

### Why cache it
- The frontend needs a simple field for fast destination and search reads.
- The derivation rules can still evolve centrally in SQL without page changes.

## Proposed Backend Components
### Edge Functions
- `ingest-destination-batch`
  - Validate and upsert curated destination seed data.
- `import-destination-climate`
  - Fetch or read monthly climate inputs and upsert normalized rows.
- `enrich-destination`
  - Fetch and sanitize summary and hero image candidates.
- `refresh-country-rollups`
  - Optional later job for aggregate country data or materialized views.

### SQL / RPC
- `compute_comfort_score(...)`
- `refresh_destination_climate_derivatives(p_destination_id uuid)`
- `compute_best_months(p_destination_id uuid)`
- `get_destination_full(p_slug text)`
- `get_country_full(p_slug text)`
- `search_countries(p_query text)` when country pages are introduced

## Recommended Supporting Tables
Add these only when the ingestion work starts:
- `ingestion_runs`
  - pipeline name, source version, status, counts, error summary, timestamps
- `destination_source_snapshots`
  - external source id, normalized payload, ingestion run id
- `climate_source_snapshots`
  - destination id, source payload, source period, ingestion run id

These tables let the backend retry safely and preserve source traceability without bloating public app tables.

## Frontend Contract
- The browser should only call prepared read methods such as:
  - destination search
  - destination full read
  - country full read
  - favorites reads and writes
- The browser should never:
  - import seed files
  - compute comfort scores
  - derive best months
  - normalize third-party climate payloads
  - merge multiple sources into one destination record

## Phase 10+ Execution Order
1. Add schema support for `countries` and ingestion audit tables.
2. Create a curated destination seed format and document required fields.
3. Implement `ingest-destination-batch` for small curated batches.
4. Implement `import-destination-climate` and SQL derivative refreshes.
5. Implement `enrich-destination` for summary and hero image candidates.
6. Add `get_country_full` only after country tables and curated country content exist.
7. Expand from curated batches to larger imports only after data quality is stable.

## Non-Goals for This Step
- No mass import of global cities.
- No browser-run ingestion.
- No automatic publication of partially enriched destinations.
- No country-wide climate simplification until the product explicitly defines how country climate should be represented.
