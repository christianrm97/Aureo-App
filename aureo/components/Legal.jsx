'use client'

import Link from 'next/link'
import { ChevronLeft, AlertTriangle } from 'lucide-react'
import { LEGAL, faltaPorRellenar } from '@/lib/legal'

/** Marca en amarillo lo que el responsable aun no ha rellenado. */
export function Dato({ valor }) {
  if (!faltaPorRellenar(valor)) return <span>{valor}</span>
  return (
    <mark className="px-1.5 py-0.5 rounded text-[13px] font-semibold"
      style={{ background: '#FEF3C7', color: '#92400E' }}>
      [pendiente de completar]
    </mark>
  )
}

/** Marco comun de las paginas de texto: cabecera, ancho de lectura y pie. */
export function PaginaLegal({ titulo, subtitulo, children }) {
  const incompleto = faltaPorRellenar(LEGAL.nif) || faltaPorRellenar(LEGAL.direccion)

  return (
    <main className="min-h-screen" style={{ background: 'var(--aureo-bg)' }}>
      <div className="max-w-2xl mx-auto px-5 py-8">
        <Link href="/" className="inline-flex items-center gap-1.5 text-[13px] font-medium mb-6"
          style={{ color: 'var(--aureo-purple)' }}>
          <ChevronLeft className="w-4 h-4" /> Volver a Aureo
        </Link>

        <h1 className="text-[28px] font-bold leading-tight tracking-tight">{titulo}</h1>
        {subtitulo && (
          <p className="text-[14px] mt-2" style={{ color: 'var(--aureo-text-dim)' }}>{subtitulo}</p>
        )}
        <p className="text-[12px] mt-1" style={{ color: 'var(--aureo-text-mute)' }}>
          Última actualización: {new Date(LEGAL.actualizado).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
        </p>

        {incompleto && (
          <div className="rounded-2xl p-4 mt-5 flex items-start gap-2.5"
            style={{ background: '#FEF3C7', border: '1px solid #FCD34D' }}>
            <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#92400E' }} />
            <div className="text-[12.5px] leading-snug" style={{ color: '#78350F' }}>
              Faltan datos del responsable (NIF y domicilio). Sin ellos este texto no cumple
              el RGPD. Se rellenan en <code>lib/legal.ts</code>.
            </div>
          </div>
        )}

        <div className="aureo-card mt-6 p-6 md:p-8 legal">{children}</div>

        <PieLegal />
      </div>
    </main>
  )
}

export function PieLegal() {
  return (
    <nav aria-label="Enlaces legales"
      className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 mt-8 mb-4 text-[12.5px]">
      {[
        { href: '/privacidad', texto: 'Privacidad' },
        { href: '/terminos', texto: 'Términos' },
        { href: '/contacto', texto: 'Contacto' },
      ].map((l) => (
        <Link key={l.href} href={l.href} style={{ color: 'var(--aureo-text-dim)' }} className="hover:underline">
          {l.texto}
        </Link>
      ))}
      <span style={{ color: 'var(--aureo-text-mute)' }}>
        © {new Date().getFullYear()} {LEGAL.servicio}
      </span>
    </nav>
  )
}
