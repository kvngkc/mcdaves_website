import { NextRequest, NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/auth/admin-auth';
import { supabaseServer } from '@/lib/supabase/server';
import { deleteVTOAssetSourceAfterPublication } from '@/vto-pipeline/backend/VTOPipelineService';
import { createHash } from 'node:crypto';

const BUCKET = 'vto-models';

function getStoragePathFromPublicUrl(value: string): string | null {
  const marker = `/storage/v1/object/public/${BUCKET}/`;
  const index = value.indexOf(marker);
  return index === -1 ? null : decodeURIComponent(value.slice(index + marker.length));
}

export async function POST(request: NextRequest) {
  const auth = requireAdminSession(request);
  if (!auth.authorized) return NextResponse.json({ error: auth.error }, { status: 401 });
  if (!supabaseServer) return NextResponse.json({ error: 'Supabase is not configured.' }, { status: 503 });

  try {
    const body = await request.json();
    const assetId = typeof body.assetId === 'string' ? body.assetId.trim() : '';
    if (!assetId) return NextResponse.json({ error: 'assetId is required.' }, { status: 400 });

    const { data: asset, error: assetError } = await supabaseServer
      .from('vto_asset_calibrations')
      .select('asset_id,status,derived_storage_path,derived_content_hash,derived_size_bytes,provenance,vto_glb_url,storage_path,storage_bucket')
      .eq('asset_id', assetId)
      .maybeSingle();
    if (assetError) throw new Error(assetError.message);
    if (!asset) return NextResponse.json({ error: 'VTO asset not found.' }, { status: 404 });
    if (!['REVIEW_REQUIRED', 'APPROVED', 'PUBLISHED'].includes(asset.status)) {
      return NextResponse.json({ error: `Asset cannot be published from status ${asset.status}.` }, { status: 409 });
    }

    const provenance = asset.provenance && typeof asset.provenance === 'object' ? asset.provenance as Record<string, unknown> : {};
    let variantId = typeof provenance.variantId === 'string' ? provenance.variantId : '';

    let derivedPath = asset.derived_storage_path as string | null;
    let derivedHash = asset.derived_content_hash as string | null;
    let derivedSize = asset.derived_size_bytes as number | null;

    // Backfill Gate 4 verification for legacy approved assets that already have a stored GLB.
    if (!derivedPath || !derivedHash || !derivedSize) {
      const candidatePath = derivedPath || (typeof asset.vto_glb_url === 'string' ? getStoragePathFromPublicUrl(asset.vto_glb_url) : null) || (typeof asset.storage_path === 'string' ? asset.storage_path : null);
      if (!candidatePath) return NextResponse.json({ error: 'Verified derived asset is missing. Re-process the VTO asset before publication.' }, { status: 409 });
      const { data: candidate, error: candidateError } = await supabaseServer.storage.from(BUCKET).download(candidatePath);
      if (candidateError || !candidate) return NextResponse.json({ error: 'Stored VTO GLB could not be verified before publication.' }, { status: 409 });
      const candidateBytes = await candidate.arrayBuffer();
      if (candidateBytes.byteLength === 0) return NextResponse.json({ error: 'Stored VTO GLB is empty.' }, { status: 409 });
      derivedPath = candidatePath;
      derivedSize = candidateBytes.byteLength;
      derivedHash = createHash('sha256').update(Buffer.from(candidateBytes)).digest('hex');
      const { data: publicUrl } = supabaseServer.storage.from(BUCKET).getPublicUrl(derivedPath);
      const { error: metadataError } = await supabaseServer.from('vto_asset_calibrations').update({
        derived_storage_path: derivedPath, derived_content_hash: derivedHash, derived_size_bytes: derivedSize,
        storage_bucket: BUCKET, storage_path: derivedPath,
        vto_glb_url: publicUrl.publicUrl, provenance: { ...provenance, derivedPath, derivedHash },
        updated_at: new Date().toISOString(),
      }).eq('asset_id', assetId);
      if (metadataError) throw new Error(`Failed to record VTO verification metadata: ${metadataError.message}`);
    }

    if (!variantId) {
      const { data: linkedVariant, error: linkedVariantError } = await supabaseServer
        .from('product_variants').select('id').eq('vto_asset_id', assetId).maybeSingle();
      if (linkedVariantError) throw new Error(linkedVariantError.message);
      variantId = linkedVariant?.id ?? '';
    }
    if (!variantId) return NextResponse.json({ error: 'Variant linkage evidence is missing from the asset.' }, { status: 409 });

    const { data: finalPublicUrl } = supabaseServer.storage.from(BUCKET).getPublicUrl(derivedPath!);

    const { error: variantError } = await supabaseServer.from('product_variants')
      .update({ vto_asset_id: assetId, updated_at: new Date().toISOString() }).eq('id', variantId);
    if (variantError) throw new Error(`Failed to link VTO asset to variant: ${variantError.message}`);

    if (asset.status !== 'PUBLISHED') {
      const { error: publishError } = await supabaseServer.from('vto_asset_calibrations').update({
        status: 'PUBLISHED', vto_glb_url: finalPublicUrl.publicUrl, storage_bucket: BUCKET, storage_path: derivedPath,
        derived_storage_path: derivedPath, derived_content_hash: derivedHash, derived_size_bytes: derivedSize,
        updated_at: new Date().toISOString(),
      }).eq('asset_id', assetId).in('status', ['REVIEW_REQUIRED', 'APPROVED']);
      if (publishError) throw new Error(`Failed to publish VTO asset: ${publishError.message}`);
    }

    await deleteVTOAssetSourceAfterPublication(assetId);
    return NextResponse.json({ assetId, variantId, status: 'PUBLISHED', vtoGlbUrl: finalPublicUrl.publicUrl, sourceDeleted: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'VTO publication failed.' }, { status: 500 });
  }
}
