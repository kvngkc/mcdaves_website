import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/service';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    if (!supabase) {
      return NextResponse.json({ error: 'Database client missing' }, { status: 500 });
    }

    const { data, error } = await supabase
      .from('vto_asset_calibrations')
      .select('*')
      .eq('status', 'PUBLISHED')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[VTO API] Error fetching assets:', error);
      return NextResponse.json({ error: 'Failed to fetch VTO assets' }, { status: 500 });
    }

    // Set cache headers (60s CDN cache, 5min stale-while-revalidate)
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    });
  } catch (err: unknown) {
    console.error('[VTO API] Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
