import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// POST /api/gastos
// Llamado desde el Atajo de iPhone
// Headers: { Authorization: 'Bearer <SHORTCUT_SECRET>' }
// Body: { nota, importe, categoria, user_id }
export async function POST(req: NextRequest) {
  // 1. Verificar token secreto
  const auth = req.headers.get('authorization')
  const secret = process.env.SHORTCUT_SECRET
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  // 2. Parsear body
  let body: { nota: string; importe: number; categoria: string; user_id: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 })
  }

  const { nota, importe, categoria, user_id } = body

  if (!nota || !importe || !categoria || !user_id) {
    return NextResponse.json({ error: 'Faltan campos: nota, importe, categoria, user_id' }, { status: 422 })
  }

  // 3. Insertar gasto en Supabase
  const db = supabaseAdmin()
  const { data, error } = await db
    .from('gastos')
    .insert({
      user_id,
      nota,
      importe: Number(importe),
      categoria,
      desde_atajo: true,
      fecha: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) {
    console.error('Error Supabase:', error)
    return NextResponse.json({ error: 'Error guardando gasto' }, { status: 500 })
  }

  return NextResponse.json({
    ok: true,
    gasto: data,
    mensaje: `✅ Gasto de ${importe}€ en "${nota}" registrado`,
  })
}

// GET /api/gastos — listar gastos del mes actual
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const user_id = searchParams.get('user_id')
  const mes = searchParams.get('mes') // formato: '2026-08'

  if (!user_id) {
    return NextResponse.json({ error: 'user_id requerido' }, { status: 400 })
  }

  const db = supabaseAdmin()
  let query = db
    .from('gastos')
    .select('*')
    .eq('user_id', user_id)
    .order('fecha', { ascending: false })

  if (mes) {
    const inicio = `${mes}-01`
    const [anio, m] = mes.split('-').map(Number)
    const fin = new Date(anio, m, 0).toISOString().split('T')[0]
    query = query.gte('fecha', inicio).lte('fecha', fin + 'T23:59:59')
  }

  const { data, error } = await query.limit(100)

  if (error) return NextResponse.json({ error: 'Error cargando gastos' }, { status: 500 })

  return NextResponse.json({ gastos: data })
}
