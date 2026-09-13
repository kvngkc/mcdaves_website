// scripts/gate3_backfill_inventory.js
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://uijncyzhguftcdonkcdg.supabase.co';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpam5jeXpoZ3VmdGNkb25rY2RnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4Njg5Mjk1MCwiZXhwIjoyMTAyNDY4OTUwfQ.bv5rsyaGjDY-9USdigtCP8NGeLrrp_iU9RhoFTkRB3E';

const supabase = createClient(url, serviceKey);

const isMutationMode = process.argv.includes('--mutate');

async function run() {
  console.log(`Gate 3 Backfill Inventory [Mode: ${isMutationMode ? 'MUTATE' : 'DRY-RUN'}]`);
  
  // 1. Fetch all variants that have glb_path
  const { data: variants, error: vErr } = await supabase
    .from('product_variants')
    .select('id, sku, glb_path, vto_asset_id')
    .not('glb_path', 'is', null);

  if (vErr) {
    console.error('Error fetching variants:', vErr);
    process.exit(1);
  }

  // 2. Fetch all calibrations
  const { data: calibrations, error: cErr } = await supabase
    .from('vto_asset_calibrations')
    .select('asset_id, vto_glb_url, status');

  if (cErr) {
    console.error('Error fetching calibrations:', cErr);
    process.exit(1);
  }

  const results = {
    ALREADY_LINKED: [],
    READY_TO_BACKFILL: [],
    AMBIGUOUS: [],
    UNMATCHED: [],
    INVALID: [],
  };

  for (const variant of variants) {
    if (variant.vto_asset_id) {
      results.ALREADY_LINKED.push(variant);
      continue;
    }

    if (!variant.glb_path || variant.glb_path.trim() === '') {
      continue; // No fallback to process
    }

    const matches = calibrations.filter(c => c.vto_glb_url === variant.glb_path);

    if (matches.length === 0) {
      results.UNMATCHED.push(variant);
    } else if (matches.length > 1) {
      results.AMBIGUOUS.push({ variant, matches });
    } else {
      const match = matches[0];
      if (match.status !== 'PUBLISHED') {
        results.INVALID.push({ variant, match, reason: 'Not PUBLISHED' });
      } else {
        results.READY_TO_BACKFILL.push({ variant, assetId: match.asset_id });
      }
    }
  }

  console.log('\n--- INVENTORY RESULTS ---');
  console.log(`Already Linked:   ${results.ALREADY_LINKED.length}`);
  console.log(`Ready to Backfill: ${results.READY_TO_BACKFILL.length}`);
  console.log(`Ambiguous:        ${results.AMBIGUOUS.length}`);
  console.log(`Unmatched:        ${results.UNMATCHED.length}`);
  console.log(`Invalid:          ${results.INVALID.length}`);
  
  if (results.UNMATCHED.length > 0) {
    console.log('\nSample Unmatched:');
    console.log(results.UNMATCHED.slice(0, 3));
  }
  
  if (results.AMBIGUOUS.length > 0) {
    console.log('\nSample Ambiguous:');
    console.log(results.AMBIGUOUS.slice(0, 3));
  }

  if (isMutationMode && results.READY_TO_BACKFILL.length > 0) {
    console.log('\n--- EXECUTING MUTATION ---');
    let successCount = 0;
    for (const item of results.READY_TO_BACKFILL) {
      const { error } = await supabase
        .from('product_variants')
        .update({ vto_asset_id: item.assetId })
        .eq('id', item.variant.id);
        
      if (error) {
        console.error(`Failed to update variant ${item.variant.id}:`, error);
      } else {
        successCount++;
      }
    }
    console.log(`✓ Successfully backfilled ${successCount} variants.`);
  } else if (!isMutationMode) {
    console.log('\nRun with --mutate to execute the backfill for READY_TO_BACKFILL variants.');
  }
}

run();
