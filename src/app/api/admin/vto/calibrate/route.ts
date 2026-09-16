import { NextRequest, NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/auth/admin-auth';
import { supabaseServer } from '@/lib/supabase/server';

const isNum = (v: unknown) => typeof v === 'number' && Number.isFinite(v);
const validTransform = (t: any) => t && ['position','rotation'].every(k => t[k] && ['x','y','z'].every(a => isNum(t[k][a]))) && isNum(t.scale) && t.scale > 0;

export async function POST(request: NextRequest) {
  const auth = requireAdminSession(request);
  if (!auth.authorized) return NextResponse.json({ error: auth.error }, { status: 401 });
  if (!supabaseServer) return NextResponse.json({ error: 'Supabase is not configured.' }, { status: 503 });
  try {
    const body = await request.json();
    const assetId = typeof body.assetId === 'string' ? body.assetId.trim() : '';
    const transform = body.manualTransform;
    const dimensions = body.physicalDimensions;
    if (!assetId || !validTransform(transform)) return NextResponse.json({ error: 'Valid assetId and manualTransform are required.' }, { status: 400 });
    const patch: Record<string, unknown> = {
      manual_transform: transform,
      bridge_x: isNum(body.bridge?.x) ? body.bridge.x : null,
      bridge_y: isNum(body.bridge?.y) ? body.bridge.y : null,
      bridge_z: isNum(body.bridge?.z) ? body.bridge.z : null,
      rotation_offset_euler: transform.rotation,
      metadata_source: 'McDaves VTO Manual Calibration Studio',
      status: 'CALIBRATED',
      updated_at: new Date().toISOString(),
    };
    if (dimensions && typeof dimensions === 'object') {
      for (const [key, dbKey] of [['frameWidthMm','frame_width_mm'],['lensWidthMm','lens_width_mm'],['bridgeWidthMm','bridge_width_mm'],['templeLengthMm','temple_length_mm']] as const) {
        if (dimensions[key] == null || isNum(dimensions[key])) patch[dbKey] = dimensions[key] ?? null;
      }
    }
    const { data, error } = await supabaseServer.from('vto_asset_calibrations').update(patch).eq('asset_id', assetId).select('*').maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) return NextResponse.json({ error: 'VTO asset not found.' }, { status: 404 });
    return NextResponse.json({ asset: data });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Calibration save failed.' }, { status: 500 });
  }
}
