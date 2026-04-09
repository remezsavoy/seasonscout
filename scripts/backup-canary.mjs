import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

const canarySlugs = ['japan', 'iceland', 'indonesia', 'italy', 'greece', 'spain', 'mexico', 'norway'];

async function backupCanary() {
  console.log('Capturing backup for canary countries...');
  
  // Fetch available columns to avoid errors if summary_metadata is missing
  const { data, error } = await supabase
    .from('countries')
    .select('slug, summary, seasonal_overview')
    .in('slug', canarySlugs);

  if (error) {
    console.error('Backup failed:', error);
    process.exit(1);
  }

  const backup = {
    timestamp: new Date().toISOString(),
    source_version_replaced: 'v4-pre-ingestion',
    note: 'summary_metadata column was missing in DB, backed up summary and seasonal_overview instead',
    countries: data
  };

  if (!fs.existsSync('backups')) {
    fs.mkdirSync('backups');
  }

  const filename = `backups/canary-backup-${Date.now()}.json`;
  fs.writeFileSync(filename, JSON.stringify(backup, null, 2));
  
  console.log(`Backup saved to ${filename}`);
  console.log('Backup Structure Sample:', JSON.stringify(data[0], null, 2));
}

backupCanary();
