import { NextRequest, NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/auth/admin-auth';
import { supabaseServer } from '@/lib/supabase/server';
const BUCKET='vto-models';
export async function GET(request:NextRequest){const auth=requireAdminSession(request);if(!auth.authorized)return NextResponse.json({error:auth.error},{status:401});if(!supabaseServer)return NextResponse.json({error:'Supabase is not configured.'},{status:503});const{data,error}=await supabaseServer.from('vto_asset_calibrations').select('*').order('created_at',{ascending:false});if(error)return NextResponse.json({error:error.message},{status:500});const assets=(data??[]).map((a:any)=>{const path=a.source_storage_path||a.storage_path||null;const url=path?supabaseServer!.storage.from(BUCKET).getPublicUrl(path).data.publicUrl:(a.vto_glb_url||'');return {...a,source_public_url:url};});return NextResponse.json({assets});}
