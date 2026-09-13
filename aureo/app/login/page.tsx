import type { Metadata } from 'next'
import Login from '@/components/Login'

export const metadata: Metadata = {
  title: 'Entrar en Aureo',
  description: 'Tu patrimonio en vivo, tus gastos y tu objetivo en un solo sitio.',
}

export default function PaginaLogin({
  searchParams,
}: {
  searchParams: { error?: string; volver?: string }
}) {
  const configurado = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  )
  return <Login configurado={configurado} error={searchParams.error} volver={searchParams.volver ?? '/'} />
}
