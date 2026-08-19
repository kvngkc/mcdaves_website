import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const envContent = fs.readFileSync('c:/Users/KC/Downloads/mcdaves-vto-forensic-fixed/mcdaves-starter/.env.local', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const [k, ...v] = line.split('=');
  if (k && v.length) env[k.trim()] = v.join('=').trim().replace(/^["']|["']$/g, '');
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function syncAndFix() {
  console.log('--- Auditing & Synchronizing Catalog ---');
  const { data: products, error: pErr } = await supabase.from('products').select('*');
  const { data: variants, error: vErr } = await supabase.from('product_variants').select('*');
  const { data: media, error: mErr } = await supabase.from('product_media').select('*');

  console.log(`Found ${products?.length || 0} products, ${variants?.length || 0} variants, ${media?.length || 0} media records.`);

  // 1. Ensure each product has valid images in product_media or local
  for (const p of (products || [])) {
    const pMedia = (media || []).filter(m => m.product_id === p.id);
    const pVariants = (variants || []).filter(v => v.product_id === p.id);
    console.log(`Product: [${p.id}] ${p.name} (slug: ${p.slug}) - Media: ${pMedia.length}, Variants: ${pVariants.length}`);

    // If no media in DB, let's ensure valid media records
    if (pMedia.length === 0) {
      console.log(`  Adding media for ${p.name}...`);
      let frontUrl = `/images/products/sightly/${p.slug}/front.webp`;
      let sideUrl = `/images/products/sightly/${p.slug}/side.webp`;
      let lifestyleUrl = `/images/products/sightly/${p.slug}/lifestyle.webp`;

      // Check if local folder exists
      const localFolder = path.join('c:/Users/KC/Downloads/mcdaves-vto-forensic-fixed/mcdaves-starter/public/images/products/sightly', p.slug);
      if (!fs.existsSync(localFolder)) {
        console.log(`  Local image directory does not exist for ${p.slug}, creating fallback directory with assets...`);
        fs.mkdirSync(localFolder, { recursive: true });
        // Copy standard havana/aviator preview as fallback
        const sourceFront = 'c:/Users/KC/Downloads/mcdaves-vto-forensic-fixed/mcdaves-starter/public/images/products/sightly/classic-havana/front.webp';
        const sourceSide = 'c:/Users/KC/Downloads/mcdaves-vto-forensic-fixed/mcdaves-starter/public/images/products/sightly/classic-havana/side.webp';
        const sourceLife = 'c:/Users/KC/Downloads/mcdaves-vto-forensic-fixed/mcdaves-starter/public/images/products/sightly/classic-havana/lifestyle.webp';
        
        if (fs.existsSync(sourceFront)) fs.copyFileSync(sourceFront, path.join(localFolder, 'front.webp'));
        if (fs.existsSync(sourceSide)) fs.copyFileSync(sourceSide, path.join(localFolder, 'side.webp'));
        if (fs.existsSync(sourceLife)) fs.copyFileSync(sourceLife, path.join(localFolder, 'lifestyle.webp'));
      }

      await supabase.from('product_media').insert([
        { id: `med-${p.id}-front`, product_id: p.id, type: 'front', url: frontUrl, is_primary: true, sort_order: 0 },
        { id: `med-${p.id}-side`, product_id: p.id, type: 'side', url: sideUrl, is_primary: false, sort_order: 1 },
        { id: `med-${p.id}-life`, product_id: p.id, type: 'lifestyle', url: lifestyleUrl, is_primary: false, sort_order: 2 }
      ]);
      console.log(`  ✓ Inserted 3 media records for ${p.name}`);
    }

    // 2. Check GLB paths for variants
    for (const v of pVariants) {
      if (!v.glb_path || v.glb_path.includes('island_classic_leopard_skin')) {
        // Fall back to standard glasses.glb or ikoyi glb
        const fallbackGlb = p.slug.includes('cat-eye')
          ? '/models/Meshy_AI_Purple_Cat_Eye_Glasse_0810153235_texture.glb'
          : '/models/glasses.glb';
        console.log(`  Updating variant ${v.name} GLB path to ${fallbackGlb}`);
        await supabase.from('product_variants').update({ glb_path: fallbackGlb }).eq('id', v.id);
      }
    }
  }

  console.log('--- Catalog Synchronization Complete ---');
}

syncAndFix();
