import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envContent = fs.readFileSync('c:/Users/KC/Downloads/mcdaves-vto-forensic-fixed/mcdaves-starter/.env.local', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const [k, ...v] = line.split('=');
  if (k && v.length) env[k.trim()] = v.join('=').trim().replace(/^["']|["']$/g, '');
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, serviceKey);

async function setupBuckets() {
  console.log('--- Initializing Supabase Storage Buckets ---');
  const bucketsToCreate = [
    { name: 'product-media', public: true, fileSizeLimit: 10485760 }, // 10MB
    { name: 'vto-models', public: true, fileSizeLimit: 52428800 }     // 50MB
  ];

  const { data: existingBuckets, error: listErr } = await supabase.storage.listBuckets();
  if (listErr) {
    console.error('Error listing buckets:', listErr);
  } else {
    console.log('Existing buckets:', existingBuckets.map(b => b.name));
  }

  for (const b of bucketsToCreate) {
    const exists = (existingBuckets || []).some(eb => eb.name === b.name);
    if (!exists) {
      console.log(`Creating bucket: ${b.name} (public: ${b.public})...`);
      const { data, error } = await supabase.storage.createBucket(b.name, {
        public: b.public,
        fileSizeLimit: b.fileSizeLimit,
      });
      if (error) {
        console.error(`Failed to create bucket ${b.name}:`, error);
      } else {
        console.log(`✓ Bucket ${b.name} created successfully.`);
      }
    } else {
      console.log(`✓ Bucket ${b.name} already exists.`);
      // Ensure it is public
      await supabase.storage.updateBucket(b.name, { public: true });
    }
  }

  const { data: finalBuckets } = await supabase.storage.listBuckets();
  console.log('Final Storage Buckets in Supabase:', finalBuckets?.map(b => `${b.name} (public: ${b.public})`));
}

setupBuckets();
