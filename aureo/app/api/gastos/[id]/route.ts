import { NextResponse } from 'next/server'
import { supabaseServidor, usuarioActual } from '@/lib/supabase/servidor'

export const dynamic = 'force-dynamic'

// DELETE /api/gastos/:id
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const db = supabaseServidor()
  if (!db) return NextResponse.json({ ok: false, error: 'Supabase sin configurar' }, { status: 503 })

  const usuario = await usuarioActual()
  if (!usuario) return NextResponse.json({ ok: false, error: 'No autenticado' }, { status: 401 })

  const { error } = await db.from('gastos').delete().eq('id', params.id)
  if (error) return NextResponse.json({ ok: false, error: 'Error borrando gasto' }, { status: 500 })
  return NextResponse.json({ ok: true })
}
