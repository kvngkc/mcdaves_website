import { NextRequest, NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/auth/admin-auth';
import { supabaseServer } from '@/lib/supabase/server';
import { deleteVTOAssetSourceAfterPublication } from '@/vto-pipeline/backend/VTOPipelineService';
import { createHash } from 'node:crypto';

const BUCKET = 'vto-models';

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
      .select('asset_id,status,derived_storage_path,derived_content_hash,derived_size_bytes,output_size_status,provenance,vto_glb_url')
      .eq('asset_id', assetId)
      .maybeSingle();
    if (assetError) throw new Error(assetError.message);
    if (!asset) return NextResponse.json({ error: 'VTO asset not found.' }, { status: 404 });
    if (asset.status !== 'REVIEW_REQUIRED' && asset.status !== 'APPROVED' && asset.status !== 'PUBLISHED') {
      return NextResponse.json({ error: `Asset cannot be approved from status ${asset.status}.` }, { status: 409 });
    }
    if (asset.output_size_status !== 'PASS') return NextResponse.json({ error: 'Only a PASS-sized derived asset can be approved for publication.' }, { status: 409 });
    if (!asset.derived_storage_path || !asset.derived_content_hash) return NextResponse.json({ error: 'Verified derived asset is missing.' }, { status: 409 });

    const provenance = asset.provenance && typeof asset.provenance === 'object' ? asset.provenance as Record<string, unknown> : {};
    const variantId = typeof provenance.variantId === 'string' ? provenance.variantId : '';
    if (!variantId) return NextResponse.json({ error: 'Variant linkage evidence is missing from the asset provenance.' }, { status: 409 });

    const { data: derived, error: derivedError } = await supabaseServer.storage.from(BUCKET).download(asset.derived_storage_path);
    if (derivedError || !derived) return NextResponse.json({ error: 'Derived asset could not be verified before publication.' }, { status: 409 });
    const derivedBytes = await derived.arrayBuffer();
    const actualHash = createHash('sha256').update(Buffer.from(derivedBytes)).digest('hex');
    if (actualHash !== asset.derived_content_hash || derivedBytes.byteLength !== asset.derived_size_bytes) {
      return NextResponse.json({ error: 'Derived asset provenance verification failed.' }, { status: 409 });
    }

    const { data: publicUrl } = supabaseServer.storage.from(BUCKET).getPublicUrl(asset.derived_storage_path);

    const { error: variantError } = await supabaseServer
      .from('product_variants')
      .update({ vto_asset_id: assetId, updated_at: new Date().toISOString() })
      .eq('id', variantId);
    if (variantError) throw new Error(`Failed to link VTO asset to variant: ${variantError.message}`);

    if (asset.status !== 'PUBLISHED') {
      const { error: publishError } = await supabaseServer
        .from('vto_asset_calibrations')
        .update({ status: 'PUBLISHED', vto_glb_url: publicUrl.publicUrl, storage_bucket: BUCKET, storage_path: asset.derived_storage_path, updated_at: new Date().toISOString() })
        .eq('asset_id', assetId)
        .in('status', ['REVIEW_REQUIRED', 'APPROVED']);
      if (publishError) throw new Error(`Failed to publish VTO asset: ${publishError.message}`);
    }

    await deleteVTOAssetSourceAfterPublication(assetId);

    return NextResponse.json({ assetId, variantId, status: 'PUBLISHED', vtoGlbUrl: publicUrl.publicUrl, sourceDeleted: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'VTO publication failed.' }, { status: 500 });
  }
}
