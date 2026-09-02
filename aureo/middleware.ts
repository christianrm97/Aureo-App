import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

const PUBLICAS = ['/login', '/auth', '/api/health', '/api/logo', '/api/noticias', '/api/precios']

/**
 * Refresca la sesion en cada peticion y protege lo privado. Sin esto los
 * tokens caducan a la hora y el usuario se ve fuera sin motivo.
 */
export async function middleware(req: NextRequest) {
  let res = NextResponse.next({ request: req })

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  // Sin Supabase configurado no se puede autenticar a nadie: se deja pasar y
  // la propia pantalla de login explica que falta por configurar.
  if (!url || !anonKey) return res

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll: () => req.cookies.getAll(),
      setAll: (nuevas) => {
        nuevas.forEach(({ name, value }) => req.cookies.set(name, value))
        res = NextResponse.next({ request: req })
        nuevas.forEach(({ name, value, options }) => res.cookies.set(name, value, options))
      },
    },
  })

  const { data: { user } } = await supabase.auth.getUser()
  const ruta = req.nextUrl.pathname
  const esPublica = PUBLICAS.some((p) => ruta === p || ruta.startsWith(p + '/'))

  if (!user && !esPublica) {
    // El Atajo de iPhone no tiene cookies: se identifica con su token y lo
    // valida la propia ruta, asi que no se le redirige a una pantalla de login.
    if (ruta.startsWith('/api/')) {
      if (req.headers.get('authorization')?.startsWith('Bearer ')) return res
      return NextResponse.json({ ok: false, error: 'No autenticado' }, { status: 401 })
    }
    const destino = req.nextUrl.clone()
    destino.pathname = '/login'
    destino.searchParams.set('volver', ruta)
    return NextResponse.redirect(destino)
  }

  if (user && ruta === '/login') {
    const destino = req.nextUrl.clone()
    destino.pathname = '/'
    destino.search = ''
    return NextResponse.redirect(destino)
  }

  return res
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
