import { NextResponse } from 'next/server'
import { supabaseAdmin, USER_ID } from '@/lib/supabase'
import { RECURRENTES_BASE } from '@/lib/recurrentes'

export const dynamic = 'force-dynamic'

/**
 * GET /api/recurrentes
 *
 * Con la tabla vacia devuelve los fijos del codigo, pero NO los inserta: la
 * app dispara varias peticiones al cargar y todas veian la tabla vacia a la
 * vez, asi que cada una sembraba su copia (36 filas = 6 seeds x 6 fijos).
 * Sirviendolos como configuracion no hay carrera que perder.
 */
export async function GET() {
  const db = supabaseAdmin()
  if (!db) return NextResponse.json({ ok: true, items: RECURRENTES_BASE })

  const { data, error } = await db
    .from('recurrentes')
    .select('*')
    .eq('user_id', USER_ID)
    .order('dia', { ascending: true })

  if (error || !data?.length) return NextResponse.json({ ok: true, items: RECURRENTES_BASE })
  return NextResponse.json({ ok: true, items: data })
}
