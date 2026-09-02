import { NextRequest, NextResponse } from 'next/server'
import { supabaseServidor, usuarioActual } from '@/lib/supabase/servidor'

type Validador<T> = (body: unknown) => { valor: T } | { error: string }

const SIN_SESION = NextResponse.json({ ok: false, error: 'No autenticado' }, { status: 401 })
const SIN_DB = NextResponse.json({ ok: false, error: 'Supabase sin configurar' }, { status: 503 })

/**
 * Suscripciones, recibos, deudas, ingresos y cuentas son la misma tabla con
 * otro nombre. Una fabrica en vez de cinco rutas iguales.
 *
 * Las consultas van con la sesion del usuario, no con la service role: quien
 * decide que filas se ven es RLS en la base de datos, no este codigo. Aunque
 * un dia se olvide un filtro, Postgres no deja leer lo de otro.
 */
export function coleccion<T extends object>(tabla: string, orden: string, validar: Validador<T>) {
  return {
    async GET() {
      const db = supabaseServidor()
      if (!db) return SIN_DB
      const usuario = await usuarioActual()
      if (!usuario) return SIN_SESION

      const { data, error } = await db.from(tabla).select('*').order(orden, { ascending: true })
      if (error) return NextResponse.json({ ok: false, error: `Error cargando ${tabla}` }, { status: 500 })
      return NextResponse.json({ ok: true, items: data })
    },

    async POST(req: NextRequest) {
      const db = supabaseServidor()
      if (!db) return SIN_DB
      const usuario = await usuarioActual()
      if (!usuario) return SIN_SESION

      let body: unknown
      try {
        body = await req.json()
      } catch {
        return NextResponse.json({ ok: false, error: 'Body inválido' }, { status: 400 })
      }

      const validado = validar(body)
      if ('error' in validado) return NextResponse.json({ ok: false, error: validado.error }, { status: 422 })

      const { data, error } = await db
        .from(tabla)
        .insert({ user_id: usuario.id, ...validado.valor })
        .select()
        .single()

      if (error) return NextResponse.json({ ok: false, error: `Error guardando en ${tabla}` }, { status: 500 })
      return NextResponse.json({ ok: true, item: data })
    },

    async DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
      const db = supabaseServidor()
      if (!db) return SIN_DB
      const usuario = await usuarioActual()
      if (!usuario) return SIN_SESION

      const { error } = await db.from(tabla).delete().eq('id', params.id)
      if (error) return NextResponse.json({ ok: false, error: `Error borrando de ${tabla}` }, { status: 500 })
      return NextResponse.json({ ok: true })
    },

    async PATCH(req: NextRequest, { params }: { params: { id: string } }) {
      const db = supabaseServidor()
      if (!db) return SIN_DB
      const usuario = await usuarioActual()
      if (!usuario) return SIN_SESION

      let body: unknown
      try {
        body = await req.json()
      } catch {
        return NextResponse.json({ ok: false, error: 'Body inválido' }, { status: 400 })
      }

      const validado = validar(body)
      if ('error' in validado) return NextResponse.json({ ok: false, error: validado.error }, { status: 422 })

      const { data, error } = await db
        .from(tabla)
        .update(validado.valor)
        .eq('id', params.id)
        .select()
        .single()

      if (error) return NextResponse.json({ ok: false, error: `Error actualizando ${tabla}` }, { status: 500 })
      return NextResponse.json({ ok: true, item: data })
    },
  }
}

/** Numero > 0 y con tope, que es lo que piden todos los importes de la app. */
export function importeValido(valor: unknown, tope = 1_000_000): number | null {
  const n = typeof valor === 'string' ? Number(valor.replace(',', '.')) : valor
  if (typeof n !== 'number' || !Number.isFinite(n) || n <= 0 || n > tope) return null
  return Math.round(n * 100) / 100
}

export function textoValido(valor: unknown, max = 80): string | null {
  if (typeof valor !== 'string') return null
  const t = valor.trim()
  return t.length > 0 && t.length <= max ? t : null
}

export function diaValido(valor: unknown): number | null {
  const n = Number(valor)
  return Number.isInteger(n) && n >= 1 && n <= 31 ? n : null
}
