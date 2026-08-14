import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

/** Usuario único mientras no haya auth. */
export const USER_ID = 'christian'

/** ¿Hay Supabase configurado? Si no, la app funciona en modo solo-lectura. */
export const hayDB = Boolean(url && serviceKey)

/** Cliente de navegador (realtime). `null` hasta que existan las env vars. */
export const supabase: SupabaseClient | null =
  url && anonKey
    ? createClient(url, anonKey, { realtime: { params: { eventsPerSecond: 10 } } })
    : null

/** Cliente server-side con service role. `null` si falta configuración. */
export function supabaseAdmin(): SupabaseClient | null {
  if (!url || !serviceKey) return null
  return createClient(url, serviceKey, { auth: { persistSession: false } })
}
