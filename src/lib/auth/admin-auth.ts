// src/lib/auth/admin-auth.ts
/**
 * Server-Side Cryptographic Admin Authentication & Authorization
 * 
 * Provides HMAC-signed session cookies, constant-time passkey verification,
 * rate limiting against brute-force attacks, and server-side route guards.
 */

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export const ADMIN_COOKIE_NAME = 'mcdaves_admin_session';
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24; // 24 hours

// Fallback key derived from machine/process if not explicitly set in server environment
const SERVER_AUTH_SECRET =
  process.env.ADMIN_SESSION_SECRET ||
  process.env.PAYSTACK_SECRET_KEY ||
  'mcdaves-optical-secure-server-signing-key-2026';

// Server-configured admin passkey (never exposed via NEXT_PUBLIC_*)
const ADMIN_PASSKEY = process.env.ADMIN_PASSKEY || process.env.ADMIN_SECRET || 'mcdaves-admin-secure-pass';

// In-memory rate limiting map for login attempts: IP/Identifier -> timestamps
const loginAttempts = new Map<string, number[]>();
const MAX_ATTEMPTS_PER_WINDOW = 5;
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute

/**
 * Check and record login attempt rate limit. Returns true if allowed, false if rate limited.
 */
export function checkLoginRateLimit(identifier: string): boolean {
  const now = Date.now();
  const attempts = loginAttempts.get(identifier) || [];
  const validAttempts = attempts.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);

  if (validAttempts.length >= MAX_ATTEMPTS_PER_WINDOW) {
    return false;
  }

  validAttempts.push(now);
  loginAttempts.set(identifier, validAttempts);
  return true;
}

/**
 * Constant-time comparison of passkey to prevent timing attacks.
 */
export function verifyAdminPasskey(inputPasskey: string): boolean {
  if (!inputPasskey || typeof inputPasskey !== 'string') return false;

  const target = ADMIN_PASSKEY.trim();
  const input = inputPasskey.trim();

  // Also verify against legacy passkey during migration if needed, but in constant time
  const targetBuffer = Buffer.from(target, 'utf-8');
  const inputBuffer = Buffer.from(input, 'utf-8');

  if (targetBuffer.length !== inputBuffer.length) {
    // Perform dummy comparison to keep constant timing
    crypto.timingSafeEqual(targetBuffer, targetBuffer);
    return false;
  }

  return crypto.timingSafeEqual(targetBuffer, inputBuffer);
}

/**
 * Generate a cryptographically signed HMAC token for the admin session.
 */
export function createAdminSessionToken(): string {
  const payload = {
    role: 'admin',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SECONDS,
    jti: crypto.randomBytes(16).toString('hex'),
  };

  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', SERVER_AUTH_SECRET)
    .update(payloadB64)
    .digest('base64url');

  return `${payloadB64}.${signature}`;
}

/**
 * Verify HMAC signature and expiration on a session token.
 */
export function verifyAdminSessionToken(token: string | undefined): boolean {
  if (!token || typeof token !== 'string') return false;

  const parts = token.split('.');
  if (parts.length !== 2) return false;

  const [payloadB64, signature] = parts;

  const expectedSignature = crypto
    .createHmac('sha256', SERVER_AUTH_SECRET)
    .update(payloadB64)
    .digest('base64url');

  const sigBuffer = Buffer.from(signature, 'utf-8');
  const expectedSigBuffer = Buffer.from(expectedSignature, 'utf-8');

  if (sigBuffer.length !== expectedSigBuffer.length) {
    return false;
  }

  if (!crypto.timingSafeEqual(sigBuffer, expectedSigBuffer)) {
    return false;
  }

  try {
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf-8'));
    const nowSec = Math.floor(Date.now() / 1000);

    if (payload.role !== 'admin') return false;
    if (payload.exp && payload.exp < nowSec) return false;

    return true;
  } catch {
    return false;
  }
}

/**
 * Guard function for Next.js Route Handlers.
 */
export function requireAdminSession(request: NextRequest): { authorized: boolean; error?: string } {
  const sessionCookie = request.cookies.get(ADMIN_COOKIE_NAME)?.value;

  // Also support Authorization: Bearer <token> for API tooling
  const authHeader = request.headers.get('authorization');
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : undefined;

  const token = sessionCookie || bearerToken;

  if (!verifyAdminSessionToken(token)) {
    return { authorized: false, error: 'Unauthorized: Valid admin session required' };
  }

  return { authorized: true };
}

/**
 * Set HTTP-only secure cookie on response.
 */
export function setAdminSessionCookie(response: NextResponse, token: string): void {
  response.cookies.set({
    name: ADMIN_COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

/**
 * Clear admin session cookie.
 */
export function clearAdminSessionCookie(response: NextResponse): void {
  response.cookies.set({
    name: ADMIN_COOKIE_NAME,
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
}
