# Prompt for Gemini: Rewrite Skeleton Templates for Country Summary Pipeline

## Background — What This Project Is

I have a deterministic editorial pipeline that generates short travel summaries for countries on a tourism website. Each summary is ~3 sentences, max 360 characters, and appears on a country card that users see when browsing destinations.

The pipeline is NOT an LLM — it's a rule-based system built in JavaScript (summaryPipeline.js). It works like this:

1. **Signal extraction**: Pulls data about each country — identity, geography, published destinations, climate/seasonality
2. **Anchor selection**: Picks 2–3 specific proper-noun anchors per country (e.g., "Kyoto's temple districts", "the Nile Valley") using multi-source scoring from Wikipedia, Wikivoyage, and an internal destination database
3. **Template assembly**: Selects a "skeleton" sentence pattern based on the country's editorial pattern family, then fills it with the anchors, trip-style, and seasonality data
4. **Validation**: Checks for banned phrases, semantic mismatches, cadence repetition, and readability issues

The architecture is solid and has been reviewed. The problem is specifically in step 3 — the **tone and language of the skeleton templates**.

## The Problem

The current skeletons produce summaries that sound like an internal editorial review, not like travel writing that makes someone want to visit. Here's a real example:

**Current output for Japan:**
> Japan is most convincing when the trip moves between Kyoto's historic core, Tokyo, and hot-spring towns, not when it sits in one city. It suits travelers who care about old quarters and headline sights, but still want the food and street life to matter. At country scale, spring and autumn are the safer planning window.

**What's wrong with it:**
- "Most convincing" — countries don't "convince" travelers; this is editor-speak
- "Not when it sits in one city" — critical/negative framing; a travel site shouldn't tell you what NOT to do
- "It suits travelers who..." — analytical, classifying the reader instead of inviting them
- "Safer planning window" — sounds like a risk assessment, not a recommendation
- The whole thing is smart but cold. It tells you how to think about Japan instead of making you feel something about Japan.

**What good travel writing sounds like** (for reference tone, not to copy):
- Lonely Planet opens their Japan page with the idea that ancient traditions fuse naturally with modern life
- Rough Guides leads with the landscape diversity — snow-capped peaks to tranquil rice paddies
- These sites show you the place first, then guide you. They don't analyze or classify.

## What I Need You To Do

Rewrite the skeleton templates in my pipeline. The skeletons are sentence patterns with slots that get filled by the pipeline. They currently live in `summaryPipeline.js` inside the editorial pattern family system.

### Current Skeleton Structure (3 sentences)

Each summary has 3 parts:
1. **Opening / Identity sentence**: What makes this country distinctive as a travel destination
2. **Trip-fit sentence**: What kind of traveler or travel style it rewards
3. **Seasonality sentence**: When to go

### What I Need For Each Part

**Sentence 1 — Opening (the hook)**
Write 5–6 alternative skeleton patterns. These should:
- Open with a sensory or spatial image, not an analysis
- Use the proper-noun anchors naturally (the pipeline inserts place names like "Kyoto's temple districts", "the Atlas Mountains", "Havana's old quarter")
- Feel like the first line of a great travel article, not a product description
- Avoid: "combines", "offers", "is known for", "is most convincing", "works best as"
- Vary in structure so that a batch of 20 countries doesn't all sound the same

**Sentence 2 — Trip-fit (who it's for)**
Write 5–6 alternative skeleton patterns. These should:
- Describe what the trip feels like, not classify the traveler
- Use language like "the kind of trip where..." or "days split between..." rather than "suits travelers who..." or "ideal for..."
- Make the reader see themselves in the trip, not feel sorted into a category

**Sentence 3 — Seasonality (when to go)**
Write 5–6 alternative skeleton patterns. These should:
- Be direct and useful, not hedging
- Say "spring and autumn" not "the safer planning window"
- Can mention what makes the season special (cherry blossoms, autumn leaves, dry season) when the pipeline provides that data
- Vary between directive ("Go in spring") and descriptive ("The best light hits in October")

### Constraints

- Each complete summary must fit in ~360 characters (about 50–60 words total)
- Sentence 1 will contain 2–3 proper noun anchors that can be long (e.g., "Kyoto's historic temple districts") — budget ~40% of characters for this sentence
- The skeletons use template slots. Mark slots like this: `{anchors}`, `{tripStyle}`, `{season}`, `{seasonHighlight}`
- These must work for ANY country — from Japan to Luxembourg to Trinidad to Mozambique. Don't write Japan-specific patterns; write universal patterns that sound great when filled with any country's data.

### Deliverable

Give me:
1. 5–6 opening sentence skeletons
2. 5–6 trip-fit sentence skeletons  
3. 5–6 seasonality sentence skeletons
4. 3 complete example summaries using your new skeletons — for Japan, Portugal, and Kenya — so I can see how they feel when assembled

### Tone North Star

Imagine a well-traveled friend who just came back from a country and is telling you why you should go. They're specific, warm, opinionated — but they're pulling you in, not lecturing you. That's the tone.
