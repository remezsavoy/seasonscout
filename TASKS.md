# SeasonScout Tasks

## Usage Rules
- Update this file as work progresses
- Mark completed tasks with [x]
- Keep tasks small and specific
- Add sub-tasks when necessary
- Do not remove completed tasks

---

## Implementation Plan
- [x] Review project documentation and align implementation with PRD.md and AGENTS.md
- [x] Phase 0: scaffold the React/Vite app foundation
- [x] Phase 0: configure styling, routing, environment handling, and the base app shell
- [x] Phase 1: establish thin-frontend architecture and shared UI primitives
- [x] Phase 1: define service boundaries and backend responsibility plan
- [x] Phase 2: set up Supabase integration and prepared service clients
- [x] Phase 3: document backend logic ownership for scoring, enrichment, and cache refresh
- [x] Phase 4-9: deliver product flows for home, destination details, auth, weather, and favorites
- [x] Phase 10.5: document data ingestion and enrichment architecture
- [ ] Phase 10-11: polish UX states, responsiveness, accessibility, and feedback patterns
- [ ] Phase 12-13: finalize documentation, validation, and release readiness

---

## Phase 0 - Planning and Setup

- [x] Read PRD.md fully before coding
- [x] Read AGENTS.md fully before coding
- [x] Review TASKS.md before coding
- [x] Scaffold app with Vite
- [x] Install core dependencies
- [x] Configure React Router
- [x] Configure Tailwind CSS
- [x] Set up folder structure
- [x] Add environment variable support
- [x] Create base layout structure
- [x] Create shared UI primitives
- [x] Confirm project builds successfully

---

## Phase 1 - Architecture Foundation

- [x] Define application architecture in code structure
- [x] Keep frontend responsibilities thin and presentation-focused
- [x] Keep durable business logic out of page components
- [x] Decide service layer boundaries
- [x] Decide backend function boundaries
- [x] Document assumptions where needed

---

## Phase 2 - Supabase Foundation

- [x] Install Supabase client
- [x] Create `src/lib/supabaseClient.js`
- [x] Define database schema assumptions in docs or code comments
- [x] Draft initial Phase 1 SQL schema migration for core tables
- [x] Add initial RLS policies for public and user-owned data
- [x] Review and refine Phase 1 schema constraints, indexes, and RLS
- [x] Create service layer for destinations
- [x] Create service layer for climate data
- [x] Create service layer for favorites
- [x] Create service layer for auth
- [x] Plan backend RPC / function usage
- [x] Add basic error handling patterns
- [x] Confirm Supabase integration structure is ready

---

## Phase 3 - Backend Logic Plan

- [x] Define which logic belongs in SQL functions
- [x] Document candidate RPCs for `get_destination_full`, `toggle_favorite`, and `compute_best_months`
- [x] Define which logic belongs in Edge Functions
- [x] Identify computations that should not happen in frontend
- [x] Plan climate scoring strategy
- [x] Plan best-month calculation strategy
- [x] Plan destination enrichment strategy
- [x] Plan caching / refresh strategy for dynamic data

---

## Phase 4 - App Shell and Navigation

- [x] Create app routes
- [x] Create Home page
- [x] Create Destination Details page
- [x] Create Favorites page
- [x] Create Login page
- [x] Create Not Found page
- [x] Add header/navigation
- [x] Add footer
- [x] Add responsive page container styles

---

## Phase 5 - Home Page

- [x] Build hero section
- [x] Build destination search component
- [x] Build featured destinations section
- [x] Build seasonal inspiration section
- [x] Add loading skeletons for home content
- [x] Add empty states
- [x] Add error states
- [x] Make Home page responsive

---

## Phase 6 - Destination Details Page

- [x] Build destination hero section
- [x] Show destination title and country
- [x] Show summary text
- [x] Build current weather section
- [x] Build short forecast section
- [x] Build best months section
- [x] Build monthly climate section
- [x] Build seasonal insight section
- [x] Add loading state
- [x] Add error state
- [x] Make Destination page responsive

---

## Phase 7 - Weather Integration

- [x] Create weather API service layer
- [x] Add current weather fetch logic
- [x] Add forecast fetch logic
- [x] Normalize API response shape
- [x] Handle API failures gracefully
- [x] Avoid duplicate fetch logic
- [x] Document expected API environment/config needs

---

## Phase 8 - Authentication

- [x] Add sign up flow
- [x] Add sign in flow
- [x] Add sign out flow
- [x] Add auth state listener
- [x] Add protected behavior for favorites
- [x] Add loading state for auth session restore

---

## Phase 9 - Favorites

- [x] Add favorite button to destination page
- [x] Create favorites service methods
- [x] Allow logged-in users to save favorites
- [x] Prevent duplicate favorites
- [x] Build favorites page UI
- [x] Add empty state for favorites
- [x] Add loading state for favorites
- [x] Add remove favorite action

---

## Phase 10 - Backend Enrichment and Intelligence

- [x] Prepare SQL or RPC plan for climate scoring
- [x] Prepare SQL or RPC plan for best-month logic
- [x] Prepare Edge Function plan for destination enrichment
- [x] Prepare Edge Function plan for summary/image syncing
- [x] Ensure frontend consumes prepared data instead of recomputing heavily

---

## Phase 10.5 - Data Ingestion and Enrichment

- [x] Document destination ingestion workflow
- [x] Document monthly climate ingestion workflow
- [x] Define country-page database support
- [x] Define external, editorial, and computed field ownership
- [x] Define backend derivation strategy for `best_months`
- [x] Review current schema against the ingestion plan
- [x] Add schema migration for country pages and ingestion metadata
- [x] Add admin-safe destination seed ingestion workflow
- [x] Extend the curated destination seed with Israel for country ingestion coverage
- [x] Add curated seed-only backend import path with ingestion audit snapshots
- [x] Track per-destination climate import readiness in schema
- [x] Add backend monthly climate import workflow
- [x] Add SQL derivative refresh support for climate imports
- [x] Add destination summary/image enrichment orchestration
- [x] Add backend publish-readiness rules for imported destinations
- [x] Improve backend enrichment quality for summaries, tags, and seasonal insight
- [x] Add safe single-slug re-enrichment override for backend enrichment
- [x] Generate short fact-safe destination summaries from structured backend enrichment facts
- [x] Store and render backend-owned hero image attribution for Unsplash-enriched destinations
- [x] Add mixed city and country search support through the service layer
- [x] Add country page foundation with featured destination reads and qualitative overview content
- [x] Add backend-managed Home hero image content with attribution fallback
- [x] Render backend-provided Home hero image location metadata
- [x] Render backend-managed Home hero imagery inside the primary Home hero panel
- [x] Render backend-managed Home hero imagery across the full outer hero container
- [x] Add country enrichment orchestration, audit snapshots, and publish-readiness rules
- [x] Improve backend country summary quality from structured enrichment facts
- [x] Improve backend country hero image selection quality for iconic travel imagery
- [x] Improve backend country summary and seasonal planning copy quality
- [x] Replace generic country summaries with a deterministic Wikipedia + Wikivoyage editorial pipeline
- [x] Add a new thin Gemini-driven `compose-country-editorial` action for country description and hero image enrichment
- [x] Add fixture-based QA harness for deterministic country summary review
- [x] Diversify deterministic country summary editorial patterns and QA review signals
- [x] Add CI protection for deterministic country summary QA and committed report diffs
- [x] Harden country summary anchor validation and warning-based quality gating before broad ingestion
- [x] Harden sparse country-summary source-place fallback extraction against sentence-starter false positives
- [x] Tighten weak generic fallback anchor phrasing before country summary dry-runs are considered write-safe
- [x] Improve sparse live country-summary extraction and seasonality framing for Japan-style single-destination contexts
- [x] Expand country summary fixtures across larger multi-region and island-heavy countries before staged ingestion
- [x] Add staged dry-run and publish-ready-gated country summary ingestion flow
- [x] Add test-only `extract-country-tourism` edge function for Wikipedia-to-OpenRouter JSON extraction
- [x] Fix dynamic example filtering and runtime prompt tracing in `compose-country-editorial`
- [x] Batch Gemini description and hero-query generation in `compose-country-editorial`
- [x] Render stored country hero image attribution on country pages
- [ ] Add backend aggregate reads for country pages

---

## Phase 11 - Data Quality and UX

- [ ] Add reusable loading skeleton components
- [ ] Add reusable empty state component
- [ ] Add reusable error state component
- [ ] Add toast or user feedback pattern
- [ ] Improve accessibility basics
- [ ] Improve responsive behavior on mobile
- [ ] Improve spacing and visual consistency

---

## Phase 12 - Documentation

- [x] Write README project overview
- [x] Document tech stack
- [x] Document local setup
- [x] Document environment variables
- [x] Document Supabase setup expectations
- [x] Document backend logic strategy
- [x] Add screenshots or placeholders section
- [x] Add roadmap section to README

---

## Phase 13 - Final Validation

- [x] Run build
- [x] Fix build issues
- [ ] Run lint if configured
- [ ] Remove dead code
- [ ] Remove placeholder text that should not ship
- [ ] Verify responsive behavior
- [ ] Verify favorites flow
- [x] Verify destination data flow
- [ ] Verify weather sections render correctly
- [ ] Verify frontend is not carrying avoidable heavy business logic

---

## Phase 14 - Product Expansion Backlog

- [ ] Compare destinations page
- [ ] Browse by season
- [ ] Browse by travel style tags
- [ ] Recent searches
- [ ] Better recommendation engine
- [ ] Trip planner
