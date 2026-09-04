import { NextRequest, NextResponse } from 'next/server'
import { supabaseServidor, supabaseAdmin, usuarioActual } from '@/lib/supabase/servidor'
import { validarGasto } from '@/lib/gastos'
import { comprobarLimite, LIMITES } from '@/lib/limite'

export const dynamic = 'force-dynamic'

/**
 * El Atajo de iPhone no tiene cookies: manda `Authorization: Bearer <token>`
 * con el token personal del perfil. Se resuelve a que usuario pertenece y se
 * escribe en su nombre con la service role.
 *
 * El token se compara entero contra la tabla, no se acepta ninguno vacio.
 */
async function usuarioDelAtajo(req: NextRequest): Promise<string | null> {
  const cabecera = req.headers.get('authorization')
  if (!cabecera?.startsWith('Bearer ')) return null

  const token = cabecera.slice(7).trim()
  if (token.length < 20) return null

  const admin = supabaseAdmin()
  if (!admin) return null

  const { data } = await admin.from('perfiles').select('id').eq('shortcut_token', token).maybeSingle()
  return data?.id ?? null
}

// GET /api/gastos?limit=100
export async function GET(req: NextRequest) {
  const db = supabaseServidor()
  if (!db) return NextResponse.json({ ok: false, error: 'Supabase sin configurar' }, { status: 503 })

  const usuario = await usuarioActual()
  const idAtajo = usuario ? null : await usuarioDelAtajo(req)
  if (!usuario && !idAtajo) return NextResponse.json({ ok: false, error: 'No autenticado' }, { status: 401 })

  const limitParam = Number(new URL(req.url).searchParams.get('limit'))
  const limit = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(limitParam, 500) : 100

  // Con sesion manda RLS; con token del Atajo hay que filtrar a mano porque la
  // service role se salta las policies.
  if (idAtajo) {
    const admin = supabaseAdmin()!
    const { data, error } = await admin.from('gastos').select('*')
      .eq('user_id', idAtajo).order('ts', { ascending: false }).limit(limit)
    if (error) return NextResponse.json({ ok: false, error: 'Error cargando gastos' }, { status: 500 })
    return NextResponse.json({ ok: true, items: data })
  }

  const { data, error } = await db.from('gastos').select('*').order('ts', { ascending: false }).limit(limit)
  if (error) return NextResponse.json({ ok: false, error: 'Error cargando gastos' }, { status: 500 })
  return NextResponse.json({ ok: true, items: data })
}

// POST /api/gastos — desde la web (sesión) o desde el Atajo (token)
export async function POST(req: NextRequest) {
  // El Atajo entra sin sesion: hay que frenar la fuerza bruta sobre el token
  const frenado = comprobarLimite(req, 'gastos-post', LIMITES.atajo)
  if (frenado) return frenado

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

  const usuario = await usuarioActual()
  const idAtajo = usuario ? null : await usuarioDelAtajo(req)
  if (!usuario && !idAtajo) return NextResponse.json({ ok: false, error: 'No autenticado' }, { status: 401 })

  const fila = {
    user_id: usuario?.id ?? idAtajo!,
    ...validado.gasto,
    source: idAtajo ? 'shortcut' : 'web',
    ts: Date.now(),
  }

  const db = idAtajo ? supabaseAdmin() : supabaseServidor()
  if (!db) return NextResponse.json({ ok: false, error: 'Supabase sin configurar' }, { status: 503 })

  const { data, error } = await db.from('gastos').insert(fila).select().single()
  if (error) return NextResponse.json({ ok: false, error: 'Error guardando gasto' }, { status: 500 })

  return NextResponse.json({
    ok: true,
    gasto: data,
    mensaje: `Gasto de ${validado.gasto.importe}€ registrado`,
  })
}

// DELETE /api/gastos — vacia tus gastos. Solo con sesion: no es un boton de la UI.
export async function DELETE() {
  const db = supabaseServidor()
  if (!db) return NextResponse.json({ ok: false, error: 'Supabase sin configurar' }, { status: 503 })

  const usuario = await usuarioActual()
  if (!usuario) return NextResponse.json({ ok: false, error: 'No autenticado' }, { status: 401 })

  const { error } = await db.from('gastos').delete().eq('user_id', usuario.id)
  if (error) return NextResponse.json({ ok: false, error: 'Error borrando gastos' }, { status: 500 })
  return NextResponse.json({ ok: true })
}
