// src/app/products/[productSlug]/[variantSlug]/page.tsx
/**
 * Canonical Variant-First Product Route: /products/[productSlug]/[variantSlug]
 * Example: /products/classic-cat-eye/havana, /products/classic-cat-eye/black
 * Enables direct sharing and SEO indexing of exact frame variants.
 */

import React from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { commerceRepository } from '@/lib/commerce/repository';
import ProductDetailClient from '@/app/shop/[slug]/ProductDetailClient';

interface PageProps {
  params: Promise<{
    productSlug: string;
    variantSlug: string;
  }>;
}

export async function generateStaticParams() {
  try {
    const products = await commerceRepository.getAllProducts();
    const params: { productSlug: string; variantSlug: string }[] = [];

    products.forEach((product) => {
      product.variants.forEach((variant) => {
        params.push({ productSlug: product.slug, variantSlug: variant.slug });
      });
    });

    return params;
  } catch (error) {
    console.warn('[Build] Skipping static generation for variant slugs due to DB fetch error.', error);
    return [];
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { productSlug, variantSlug } = await params;
  const match = await commerceRepository.getProductVariantBySlug(productSlug, variantSlug);

  if (!match) {
    return { title: 'Variant Not Found | McDaves' };
  }

  const { product, variant } = match;
  const image = variant.media?.[0]?.url || product.media?.[0]?.url || '/images/products/placeholder.webp';

  return {
    title: `${product.name} in ${variant.colorName} | Sightly by McDaves`,
    description: variant.effectiveDescription || product.description,
    openGraph: {
      title: `${product.name} (${variant.colorName}) | McDaves Eyewear`,
      description: variant.effectiveDescription || product.description,
      images: [{ url: image }],
    },
    alternates: {
      canonical: `https://mcdaves.com.ng/products/${product.slug}/${variant.slug}`,
    },
  };
}

export default async function ExactVariantPage({ params }: PageProps) {
  const { productSlug, variantSlug } = await params;
  const match = await commerceRepository.getProductVariantBySlug(productSlug, variantSlug);

  if (!match) {
    notFound();
  }

  const { product, variant } = match;
  const allProducts = await commerceRepository.getAllProducts();
  const relatedProducts = allProducts
    .filter((p) => p.id !== product.id && p.collection === product.collection)
    .slice(0, 3)
    .map((p) => ({
      id: p.id,
      slug: p.slug,
      name: p.name,
      collection: p.collection,
      category: p.category,
      price: p.defaultPrice,
      originalPrice: p.defaultOriginalPrice,
      colors: p.variants.map((v) => ({ name: v.colorName, hex: v.colorHex, imageSuffix: v.slug })),
      sizes: p.defaultSpecifications.frameSize,
      material: p.defaultMaterial,
      description: p.description,
      features: p.features,
      images: p.media.map((m) => m.url),
      inStock: p.variants.some((v) => v.inStock),
      stockLevel: p.variants.some((v) => v.stockLevel === 'high') ? 'high' : p.variants.some((v) => v.inStock) ? 'low' : 'out',
      prescriptionRequired: p.prescriptionRequired,
      tryOnAvailable: p.tryOnAvailable,
      frameSize: p.defaultSpecifications.frameSize,
      weight: p.defaultWeight,
      faceShape: p.faceShape,
    }));

  const jsonLd = {
    '@context': 'https://schema.org/',
    '@type': 'Product',
    name: `${product.name} - ${variant.colorName}`,
    image: variant.media.map((m) => m.url),
    description: variant.effectiveDescription,
    sku: variant.sku,
    brand: { '@type': 'Brand', name: 'Sightly by McDaves' },
    offers: {
      '@type': 'Offer',
      url: `https://mcdaves.com.ng/products/${product.slug}/${variant.slug}`,
      priceCurrency: 'NGN',
      price: variant.effectivePrice,
      itemCondition: 'https://schema.org/NewCondition',
      availability: variant.inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />
      <ProductDetailClient
        product={product as any}
        initialVariantSlug={variantSlug}
        relatedProducts={relatedProducts as any}
      />
    </>
  );
}
