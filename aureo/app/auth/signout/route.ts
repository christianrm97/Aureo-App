import { NextResponse, type NextRequest } from 'next/server'
import { supabaseServidor } from '@/lib/supabase/servidor'

// POST /auth/signout — cerrar sesion. Es POST a proposito: un GET lo podria
// disparar cualquier imagen o enlace de otra web.
export async function POST(req: NextRequest) {
  const db = supabaseServidor()
  if (db) await db.auth.signOut()
  return NextResponse.redirect(new URL('/login', req.url), { status: 303 })
}
