// src/app/api/prescriptions/upload/route.ts
// ─── POST /api/prescriptions/upload ──────────────────────────────────────────
// Uploads a customer prescription file to Supabase Storage (product-media bucket,
// prescriptions/ path) and returns the public URL.
// Called client-side before /api/pay/initialize so the URL can be stored in
// order metadata for admin retrieval.

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { checkRateLimit, getClientIp } from '@/lib/security/rate-limiter';

export const dynamic = 'force-dynamic';

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB — matches UI copy
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
];

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
    const rateLimit = checkRateLimit(`prescription-upload:${clientIp}`, {
      maxRequests: 5,
      windowMs: 60 * 1000,
    });

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many upload attempts. Please wait a minute.' },
        { status: 429 },
      );
    }

    // 2. Supabase service client (server-only — uses service role key)
    const supabase = getSupabaseServiceClient();
    if (!supabase) {
      return NextResponse.json(
        { error: 'Storage service not configured.' },
        { status: 500 },
      );
    }

    // 3. Parse multipart form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided.' }, { status: 400 });
    }

    // 4. Validate type and size
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload JPG, PNG, WEBP, or PDF.' },
        { status: 400 },
      );
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { error: 'File exceeds 5 MB limit.' },
        { status: 400 },
      );
    }

    // 5. Build a unique, sanitized storage path
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 7).toUpperCase();
    const storagePath = `prescriptions/rx_${timestamp}_${randomSuffix}.${ext}`;

    const buffer = Buffer.from(await file.arrayBuffer());

    // 6. Upload to Supabase Storage — product-media bucket, prescriptions/ folder
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('product-media')
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: false, // prescriptions are unique per submission
      });

    if (uploadError || !uploadData) {
      console.error('[/api/prescriptions/upload] Upload failed:', uploadError?.message);
      return NextResponse.json(
        { error: 'Failed to upload prescription. Please try again.' },
        { status: 500 },
      );
    }

    // 7. Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('product-media')
      .getPublicUrl(storagePath);

    const prescriptionFileUrl = publicUrlData?.publicUrl;

    if (!prescriptionFileUrl) {
      return NextResponse.json(
        { error: 'Upload succeeded but URL could not be resolved.' },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        prescriptionFileUrl,
        storagePath,
      },
      { status: 201 },
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Prescription upload failed.';
    console.error('[/api/prescriptions/upload]', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
