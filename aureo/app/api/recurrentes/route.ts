import { NextResponse } from 'next/server'
import { supabaseServidor, usuarioActual } from '@/lib/supabase/servidor'

export const dynamic = 'force-dynamic'

/**
 * GET /api/recurrentes — ingresos y gastos fijos del usuario.
 *
 * Una tabla vacia devuelve una lista vacia: la app no inventa movimientos que
 * no son del usuario, porque descuadrarian su patrimonio y su proyeccion.
 */
export async function GET() {
  const db = supabaseServidor()
  if (!db) return NextResponse.json({ ok: false, error: 'Supabase sin configurar' }, { status: 503 })

  const usuario = await usuarioActual()
  if (!usuario) return NextResponse.json({ ok: false, error: 'No autenticado' }, { status: 401 })

  const { data, error } = await db.from('recurrentes').select('*').order('dia', { ascending: true })
  if (error) return NextResponse.json({ ok: false, error: 'Error cargando recurrentes' }, { status: 500 })
  return NextResponse.json({ ok: true, items: data ?? [] })
}
