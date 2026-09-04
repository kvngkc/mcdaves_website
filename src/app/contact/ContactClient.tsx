// src/app/contact/page.tsx
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  PhoneCall,
  Mail,
  MapPin,
  MessageCircle,
  Clock,
  ShieldCheck,
  Send,
  CheckCircle2,
} from 'lucide-react';
import { siteConfig } from '@/data/site-config';

export default function ContactPage() {
  const [inquiryType, setInquiryType] = useState<'retail' | 'b2b'>('retail');
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitted(true);
  };

  const getWhatsAppUrl = () => {
    return `https://wa.me/${siteConfig.whatsappNumber}?text=${encodeURIComponent(
      "Hi McDaves! I'd like help choosing the right eyewear or lenses.",
    )}`;
  };

  return (
    <div className="flex flex-col min-h-screen bg-brand-50/40 pb-16">
      
      {/* ── 1. Header Banner ─────────────────────────────────────────────────── */}
      <section className="pt-12 pb-16 bg-white border-b border-neutral-200">
        <div className="container-main text-center max-w-2xl">
          <span className="text-caption font-semibold uppercase tracking-wider text-brand-700 block mb-2">
            Get in Touch
          </span>
          <h1 className="text-h1 font-bold text-neutral-900 tracking-tight mb-3">
            Contact McDaves
          </h1>
          <p className="text-body-sm text-neutral-600">
            Have a question about our eyewear collection or optical supplies? Our Lagos team is here to assist.
          </p>
        </div>
      </section>

      {/* ── 2. Contact Details & Form Grid ──────────────────────────────────── */}
      <section className="py-16">
        <div className="container-main max-w-5xl">
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left: Authoritative Contact Cards */}
            <div className="space-y-6 lg:col-span-1">
              
              <div className="p-6 bg-white rounded-2xl border border-neutral-200 shadow-card">
                <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center text-brand-700 mb-4">
                  <MapPin className="w-5 h-5" />
                </div>
                <h3 className="text-body-md font-bold text-neutral-900 mb-1">Central Office & Facility</h3>
                <p className="text-body-sm text-neutral-600 leading-relaxed mb-2">
                  {siteConfig.address}
                </p>
                <span className="text-caption text-neutral-400">Main Optical Distribution Hub</span>
              </div>

              <div className="p-6 bg-white rounded-2xl border border-neutral-200 shadow-card">
                <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center text-brand-700 mb-4">
                  <PhoneCall className="w-5 h-5" />
                </div>
                <h3 className="text-body-md font-bold text-neutral-900 mb-1">Phone & Support</h3>
                <p className="text-body-sm text-neutral-600 mb-1">
                  {siteConfig.displayPhone}
                </p>
                <p className="text-caption text-neutral-400 mb-4">{siteConfig.hours}</p>

                <a
                  href={getWhatsAppUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 w-full justify-center py-2.5 px-4 rounded-xl bg-[#25D366] hover:bg-[#1ebe5d] text-white font-semibold text-xs transition-colors shadow-sm"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Chat with us on WhatsApp</span>
                </a>
              </div>

              <div className="p-6 bg-white rounded-2xl border border-neutral-200 shadow-card">
                <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center text-brand-700 mb-4">
                  <Mail className="w-5 h-5" />
                </div>
                <h3 className="text-body-md font-bold text-neutral-900 mb-1">Email Inquiry</h3>
                <p className="text-body-sm text-neutral-600">
                  {siteConfig.email}
                </p>
              </div>

            </div>

            {/* Right: Contact Inquiry Form */}
            <div className="lg:col-span-2 bg-white rounded-3xl border border-neutral-200 p-8 shadow-card">
              
              {/* Inquiry Type Selector Tabs */}
              <div className="flex items-center gap-2 p-1 bg-neutral-100 rounded-xl mb-8">
                <button
                  type="button"
                  onClick={() => setInquiryType('retail')}
                  className={`flex-1 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                    inquiryType === 'retail'
                      ? 'bg-white text-brand-800 shadow-xs'
                      : 'text-neutral-500 hover:text-neutral-800'
                  }`}
                >
                  👓 Retail Eyewear Inquiry
                </button>
                <button
                  type="button"
                  onClick={() => setInquiryType('b2b')}
                  className={`flex-1 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                    inquiryType === 'b2b'
                      ? 'bg-neutral-900 text-white shadow-xs'
                      : 'text-neutral-500 hover:text-neutral-800'
                  }`}
                >
                  📦 B2B Optical Supply Quote
                </button>
              </div>

              {formSubmitted ? (
                <div className="text-center py-12 space-y-4">
                  <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <h3 className="text-h3 font-bold text-neutral-900">Message Received</h3>
                  <p className="text-body-sm text-neutral-600 max-w-md mx-auto">
                    Thank you, <strong className="text-neutral-800">{formData.name}</strong>. Our Lagos team will reply to your message shortly.
                  </p>
                  <button
                    onClick={() => {
                      setFormSubmitted(false);
                      setFormData({ name: '', email: '', phone: '', message: '' });
                    }}
                    className="px-5 py-2.5 bg-neutral-100 hover:bg-neutral-200 text-xs font-semibold text-neutral-800 rounded-xl mt-4"
                  >
                    Send Another Message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  
                  {inquiryType === 'b2b' && (
                    <div className="p-4 rounded-xl bg-neutral-900 text-white text-xs flex items-center justify-between gap-4">
                      <span>Need a formal volume quote with SKUs & specs?</span>
                      <Link
                        href="/pro/quote"
                        className="px-3 py-1.5 rounded-lg bg-brand-500 hover:bg-brand-600 font-semibold whitespace-nowrap text-[11px]"
                      >
                        Use B2B Quote Form →
                      </Link>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-neutral-700 mb-1">
                        Your Full Name <span className="text-brand-600">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. John Doe"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-4 py-2.5 bg-white border border-neutral-300 rounded-xl text-xs text-neutral-900 focus:outline-none focus:border-brand-600"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-neutral-700 mb-1">
                        Email Address <span className="text-brand-600">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="you@domain.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-4 py-2.5 bg-white border border-neutral-300 rounded-xl text-xs text-neutral-900 focus:outline-none focus:border-brand-600"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">
                      Phone / WhatsApp Number
                    </label>
                    <input
                      type="tel"
                      placeholder="080 1234 5678"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-4 py-2.5 bg-white border border-neutral-300 rounded-xl text-xs text-neutral-900 focus:outline-none focus:border-brand-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">
                      Your Message <span className="text-brand-600">*</span>
                    </label>
                    <textarea
                      required
                      rows={5}
                      placeholder="How can we assist you today?"
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="w-full px-4 py-2.5 bg-white border border-neutral-300 rounded-xl text-xs text-neutral-900 focus:outline-none focus:border-brand-600 resize-y"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 px-6 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-body-sm transition-all shadow-md active:scale-[0.98] flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    <span>Send Message</span>
                  </button>

                </form>
              )}

            </div>

          </div>

        </div>
      </section>

    </div>
  );
}
