// src/app/shop/[slug]/page.tsx
import React from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { commerceRepository } from '@/lib/commerce/repository';
import { getLiveResolvedProductBySlug, getLiveStorefrontProducts } from '@/lib/commerce/storefront-catalog';
import { products as legacyProducts } from '@/data/products';
import ProductDetailClient from './ProductDetailClient';

export const dynamic = 'force-dynamic';
export const dynamicParams = true;

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateStaticParams() {
  try {
    const products = await commerceRepository.getAllProducts();
    return products.map((product) => ({
      slug: product.slug,
    }));
  } catch (error) {
    console.warn('[Build] Skipping static generation for shop slugs due to DB fetch error.', error);
    return [];
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = (await getLiveResolvedProductBySlug(slug)) || (await commerceRepository.getProductBySlug(slug));
  if (!product) {
    return {
      title: 'Product Not Found | McDaves',
    };
  }

  const primaryImage =
    ('defaultVariant' in product && (product as any).defaultVariant?.media?.[0]?.url) ||
    ('images' in product && (product as any).images?.[0]) ||
    '/images/products/placeholder.webp';

  return {
    title: `${product.name} | Sightly Eyewear | McDaves Nigeria`,
    description: `${product.description} Available in Lagos with virtual try-on and prescription lens fitting.`,
    alternates: {
      canonical: `https://mcdaves.com.ng/shop/${product.slug}`,
    },
    openGraph: {
      title: `${product.name} | Sightly Eyewear | McDaves Nigeria`,
      description: `${product.description} Available in Lagos with virtual try-on and prescription lens fitting.`,
      url: `https://mcdaves.com.ng/shop/${product.slug}`,
      images: [{ url: primaryImage }],
    },
  };
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const product = (await getLiveResolvedProductBySlug(slug)) || (await commerceRepository.getProductBySlug(slug));

  if (!product) {
    notFound();
  }

  const allProducts = await commerceRepository.getAllProducts();
  const relatedResolved = allProducts
    .filter((p) => p.id !== product.id && p.collection === product.collection)
    .slice(0, 3);

  // Map to legacy product format for the ProductGrid component
  const relatedLegacy = relatedResolved.map((p) => {
    const legacy = legacyProducts.find((lp) => lp.slug === p.slug);
    if (legacy) return legacy;
    return {
      id: p.id,
      slug: p.slug,
      name: p.name,
      collection: p.collection,
      category: p.category,
      price: p.defaultPrice,
      originalPrice: p.defaultOriginalPrice,
      colors: p.variants.map((v) => ({
        name: v.colorName,
        hex: v.colorHex,
        imageSuffix: v.slug,
      })),
      sizes: p.defaultSpecifications.frameSize,
      material: p.defaultMaterial,
      description: p.description,
      features: p.features,
      images: p.media.map((m) => m.url),
      inStock: true,
      stockLevel: 'high' as const,
      prescriptionRequired: p.prescriptionRequired,
      tryOnAvailable: p.tryOnAvailable,
      frameSize: p.defaultSpecifications.frameSize,
      weight: p.defaultWeight,
      faceShape: p.faceShape,
    };
  });

  // Schema.org Product JSON-LD
  const jsonLd = {
    '@context': 'https://schema.org/',
    '@type': 'Product',
    name: product.name,
    image: 'images' in product ? (product as any).images : ('media' in product ? (product as any).media.map((m: any) => m.url) : []),
    description: product.description,
    sku: 'defaultVariant' in product ? (product as any).defaultVariant.sku : product.id,
    brand: {
      '@type': 'Brand',
      name: 'Sightly by McDaves',
    },
    offers: {
      '@type': 'Offer',
      url: `https://mcdaves.com.ng/shop/${product.slug}`,
      priceCurrency: 'NGN',
      price: 'defaultPrice' in product ? (product as any).defaultPrice : product.price,
      itemCondition: 'https://schema.org/NewCondition',
      availability: 'https://schema.org/InStock',
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c'),
        }}
      />

      <ProductDetailClient
        product={product as any}
        relatedProducts={relatedLegacy as any}
      />
    </>
  );
}
