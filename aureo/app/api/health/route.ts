import { NextResponse } from 'next/server'
import { hayDB, usuarioActual } from '@/lib/supabase/servidor'

export const dynamic = 'force-dynamic'

// GET /api/health — para comprobar el deploy de un vistazo
export async function GET() {
  const usuario = await usuarioActual().catch(() => null)
  return NextResponse.json({
    ok: true,
    service: 'aureo',
    db: hayDB,
    auth: Boolean(usuario),
    ts: Date.now(),
  })
}
