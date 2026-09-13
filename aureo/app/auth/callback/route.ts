import { NextResponse, type NextRequest } from 'next/server'
import { supabaseServidor } from '@/lib/supabase/servidor'

/**
 * Vuelta de Google: se cambia el `code` por una sesion y se deja la cookie.
 * Supabase manda aqui tras autenticar.
 */
export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url)
  const code = searchParams.get('code')
  const volver = searchParams.get('volver') ?? '/'
  const error = searchParams.get('error_description') ?? searchParams.get('error')

  if (error) {
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error)}`)
  }
  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent('Falta el código de Google')}`)
  }

  const db = supabaseServidor()
  if (!db) return NextResponse.redirect(`${origin}/login?error=sin-configurar`)

  const { error: fallo } = await db.auth.exchangeCodeForSession(code)
  if (fallo) {
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(fallo.message)}`)
  }

  // Solo rutas internas: un `volver` con dominio ajeno seria un open redirect.
  const destino = volver.startsWith('/') && !volver.startsWith('//') ? volver : '/'
  return NextResponse.redirect(`${origin}${destino}`)
}
