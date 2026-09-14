'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, ArrowRight, ShieldCheck, CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui';
import { createAuthBrowserClient } from '@/lib/supabase/auth-client';

export default function CustomerLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setError(null);

    const supabase = createAuthBrowserClient();
    const { error: signInError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/api/auth/callback?next=/account/orders`,
      },
    });

    if (signInError) setError(signInError.message);
    else setSuccess(true);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-neutral-100 overflow-hidden">
        <div className="bg-neutral-900 px-6 py-8 text-center">
          <Link href="/" className="inline-block text-2xl font-black text-white tracking-tight mb-2">McDaves</Link>
          <h2 className="text-xl font-bold text-white/90">Customer Portal</h2>
          <p className="text-sm text-neutral-400 mt-2">Sign in securely to view your orders and track deliveries.</p>
        </div>
        <div className="p-6 sm:p-8">
          {success ? (
            <div className="text-center space-y-4 py-4">
              <div className="mx-auto w-16 h-16 bg-green-50 text-green-600 rounded-full flex items-center justify-center mb-6"><CheckCircle2 className="w-8 h-8" /></div>
              <h3 className="text-xl font-bold text-neutral-900">Check your email</h3>
              <p className="text-neutral-600 text-sm">We sent a secure magic link to <strong className="text-neutral-900">{email}</strong>. Click the link in the email to instantly sign in.</p>
              <Button variant="secondary" fullWidth onClick={() => setSuccess(false)} className="mt-6">Try a different email</Button>
            </div>
          ) : (
            <form onSubmit={handleLogin} className="space-y-6">
              {error && <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100 text-center">{error}</div>}
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-neutral-900 mb-1.5">Email address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Mail className="h-5 w-5 text-neutral-400" /></div>
                  <input id="email" name="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="block w-full pl-10 pr-3 py-3 border border-neutral-300 rounded-xl bg-neutral-50 text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 sm:text-sm transition-colors" placeholder="you@example.com" />
                </div>
              </div>
              <Button type="submit" variant="primary" size="lg" fullWidth disabled={loading} trailingIcon={loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5" />}>{loading ? 'Sending link...' : 'Send Magic Link'}</Button>
            </form>
          )}
        </div>
        <div className="bg-neutral-50 px-6 py-4 border-t border-neutral-100 flex items-center justify-center gap-2 text-xs text-neutral-500"><ShieldCheck className="w-4 h-4 text-green-600" /><span>Secure passwordless authentication</span></div>
      </div>
    </div>
  );
}
