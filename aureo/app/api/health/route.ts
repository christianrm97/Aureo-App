import { NextResponse } from 'next/server'
import { hayDB } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

// GET /api/health — para comprobar el deploy de un vistazo
export async function GET() {
  return NextResponse.json({ ok: true, service: 'aureo', db: hayDB, ts: Date.now() })
}
