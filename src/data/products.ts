// src/data/products.ts
// McDaves B2C Product Catalog — Sightly Collection
// Add more products following this exact interface

export interface Product {
  id: string;
  slug: string;
  name: string;
  collection: 'sightly';
  category: 'men' | 'women' | 'unisex' | 'sunglasses';
  price: number;
  originalPrice?: number;
  colors: { name: string; hex: string; imageSuffix: string }[];
  sizes: string;
  material: string;
  description: string;
  features: string[];
  images: string[];
  inStock: boolean;
  stockLevel: 'high' | 'low' | 'out';
  prescriptionRequired: boolean;
  tryOnAvailable: boolean;
  overlayImage?: string;   // e.g. "/overlays/classic-havana.png"
  glbModel?: string;       // e.g. "/models/glasses.glb"
  frameSize?: string;      // e.g. "52□18-140" (lens□bridge-temple in mm)
  weight?: string;
  faceShape?: ('round' | 'oval' | 'square' | 'heart' | 'diamond')[];
}

export const products: Product[] = [
  {
    id: 'sightly-001',
    slug: 'classic-havana',
    name: 'Classic Havana',
    collection: 'sightly',
    category: 'unisex',
    price: 35000,
    colors: [
      { name: 'Havana', hex: '#8B4513', imageSuffix: 'havana' },
      { name: 'Black', hex: '#000000', imageSuffix: 'black' },
    ],
    sizes: '52□18-140',
    material: 'Acetate',
    description: 'A timeless round frame that suits every face. Hand-finished acetate with a warm tortoiseshell pattern. Lightweight enough for all-day wear, strong enough to last for years. The Classic Havana is the frame that started it all for Sightly.',
    features: ['Hand-polished acetate', 'Hypoallergenic', 'Prescription-ready', 'Ultra-lightweight', 'Spring hinges'],
    images: [
      '/images/products/sightly/classic-havana/front.webp',
      '/images/products/sightly/classic-havana/side.webp',
      '/images/products/sightly/classic-havana/lifestyle.webp',
    ],
    inStock: true,
    stockLevel: 'high',
    prescriptionRequired: true,
    tryOnAvailable: true,
    overlayImage: '/overlays/classic-havana.png',
    glbModel: '/models/glasses.glb',
    frameSize: '52□18-140',
    weight: '22g',
    faceShape: ['round', 'oval', 'square'],
  },
  {
    id: 'sightly-002',
    slug: 'lagos-aviator',
    name: 'Lagos Aviator',
    collection: 'sightly',
    category: 'men',
    price: 42000,
    colors: [
      { name: 'Gold', hex: '#C9A227', imageSuffix: 'gold' },
      { name: 'Gunmetal', hex: '#4A5568', imageSuffix: 'gunmetal' },
    ],
    sizes: '58□14-145',
    material: 'Stainless Steel',
    description: 'The Lagos Aviator brings classic pilot style to the modern Nigerian professional. Metal construction with adjustable nose pads for a custom fit. Bold enough for the boardroom, comfortable enough for weekend drives.',
    features: ['Stainless steel frame', 'Adjustable nose pads', 'UV400 sun lenses included', 'Corrosion-resistant coating', 'Double bridge design'],
    images: [
      '/images/products/sightly/lagos-aviator/front.webp',
      '/images/products/sightly/lagos-aviator/side.webp',
      '/images/products/sightly/lagos-aviator/lifestyle.webp',
    ],
    inStock: true,
    stockLevel: 'high',
    prescriptionRequired: false,
    tryOnAvailable: true,
    overlayImage: '/overlays/lagos-aviator.png',
    glbModel: '/models/glasses.glb',
    frameSize: '58□14-135',
    weight: '18g',
    faceShape: ['oval', 'heart', 'diamond'],
  },
  {
    id: 'sightly-003',
    slug: 'ikoyi-cat-eye',
    name: 'Ikoyi Cat-Eye',
    collection: 'sightly',
    category: 'women',
    price: 38000,
    colors: [
      { name: 'Burgundy', hex: '#800020', imageSuffix: 'burgundy' },
      { name: 'Black', hex: '#000000', imageSuffix: 'black' },
      { name: 'Crystal', hex: '#E2E8F0', imageSuffix: 'crystal' },
    ],
    sizes: '54□16-140',
    material: 'TR90 (Lightweight Polymer)',
    description: 'Elegant, elevated, and unmistakably Ikoyi. The Cat-Eye frame adds instant sophistication to any look. TR90 construction makes it feather-light yet virtually unbreakable. For the woman who knows that style is never an accident.',
    features: ['TR90 ultra-lightweight material', 'Flexible and durable', 'Prescription-ready', 'Anti-slip temple tips', 'Elegant upswept design'],
    images: [
      '/images/products/sightly/ikoyi-cat-eye/front.webp',
      '/images/products/sightly/ikoyi-cat-eye/side.webp',
      '/images/products/sightly/ikoyi-cat-eye/lifestyle.webp',
    ],
    inStock: true,
    stockLevel: 'low',
    prescriptionRequired: true,
    tryOnAvailable: true,
    overlayImage: '/overlays/ikoyi-cat-eye.png',
    glbModel: '/models/glasses.glb',
    frameSize: '50□16-140',
    weight: '15g',
    faceShape: ['round', 'oval', 'heart'],
  },
];

// Helper functions for data access
export const getProductBySlug = (slug: string): Product | undefined =>
  products.find((p) => p.slug === slug);

export const getProductsByCollection = (collection: string): Product[] =>
  products.filter((p) => p.collection === collection);

export const getProductsByCategory = (category: string): Product[] =>
  products.filter((p) => p.category === category);

export const getRelatedProducts = (productId: string, limit = 3): Product[] => {
  const product = products.find((p) => p.id === productId);
  if (!product) return [];
  return products
    .filter((p) => p.id !== productId && p.collection === product.collection)
    .slice(0, limit);
};
