import { NextResponse } from 'next/server.js';
import { isSupabaseConfigured } from '../../../lib/supabase.ts';

export const dynamic = 'force-dynamic';

export async function GET() {
  const configured = isSupabaseConfigured();
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    supabase: {
      configured,
      mode: configured ? 'cloud' : 'offline_mock',
    },
  });
}