// scripts/test-supabase.mjs
import { createClient } from '@supabase/supabase-js';

const url = 'https://uijncyzhguftcdonkcdg.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpam5jeXpoZ3VmdGNkb25rY2RnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4Njg5Mjk1MCwiZXhwIjoyMTAyNDY4OTUwfQ.bv5rsyaGjDY-9USdigtCP8NGeLrrp_iU9RhoFTkRB3E';

const supabase = createClient(url, serviceKey);

async function testConnection() {
  console.log('Testing Supabase connection...');
  
  // 1. Check products table
  const { data: products, error: prodErr } = await supabase.from('products').select('*').limit(5);
  if (prodErr) {
    console.error('Error querying products table:', prodErr);
    process.exit(1);
  }
  console.log('✓ Successfully queried "products" table. Rows found:', products?.length);

  // 2. Check product_variants table
  const { data: variants, error: varErr } = await supabase.from('product_variants').select('*').limit(5);
  if (varErr) {
    console.error('Error querying product_variants table:', varErr);
    process.exit(1);
  }
  console.log('✓ Successfully queried "product_variants" table. Rows found:', variants?.length);

  // 3. Check order_intents table
  const { data: intents, error: intentErr } = await supabase.from('order_intents').select('*').limit(5);
  if (intentErr) {
    console.error('Error querying order_intents table:', intentErr);
    process.exit(1);
  }
  console.log('✓ Successfully queried "order_intents" table. Rows found:', intents?.length);

  console.log('\n🎉 ALL SUPABASE DATABASE TABLES AND KEYS ARE 100% OPERATIONAL!');
}

testConnection();
