import { NextRequest, NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/auth/admin-auth';
import { processVTOAsset } from '@/vto-pipeline/backend/VTOPipelineService';
import { supabaseServer } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  const auth = requireAdminSession(request);
  if (!auth.authorized) return NextResponse.json({ error: auth.error }, { status: 401 });
  if (!supabaseServer) return NextResponse.json({ error: 'Supabase is not configured.' }, { status: 503 });

  try {
    const body = await request.json();
    const assetId = typeof body.assetId === 'string' ? body.assetId.trim() : '';
    if (!assetId) return NextResponse.json({ error: 'assetId is required.' }, { status: 400 });

    const { data: asset, error } = await supabaseServer
      .from('vto_asset_calibrations')
      .select('asset_id,name,source_storage_path,frame_width_mm,lens_width_mm,bridge_width_mm,temple_length_mm,bridge_x,bridge_y,bridge_z')
      .eq('asset_id', assetId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!asset || !asset.source_storage_path) return NextResponse.json({ error: 'Uploaded VTO asset record not found.' }, { status: 404 });

    const result = await processVTOAsset({
      assetId: asset.asset_id,
      sourceStoragePath: asset.source_storage_path,
      fileName: asset.source_storage_path.split('/').pop() || `${asset.asset_id}.glb`,
      physicalDimensions: {
        frameWidthMm: Number(asset.frame_width_mm),
        lensWidthMm: Number(asset.lens_width_mm),
        bridgeWidthMm: Number(asset.bridge_width_mm),
        templeLengthMm: Number(asset.temple_length_mm),
      },
      customBridge: {
        x: asset.bridge_x == null ? undefined : Number(asset.bridge_x),
        y: asset.bridge_y == null ? undefined : Number(asset.bridge_y),
        z: asset.bridge_z == null ? undefined : Number(asset.bridge_z),
      },
    });

    const statusCode = result.status === 'PROCESSING_FAILED' ? 422 : 200;
    return NextResponse.json(result, { status: statusCode });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'VTO processing failed.' }, { status: 500 });
  }
}
