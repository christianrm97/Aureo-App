'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { Cookie } from 'lucide-react'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'

const CLAVE = 'aureo-cookies'

/**
 * Consentimiento de cookies.
 *
 * Las de sesion son tecnicas y no se pueden rechazar sin romper el login, asi
 * que no se piden: la ley no lo exige para las estrictamente necesarias. Lo
 * que si se pide es la medicion de uso, y hasta que no la aceptas no se carga
 * el script. Rechazar es tan facil como aceptar, que es justo lo que suele
 * fallar en estos banners.
 */
export default function Cookies() {
  const [decision, setDecision] = useState(undefined)

  useEffect(() => {
    try {
      setDecision(window.localStorage.getItem(CLAVE) ?? null)
    } catch {
      setDecision('denegado') // navegacion privada: no medimos y no molestamos
    }
  }, [])

  const decidir = (valor) => {
    try { window.localStorage.setItem(CLAVE, valor) } catch {}
    setDecision(valor)
  }

  return (
    <>
      {decision === 'aceptado' && (
        <>
          <Analytics />
          <SpeedInsights />
        </>
      )}

      <AnimatePresence>
        {decision === null && (
          <motion.div
            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 24 }}
            transition={{ type: 'spring', stiffness: 260, damping: 28 }}
            role="dialog" aria-live="polite" aria-label="Aviso de cookies"
            className="fixed left-0 right-0 bottom-0 z-[80] p-3">
            <div className="max-w-md mx-auto rounded-[24px] p-5"
              style={{ background: '#fff', border: '1px solid var(--aureo-border)', boxShadow: '0 24px 50px -20px rgba(20,16,27,0.35)' }}>
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full grid place-items-center flex-shrink-0"
                  style={{ background: 'var(--aureo-purple-soft)' }}>
                  <Cookie className="w-4 h-4" style={{ color: 'var(--aureo-purple)' }} />
                </div>
                <div className="text-[12.5px] leading-snug" style={{ color: 'var(--aureo-text-dim)' }}>
                  Usamos cookies propias para mantener tu sesión iniciada, que son imprescindibles.
                  Solo si nos dejas, medimos el uso de la app de forma anónima para mejorarla.
                  Nunca para publicidad. Más en la{' '}
                  <Link href="/privacidad" className="underline" style={{ color: 'var(--aureo-purple)' }}>
                    política de privacidad
                  </Link>.
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-4">
                <button onClick={() => decidir('denegado')}
                  className="pill-button h-11 text-[13.5px] font-semibold"
                  style={{ background: 'var(--aureo-bg)', color: 'var(--aureo-text)' }}>
                  Solo las necesarias
                </button>
                <button onClick={() => decidir('aceptado')}
                  className="pill-button h-11 text-[13.5px] font-semibold text-white"
                  style={{ background: 'var(--aureo-purple)' }}>
                  Aceptar
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
