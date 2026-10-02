// src/app/api/prescriptions/upload/route.ts
// ─── POST /api/prescriptions/upload ───────────────────────────────────────────
// Uploads a customer prescription file to a PRIVATE Supabase Storage bucket
// ('prescriptions') and returns a short-lived signed URL for the caller.
// Files are never public: the object cannot be fetched without a signed URL.
//
// SECURITY:
//   - Requires an authenticated session (Supabase auth cookie) before accepting.
//   - Validates the file signature (magic bytes), not the declared MIME type.
//   - Stores into a private bucket; only a short-lived signed URL is returned.

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { createAuthServerClient } from '@/lib/supabase/auth';
import { checkRateLimit, getClientIp } from '@/lib/security/rate-limiter';

export const dynamic = 'force-dynamic';

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB — matches UI copy
const PRIVATE_BUCKET = 'prescriptions';
const SIGNED_URL_TTL_SECONDS = 60 * 5; // 5 minutes

// Magic-byte signatures for the accepted formats.
const SIGNATURES: Array<{ mime: string; ext: string; test: (b: Buffer) => boolean }> = [
  {
    mime: 'image/jpeg',
    ext: 'jpg',
    test: (b) => b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  },
  {
    mime: 'image/png',
    ext: 'png',
    test: (b) =>
      b.length > 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47,
  },
  {
    mime: 'image/webp',
    ext: 'webp',
    test: (b) =>
      b.length > 12 &&
      b.toString('ascii', 0, 4) === 'RIFF' &&
      b.toString('ascii', 8, 12) === 'WEBP',
  },
  {
    mime: 'application/pdf',
    ext: 'pdf',
    test: (b) => b.length > 4 && b.toString('ascii', 0, 4) === '%PDF',
  },
];

function detectFileType(buffer: Buffer): { mime: string; ext: string } | null {
  for (const sig of SIGNATURES) {
    if (sig.test(buffer)) return { mime: sig.mime, ext: sig.ext };
  }
  return null;
}

function getSupabaseServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // 1. Rate limit — max 5 prescription uploads per minute per IP (prevents abuse)
    const clientIp = getClientIp(request);
    const rateLimit = await checkRateLimit(`prescription-upload:${clientIp}`, {
      maxRequests: 5,
      windowMs: 60 * 1000,
    });

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many upload attempts. Please wait a minute.' },
        { status: 429 },
      );
    }

    // 2. Require an authenticated session before accepting any upload.
    const authClient = await createAuthServerClient();
    const {
      data: { user },
    } = await authClient.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required to upload a prescription.' },
        { status: 401 },
      );
    }

    // 3. Supabase service client (server-only — uses service role key)
    const supabase = getSupabaseServiceClient();
    if (!supabase) {
      return NextResponse.json(
        { error: 'Storage service not configured.' },
        { status: 500 },
      );
    }

    // 4. Parse multipart form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided.' }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { error: 'File exceeds 5 MB limit.' },
        { status: 400 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // 5. Validate the actual file signature (magic bytes), not the declared MIME.
    const detected = detectFileType(buffer);
    if (!detected) {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload JPG, PNG, WEBP, or PDF.' },
        { status: 400 },
      );
    }

    // 6. Build a unique, sanitized storage path (CSPRNG suffix).
    const storagePath = `rx_${user.id}_${Date.now()}_${crypto.randomUUID()}.${detected.ext}`;

    // 7. Upload to the PRIVATE bucket.
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(PRIVATE_BUCKET)
      .upload(storagePath, buffer, {
        contentType: detected.mime,
        upsert: false, // prescriptions are unique per submission
      });

    if (uploadError || !uploadData) {
      console.error('[/api/prescriptions/upload] Upload failed:', uploadError?.message);
      return NextResponse.json(
        { error: 'Failed to upload prescription. Please try again.' },
        { status: 500 },
      );
    }

    // 8. Mint a short-lived signed URL. The object itself is private and
    //    cannot be fetched without a signed URL; the URL expires per config.
    const { data: signed } = await supabase.storage
      .from(PRIVATE_BUCKET)
      .createSignedUrl(storagePath, SIGNED_URL_TTL_SECONDS);

    return NextResponse.json(
      {
        success: true,
        storagePath,
        bucket: PRIVATE_BUCKET,
        prescriptionFileUrl: signed?.signedUrl ?? null,
        signedUrlTtlSeconds: SIGNED_URL_TTL_SECONDS,
      },
      { status: 201 },
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Prescription upload failed.';
    console.error('[/api/prescriptions/upload]', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
