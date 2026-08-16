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
import { products as legacyProducts } from '@/data/products';
import ProductDetailClient from '@/app/shop/[slug]/ProductDetailClient';

interface PageProps {
  params: Promise<{
    productSlug: string;
    variantSlug: string;
  }>;
}

export async function generateStaticParams() {
  const products = commerceRepository.getAllProducts();
  const params: { productSlug: string; variantSlug: string }[] = [];

  products.forEach((product) => {
    product.variants.forEach((variant) => {
      params.push({
        productSlug: product.slug,
        variantSlug: variant.slug,
      });
    });
  });

  return params;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { productSlug, variantSlug } = await params;
  const match = commerceRepository.getProductVariantBySlug(productSlug, variantSlug);

  if (!match) {
    return {
      title: 'Variant Not Found | McDaves',
    };
  }

  const { product, variant } = match;
  const image =
    variant.media?.[0]?.url ||
    product.media?.[0]?.url ||
    '/images/products/placeholder.webp';

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
  const match = commerceRepository.getProductVariantBySlug(productSlug, variantSlug);

  if (!match) {
    notFound();
  }

  const { product, variant } = match;

  const allProducts = commerceRepository.getAllProducts();
  const relatedResolved = allProducts
    .filter((p) => p.id !== product.id && p.collection === product.collection)
    .slice(0, 3);

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

  // Schema.org Product JSON-LD for exact variant
  const jsonLd = {
    '@context': 'https://schema.org/',
    '@type': 'Product',
    name: `${product.name} - ${variant.colorName}`,
    image: variant.media.map((m) => m.url),
    description: variant.effectiveDescription,
    sku: variant.sku,
    brand: {
      '@type': 'Brand',
      name: 'Sightly by McDaves',
    },
    offers: {
      '@type': 'Offer',
      url: `https://mcdaves.com.ng/products/${product.slug}/${variant.slug}`,
      priceCurrency: 'NGN',
      price: variant.effectivePrice,
      itemCondition: 'https://schema.org/NewCondition',
      availability: variant.inStock
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
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
        product={product}
        initialVariantSlug={variantSlug}
        relatedProducts={relatedLegacy}
      />
    </>
  );
}
