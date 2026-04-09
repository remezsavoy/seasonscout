export const COUNTRY_DESCRIPTION_PROMPT_FILE_NAME = 'countryDescriptionPrompt.ts';

const COUNTRY_EXAMPLES: Record<string, string> = {
  Japan:
    'A dense mix of temples, hyper-efficient logistics, and some of the best food on earth - convenience store onigiri alone beats most restaurant food abroad. The attention to detail shows up everywhere, from train station bento boxes to public bathroom design.',
  Portugal:
    'Small enough to cover in two weeks, with pasteis de nata on every corner, solid local wine, and surf towns an hour from Lisbon. The country runs at a slower pace than the rest of Western Europe and rarely feels crowded outside of August.',
  Colombia:
    'Caribbean beach towns, Zona Cafetera farms, and cities like Medellin that have rebuilt fast sit surprisingly close together. The regional food differences are massive - coastal ceviches and Bogota ajiaco feel like they come from different countries.',
  Morocco:
    'Medinas, Atlas mountain villages, and Sahara camps within a few hours of each other - the variety is extreme for a country this size. Haggling is constant, the tagine changes by region, and the riads are some of the most distinctive lodging anywhere.',
  Greece:
    'Island-hopping by ferry is the main draw, with each island offering a different character - but the mainland has underrated spots like Meteora and the Peloponnese. Taverna food stays consistent everywhere and the summer weather almost never lets you down.',
  Italy:
    'Every region runs like a different country - Roman ruins, Neapolitan pizza, Tuscan hill towns, and Dolomite hikes all within a few hours by train. The food changes every 100 kilometers and almost never disappoints.',
  Spain:
    'Late-night tapas crawls in Madrid and Basque Country pintxos bars define the social structure of a trip here. Regional identities stay strong, from Andalusian flamenco to Gaudi\'s architecture in Barcelona.',
};

function buildExamplesBlock(excludeCountries: string[]): string {
  const excluded = new Set(excludeCountries.map((country) => country.toLowerCase()));

  return Object.entries(COUNTRY_EXAMPLES)
    .filter(([country]) => !excluded.has(country.toLowerCase()))
    .map(([country, description]) => `${country}: "${description}"`)
    .join('\n\n');
}

const SYSTEM_PROMPT = `You are a concise, practical travel writer.

Write a 2-sentence country description for a travel planning app.

STRICT RULES:
- EXACTLY 2 sentences. 30-50 words. Count after writing - if over 50, cut.
- Describe what a trip in this country IS - the structure, the character, what makes it distinct. Not how it FEELS poetically.
- Stay factual and concrete. Talk about what travelers actually spend their days doing there - the food, the landscapes, the activities, the culture, the daily rhythm.
- You SHOULD mention specific things from the country - a well-known region, a food, a cultural detail - whatever makes the description feel grounded and real. But never structure the whole description as a route ("from X to Y to Z").
- VARY your sentence openers. Do NOT start with transport (trains, buses, flights, ferries, driving). Transport can appear naturally inside a sentence but should never be the leading idea. Start with food, landscape, culture, activities, daily rhythm, regional variety, or any other angle.
- Each sentence should have ONE clear idea. Don't cram unrelated categories into the same sentence. If a sentence lists more than 3 things, it's probably overloaded.
- Make sure the sentence is LOGICALLY coherent - read it back and check if the verb actually works with everything in the list.
- Be SPECIFIC to this country. Test: could this description fit a different country? If yes, rewrite.
- Write like a well-traveled friend giving an honest, practical take - not a poet, not a tour guide, not a blogger, not an analyst, not an ad.
- Sentence 1: What does a trip here look like? Structure, activities, variety. Ground it with 1-2 real details from the country. Start with the country's name or a concrete noun - not "You'll", not a transport method.
- Sentence 2: Add another interesting, concrete detail about the country - something that deepens the picture. This could be about the food culture, regional variety, local habits, travel rhythm, or anything else that makes the country distinct. Do NOT use sentence 2 to classify, recommend, or label the country. Just say something else worth knowing.
- NEVER start sentence 2 with "It is", "It's a", "Choose this", "Pick this", "Come here for", "Best for", "A reliable choice", "A mandatory stop", "This is the premier", or any classification/recommendation.
- NEVER start sentence 1 with "You'll".
- Don't describe who it DOESN'T suit or what it's NOT good for. Just say what it is.
- NO "X over Y" comparisons.
- NO cost or price talk.
- NO sensory poetry. Banned: "salt air", "cobblestone charm", "sun-drenched", "melancholic pace", "hazy light", "worn-in", "boozy lunches", or any phrase that belongs in a personal travel essay.
- NO literary flourishes. Banned: "profound", "masterfully", "rhythmic", "seamless blend", "tapestry", "vibrant", "nestled", "beckons", "unfolds", "kaleidoscope".
- NO empty contrast pairs ("balances tradition with modernity" - says nothing).
- NO analytical language. Banned patterns: "prioritizing X over Y", "high-reward destination for travelers who value", "ideal for those seeking", "prioritize X above all else".
- NO formal category labels. Banned pattern: "It is a X destination for travelers who Y".
- NO marketing or ad language. Banned: "Choose this for", "Pick this if", "Come for the", "Don't miss", "You won't regret", "premier destination", "mandatory stop", "reliable choice".

BAD EXAMPLE - poetic filler:
"Thailand rewards the curious with a rhythmic shift between high-energy urban exploration and profound coastal stillness."
WHY: Empty poetry. Could describe 20 countries.

BAD EXAMPLE - route itinerary:
"Route from Bangkok's high-rise density to Chiang Mai's mountain outskirts, ending on southern islands via overnight trains."
WHY: Reads like logistics. Makes every country sound like "go from A to B to C."

BAD EXAMPLE - sensory blog writing:
"It's a mix of salt air, steep cobblestone hills, and the constant smell of grilled sardines and custard tarts."
WHY: Travel blog poetry. Sounds pretty but doesn't help someone decide whether to go there.

BAD EXAMPLE - landmark trivia:
"...though the steep climb up Sigiriya Rock often catches the unprepared off guard."
WHY: Fun fact about one spot, not the country.

BAD EXAMPLE - overloaded sentence with broken logic:
"High-speed trains connect Renaissance cities, regional pasta specialties, and coastal hubs."
WHY: Trains don't connect "pasta specialties." Don't cram unrelated categories into one list.

BAD EXAMPLE - sentence 2 as classification:
"A reliable choice for travelers who want tropical beaches and spicy curries without complex logistics."
WHY: Sentence 2 should add another interesting detail, not classify or recommend.

BAD EXAMPLE - "X over Y" comparison:
"Best for travelers who prefer dramatic volcanic scenery over urban nightlife."
WHY: Don't compare what the country IS against what it ISN'T.

BAD EXAMPLE - transport-first opener (COMMON MISTAKE):
"Overnight trains and ferries connect Bangkok's street food stalls to the northern mountains."
"Domestic flights and ferries bridge Istanbul's history with Cappadocia's caves."
"High-speed rail connects Seoul's urban culture to the Buddhist monasteries."
WHY: Starting every country with transport makes them all sound the same - "[transport] connects [place] to [place]." Transport can appear in a sentence but should not be the opening idea. Lead with food, culture, landscape, activities, or daily rhythm instead.`;

const USER_TEMPLATE = `Write a 2-sentence travel description for each of these countries: {country_list}

This is for country guide pages in a travel app. The reader is deciding where to go.
Under 50 words per country. Each country must get EXACTLY 2 sentences.
Both sentences should describe - neither should classify or recommend.
Do NOT open with transport. Lead with food, culture, landscape, or activities.
Do NOT reuse example wording verbatim or near-verbatim.

EXAMPLES:

{examples}`;

export function buildCountryDescriptionPrompt(countryNames: string[]) {
  const examples = buildExamplesBlock(countryNames);
  const includedExampleCountries = Object.keys(COUNTRY_EXAMPLES)
    .filter((country) => !countryNames.some((excludedCountry) => excludedCountry.toLowerCase() === country.toLowerCase()));

  console.log(JSON.stringify({
    event: 'compose-country-editorial.description-prompt-built',
    country_name: countryNames.length === 1 ? countryNames[0] : null,
    country_names: countryNames,
    excluded_example_country: countryNames.length === 1 ? countryNames[0] : null,
    excluded_example_countries: countryNames,
    included_example_countries: includedExampleCountries,
  }));

  return {
    systemInstruction: SYSTEM_PROMPT,
    userTemplate: USER_TEMPLATE.replace('{examples}', examples),
  };
}

// Backward-compatible raw export for code that still uses the old import.
export const countryDescriptionPrompt = `SYSTEM PROMPT:\n\n${SYSTEM_PROMPT}\n\n---\n\nUSER PROMPT:\n\n${USER_TEMPLATE}`;
