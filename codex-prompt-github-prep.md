# Codex Prompt: Prepare SeasonScout for GitHub

## Context
SeasonScout is a climate-focused travel planning web app built with Vite + React + TypeScript + Tailwind + Supabase. The project's key innovation is its **self-building architecture**: a Supabase Edge Function (`compose-country-editorial`) calls the Gemini API to automatically generate rich, editorial-quality country descriptions and fetches matching images from Unsplash. The site essentially builds its own content — when a new country is added, the AI pipeline generates everything: descriptions, climate data, travel recommendations, and imagery. This is the project's strongest and most impressive feature.

The stack includes:
- **Frontend**: Vite + React + TypeScript + Tailwind CSS
- **Backend**: Supabase (Auth, Database, Edge Functions, Storage)
- **AI Content Pipeline**: Gemini API for editorial content generation
- **Images**: Unsplash API for country photography
- **Hosting**: (add if relevant)

## Task 1: Create `.gitignore`

Create a comprehensive `.gitignore` file for this project. Include:

```
# Dependencies
node_modules/
.pnp
.pnp.js

# Build output
dist/
build/
.vite/

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Supabase
supabase/.branches
supabase/.temp
.supabase/

# IDE / Editor
.vscode/
.idea/
*.swp
*.swo
*~
.DS_Store
Thumbs.db

# Logs
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*

# Testing
coverage/

# TypeScript
*.tsbuildinfo

# OS files
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db

# Misc
*.log
.cache/
```

Make sure to check the actual project structure for any additional files/folders that should be ignored (e.g., local Supabase config, any generated content cache, skill files, etc.).

## Task 2: Create `.env.example`

Create a `.env.example` file listing every environment variable used across the project (frontend `.env` and Supabase Edge Functions). Scan all source files for references to `import.meta.env`, `process.env`, and `Deno.env.get()` to make sure nothing is missed.

Expected format:
```
# Supabase
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Gemini API (used in Edge Functions)
GEMINI_API_KEY=your_gemini_api_key

# Unsplash API (used in Edge Functions)
UNSPLASH_ACCESS_KEY=your_unsplash_access_key

# Add any other env vars found in the codebase
```

Scan the entire codebase thoroughly — check `src/`, `supabase/functions/`, config files, and any scripts.

## Task 3: Create `README.md`

Create a professional, detailed README.md with the following structure and tone. This should be impressive and clearly communicate the project's unique value proposition: **the site builds itself using AI**.

Structure:

```markdown
# 🌍 SeasonScout — AI-Powered Travel Planning

> **A travel platform that builds itself.** SeasonScout uses AI to automatically generate rich, editorial-quality destination content — so the site grows smarter with every country added.

## ✨ What Makes This Different

Most travel sites rely on manually written content. SeasonScout flips that model:

1. An admin adds a new country to the database
2. A Supabase Edge Function triggers the **AI Content Pipeline**
3. Gemini API generates a complete editorial profile — climate analysis, best travel seasons, cultural highlights, and practical tips
4. Unsplash API fetches curated, high-quality photography
5. The country page is live — fully written, fully designed, zero manual content work

**The result: a travel platform that scales without a content team.**

## 🏗️ Architecture

[Include a clear description of the tech stack and how the pieces connect]

### The AI Content Pipeline (The Core Innovation)

[Detailed explanation of compose-country-editorial Edge Function, how it calls Gemini, the prompt engineering involved, how Unsplash images are fetched and stored, and how the frontend consumes this data]

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- npm or yarn
- Supabase account
- Gemini API key
- Unsplash API access key

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/YOUR_USERNAME/seasonscout.git
   cd seasonscout
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Set up environment variables
   ```bash
   cp .env.example .env
   # Fill in your API keys
   ```

4. Set up Supabase
   [Instructions for setting up the database schema, Edge Functions, etc.]

5. Run the development server
   ```bash
   npm run dev
   ```

### Supabase Edge Functions

[Explain how to deploy Edge Functions, noting Windows users should use `npx supabase` instead of global CLI]

## 📊 Database Schema

[Document all tables: countries, and any related tables — their columns, relationships, and RLS policies]

## 🧠 AI Content Generation

[Deep dive into:
- The Gemini prompt engineering (the ~9 versions of iteration)
- Editorial voice guidelines ("like a smart friend who's been there 3 times")
- Temperature settings and how they affect output
- The batching strategy for API calls
- How content quality is maintained]

## 🗺️ Roadmap

- [ ] Destination-level content (cities, attractions within each country)
- [ ] Per-destination AI-generated descriptions and images
- [ ] User personalization and trip planning
- [ ] Multi-language support

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Vite + React + TypeScript + Tailwind CSS |
| Backend | Supabase (PostgreSQL, Auth, Edge Functions, Storage) |
| AI Engine | Google Gemini API |
| Images | Unsplash API |

## 📄 License

[Add appropriate license]
```

**Important notes for the README:**
- Make the AI pipeline section the star of the show — it's what makes this project stand out
- Include actual examples of generated content if possible (before/after, or a sample output)
- Be specific about the prompt engineering work — mention the iterative refinement process
- The tone should be professional but enthusiastic — this is a portfolio piece
- Add badges at the top (React, TypeScript, Supabase, Gemini)
- If there are screenshots available, include them

## General Instructions

- Before creating any file, scan the full project structure to understand what exists
- Check for any existing .gitignore, .env.example, or README.md and improve rather than overwrite blindly
- Make sure the .env.example captures ALL env vars actually used in the code
- The README should reflect the actual current state of the project, not aspirational features (except in the Roadmap section)
