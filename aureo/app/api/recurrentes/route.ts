import { NextResponse } from 'next/server'
import { supabaseServidor, usuarioActual } from '@/lib/supabase/servidor'
import { RECURRENTES_BASE } from '@/lib/recurrentes'

export const dynamic = 'force-dynamic'

/**
 * GET /api/recurrentes
 *
 * Con la tabla vacia devuelve los fijos de ejemplo, pero NO los inserta: la
 * app dispara varias peticiones al cargar y todas verian la tabla vacia a la
 * vez, asi que cada una sembraria su copia. Sirviendolos como configuracion
 * no hay carrera que perder.
 */
export async function GET() {
  const db = supabaseServidor()
  if (!db) return NextResponse.json({ ok: true, items: RECURRENTES_BASE })

  const usuario = await usuarioActual()
  if (!usuario) return NextResponse.json({ ok: false, error: 'No autenticado' }, { status: 401 })

  const { data, error } = await db.from('recurrentes').select('*').order('dia', { ascending: true })
  if (error || !data?.length) return NextResponse.json({ ok: true, items: RECURRENTES_BASE, porDefecto: true })
  return NextResponse.json({ ok: true, items: data })
}
