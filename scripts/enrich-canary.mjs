const canarySlugs = ['japan', 'south-africa', 'iceland', 'indonesia', 'italy', 'greece', 'spain', 'mexico', 'norway'];

async function enrichCanary() {
  console.log('Starting enrichment for canary batch...');
  
  const results = [];
  const chunkSize = 2; // Conservative chunk size
  for (let i = 0; i < canarySlugs.length; i += chunkSize) {
    const chunk = canarySlugs.slice(i, i + chunkSize);
    console.log(`Processing chunk: ${chunk.join(', ')}...`);
    
    const response = await fetch(`${process.env.VITE_SUPABASE_URL}/functions/v1/enrich-country?v=20260314-final`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.VITE_SUPABASE_ANON_KEY}`,
        'x-seasonscout-ingestion-secret': process.env.SEASONSCOUT_INGESTION_SECRET
      },
      body: JSON.stringify({
        slugs: chunk,
        allow_non_pending: true,
        overwrite_existing: true,
        source_version: '2026-03-14-v4-concrete-final-v4'
      })
    });

    if (!response.ok) {
      const error = await response.json();
      console.error(`Enrichment failed for chunk ${chunk}:`, error.error);
      // Try processing one by one if chunk fails
      for (const slug of chunk) {
        console.log(`Retrying individual slug: ${slug}...`);
        const subResp = await fetch(`${process.env.VITE_SUPABASE_URL}/functions/v1/enrich-country`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.VITE_SUPABASE_ANON_KEY}`,
            'x-seasonscout-ingestion-secret': process.env.SEASONSCOUT_INGESTION_SECRET
          },
          body: JSON.stringify({
            slugs: [slug],
            allow_non_pending: true,
            overwrite_existing: true,
            source_version: '2026-03-14-v4-concrete-final-v4'
          })
        });
        if (subResp.ok) {
          const subResult = await subResp.json();
          results.push(...subResult.countries_processed);
        } else {
          const subErr = await subResp.json();
          console.error(`Failed individual slug ${slug}:`, subErr.error);
        }
      }
      continue;
    }

    const result = await response.json();
    results.push(...result.countries_processed);
  }

  console.log('\nEnrichment Results:');
  console.log(JSON.stringify(results, (key, value) => {
    if (key === 'old_summary' || key === 'new_summary') {
      return value ? value.substring(0, 50) + '...' : value;
    }
    return value;
  }, 2));
}

enrichCanary();
