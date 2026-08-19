import { createClient } from '@supabase/supabase-js';
import http from 'http';
import fs from 'fs';
import path from 'path';

// Read .env.local from starter
const envContent = fs.readFileSync('c:/Users/KC/Downloads/mcdaves-vto-forensic-fixed/mcdaves-starter/.env.local', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const [k, ...v] = line.split('=');
  if (k && v.length) env[k.trim()] = v.join('=').trim().replace(/^["']|["']$/g, '');
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

const BASE_URL = 'http://localhost:3000';
const ADMIN_URL = 'http://localhost:3001';

async function fetchRoute(url) {
  const start = Date.now();
  return new Promise((resolve) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          duration: Date.now() - start,
          body: data,
          url
        });
      });
    }).on('error', (err) => {
      resolve({ status: 0, error: err.message, url });
    });
  });
}

async function runSession2Tests() {
  console.log('=== McDaves Master QA Plan: Session 2 (Catalog & Product CRUD) ===\n');
  const results = [];

  function record(id, area, test, expected, actual, status, severity, url, logs = '') {
    results.push({ id, area, test, expected, actual, status, severity, url, logs });
    const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
    console.log(`${icon} [${id}] ${test} -> ${status} (${actual})`);
  }

  // --- PHASE 5: PRODUCT CATALOG (PROD) ---
  console.log('\n--- Phase 5: Product Catalog (PROD) ---');
  const shopRes = await fetchRoute(`${BASE_URL}/shop`);
  record('PROD-001', 'Catalog', 'Shop page loads', 'Returns 200 OK with shop layout', `Status: ${shopRes.status} in ${shopRes.duration}ms`, shopRes.status === 200 ? 'PASS' : 'FAIL', '🔴 P0', '/shop');

  // Query DB products
  const { data: dbProducts, error: dbErr } = await supabase.from('products').select('*, product_variants(*)');
  console.log(`[DB Audit] Products in Supabase: ${dbProducts?.length ?? 0}`);
  if (dbProducts) {
    dbProducts.forEach(p => console.log(`   - ID: ${p.id} | Slug: ${p.slug} | Name: ${p.name} | Variants: ${p.product_variants?.length}`));
  }

  const hasProductsInShop = (shopRes.body || '').includes('Lagos Aviator') || (shopRes.body || '').includes('lagos-aviator');
  record('PROD-002', 'Catalog', 'Products appear in shop', 'Seeded products rendered', hasProductsInShop ? 'Seeded products visible in HTML' : 'Shop catalog HTML empty or products missing', hasProductsInShop ? 'PASS' : 'FAIL', '🔴 P0', '/shop');

  // PDP check for existing product
  const pdpRes = await fetchRoute(`${BASE_URL}/shop/lagos-aviator`);
  record('PROD-010', 'PDP', 'Product detail page loads', 'Returns 200 with product details', `Status: ${pdpRes.status} in ${pdpRes.duration}ms`, pdpRes.status === 200 ? 'PASS' : 'FAIL', '🔴 P0', '/shop/lagos-aviator');

  // Refresh check
  const pdpRefreshRes = await fetchRoute(`${BASE_URL}/shop/lagos-aviator`);
  record('PROD-012', 'PDP', 'Product hard refresh', 'Subsequent GET returns 200 OK', `Status: ${pdpRefreshRes.status}`, pdpRefreshRes.status === 200 ? 'PASS' : 'FAIL', '🔴 P1', '/shop/lagos-aviator');

  // --- PHASE 6: PRODUCT CRUD CHAIN (ADMIN-PROD) ---
  console.log('\n--- Phase 6: Product CRUD Lifecycle (ADMIN-PROD) ---');
  
  // ADMIN-PROD-001: Check Admin Products list
  const adminProdList = await fetchRoute(`${ADMIN_URL}/products`);
  record('ADMIN-PROD-002', 'Admin CRUD', 'Admin products table loads', 'Returns 200 OK with product table', `Status: ${adminProdList.status}`, adminProdList.status === 200 ? 'PASS' : 'FAIL', '🔴 P0', 'localhost:3001/products');

  // Check how Admin API creates products
  console.log('\n--- Investigating Admin Product Creation Endpoint ---');
  // Let's create a test product directly via DB / API to trace why admin created products 404
  const testSlug = `qa-audit-frame-${Date.now()}`;
  const testProductPayload = {
    name: 'QA Audit Frame',
    slug: testSlug,
    sku: `SKU-${Date.now()}`,
    description: 'Forensic test frame created by master QA plan runner.',
    base_price: 45000,
    category: 'unisex',
    face_shape: 'oval',
    material: 'acetate',
    frame_width: 140,
    lens_width: 52,
    bridge_width: 18,
    temple_length: 145,
    is_active: true,
    is_featured: false
  };

  console.log(`[TEST MUTATION] Inserting test product: ${testSlug} into Supabase...`);
  const { data: newProd, error: insertErr } = await supabase.from('products').insert([testProductPayload]).select().single();

  if (insertErr) {
    record('ADMIN-PROD-001', 'Admin CRUD', 'Create test product in DB', 'Database accepts product insert', `DB Error: ${insertErr.message}`, 'FAIL', '🔴 P0', 'Supabase');
  } else {
    record('ADMIN-PROD-001', 'Admin CRUD', 'Create test product in DB', 'Database accepts product insert', `Inserted product ID: ${newProd.id}`, 'PASS', '🔴 P0', 'Supabase');

    // Create a variant for this product
    const { data: newVar, error: varErr } = await supabase.from('product_variants').insert([{
      product_id: newProd.id,
      name: 'Midnight Black',
      color: 'Midnight Black',
      color_code: '#111111',
      sku: `${testProductPayload.sku}-BLK`,
      stock: 10,
      is_active: true,
      price_override: null
    }]).select().single();

    if (varErr) {
      console.log(`[Variant Insert Error]: ${varErr.message}`);
    } else {
      console.log(`[Variant Inserted]: ${newVar.id}`);
    }

    // Now test ADMIN-PROD-004: Does this product appear on /shop?
    const shopAfterCreate = await fetchRoute(`${BASE_URL}/shop`);
    const isNewProdInShop = shopAfterCreate.body.includes(testSlug) || shopAfterCreate.body.includes('QA Audit Frame');
    record('ADMIN-PROD-004', 'Admin CRUD', 'Public catalog visibility', 'New product appears on /shop', isNewProdInShop ? 'Visible on /shop' : 'NOT visible on /shop (Storefront uses hardcoded data or static caching!)', isNewProdInShop ? 'PASS' : 'FAIL', '🔴 P0', '/shop');

    // Now test ADMIN-PROD-005: Public PDP load
    const newPdpRes = await fetchRoute(`${BASE_URL}/shop/${testSlug}`);
    record('ADMIN-PROD-005', 'Admin CRUD', 'Public PDP loads for new product', 'Returns 200 OK for new slug', `Status: ${newPdpRes.status}`, newPdpRes.status === 200 ? 'PASS' : 'FAIL', '🔴 P0', `/shop/${testSlug}`);

    // Now test ADMIN-PROD-006: Refresh PDP
    const newPdpRefresh = await fetchRoute(`${BASE_URL}/shop/${testSlug}`);
    record('ADMIN-PROD-006', 'Admin CRUD', 'Public PDP refresh for new product', 'Returns 200 OK without 404', `Status: ${newPdpRefresh.status}`, newPdpRefresh.status === 200 ? 'PASS' : 'FAIL', '🔴 P0', `/shop/${testSlug}`);
  }

  // --- PHASE 7: STORAGE BUCKETS (IMG) ---
  console.log('\n--- Phase 7: Storage Buckets & Image Pipeline (IMG) ---');
  const { data: buckets, error: bErr } = await supabase.storage.listBuckets();
  console.log(`[Storage Audit] Available Buckets:`, buckets?.map(b => `${b.name} (public: ${b.public})`) || bErr?.message);

  if (bErr || !buckets) {
    record('IMG-002', 'Image', 'Storage bucket listing', 'Supabase storage buckets accessible', `Error: ${bErr?.message}`, 'FAIL', '🔴 P0', 'Supabase Storage');
  } else {
    const hasProductBucket = buckets.some(b => b.name === 'product-images' || b.name === 'products' || b.name === 'product_images');
    record('IMG-002', 'Image', 'Storage bucket exists', 'Product images bucket exists', hasProductBucket ? `Found bucket (${buckets.map(b => b.name).join(', ')})` : `MISSING bucket! Available: [${buckets.map(b => b.name).join(', ')}]`, hasProductBucket ? 'PASS' : 'FAIL', '🔴 P0', 'Supabase Storage');
  }

  console.log('\n=== Session 2 Completed ===');
}

runSession2Tests();
