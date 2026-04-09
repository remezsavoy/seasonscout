# Backend Execution Plan

## Goal
Keep React thin. The browser should request prepared data, render UI, and handle local state. Data correctness, aggregation, scoring, deduplication, and third-party normalization should live in Supabase.

## Postgres SQL / RPC Functions

### Destination reads and aggregation
- `get_destination_full(p_slug text)`
  - Return one destination payload for the details page.
  - Include destination fields, ordered `monthly_climate` rows, cached `best_months`, and auth-aware favorite state.
- `search_destinations(p_query text, p_limit int default 10)`
  - Apply `is_published` filtering, ranking, and consistent search behavior server-side.
- `get_featured_destinations(p_limit int default 6)`
  - Read published destinations ordered by `featured_rank`.

### Favorites and user-owned reads
- `toggle_favorite(p_destination_id uuid)`
  - Use `auth.uid()` and the unique constraint on `favorites` to create or remove a save atomically.
- `get_my_favorites()`
  - Return favorite destination cards already joined to `destinations` so the frontend does not orchestrate joins.

### Climate intelligence
- `compute_comfort_score(...)`
  - Pure scoring helper based on temperature, precipitation, humidity, and optional sunshine.
- `compute_best_months(p_destination_id uuid)`
  - Rank months from `monthly_climate` and return the recommended month list.
- `refresh_destination_best_months(p_destination_id uuid)`
  - Internal helper or RPC to update the cached `destinations.best_months` field after climate changes.

### Trigger / integrity helpers
- `handle_new_user()`
  - Keep profile bootstrap in the database.
- Constraint and RLS enforcement
  - Keep duplicate prevention, ownership checks, publication rules, and month validity in Postgres.

## Supabase Edge Functions

### Live weather
- `get-destination-weather` or `refresh-destination-weather-cache`
  - Call Open-Meteo with server-controlled parameters.
  - Normalize current weather and short forecast into one stable frontend shape.
  - Phase 1 can start without a database cache table; the frontend contract should stay the same if caching is added later.

### Destination enrichment
- `enrich-destination`
  - Orchestrate destination summary and hero image enrichment.
  - Fetch from Wikimedia and image providers, sanitize the result, and update `destinations`.
- `import-destination-climate`
  - Import or refresh curated `monthly_climate` rows through one backend entrypoint.

### Background refresh
- Scheduled weather refresh
  - If weather caching is added later, run refreshes on the server, not in the browser.
- Scheduled content sync
  - Re-run destination summary/image enrichment or climate imports without any frontend involvement.

## Frontend Service Layer

### Responsibilities
- Wrap Supabase and Edge Function calls behind stable methods such as:
  - `destinationsService.searchDestinations(query)`
  - `destinationsService.getFeaturedDestinations()`
  - `destinationsService.getDestinationPageData(slug)`
  - `weatherService.getDestinationWeather(slugOrCoords)`
  - `favoritesService.toggleFavorite(destinationId)`
  - `favoritesService.getFavorites()`
  - `authService.signIn()`, `authService.signUp()`, `authService.signOut()`, `authService.getSession()`
- Map backend payloads into UI-friendly view models only when the change is presentation-specific.
- Handle loading, empty, and error states consistently.

### Frontend should not own
- Comfort-score formulas
- Best-month selection rules
- Search ranking logic
- Favorite deduplication logic
- Raw Open-Meteo response normalization
- Third-party enrichment orchestration
- Publication filtering or authorization rules

## Phase 1 Execution Order
1. Add Supabase client and swap fixture-backed services to real service modules.
2. Implement SQL/RPC for `get_featured_destinations`, `search_destinations`, `get_destination_full`, and `toggle_favorite`.
3. Add one weather Edge Function with a normalized response contract.
4. Keep climate scoring and best-month computation in SQL so the frontend consumes cached or prepared values.
5. Add enrichment/import Edge Functions only as backend-only ingestion tools, not as browser flows.

## Caching Notes
- `destinations.best_months` should be treated as a backend-maintained cache of climate recommendations.
- Live weather caching, if needed, should be introduced behind the Edge Function boundary so the frontend API does not change.
