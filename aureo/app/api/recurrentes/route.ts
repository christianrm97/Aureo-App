import { NextResponse } from 'next/server'
import { supabaseAdmin, USER_ID } from '@/lib/supabase'
import { RECURRENTES_BASE } from '@/lib/recurrentes'

export const dynamic = 'force-dynamic'

// GET /api/recurrentes — si la tabla esta vacia (o no hay DB), devuelve los fijos
export async function GET() {
  const db = supabaseAdmin()
  if (!db) return NextResponse.json({ ok: true, items: RECURRENTES_BASE })

  const { data, error } = await db
    .from('recurrentes')
    .select('*')
    .eq('user_id', USER_ID)
    .order('dia', { ascending: true })

  if (error) return NextResponse.json({ ok: true, items: RECURRENTES_BASE })
  if (!data?.length) {
    const seed = RECURRENTES_BASE.map(({ id, ...r }) => ({ ...r, user_id: USER_ID }))
    const { data: creados } = await db.from('recurrentes').insert(seed).select()
    return NextResponse.json({ ok: true, items: creados ?? RECURRENTES_BASE })
  }

  return NextResponse.json({ ok: true, items: data })
}
