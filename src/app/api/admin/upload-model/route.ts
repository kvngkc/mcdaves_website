// src/app/api/admin/upload-model/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/auth/admin-auth';
import { supabase } from '@/lib/supabase/service';

export const dynamic = 'force-dynamic';

const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50MB
const STORAGE_BUCKET = 'vto-models';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const auth = requireAdminSession(request);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }

    if (!supabase) {
      console.error('[Upload Model] Supabase server configuration is missing.');
      return NextResponse.json(
        { error: 'Server storage is not configured.' },
        { status: 503 },
      );
    }

    const formData = await request.formData();
    const file = formData.get('file');

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'No 3D model file provided' }, { status: 400 });
    }

    const originalName = file.name || 'model.glb';
    if (!originalName.toLowerCase().endsWith('.glb')) {
      return NextResponse.json(
        { error: 'Invalid file format. Only binary 3D GLB (.glb) files are supported for AR Virtual Try-On.' },
        { status: 400 },
      );
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { error: 'File size exceeds maximum allowed limit (50MB).' },
        { status: 400 },
      );
    }

    const baseClean = originalName
      .toLowerCase()
      .replace(/\.glb$/i, '')
      .replace(/[^a-z0-9_-]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_+|_+$/g, '') || 'model';

    const sanitizedFilename = `${baseClean}_${Date.now().toString().slice(-4)}.glb`;
    const buffer = Buffer.from(await file.arrayBuffer());

    // Validate GLB binary magic header: "glTF" (0x46546C67).
    if (buffer.length < 12) {
      return NextResponse.json(
        { error: 'Invalid file: File is too small to be a valid 3D GLB model.' },
        { status: 400 },
      );
    }

    const magic = buffer.readUInt32LE(0);
    const GLB_MAGIC = 0x46546c67; // 'glTF' in ASCII
    if (magic !== GLB_MAGIC) {
      return NextResponse.json(
        { error: 'Invalid 3D asset: The uploaded file does not contain a valid binary glTF (GLB) header.' },
        { status: 400 },
      );
    }

    // Store the canonical asset in Supabase Storage. The VTO pipeline must not
    // depend on Vercel's ephemeral/read-only filesystem or public/models.
    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(sanitizedFilename, buffer, {
        contentType: 'model/gltf-binary',
        upsert: true,
      });

    if (uploadError) {
      console.error('[Upload Model] Supabase Storage upload failed:', uploadError);
      return NextResponse.json(
        { error: 'Failed to upload 3D model to server storage.' },
        { status: 500 },
      );
    }

    const { data: publicUrlData } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(sanitizedFilename);

    if (!publicUrlData?.publicUrl) {
      console.error('[Upload Model] Supabase Storage returned no public URL.');
      return NextResponse.json(
        { error: '3D model uploaded, but its storage URL could not be resolved.' },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        glbPath: publicUrlData.publicUrl,
        filename: sanitizedFilename,
        sizeBytes: file.size,
        message: '3D GLB model uploaded successfully',
      },
      { status: 201 },
    );
  } catch (err: unknown) {
    console.error('[Upload Model] Unexpected error:', err);
    const msg = err instanceof Error ? err.message : 'Failed to process 3D model upload';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
