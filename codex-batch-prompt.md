## Task: Batch Gemini Calls for Country Editorial Enrichment

### Context
The `compose-country-editorial` Edge Function currently makes **2 separate Gemini API calls per country**:
1. `generateDescription()` — generates a 2-sentence country description
2. `generateHeroQuery()` — generates an Unsplash search query for the hero image

For 10 countries, that's 20 Gemini calls. Each call sends the full prompt (~2000 tokens) which is wasteful because the system prompt and examples are identical every time.

### Goal
Refactor so that **all country descriptions are generated in a single Gemini call**, and **all hero queries are generated in a single Gemini call**. This reduces 20 Gemini calls to 2.

Unsplash calls remain 1-per-country (unavoidable).

### What to Change

#### 1. `generateDescription()` → `generateDescriptions()` (batch)

Instead of calling Gemini once per country, collect all country names and send them in one request.

**User prompt should look like:**
```
Write a 2-sentence travel description for each of these countries: Japan, Greece, Iceland, Mexico, Norway

Return ONLY valid JSON. Format:
{
  "Japan": "...",
  "Greece": "...",
  "Iceland": "...",
  "Mexico": "...",
  "Norway": "..."
}
```

**Response schema** should change from:
```json
{ "description": "string" }
```
To:
```json
{ 
  "type": "object",
  "additionalProperties": { "type": "string" }
}
```
Or a more explicit schema with the country names as keys — whatever works best with Gemini's structured output.

**Important for examples filtering:** When building the prompt for a batch, filter out ALL countries in the batch from the few-shot examples. Update `buildCountryDescriptionPrompt` to accept an array of country names instead of a single name:
```typescript
buildCountryDescriptionPrompt(countryNames: string[])
```

The function `buildExamplesBlock` should filter out all of them:
```typescript
function buildExamplesBlock(excludeCountries: string[]): string {
  const excluded = new Set(excludeCountries.map(c => c.toLowerCase()));
  return Object.entries(COUNTRY_EXAMPLES)
    .filter(([country]) => !excluded.has(country.toLowerCase()))
    .map(([country, description]) => `${country}: "${description}"`)
    .join('\n\n');
}
```

#### 2. `generateHeroQuery()` → `generateHeroQueries()` (batch)

Same idea. Send all country names in one call:

**User prompt should look like:**
```
Generate Unsplash hero image search queries for these countries: Japan, Greece, Iceland, Mexico, Norway

Return ONLY valid JSON. Format:
{
  "Japan": "query here",
  "Greece": "query here"
}
```

#### 3. Update the main loop in `index.ts`

Current flow (per country):
```
for each country:
  1. generateDescription(country)
  2. generateHeroQuery(country) 
  3. fetchUnsplashHero(country, query)
  4. save to DB
```

New flow (batched):
```
1. generateDescriptions(allCountries)        // 1 Gemini call
2. generateHeroQueries(allCountries)          // 1 Gemini call  
3. for each country:
   a. fetchUnsplashHero(country, query)       // 1 Unsplash call per country
   b. save to DB
```

#### 4. Keep backward compatibility

- Single country requests (`slug: "japan"`) should still work — they just become a batch of 1.
- The `overwrite_existing` and `allow_non_pending` flags should work the same.
- Error handling: if Gemini returns descriptions for 9 out of 10 countries, save the 9 that worked and report the 1 that failed.
- Keep the existing logging (description-prompt-built event, etc.)

#### 5. Temperature

- Description generation: **0.9**
- Hero query generation: **0.2** (keep low — we want predictable landmark names)

### Files to Change
- `prompts/countryDescriptionPrompt.ts` — update `buildCountryDescriptionPrompt` to accept array
- `prompts/heroImageQueryPrompt.ts` — add similar batch builder if needed
- `index.ts` — refactor `generateDescription` → `generateDescriptions`, `generateHeroQuery` → `generateHeroQueries`, update main loop

### Testing
After changes, deploy and run:
```json
{
  "slugs": ["japan", "greece", "iceland"],
  "overwrite_existing": true,
  "allow_non_pending": true
}
```

Check logs to verify:
1. Only 2 Gemini calls were made (not 6)
2. Each country got a unique description
3. Japan and Greece descriptions are different from the old examples
4. Hero queries returned valid Unsplash results
5. All 3 countries updated in DB
