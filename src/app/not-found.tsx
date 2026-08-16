import React from 'react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4 py-16">
      <h1 className="text-h1 font-bold text-neutral-900 mb-4">404 - Page Not Found</h1>
      <p className="text-body text-neutral-600 mb-8 max-w-md">
        Sorry, the page or optical frame you are looking for does not exist or has been moved.
      </p>
      <Link
        href="/shop"
        className="px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white font-medium rounded-lg transition-colors"
      >
        Back to Shop
      </Link>
    </div>
  );
}
