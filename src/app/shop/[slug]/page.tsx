// src/app/shop/[slug]/page.tsx
import React from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getLiveResolvedProductBySlug, getLiveStorefrontProducts } from '@/lib/commerce/storefront-catalog';
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
    const products = await getLiveStorefrontProducts();
    return products.map((product) => ({ slug: product.slug }));
  } catch (error) {
    console.warn('[Build] Skipping static generation for shop slugs due to DB fetch error.', error);
    return [];
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getLiveResolvedProductBySlug(slug);
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
  const product = await getLiveResolvedProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const allProducts = await getLiveStorefrontProducts();
  const relatedProducts = allProducts
    .filter((p) => p.id !== product.id && p.collection === product.collection)
    .slice(0, 3);

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
        relatedProducts={relatedProducts as any}
      />
    </>
  );
}
