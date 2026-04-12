# 🌍 SeasonScout

**Discover Your Next Adventure, Perfectly Timed.**

SeasonScout is an **AI-powered travel discovery platform** designed to help travelers find the absolute best time to visit any destination. By orchestrating complex data from multiple APIs and leveraging advanced generative AI, SeasonScout curates the perfect travel windows and rich editorial content, ensuring you never book a trip in the wrong season again.

---

## ✨ Key Features

- **🤖 AI-Driven Content Generation:** Country summaries, destination descriptions, and "Seasonal Insights" are dynamically generated using advanced AI models (Google Gemini), providing rich, up-to-date travel contexts that feel human-curated.
- **📅 Smart "Best Climate" Windows:** Unlike static lists, SeasonScout calculates the "Best Months" to visit by cross-referencing historical temperature, precipitation, and sunshine data to find the mathematical "sweet spot" for every destination.
- **🔍 Dynamic Destination Search:** Instantly find your next getaway by name, country, or continent.
- **🗓️ Explore Calendar:** A visual seasonal guide that highlights top-tier destinations for every month of the year, powered by calculated climate metrics.
- **🌡️ Live Weather & Historical Climate:** Get real-time updates and deep-dive into monthly averages for temperature and precipitation (powered by Open-Meteo).
- **📝 Traveler Insights & Reviews:** Read authentic reviews and share your own travel experiences with a secure, authenticated review system.
- **❤️ Favorites Management:** Save and organize your must-visit destinations in a personalized dashboard.
- **🌍 Detailed Country & Destination Pages:** Rich editorial content, "Quick Facts" (capital, currency, languages), and stunning high-resolution imagery.
- **🛠️ Admin Dashboard:** Comprehensive tools for managing the ingestion pipeline, moderating community reviews, and triggering AI-driven content refreshes.

---

## 🚀 Tech Stack

### Frontend
- **Framework:** [React 18](https://reactjs.org/) (Vite-powered)
- **Routing:** [React Router 6](https://reactrouter.com/)
- **Icons:** [Lucide React](https://lucide.dev/)
- **State Management:** React Context (Auth, Theme, Providers)

### Backend & Infrastructure
- **BaaS:** [Supabase](https://supabase.com/) (PostgreSQL Database, RLS Security, Auth)
- **Edge Functions:** Deno-based Supabase Functions for secure, serverless API orchestration.

### 🌐 External APIs & AI Integration
SeasonScout acts as a smart aggregator, orchestrating multiple high-signal data sources:
- **Google Gemini (AI):** Powers the core discovery engine, generating structured editorial content and destination recommendations.
- **Open-Meteo:** Provides high-resolution historical climate data and real-time weather forecasts.
- **Unsplash API:** Dynamically sources professional-grade hero imagery based on AI-optimized search queries.
- **Rest Countries API:** Supplies localized "Quick Facts" like currencies, languages, and regional data.

---

## 🏗️ Project Architecture

SeasonScout is built with a focus on modularity and sophisticated data ingestion:

- **`/supabase/functions/compose-country-full`**: The "brain" of the app—a complex orchestration pipeline that coordinates AI content generation, image sourcing, and climate data aggregation in a single workflow.
- **`/src/services`**: Clean abstraction layer for consuming aggregated data and mapping it to the UI.
- **`/src/hooks`**: Custom React hooks for shared logic like search, favorites, and admin data management.
- **`/supabase/migrations`**: Robust PostgreSQL schema including specialized RPCs for calculating climate derivatives and managing publish readiness.

---

## 🔑 Environment Variables

To run SeasonScout locally, you will need to create a `.env` file in the root directory with the following keys:

| Key | Description | Required |
| :--- | :--- | :--- |
| `VITE_SUPABASE_URL` | Your Supabase project URL | Yes |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anonymous API key | Yes |
| `VITE_OPEN_METEO_BASE_URL` | Custom endpoint for Open-Meteo (Optional) | No |
| `VITE_INGESTION_SECRET` | Secret for administrative data ingestion (Optional) | No |

*Note: Backend Edge Functions require additional keys (GEMINI_API_KEY, UNSPLASH_ACCESS_KEY) configured in the Supabase Dashboard.*

---

## 🛠️ Running Locally

Follow these steps to get your local development environment up and running:

1. **Clone the Repository:**
   ```bash
   git clone https://github.com/remezsavoy/seasonscout.git
   cd SeasonScout
   ```

2. **Install Dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   - Copy `.env.example` to `.env`.
   - Fill in your Supabase credentials.

4. **Start the Development Server:**
   ```bash
   npm run dev
   ```
   *The application will be available at `http://localhost:5173`.*

---

*Made with ❤️ for travelers everywhere.*
