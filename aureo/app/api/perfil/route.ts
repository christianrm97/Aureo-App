import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'node:crypto'
import { supabaseServidor, usuarioActual } from '@/lib/supabase/servidor'
import { OBJETIVO, FONDO_EMERGENCIA } from '@/lib/perfil'

export const dynamic = 'force-dynamic'

/**
 * Perfil del usuario: su objetivo, su colchon y el token con el que el Atajo
 * de iPhone mete gastos sin sesion de navegador. Se crea solo la primera vez
 * que entras.
 */
export async function GET() {
  const db = supabaseServidor()
  if (!db) return NextResponse.json({ ok: false, error: 'Supabase sin configurar' }, { status: 503 })

  const usuario = await usuarioActual()
  if (!usuario) return NextResponse.json({ ok: false, error: 'No autenticado' }, { status: 401 })

  const { data } = await db.from('perfiles').select('*').eq('id', usuario.id).maybeSingle()

  if (data) return NextResponse.json({ ok: true, perfil: data, usuario: publico(usuario) })

  // Primera visita: se crea el perfil con los valores por defecto.
  const { data: creado, error } = await db
    .from('perfiles')
    .insert({
      id: usuario.id,
      nombre: usuario.user_metadata?.full_name ?? usuario.email?.split('@')[0] ?? 'Yo',
      objetivo: OBJETIVO,
      fondo_emergencia: FONDO_EMERGENCIA,
      shortcut_token: randomBytes(24).toString('base64url'),
    })
    .select()
    .single()

  if (error) return NextResponse.json({ ok: false, error: 'No se pudo crear el perfil' }, { status: 500 })
  return NextResponse.json({ ok: true, perfil: creado, usuario: publico(usuario) })
}

// PATCH /api/perfil — cambiar objetivo, colchon o nombre
export async function PATCH(req: NextRequest) {
  const db = supabaseServidor()
  if (!db) return NextResponse.json({ ok: false, error: 'Supabase sin configurar' }, { status: 503 })

  const usuario = await usuarioActual()
  if (!usuario) return NextResponse.json({ ok: false, error: 'No autenticado' }, { status: 401 })

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'Body inválido' }, { status: 400 })
  }

  const cambios: Record<string, unknown> = {}
  for (const campo of ['objetivo', 'fondo_emergencia'] as const) {
    if (body[campo] === undefined) continue
    const n = Number(body[campo])
    if (!Number.isFinite(n) || n < 0 || n > 100_000_000) {
      return NextResponse.json({ ok: false, error: `${campo} inválido` }, { status: 422 })
    }
    cambios[campo] = Math.round(n * 100) / 100
  }
  if (typeof body.nombre === 'string' && body.nombre.trim()) {
    cambios.nombre = body.nombre.trim().slice(0, 60)
  }
  if (typeof body.fecha_objetivo === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(body.fecha_objetivo)) {
    cambios.fecha_objetivo = body.fecha_objetivo
  }
  // Regenerar el token invalida el Atajo anterior: solo si se pide expresamente
  if (body.regenerar_token === true) cambios.shortcut_token = randomBytes(24).toString('base64url')

  if (!Object.keys(cambios).length) {
    return NextResponse.json({ ok: false, error: 'Nada que actualizar' }, { status: 422 })
  }

  const { data, error } = await db.from('perfiles').update(cambios).eq('id', usuario.id).select().single()
  if (error) return NextResponse.json({ ok: false, error: 'No se pudo guardar' }, { status: 500 })
  return NextResponse.json({ ok: true, perfil: data })
}

/** Lo minimo del usuario que la app necesita pintar. */
function publico(u: { id: string; email?: string; user_metadata?: Record<string, unknown> }) {
  return {
    id: u.id,
    email: u.email ?? null,
    nombre: (u.user_metadata?.full_name as string) ?? (u.email?.split('@')[0] ?? 'Yo'),
    avatar: (u.user_metadata?.avatar_url as string) ?? null,
  }
}
