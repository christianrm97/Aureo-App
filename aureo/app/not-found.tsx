import type { Metadata } from 'next'
import Link from 'next/link'
import { PieLegal } from '@/components/Legal'

export const metadata: Metadata = {
  title: 'Página no encontrada',
  description: 'Esta página no existe o ha cambiado de sitio.',
  robots: { index: false, follow: true },
}

export default function NoEncontrada() {
  return (
    <main className="min-h-screen grid place-items-center px-5" style={{ background: 'var(--aureo-bg)' }}>
      <div className="max-w-md w-full text-center">
        <div className="aureo-card p-8">
          <img src="/icono-192.png" alt="Aureo" width={72} height={72}
            className="mx-auto mb-4 rounded-[20px]" />
          <div className="tabular text-[46px] font-bold leading-none" style={{ color: 'var(--aureo-purple)' }}>404</div>
          <h1 className="text-[20px] font-semibold mt-2">Aquí no hay nada</h1>
          <p className="text-[14px] leading-relaxed mt-2" style={{ color: 'var(--aureo-text-dim)' }}>
            La página que buscas no existe o ha cambiado de sitio. Tus datos están intactos.
          </p>
          <Link href="/"
            className="pill-button inline-flex items-center justify-center w-full mt-6 text-white font-semibold"
            style={{ background: 'var(--aureo-purple)', height: 52, boxShadow: '0 10px 24px -8px rgba(108,43,217,0.5)' }}>
            Volver al inicio
          </Link>
        </div>
        <PieLegal />
      </div>
    </main>
  )
}
