import { NextRequest, NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/auth/admin-auth';
import { supabaseServer } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const auth = requireAdminSession(request);
  if (!auth.authorized) return NextResponse.json({ error: auth.error }, { status: 401 });
  if (!supabaseServer) return NextResponse.json({ error: 'Supabase is not configured.' }, { status: 503 });

  const { data, error } = await supabaseServer
    .from('product_variants')
    .select('id,name,sku,product_id,products:product_id(id,name,slug,frame_width_mm,lens_width_mm,bridge_width_mm,temple_length_mm)')
    .eq('status', 'ACTIVE')
    .order('name');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ variants: data ?? [] });
}
