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

    if (!variantId || !fileName || !Number.isInteger(sizeBytes) || sizeBytes <= 0 || sizeBytes > MAX_BYTES) {
      return NextResponse.json({ error: 'Invalid variant, filename, or GLB size.' }, { status: 400 });
    }
    if (!/\.glb$/i.test(fileName)) return NextResponse.json({ error: 'Only .glb assets are accepted.' }, { status: 400 });

    const { data: variant, error: variantError } = await supabaseServer
      .from('product_variants')
      .select('id, product_id, name, product:products(frame_width_mm,lens_width_mm,bridge_width_mm,temple_length_mm)')
      .eq('id', variantId)
      .maybeSingle();

    if (variantError) throw new Error(variantError.message);
    if (!variant) return NextResponse.json({ error: 'Variant not found.' }, { status: 404 });

    const product = Array.isArray(variant.product) ? variant.product[0] : variant.product;
    if (!product) return NextResponse.json({ error: 'Authoritative product dimensions are missing.' }, { status: 409 });

    const dimensions = {
      frameWidthMm: Number(product.frame_width_mm),
      lensWidthMm: Number(product.lens_width_mm),
      bridgeWidthMm: Number(product.bridge_width_mm),
      templeLengthMm: Number(product.temple_length_mm),
    };
    if (Object.values(dimensions).some((v) => !Number.isFinite(v) || v <= 0)) {
      return NextResponse.json({ error: 'Authoritative product dimensions are incomplete or invalid.' }, { status: 409 });
    }

    const assetId = `vto-${variantId}-${crypto.randomUUID()}`;
    const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '-');
    const sourcePath = `${assetId}/source/${safeName}`;

    const { data: signed, error: signedError } = await supabaseServer.storage
      .from(BUCKET)
      .createSignedUploadUrl(sourcePath);
    if (signedError || !signed) throw new Error(signedError?.message ?? 'Could not create signed upload URL.');

    const { error: insertError } = await supabaseServer.from('vto_asset_calibrations').insert({
      id: assetId,
      asset_id: assetId,
      name: variant.name,
      status: 'UPLOADED',
      frame_width_mm: dimensions.frameWidthMm,
      lens_width_mm: dimensions.lensWidthMm,
      bridge_width_mm: dimensions.bridgeWidthMm,
      temple_length_mm: dimensions.templeLengthMm,
      source_glb_url: sourcePath,
      vto_glb_url: '',
      storage_bucket: BUCKET,
      storage_path: sourcePath,
      source_storage_path: sourcePath,
      provenance: {
        variantId,
        productId: variant.product_id,
        sourceFileName: fileName,
        requestedSizeBytes: sizeBytes,
      },
    });
    if (insertError) throw new Error(insertError.message);

    return NextResponse.json({
      assetId,
      variantId,
      sourcePath,
      token: signed.token,
      signedUrl: signed.signedUrl,
      bucket: BUCKET,
      dimensions,
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'VTO upload preparation failed.' }, { status: 500 });
  }
}
