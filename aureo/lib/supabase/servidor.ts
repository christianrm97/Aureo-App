import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

export const hayDB = Boolean(url && anonKey)

/**
 * Cliente del servidor con la sesion del usuario. Todas las consultas viajan
 * con su JWT, asi que las policies de RLS deciden que filas puede tocar: si
 * el codigo tuviera un fallo de filtrado, la base de datos igual no le deja
 * leer lo de otro.
 */
export function supabaseServidor() {
  if (!url || !anonKey) return null
  const store = cookies()

  return createServerClient(url, anonKey, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (nuevas) => {
        try {
          nuevas.forEach(({ name, value, options }) => store.set(name, value, options))
        } catch {
          // Un Server Component no puede escribir cookies. No pasa nada: el
          // middleware ya refresco la sesion antes de llegar aqui.
        }
      },
    },
  })
}

/**
 * Service role: se salta RLS. Solo para lo que no tiene sesion de navegador,
 * hoy unicamente el Atajo de iPhone, que se identifica con su propio token.
 */
export function supabaseAdmin(): SupabaseClient | null {
  if (!url || !serviceKey) return null
  return createClient(url, serviceKey, { auth: { persistSession: false } })
}

/** Usuario de la peticion, ya verificado contra Supabase. `null` si no hay. */
export async function usuarioActual() {
  const db = supabaseServidor()
  if (!db) return null
  // getUser() valida el token contra el servidor. getSession() se fia de la
  // cookie, que el cliente puede manipular: aqui no vale.
  const { data, error } = await db.auth.getUser()
  return error ? null : data.user
}
