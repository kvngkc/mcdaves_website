import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/service';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    if (!supabase) return NextResponse.json({ error: 'Database client missing' }, { status: 500 });

    const { data, error } = await supabase
      .from('vto_asset_calibrations')
      .select('asset_id,name,status,vto_glb_url,storage_bucket,storage_path,frame_width_mm,lens_width_mm,bridge_width_mm,temple_length_mm,bridge_x,bridge_y,bridge_z,rotation_offset_euler,manual_transform,metadata_source,calibration_version,updated_at')
      .eq('status', 'PUBLISHED')
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('[VTO API] Error fetching assets:', error);
      return NextResponse.json({ error: 'Failed to fetch VTO assets' }, { status: 500 });
    }

    const assets = (data ?? []).map((row) => ({
      asset_id: row.asset_id,
      name: row.name,
      status: row.status,
      physical_dimensions: {
        frame_width_mm: row.frame_width_mm,
        lens_width_mm: row.lens_width_mm,
        bridge_width_mm: row.bridge_width_mm,
        temple_length_mm: row.temple_length_mm,
      },
      registration: {
        bridge: { x: row.bridge_x ?? 0, y: row.bridge_y ?? 0, z: row.bridge_z ?? 0 },
        rotation_offset_euler: row.rotation_offset_euler ?? { x: 0, y: 0, z: 0 },
      },
      manual_transform: row.manual_transform ?? { position: { x: 0, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, scale: 1 },
      vto_glb_url: row.vto_glb_url || null,
      storage_path: row.storage_path || null,
      metadata_source: row.metadata_source || 'DB',
      calibration_version: row.calibration_version ?? 1,
      updated_at: row.updated_at,
    }));

    return NextResponse.json({ assets }, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (err: unknown) {
    console.error('[VTO API] Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
