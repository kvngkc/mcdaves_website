// src/components/layout/Footer.tsx
'use client';

import React, { useState, FormEvent } from 'react';
import Link from 'next/link';
import { Instagram, Facebook, Twitter, MapPin, Phone, Clock, Send } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

import { siteConfig } from '@/data/site-config';
import { ORDERING_SYSTEM_URL } from '@/data/b2b-products';

// ─── Data ────────────────────────────────────────────────────────────────────

const LINK_COLUMNS = [
  {
    heading: 'Eyewear & Shop',
    links: [
      { label: 'Sightly Collection', href: '/shop' },
      { label: 'Men',                href: '/shop?category=men' },
      { label: 'Women',              href: '/shop?category=women' },
    ],
  },
  {
    heading: 'Services',
    links: [
      { label: 'Lens Replacement', href: '/services/lens-replacement' },
      { label: 'Lens Fitting',     href: '/services/lens-replacement#fitting' },
      { label: 'Ordering Guide',   href: '/pro/how-it-works' },
    ],
  },
  {
    heading: 'Optical Supplies',
    links: [
      { label: 'Lenses & Materials', href: '/pro' },
      { label: 'Optical Catalog',    href: '/pro/catalog' },
      { label: 'Order Online ↗',     href: ORDERING_SYSTEM_URL },
    ],
  },
] as const;

const COMPANY_LINKS = [
  { label: 'Our Story',   href: '/our-story' },
  { label: 'FAQ',         href: '/faq' },
  { label: 'Contact',     href: '/contact' },
  { label: 'Privacy Policy', href: '/privacy' },
  { label: 'Terms of Service', href: '/terms' },
  { label: 'Copyright', href: '/copyright' },
] as const;

interface SocialLink {
  label: string;
  href: string;
  icon: React.ReactNode;
}

const SOCIAL_LINKS: SocialLink[] = [
  {
    label: 'Instagram',
    href: siteConfig.social.instagram,
    icon: <Instagram className="w-4 h-4" aria-hidden="true" />,
  },
  {
    label: 'Facebook',
    href: siteConfig.social.facebook,
    icon: <Facebook className="w-4 h-4" aria-hidden="true" />,
  },
];

interface ContactItem {
  icon: React.ReactNode;
  text: string;
  href?: string;
}

const CONTACT_INFO: ContactItem[] = [
  {
    icon: <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5 text-brand-400" aria-hidden="true" />,
    text: siteConfig.address,
  },
  {
    icon: <Phone className="w-4 h-4 flex-shrink-0 text-brand-400" aria-hidden="true" />,
    text: siteConfig.displayPhone,
    href: `tel:+${siteConfig.phoneNumber}`,
  },
  {
    icon: (
      /* WhatsApp icon */
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="w-4 h-4 flex-shrink-0 text-[#25D366]"
        aria-hidden="true"
      >
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
      </svg>
    ),
    text: `WhatsApp: +${siteConfig.whatsappNumber}`,
    href: `https://wa.me/${siteConfig.whatsappNumber}?text=${encodeURIComponent("Hi McDaves! I'd like help choosing the right eyewear or lenses.")}`,
  },
  {
    icon: <Clock className="w-4 h-4 flex-shrink-0 text-brand-400" aria-hidden="true" />,
    text: siteConfig.hours,
  },
];

// ─── Newsletter form ─────────────────────────────────────────────────────────

function NewsletterForm() {
  const [email, setEmail]       = useState('');
  const [status, setStatus]     = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email) return;
    setStatus('loading');
    // Simulate network delay — replace with real API call
    await new Promise<void>((res) => setTimeout(res, 900));
    setStatus('success');
    setEmail('');
  };

  if (status === 'success') {
    return (
      <p className="text-brand-300 text-caption mt-2 flex items-center gap-2">
        <span className="text-green-400 text-lg" aria-hidden="true">✓</span>
        You&apos;re subscribed! We&apos;ll be in touch.
      </p>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-4 flex flex-col gap-3"
      aria-label="Newsletter subscription"
      noValidate
    >
      <Input
        id="footer-newsletter-email"
        type="email"
        placeholder="your@email.com"
        value={email}
        onChange={(e) => setEmail((e.target as HTMLInputElement).value)}
        required
        aria-label="Email address for newsletter"
        state={status === 'error' ? 'error' : 'default'}
        errorMessage="Something went wrong. Please try again."
        className="bg-brand-800/60 border-brand-700 text-white placeholder:text-brand-400 focus:border-brand-400"
      />
      <Button
        type="submit"
        variant="secondary"
        size="sm"
        loading={status === 'loading'}
        fullWidth
        trailingIcon={<Send className="w-4 h-4" />}
        className="border-brand-500 text-brand-100 hover:bg-brand-700 hover:border-brand-400"
      >
        Subscribe
      </Button>
    </form>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-brand-900 text-brand-100" aria-label="Site footer">
      {/* ── Main grid ─────────────────────────────────────────────────────── */}
      <div className="container-main pt-16 pb-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8">

          {/* ── Link columns: Shop / Fix&Replace / Supply ─────────────── */}
          {LINK_COLUMNS.map((col) => (
            <div key={col.heading}>
              <h3 className="text-white font-semibold text-body-sm uppercase tracking-wider mb-4">
                {col.heading}
              </h3>
              <ul role="list" className="space-y-2.5">
                {col.links.map(({ label, href }) => (
                  <li key={href}>
                    <Link
                      href={href}
                      className={
                        'text-caption text-brand-300 ' +
                        'hover:text-white transition-colors duration-150 ' +
                        'focus-visible:outline-none focus-visible:rounded focus-visible:ring-1 focus-visible:ring-brand-400'
                      }
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* ── Column 4: Company + Newsletter ─────────────────────────── */}
          <div>
            {/* Logo / brand */}
            <Link
              href="/"
              className="inline-block font-semibold text-h4 text-white tracking-tight mb-1 hover:text-brand-300 transition-colors"
            >
              McDaves
            </Link>
            <p className="text-caption text-brand-400 mb-5 leading-relaxed">
              Two generations of optical precision. Nigeria&apos;s trusted eyewear and lens supply partner.
            </p>

            {/* Company links */}
            <h3 className="text-white font-semibold text-body-sm uppercase tracking-wider mb-3">
              Company
            </h3>
            <ul role="list" className="space-y-2 mb-6">
              {COMPANY_LINKS.map(({ label, href }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className={
                      'text-caption text-brand-300 ' +
                      'hover:text-white transition-colors duration-150 ' +
                      'focus-visible:outline-none focus-visible:rounded focus-visible:ring-1 focus-visible:ring-brand-400'
                    }
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>

            {/* Newsletter */}
            <h3 className="text-white font-semibold text-body-sm uppercase tracking-wider">
              Stay updated
            </h3>
            <p className="text-caption text-brand-400 mt-1">
              New frames, tips, and offers — no spam.
            </p>
            <NewsletterForm />
          </div>
        </div>
      </div>

      {/* ── Divider ─────────────────────────────────────────────────────── */}
      <div className="border-t border-brand-800" />

      {/* ── Bottom bar ──────────────────────────────────────────────────── */}
      <div className="container-main py-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">

          {/* Contact info row */}
          <ul
            role="list"
            className="flex flex-col sm:flex-row flex-wrap gap-x-6 gap-y-2"
          >
            {CONTACT_INFO.map(({ icon, text, href }, i) => (
              <li key={i} className="flex items-center gap-1.5 text-caption text-brand-300">
                {icon}
                {href ? (
                  <a
                    href={href}
                    target={href.startsWith('http') ? '_blank' : undefined}
                    rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
                    className="hover:text-white transition-colors duration-150"
                  >
                    {text}
                  </a>
                ) : (
                  <span>{text}</span>
                )}
              </li>
            ))}
          </ul>

          {/* Social icons + copyright */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex items-center gap-2" aria-label="Social media links">
              {SOCIAL_LINKS.map(({ label, href, icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className={
                    'p-2 rounded-lg text-brand-400 ' +
                    'hover:text-white hover:bg-brand-800 ' +
                    'transition-all duration-150 ' +
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400'
                  }
                >
                  {icon}
                </a>
              ))}
            </div>
            <p className="text-caption text-brand-500 whitespace-nowrap">
              © {currentYear} McDaves Optical. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
