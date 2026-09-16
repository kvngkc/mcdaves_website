import { NextRequest, NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/auth/admin-auth';
import { supabaseServer } from '@/lib/supabase/server';
import crypto from 'node:crypto';

const BUCKET = 'vto-models';
const MAX_BYTES = 50 * 1024 * 1024;

export async function POST(request: NextRequest) {
  const auth = requireAdminSession(request);
  if (!auth.authorized) return NextResponse.json({ error: auth.error }, { status: 401 });
  if (!supabaseServer) return NextResponse.json({ error: 'Supabase is not configured.' }, { status: 503 });
  try {
    const body = await request.json();
    const variantId = typeof body.variantId === 'string' ? body.variantId.trim() : '';
    const fileName = typeof body.fileName === 'string' ? body.fileName.trim() : '';
    const sizeBytes = Number(body.sizeBytes);
    if (!variantId || !fileName || !Number.isInteger(sizeBytes) || sizeBytes <= 0 || sizeBytes > MAX_BYTES) return NextResponse.json({ error: 'Invalid variant, filename, or GLB size.' }, { status: 400 });
    if (!/\.glb$/i.test(fileName)) return NextResponse.json({ error: 'Only .glb assets are accepted.' }, { status: 400 });

    const { data: variant, error: variantError } = await supabaseServer.from('product_variants').select('id, product_id, name').eq('id', variantId).maybeSingle();
    if (variantError) throw new Error(variantError.message);
    if (!variant) return NextResponse.json({ error: 'Variant not found.' }, { status: 404 });

    const assetId = `vto-${variantId}-${crypto.randomUUID()}`;
    const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '-');
    const sourcePath = `${assetId}/source/${safeName}`;
    const { data: signed, error: signedError } = await supabaseServer.storage.from(BUCKET).createSignedUploadUrl(sourcePath);
    if (signedError || !signed) throw new Error(signedError?.message ?? 'Could not create signed upload URL.');

    const { error: insertError } = await supabaseServer.from('vto_asset_calibrations').insert({
      id: assetId, asset_id: assetId, name: variant.name, status: 'UPLOADED',
      source_glb_url: sourcePath, vto_glb_url: '', storage_bucket: BUCKET,
      storage_path: sourcePath, source_storage_path: sourcePath,
      manual_transform: { position: { x: 0, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, scale: 1 },
      provenance: { variantId, productId: variant.product_id, sourceFileName: fileName, requestedSizeBytes: sizeBytes },
    });
    if (insertError) throw new Error(insertError.message);
    return NextResponse.json({ assetId, variantId, sourcePath, token: signed.token, signedUrl: signed.signedUrl, bucket: BUCKET });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'VTO upload preparation failed.' }, { status: 500 });
  }
}
