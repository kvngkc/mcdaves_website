// scripts/seed-supabase.mjs
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("Missing SUPABASE credentials in process.env");
  process.exit(1);
}

const supabase = createClient(url, serviceKey);

const SEED_PRODUCTS = [
  {
    id: 'prod-sightly-001',
    slug: 'classic-havana',
    name: 'Classic Havana',
    collection: 'sightly',
    category: 'unisex',
    description:
      'A timeless round frame that suits every face. Hand-finished acetate with a warm tortoiseshell pattern. Lightweight enough for all-day wear, strong enough to last for years.',
    features: [
      'Hand-polished cellulose acetate',
      'Hypoallergenic material',
      'Prescription-ready frame',
      'Ultra-lightweight comfort',
      'German engineered spring hinges',
    ],
    face_shape: ['round', 'oval', 'square'],
    default_price: 35000,
    default_original_price: 42000,
    default_material: 'Acetate',
    default_weight: '22g',
    frame_width_mm: 140,
    lens_width_mm: 52,
    bridge_width_mm: 18,
    temple_length_mm: 140,
    frame_size: '52□18-140',
    prescription_required: true,
    try_on_available: true,
    status: 'ACTIVE',
  },
  {
    id: 'prod-sightly-002',
    slug: 'lagos-aviator',
    name: 'Lagos Aviator',
    collection: 'sightly',
    category: 'men',
    description:
      'The Lagos Aviator brings classic pilot style to the modern Nigerian professional. Metal construction with adjustable silicone nose pads for an exact fit.',
    features: [
      'Stainless steel structural frame',
      'Adjustable soft nose pads',
      'UV400 sun protection compatible',
      'Corrosion-resistant electroplating',
      'Reinforced double-bridge brow',
    ],
    face_shape: ['oval', 'heart', 'diamond'],
    default_price: 42000,
    default_original_price: 48000,
    default_material: 'Stainless Steel',
    default_weight: '18g',
    frame_width_mm: 142,
    lens_width_mm: 58,
    bridge_width_mm: 14,
    temple_length_mm: 145,
    frame_size: '58□14-145',
    prescription_required: false,
    try_on_available: true,
    status: 'ACTIVE',
  },
  {
    id: 'prod-sightly-003',
    slug: 'ikoyi-cat-eye',
    name: 'Ikoyi Cat-Eye',
    collection: 'sightly',
    category: 'women',
    description:
      'Bold, elegant, and designed to turn heads. Premium Italian-style acetate with subtle gold-accented temple tips for unmistakable sophistication.',
    features: [
      'Handcrafted Italian-grade acetate',
      'Gold-tone precision hinges',
      'Prescription and progressive ready',
      'Ergonomic temple contouring',
      'Scratch-resistant finish',
    ],
    face_shape: ['square', 'oval', 'heart', 'round'],
    default_price: 38000,
    default_original_price: 45000,
    default_material: 'Acetate',
    default_weight: '24g',
    frame_width_mm: 138,
    lens_width_mm: 54,
    bridge_width_mm: 16,
    temple_length_mm: 140,
    frame_size: '54□16-140',
    prescription_required: true,
    try_on_available: true,
    status: 'ACTIVE',
  },
  {
    id: 'prod-sightly-004',
    slug: 'no-vto-glasses',
    name: 'No VTO Glasses',
    collection: 'sightly',
    category: 'unisex',
    description: 'Glasses with no VTO asset.',
    features: [],
    face_shape: ['round'],
    default_price: 10000,
    default_original_price: 10000,
    default_material: 'Plastic',
    default_weight: '10g',
    frame_width_mm: 140,
    lens_width_mm: 50,
    bridge_width_mm: 18,
    temple_length_mm: 140,
    frame_size: '50□18-140',
    prescription_required: false,
    try_on_available: true,
    status: 'ACTIVE',
  }
];

const SEED_VARIANTS = [
  {
    id: 'var-sightly-004-black',
    product_id: 'prod-sightly-004',
    slug: 'black',
    name: 'No VTO Glasses - Black',
    sku: 'SIG-004-BLK',
    color_name: 'Black',
    color_hex: '#000000',
    vto_asset_id: null,
    glb_path: null,
    in_stock: true,
    stock_level: 'high',
    units_in_stock: 10,
    sort_order: 1,
    status: 'ACTIVE',
  },
  {
    id: 'var-sightly-001-havana',
    product_id: 'prod-sightly-001',
    slug: 'havana',
    name: 'Classic Havana',
    sku: 'SIG-001-HAV',
    color_name: 'Havana',
    color_hex: '#4A3728',
    vto_asset_id: 'classic-havana-glasses',
    glb_path: '/models/glasses.glb',
    in_stock: true,
    stock_level: 'high',
    units_in_stock: 25,
    sort_order: 1,
    status: 'ACTIVE',
  },
  {
    id: 'var-sightly-001-black',
    product_id: 'prod-sightly-001',
    slug: 'matte-black',
    name: 'Classic Havana - Matte Black',
    sku: 'SIG-001-BLK',
    color_name: 'Matte Black',
    color_hex: '#1C1C1C',
    vto_asset_id: 'classic-havana-glasses',
    glb_path: '/models/glasses.glb',
    in_stock: true,
    stock_level: 'high',
    units_in_stock: 18,
    sort_order: 2,
    status: 'ACTIVE',
  },
  {
    id: 'var-sightly-001-honey',
    product_id: 'prod-sightly-001',
    slug: 'honey-tortoise',
    name: 'Classic Havana - Honey Tortoise',
    sku: 'SIG-001-HNY',
    color_name: 'Honey Tortoise',
    color_hex: '#8B5A2B',
    vto_asset_id: 'classic-havana-glasses',
    glb_path: '/models/glasses.glb',
    in_stock: true,
    stock_level: 'low',
    units_in_stock: 3,
    sort_order: 3,
    status: 'ACTIVE',
  },
  {
    id: 'var-sightly-002-gold',
    product_id: 'prod-sightly-002',
    slug: 'gold',
    name: 'Lagos Aviator - Classic Gold',
    sku: 'SIG-002-GLD',
    color_name: 'Gold',
    color_hex: '#D4AF37',
    vto_asset_id: 'classic-havana-glasses', // Assuming reuse for seed
    glb_path: '/models/glasses.glb',
    in_stock: true,
    stock_level: 'high',
    units_in_stock: 12,
    sort_order: 1,
    status: 'ACTIVE',
  },
  {
    id: 'var-sightly-002-gunmetal',
    product_id: 'prod-sightly-002',
    slug: 'gunmetal',
    name: 'Lagos Aviator - Gunmetal',
    sku: 'SIG-002-GUN',
    color_name: 'Gunmetal',
    color_hex: '#4A4A4A',
    vto_asset_id: 'classic-havana-glasses', // Assuming reuse for seed
    glb_path: '/models/glasses.glb',
    in_stock: true,
    stock_level: 'high',
    units_in_stock: 15,
    sort_order: 2,
    status: 'ACTIVE',
  },
  {
    id: 'var-sightly-003-black',
    product_id: 'prod-sightly-003',
    slug: 'noir-black',
    name: 'Ikoyi Cat-Eye - Noir Black',
    sku: 'SIG-003-BLK',
    color_name: 'Noir Black',
    color_hex: '#111111',
    vto_asset_id: 'meshy-purple-cat-eye',
    glb_path: '/models/Meshy_AI_Purple_Cat_Eye_Glasse_0810153235_texture.glb',
    in_stock: true,
    stock_level: 'high',
    units_in_stock: 20,
    sort_order: 1,
    status: 'ACTIVE',
  },
  {
    id: 'var-sightly-003-tortoise',
    product_id: 'prod-sightly-003',
    slug: 'tokyo-tortoise',
    name: 'Ikoyi Cat-Eye - Tokyo Tortoise',
    sku: 'SIG-003-TOR',
    color_name: 'Tokyo Tortoise',
    color_hex: '#5C381E',
    vto_asset_id: 'meshy-purple-cat-eye',
    glb_path: '/models/Meshy_AI_Purple_Cat_Eye_Glasse_0810153235_texture.glb',
    in_stock: true,
    stock_level: 'high',
    units_in_stock: 14,
    sort_order: 2,
    status: 'ACTIVE',
  },
  {
    id: 'var-sightly-003-burgundy',
    product_id: 'prod-sightly-003',
    slug: 'deep-burgundy',
    name: 'Ikoyi Cat-Eye - Deep Burgundy',
    sku: 'SIG-003-BUR',
    color_name: 'Deep Burgundy',
    color_hex: '#6B1D2F',
    vto_asset_id: 'meshy-purple-cat-eye',
    glb_path: '/models/Meshy_AI_Purple_Cat_Eye_Glasse_0810153235_texture.glb',
    in_stock: true,
    stock_level: 'low',
    units_in_stock: 2,
    sort_order: 3,
    status: 'ACTIVE',
  },
];

const SEED_VTO_CALIBRATIONS = [
  {
    id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    asset_id: 'classic-havana-glasses',
    name: 'Classic Havana Baseline',
    status: 'PUBLISHED',
    frame_width_mm: 140,
    lens_width_mm: 52,
    bridge_width_mm: 18,
    temple_length_mm: 140,
    bridge_x: 0,
    bridge_y: 1.2,
    bridge_z: -0.8,
    measured_native_width: 1.0,
    width_multiplier: 140.0,
    source_glb_url: '/models/glasses.glb',
    vto_glb_url: '/models/glasses.glb',
    metadata_source: 'Initial Seed',
  },
  {
    id: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
    asset_id: 'meshy-purple-cat-eye',
    name: 'Meshy Cat Eye Generated',
    status: 'PUBLISHED',
    frame_width_mm: 138,
    lens_width_mm: 54,
    bridge_width_mm: 16,
    temple_length_mm: 140,
    bridge_x: 0,
    bridge_y: 2.1,
    bridge_z: -0.5,
    measured_native_width: 0.12,
    width_multiplier: 1.15,
    source_glb_url: '/models/Meshy_AI_Purple_Cat_Eye_Glasse_0810153235_texture.glb',
    vto_glb_url: '/models/Meshy_AI_Purple_Cat_Eye_Glasse_0810153235_texture.glb',
    metadata_source: 'Initial Seed',
  }
];

async function seed() {
  console.log('Seeding initial data into Supabase...');

  const { error: cErr } = await supabase.from('vto_asset_calibrations').upsert(SEED_VTO_CALIBRATIONS);
  if (cErr) console.error('VTO Calibrations seed error:', cErr);
  else console.log(`✓ Inserted ${SEED_VTO_CALIBRATIONS.length} VTO calibrations`);

  const { error: pErr } = await supabase.from('products').upsert(SEED_PRODUCTS);
  if (pErr) console.error('Product seed error:', pErr);
  else console.log(`✓ Inserted ${SEED_PRODUCTS.length} products`);

  const { error: vErr } = await supabase.from('product_variants').upsert(SEED_VARIANTS);
  if (vErr) console.error('Variant seed error:', vErr);
  else console.log(`✓ Inserted ${SEED_VARIANTS.length} variants`);

  console.log('🎉 Supabase database seeded successfully!');
}

seed();
