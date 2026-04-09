const canaryDestinations = ['kyoto', 'cape-town', 'reykjavik', 'bali', 'rome', 'athens', 'barcelona', 'mexico-city', 'oslo'];

async function seedCanary() {
  console.log('Seeding canary destinations...');
  
  const response = await fetch(`${process.env.VITE_SUPABASE_URL}/functions/v1/ingest-destination-batch`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.VITE_SUPABASE_ANON_KEY}`,
      'x-seasonscout-ingestion-secret': process.env.SEASONSCOUT_INGESTION_SECRET
    },
    body: JSON.stringify({
      slugs: canaryDestinations
    })
  });

  if (!response.ok) {
    const error = await response.json();
    console.error('Seeding failed:', error);
    process.exit(1);
  }

  const result = await response.json();
  console.log('Seeding Result:', JSON.stringify(result, null, 2));
}

seedCanary();
