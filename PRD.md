# SeasonScout PRD

## 1. Product Overview

SeasonScout is a modern travel climate planner web app built with React and Supabase.

The app helps users explore destinations around the world and answer two main questions:

1. What is the weather like there right now?
2. When is the best time of year to visit?

Unlike a basic weather app, SeasonScout combines:
- live weather data
- short-term forecasts
- stored monthly climate averages
- recommended travel months
- destination summaries
- user favorites
- climate-based travel insights

The product should feel like a polished real-world travel tool, not a demo.

---

## 2. Product Vision

SeasonScout should become a premium travel discovery and climate planning product.

The long-term vision is to let users:
- explore destinations visually
- understand live and seasonal weather patterns
- compare destinations intelligently
- decide when to travel based on climate comfort
- save destinations and build future travel plans

This is a real product built in phases, not a toy project.

---

## 3. Goals

### Primary Goals
- Let users search and explore destinations worldwide
- Show live weather and short-term forecast for each destination
- Show average climate by month for each destination
- Show recommended months to visit
- Let users save favorite destinations
- Build an architecture that scales cleanly

### Secondary Goals
- Build a portfolio-quality production-style React app
- Use Supabase as the main backend/database
- Keep architecture scalable and clean
- Create a UI that feels premium, modern, and responsive

---

## 4. Target Users

### Main User Types
- Travelers researching destinations
- Users comparing destinations by season
- Users deciding when to travel
- Users saving destinations for later
- Recruiters / developers viewing the project on GitHub as a portfolio app

---

## 5. Core User Problems

Users often know where they want to go, but they do not know:
- what the weather is like right now
- what the destination is usually like across the year
- which months are best for visiting
- whether the destination is too hot, too rainy, too humid, or ideal in certain months

SeasonScout solves this by combining live forecast data with stored climate insights.

---

## 6. Product Scope Structure

The product is built in phases.

### Phase 1 — Core Product
The first fully usable version of the real product:
- destination search
- destination details page
- live weather
- short forecast
- monthly climate display
- best months display
- auth
- favorites
- responsive premium UI

### Phase 2 — Product Expansion
- compare destinations
- browse by season
- browse by travel style
- recent searches
- recommendation improvements

### Phase 3 — Advanced Product
- trip planner
- saved travel plans
- personalized suggestions
- richer destination exploration flows

---

## 7. Core Features

### 7.1 Destination Search
Users can search for destinations by city name.

Search results should help the user quickly navigate to a destination page.

---

### 7.2 Destination Details Page
Each destination page should include:
- destination name
- country
- hero image
- short summary
- live weather
- short forecast
- monthly climate averages
- best months to visit
- travel insight / seasonal explanation
- favorite button for logged-in users

---

### 7.3 Monthly Climate Section
The app should show climate averages for all 12 months.

Each month can include:
- average high temperature
- average low temperature
- average precipitation
- optional humidity
- optional sunshine hours
- comfort score
- recommendation label such as Ideal / Good / Okay / Avoid

This data is stored in the database.

---

### 7.4 Best Months to Visit
Each destination should show a recommended set of travel months.

This can be stored directly in the database and/or derived from monthly climate scores.

Example:
- April
- May
- September
- October

Optional explanation:
- Pleasant temperatures
- Lower rainfall
- Better walking conditions

---

### 7.5 Favorites
Logged-in users can save destinations to favorites.

Favorites page should show all saved destinations.

---

### 7.6 Authentication
Users can sign up / sign in with Supabase Auth.

Phase 1 auth scope:
- email/password
- protected favorites functionality

---

## 8. Data Strategy

The app uses a hybrid data model.

### Stored Data in Supabase
This is relatively stable destination data:
- destination identity
- coordinates
- country
- summary
- image url
- monthly climate averages
- best months
- travel tags
- seasonal notes
- computed scores and labels

### Live External API Data
This is dynamic data:
- current weather
- short-term forecast

This hybrid model keeps the app fast, scalable, and cost-efficient.

---

## 9. Backend-First Logic Strategy

SeasonScout should follow a thin-frontend, smart-backend architecture.

### Principle
The frontend should focus on:
- rendering UI
- routing
- handling simple interaction state
- calling prepared backend/service methods

The backend should handle:
- climate scoring
- best month computation
- data normalization
- enrichment orchestration
- deduplication rules
- cache refresh logic
- database-oriented business logic

### Why
This keeps the frontend clean and maintainable and prevents business logic from being duplicated or scattered across components.

### Preferred Placement
- SQL / Postgres Functions:
  - comfort score calculations
  - best months calculations
  - aggregate destination reads
  - deduplication constraints
- Supabase Edge Functions:
  - external API enrichment
  - background refresh
  - secure use of secrets
  - orchestration between APIs and database

---

## 10. Data Sources

### Supabase
Used for:
- database
- auth
- favorites
- destination records
- climate records
- derived metadata
- backend logic

### Open-Meteo
Used for:
- current weather
- forecast
- climate-related enrichment if needed

### Wikimedia
Used for:
- destination summary enrichment

### Unsplash
Used for:
- destination hero images

---

## 11. Database Entities

### destinations
Stores destination-level metadata.

Suggested fields:
- id
- slug
- name
- country
- country_code
- continent
- latitude
- longitude
- timezone
- summary
- hero_image_url
- best_months
- travel_tags
- seasonal_insight
- created_at
- updated_at

### monthly_climate
Stores one row per destination per month.

Suggested fields:
- id
- destination_id
- month
- avg_high_c
- avg_low_c
- avg_precip_mm
- avg_humidity
- sunshine_hours
- comfort_score
- recommendation_label
- source
- last_updated

### profiles
Stores user profile info.

Suggested fields:
- id
- display_name
- avatar_url
- created_at

### favorites
Stores user favorites.

Suggested fields:
- id
- user_id
- destination_id
- created_at

---

## 12. Backend Functions

### Database / RPC Function Ideas
- compute_comfort_score(...)
- compute_best_months(destination_id)
- get_destination_full(slug)
- toggle_favorite(...)
- get_featured_destinations(...)

### Edge Function Ideas
- enrich-destination
- import-destination-climate
- refresh-destination-weather-cache
- sync-wikimedia-summary
- sync-destination-image

These should be used whenever backend execution is better than frontend execution.

---

## 13. Main Pages

### Home
Purpose:
- introduce the product
- allow destination search
- show featured destinations
- inspire exploration

Sections:
- hero
- search bar
- featured destinations
- seasonal inspiration
- footer

### Destination Details
Purpose:
- give the user everything needed for one destination

Sections:
- hero image
- title and country
- current weather
- forecast
- best months
- monthly climate
- summary
- seasonal insight
- favorite action

### Favorites
Purpose:
- show user's saved destinations

### Login / Sign Up
Purpose:
- authenticate users for favorites

---

## 14. Phase 1 — Core Product Scope

### Included in Phase 1
- React app scaffold
- routing
- Supabase integration
- auth
- home page
- destination details page
- favorites
- current weather
- short forecast
- monthly climate display
- best months display
- responsive UI
- clean README

### Not Included in Phase 1
- compare destinations
- trip planner
- crowd level modeling
- advanced personalization
- admin dashboard for content editing

---

## 15. Future Enhancements

### Phase 2
- compare two destinations
- browse by season
- browse by travel style
- recent searches
- smarter recommendations

### Phase 3
- trip planner
- itinerary notes
- personalized destination suggestions
- shareable trip plans

---

## 16. Design Direction

The UI should feel:
- modern
- premium
- clean
- visual
- travel-oriented

Suggested style:
- large hero imagery
- rounded cards
- subtle shadows
- elegant spacing
- polished responsive behavior
- dark or soft neutral luxury-inspired palette

---

## 17. Technical Expectations

- scalable folder structure
- reusable components
- clean service layer
- thin frontend
- backend-first business logic
- minimal duplication
- responsive design
- loading states
- empty states
- error handling
- environment variables for secrets
- no hardcoded sensitive values

---

## 18. Success Criteria

Phase 1 is successful if:
- a user can search for a destination
- open a destination page
- see current weather and forecast
- see monthly climate averages
- see recommended months to visit
- sign in
- save the destination to favorites
- use the app comfortably on desktop and mobile

---

## 19. Non-Goals

The product is not intended to:
- replace professional travel booking platforms
- provide exact future weather months ahead
- provide guaranteed pricing or crowd data
- be a full itinerary platform in Phase 1

---

## 20. Summary

SeasonScout is a travel climate exploration app that combines live weather with stored destination climate intelligence.

Its purpose is to help users understand both:
- what a destination is like now
- when it is best to visit

The product should be built with a thin frontend and a smart backend so that core logic remains scalable, maintainable, and production-ready.