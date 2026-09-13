'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Share, Plus, X } from 'lucide-react'

const RECORDATORIO = 'aureo:instalar-oculto'

/**
 * En iOS no hay prompt de instalacion: Safari solo ofrece "Añadir a pantalla
 * de inicio" desde el menu de compartir, y el usuario no lo encuentra si nadie
 * se lo dice. Esta pista solo aparece en iPhone o iPad y fuera de la app ya
 * instalada; en cuanto se cierra, no vuelve.
 */
export default function InstalarIOS() {
  const [visible, setVisible] = useState(false)

  // La deteccion va en un efecto: en el servidor no hay navigator, y pintarlo
  // en el HTML inicial rompe la hidratacion.
  useEffect(() => {
    const ua = navigator.userAgent
    // iPadOS 13+ se anuncia como Macintosh; lo delata la pantalla tactil.
    const esIOS = /iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)
    if (!esIOS) return

    const instalada =
      window.navigator.standalone === true ||
      window.matchMedia('(display-mode: standalone)').matches
    if (instalada) return

    try {
      if (localStorage.getItem(RECORDATORIO)) return
    } catch {
      // Modo privado o cookies bloqueadas: se enseña igual, no es critico.
    }
    setVisible(true)
  }, [])

  if (!visible) return null

  const cerrar = () => {
    setVisible(false)
    try {
      localStorage.setItem(RECORDATORIO, '1')
    } catch {
      // Si no se puede recordar, volvera a salir. Preferible a no cerrarse.
    }
  }

  return (
    <motion.aside
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="aureo-card mt-4 p-4 flex items-start gap-3"
      style={{ background: '#EFE7FB', border: '1px solid rgba(108,43,217,0.18)' }}>
      <div className="flex-1 min-w-0">
        <div className="text-[14px] font-semibold">Ten Aureo a un toque</div>
        <p className="text-[13px] mt-1 leading-snug" style={{ color: 'var(--aureo-text-dim)' }}>
          Pulsa{' '}
          <Share className="w-3.5 h-3.5 inline-block -mt-0.5" aria-hidden="true" />{' '}
          <b style={{ color: 'var(--aureo-text)' }}>Compartir</b> en Safari y luego{' '}
          <Plus className="w-3.5 h-3.5 inline-block -mt-0.5" aria-hidden="true" />{' '}
          <b style={{ color: 'var(--aureo-text)' }}>Añadir a pantalla de inicio</b>. Se abrirá a
          pantalla completa, como una app.
        </p>
      </div>
      <button onClick={cerrar} aria-label="Ocultar el aviso de instalación"
        className="w-7 h-7 rounded-full grid place-items-center flex-shrink-0"
        style={{ background: 'rgba(255,255,255,0.7)' }}>
        <X className="w-3.5 h-3.5" style={{ color: 'var(--aureo-text-dim)' }} />
      </button>
    </motion.aside>
  )
}
