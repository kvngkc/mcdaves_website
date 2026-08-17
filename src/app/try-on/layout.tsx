// src/app/try-on/layout.tsx
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Virtual Try-On | Try Sightly Eyeglasses Online with 3D & Camera - McDaves',
  description:
    'Experience real-time 3D Virtual Try-On for Sightly luxury eyewear. Use your camera to preview frames live, check fit dimensions, and find your perfect eyeglasses in Nigeria.',
  alternates: {
    canonical: 'https://mcdaves.com.ng/try-on',
  },
  openGraph: {
    title: 'Virtual Try-On | Try Sightly Eyeglasses Online with 3D & Camera - McDaves',
    description:
      'Experience real-time 3D Virtual Try-On for Sightly luxury eyewear. Preview frames live and find your perfect eyeglasses in Nigeria.',
    url: 'https://mcdaves.com.ng/try-on',
  },
};

export default function TryOnLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
