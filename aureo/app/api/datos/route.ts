import { NextRequest, NextResponse } from 'next/server'
import { supabaseServidor, supabaseAdmin, usuarioActual } from '@/lib/supabase/servidor'
import { comprobarLimite, LIMITES } from '@/lib/limite'

export const dynamic = 'force-dynamic'

/** Todo lo que guarda Aureo de un usuario, ademas de su perfil. */
const TABLAS = [
  'cuentas', 'gastos', 'recurrentes', 'suscripciones', 'recibos',
  'deudas', 'ingresos', 'proyectos', 'vigilante_informes',
] as const

/** Una tabla que aun no se ha creado con su SQL no debe bloquear la exportacion ni el borrado. */
const NO_EXISTE = new Set(['42P01', 'PGRST205'])

/**
 * GET /api/datos — descarga todos tus datos en JSON (derecho de portabilidad).
 *
 * El token del Atajo no se exporta: es una credencial, y un archivo descargado
 * acaba en carpetas compartidas y copias de seguridad.
 */
export async function GET(req: NextRequest) {
  const frenado = comprobarLimite(req, 'datos', LIMITES.escritura)
  if (frenado) return frenado

  const db = supabaseServidor()
  if (!db) return NextResponse.json({ ok: false, error: 'Supabase sin configurar' }, { status: 503 })
  const usuario = await usuarioActual()
  if (!usuario) return NextResponse.json({ ok: false, error: 'No autenticado' }, { status: 401 })

  const datos: Record<string, unknown> = {}
  for (const tabla of TABLAS) {
    // Con la sesion del usuario: RLS garantiza que solo salen sus filas.
    const { data, error } = await db.from(tabla).select('*')
    if (!error) datos[tabla] = data
    else if (!NO_EXISTE.has(error.code)) {
      return NextResponse.json({ ok: false, error: `No se pudo exportar ${tabla}` }, { status: 500 })
    }
  }

  const { data: perfil } = await db
    .from('perfiles')
    .select('nombre, objetivo, fondo_emergencia, fecha_objetivo, created_at')
    .eq('id', usuario.id)
    .maybeSingle()

  const hoy = new Date().toISOString().slice(0, 10)
  const cuerpo = {
    exportado: new Date().toISOString(),
    servicio: 'Aureo',
    usuario: { id: usuario.id, email: usuario.email ?? null },
    perfil,
    ...datos,
  }

  return new NextResponse(JSON.stringify(cuerpo, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="aureo-datos-${hoy}.json"`,
      'Cache-Control': 'no-store',
    },
  })
}

/**
 * DELETE /api/datos — elimina la cuenta y todos sus datos (derecho de supresion).
 * Exige { "confirmar": "ELIMINAR" } en el cuerpo: no se borra nada por un clic
 * accidental ni por una peticion que no lo pida expresamente.
 */
export async function DELETE(req: NextRequest) {
  const frenado = comprobarLimite(req, 'datos', LIMITES.escritura)
  if (frenado) return frenado

  const db = supabaseServidor()
  if (!db) return NextResponse.json({ ok: false, error: 'Supabase sin configurar' }, { status: 503 })
  const usuario = await usuarioActual()
  if (!usuario) return NextResponse.json({ ok: false, error: 'No autenticado' }, { status: 401 })

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'Body inválido' }, { status: 400 })
  }
  if ((body as { confirmar?: unknown })?.confirmar !== 'ELIMINAR') {
    return NextResponse.json({ ok: false, error: 'Escribe ELIMINAR para confirmar' }, { status: 422 })
  }

  // Borrar el usuario de auth necesita la service role. Se comprueba antes de
  // tocar nada: mejor no empezar que dejar la cuenta a medio borrar.
  const admin = supabaseAdmin()
  if (!admin) return NextResponse.json({ ok: false, error: 'No se puede eliminar la cuenta ahora mismo' }, { status: 503 })

  // Las filas se borran con la sesion del usuario: RLS impide tocar las de otro.
  for (const tabla of TABLAS) {
    const { error } = await db.from(tabla).delete().eq('user_id', usuario.id)
    if (error && !NO_EXISTE.has(error.code)) {
      return NextResponse.json({ ok: false, error: `No se pudo borrar ${tabla}. Tu cuenta sigue intacta, inténtalo otra vez.` }, { status: 500 })
    }
  }

  // El perfil cae en cascada con el usuario (perfiles.id references auth.users on delete cascade).
  const { error } = await admin.auth.admin.deleteUser(usuario.id)
  if (error) return NextResponse.json({ ok: false, error: 'Tus datos se han borrado, pero no la cuenta. Escríbenos.' }, { status: 500 })

  // La sesion ya no vale: se limpian las cookies para no dejar un usuario fantasma.
  await db.auth.signOut().catch(() => {})
  return NextResponse.json({ ok: true })
}
