import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, USER_ID } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

// DELETE /api/gastos/:id
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const db = supabaseAdmin()
  if (!db) return NextResponse.json({ ok: false, error: 'Supabase sin configurar' }, { status: 503 })

  const { error } = await db.from('gastos').delete().eq('id', params.id).eq('user_id', USER_ID)
  if (error) return NextResponse.json({ ok: false, error: 'Error borrando gasto' }, { status: 500 })
  return NextResponse.json({ ok: true })
}
