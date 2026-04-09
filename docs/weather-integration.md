# Weather Integration

## Phase 7 shape
- `weatherService.getWeatherPreview(slug, { destination })` remains the frontend-facing contract.
- The service now fetches live weather from Open-Meteo first and falls back to prepared weather snapshots when the API request fails.
- Page components do not call Open-Meteo directly.

## Configuration
- `VITE_OPEN_METEO_BASE_URL`
  - Optional.
  - Defaults to `https://api.open-meteo.com/v1`.
  - Can also point to a full `/forecast` endpoint if weather traffic is later proxied.

## Destination data requirements
- Each destination record should include:
  - `latitude`
  - `longitude`
  - `timezone`
- Without coordinates, the service cannot request live weather and will fall back to prepared data.

## Current API scope
- Current conditions:
  - temperature
  - apparent temperature
  - humidity
  - wind speed
  - weather code
- Short forecast:
  - daily weather code
  - daily high
  - daily low
  - daily precipitation probability

## Next backend step
- Move the same normalized weather contract behind a Supabase Edge Function so provider calls, retry logic, and caching are server-controlled.
