// src/app/api/admin/upload-model/route.ts
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { requireAdminSession } from '@/lib/auth/admin-auth';
import { supabase } from '@/lib/supabase/service';

export const dynamic = 'force-dynamic';

const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50MB

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const auth = requireAdminSession(request);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
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

    // Sanitize filename
    const baseClean = originalName
      .toLowerCase()
      .replace(/\.glb$/i, '')
      .replace(/[^a-z0-9_-]/g, '_')
      .replace(/_+/g, '_');

    const sanitizedFilename = `${baseClean}_${Date.now().toString().slice(-4)}.glb`;
    const buffer = Buffer.from(await file.arrayBuffer());

    // Validate GLB binary magic header: "glTF" (0x46546C67)
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

    // 1. Write to public/models directory if filesystem is writable
    const relativeGlbPath = `/models/${sanitizedFilename}`;
    try {
      const modelsDir = path.join(process.cwd(), 'public', 'models');
      if (!fs.existsSync(modelsDir)) {
        fs.mkdirSync(modelsDir, { recursive: true });
      }
      const filePath = path.join(modelsDir, sanitizedFilename);
      fs.writeFileSync(filePath, buffer);
    } catch (fsErr) {
      console.warn('[Upload Model] Filesystem write notice (read-only environment):', fsErr);
    }

    // 2. If Supabase Storage is configured, also upload to 'vto-models' bucket
    if (supabase) {
      try {
        await supabase.storage.from('vto-models').upload(sanitizedFilename, buffer, {
          contentType: 'model/gltf-binary',
          upsert: true,
        });
      } catch (storageErr) {
        console.warn('[Supabase Storage] Notice: upload to vto-models bucket skipped:', storageErr);
      }
    }

    return NextResponse.json(
      {
        success: true,
        glbPath: relativeGlbPath,
        filename: sanitizedFilename,
        sizeBytes: file.size,
        message: '3D GLB model uploaded successfully',
      },
      { status: 201 },
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to process 3D model upload';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
