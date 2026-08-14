import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, USER_ID } from '@/lib/supabase'

type Validador<T> = (body: unknown) => { valor: T } | { error: string }

/**
 * Suscripciones, recibos y deudas son la misma tabla con otro nombre: listar,
 * crear y borrar filas del usuario. Una fabrica en vez de tres rutas iguales.
 */
export function coleccion<T extends object>(tabla: string, orden: string, validar: Validador<T>) {
  return {
    async GET() {
      const db = supabaseAdmin()
      if (!db) return NextResponse.json({ ok: true, items: [] })

      const { data, error } = await db
        .from(tabla)
        .select('*')
        .eq('user_id', USER_ID)
        .order(orden, { ascending: true })

      if (error) return NextResponse.json({ ok: false, error: `Error cargando ${tabla}` }, { status: 500 })
      return NextResponse.json({ ok: true, items: data })
    },

    async POST(req: NextRequest) {
      let body: unknown
      try {
        body = await req.json()
      } catch {
        return NextResponse.json({ ok: false, error: 'Body inválido' }, { status: 400 })
      }

      const validado = validar(body)
      if ('error' in validado) return NextResponse.json({ ok: false, error: validado.error }, { status: 422 })

      const db = supabaseAdmin()
      if (!db) return NextResponse.json({ ok: false, error: 'Supabase sin configurar' }, { status: 503 })

      const { data, error } = await db
        .from(tabla)
        .insert({ user_id: USER_ID, ...validado.valor })
        .select()
        .single()

      if (error) return NextResponse.json({ ok: false, error: `Error guardando en ${tabla}` }, { status: 500 })
      return NextResponse.json({ ok: true, item: data })
    },

    async DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
      const db = supabaseAdmin()
      if (!db) return NextResponse.json({ ok: false, error: 'Supabase sin configurar' }, { status: 503 })

      const { error } = await db.from(tabla).delete().eq('id', params.id).eq('user_id', USER_ID)
      if (error) return NextResponse.json({ ok: false, error: `Error borrando de ${tabla}` }, { status: 500 })
      return NextResponse.json({ ok: true })
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
