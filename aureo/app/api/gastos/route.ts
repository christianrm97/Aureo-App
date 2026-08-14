import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, USER_ID } from '@/lib/supabase'
import { validarGasto } from '@/lib/gastos'

export const dynamic = 'force-dynamic'

const SIN_DB = { ok: false, error: 'Supabase sin configurar' } as const

/** El Atajo de iPhone manda `Authorization: Bearer <SHORTCUT_SECRET>`. */
function esAtajo(req: NextRequest): boolean {
  const secret = process.env.SHORTCUT_SECRET
  return Boolean(secret) && req.headers.get('authorization') === `Bearer ${secret}`
}

// GET /api/gastos?limit=100
export async function GET(req: NextRequest) {
  const db = supabaseAdmin()
  if (!db) return NextResponse.json({ ok: true, items: [] })

  const limitParam = Number(new URL(req.url).searchParams.get('limit'))
  const limit = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(limitParam, 500) : 100

  const { data, error } = await db
    .from('gastos')
    .select('*')
    .eq('user_id', USER_ID)
    .order('ts', { ascending: false })
    .limit(limit)

  if (error) return NextResponse.json({ ok: false, error: 'Error cargando gastos' }, { status: 500 })
  return NextResponse.json({ ok: true, items: data })
}

// POST /api/gastos — desde la web o desde el Atajo de iPhone
export async function POST(req: NextRequest) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'Body inválido' }, { status: 400 })
  }

  const validado = validarGasto(body)
  if ('error' in validado) {
    return NextResponse.json({ ok: false, error: validado.error }, { status: 422 })
  }

  const db = supabaseAdmin()
  if (!db) return NextResponse.json(SIN_DB, { status: 503 })

  const { data, error } = await db
    .from('gastos')
    .insert({
      user_id: USER_ID,
      ...validado.gasto,
      source: esAtajo(req) ? 'shortcut' : 'web',
      ts: Date.now(),
    })
    .select()
    .single()

  if (error) return NextResponse.json({ ok: false, error: 'Error guardando gasto' }, { status: 500 })

  return NextResponse.json({
    ok: true,
    gasto: data,
    mensaje: `Gasto de ${validado.gasto.importe}€ registrado`,
  })
}

// DELETE /api/gastos — borra todo. Solo con el secreto: no es un boton de la UI.
export async function DELETE(req: NextRequest) {
  if (!esAtajo(req)) return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 401 })

  const db = supabaseAdmin()
  if (!db) return NextResponse.json(SIN_DB, { status: 503 })

  const { error } = await db.from('gastos').delete().eq('user_id', USER_ID)
  if (error) return NextResponse.json({ ok: false, error: 'Error borrando gastos' }, { status: 500 })
  return NextResponse.json({ ok: true })
}
