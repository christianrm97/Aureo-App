import type { Metadata } from 'next'
import Link from 'next/link'
import { PieLegal } from '@/components/Legal'

export const metadata: Metadata = {
  title: 'Gracias',
  description: 'Hemos recibido tu mensaje. Te respondemos en un plazo de 2 días laborables.',
  robots: { index: false, follow: true },
  alternates: { canonical: '/gracias' },
}

export default function Gracias() {
  return (
    <main className="min-h-screen grid place-items-center px-5" style={{ background: 'var(--aureo-bg)' }}>
      <div className="max-w-md w-full text-center">
        <div className="aureo-card p-8">
          <div className="w-16 h-16 rounded-full grid place-items-center mx-auto mb-4"
            style={{ background: '#DCFCE7' }}>
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M5 13l4 4L19 7" stroke="#22C55E" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h1 className="text-[24px] font-bold leading-tight">Gracias, recibido</h1>
          <p className="text-[14px] leading-relaxed mt-2.5" style={{ color: 'var(--aureo-text-dim)' }}>
            Te respondemos en un plazo de 2 días laborables al correo desde el que escribiste.
          </p>
          <Link href="/"
            className="pill-button inline-flex items-center justify-center w-full h-13 mt-6 text-white font-semibold"
            style={{ background: 'var(--aureo-purple)', height: 52, boxShadow: '0 10px 24px -8px rgba(108,43,217,0.5)' }}>
            Volver a Aureo
          </Link>
        </div>
        <PieLegal />
      </div>
    </main>
  )
}
