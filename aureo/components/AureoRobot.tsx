'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'

type Variant = 'gold' | 'lavanda'
export type Humor = 'feliz' | 'pensando' | 'alerta' | 'celebrando'

interface Props {
  size?: number
  className?: string
  variant?: Variant
  /** Reacciona al puntero y al clic. Desactivalo en adornos de fondo. */
  vivo?: boolean
  humor?: Humor
}

const VARIANTS: Record<Variant, Record<string, string>> = {
  gold: {
    body0: '#FFE082', body1: '#F9A825', body2: '#C77C00',
    shine0: '#FFF8E1', shadowColor: '#C77C00',
  },
  lavanda: {
    body0: '#EFE7FB', body1: '#C4B5D4', body2: '#9B8AB0',
    shine0: '#FFFFFF', shadowColor: '#6C2BD9',
  },
}

const BOCA: Record<Humor, string> = {
  feliz:      'M50 72 Q60 78 70 72',
  pensando:   'M52 74 Q60 71 68 74',
  alerta:     'M52 75 Q60 69 68 75',
  celebrando: 'M48 71 Q60 81 72 71',
}

const OJO: Record<Humor, string> = {
  feliz: '#c084fc', pensando: '#a78bfa', alerta: '#fbbf24', celebrando: '#4ade80',
}

/**
 * Avatar de Aureo. Sin `vivo` es un SVG estatico; con `vivo` respira, parpadea,
 * sigue al puntero con la mirada y da un brinco al tocarlo.
 */
export default function AureoRobot({
  size = 120,
  className = '',
  variant = 'lavanda',
  vivo = false,
  humor = 'feliz',
}: Props) {
  const id = `ar-${variant}`
  const v = VARIANTS[variant]
  const sinMovimiento = useReducedMotion()
  const animar = vivo && !sinMovimiento

  const ref = useRef<SVGSVGElement>(null)
  const [mirada, setMirada] = useState({ x: 0, y: 0 })
  const [parpadea, setParpadea] = useState(false)
  const [saltando, setSaltando] = useState(false)

  // La mirada sigue al puntero, con un recorrido de +-3px sobre el viewBox
  useEffect(() => {
    if (!animar) return
    const mover = (e: PointerEvent) => {
      const el = ref.current
      if (!el) return
      const r = el.getBoundingClientRect()
      const dx = (e.clientX - (r.left + r.width / 2)) / Math.max(r.width, 1)
      const dy = (e.clientY - (r.top + r.height / 2)) / Math.max(r.height, 1)
      const tope = (n: number) => Math.max(-3, Math.min(3, n * 6))
      setMirada({ x: tope(dx), y: tope(dy) })
    }
    window.addEventListener('pointermove', mover)
    return () => window.removeEventListener('pointermove', mover)
  }, [animar])

  // Parpadeo con intervalo irregular: el ritmo fijo delata que es un bucle
  useEffect(() => {
    if (!animar) return
    let t: ReturnType<typeof setTimeout>
    const ciclo = () => {
      t = setTimeout(() => {
        setParpadea(true)
        setTimeout(() => setParpadea(false), 130)
        ciclo()
      }, 2200 + Math.random() * 3200)
    }
    ciclo()
    return () => clearTimeout(t)
  }, [animar])

  const saltar = () => {
    if (!animar || saltando) return
    setSaltando(true)
    setTimeout(() => setSaltando(false), 620)
  }

  return (
    <motion.svg
      ref={ref}
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role={vivo ? 'img' : undefined}
      aria-label={vivo ? 'Aureo, tu asistente' : undefined}
      aria-hidden={vivo ? undefined : 'true'}
      onTap={saltar}
      style={{ cursor: animar ? 'pointer' : undefined }}
      animate={
        animar
          ? saltando
            ? { y: [0, -10, 0, -4, 0], rotate: [0, -6, 6, -2, 0] }
            : { y: [0, -3, 0], rotate: [0, 1.2, 0, -1.2, 0] }
          : undefined
      }
      transition={
        saltando
          ? { duration: 0.6, ease: 'easeOut' }
          : { duration: 5.5, repeat: Infinity, ease: 'easeInOut' }
      }
    >
      <defs>
        <linearGradient id={`${id}-body`} x1="20" y1="30" x2="100" y2="110" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={v.body0} />
          <stop offset="45%" stopColor={v.body1} />
          <stop offset="100%" stopColor={v.body2} />
        </linearGradient>
        <linearGradient id={`${id}-shine`} x1="20" y1="40" x2="60" y2="80" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={v.shine0} stopOpacity="0.7" />
          <stop offset="100%" stopColor={v.shine0} stopOpacity="0" />
        </linearGradient>
        <linearGradient id={`${id}-screen`} x1="38" y1="50" x2="82" y2="80" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#3D1A80" />
          <stop offset="100%" stopColor="#1a0840" />
        </linearGradient>
        <radialGradient id={`${id}-eye-${humor}`} cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#e9d5ff" />
          <stop offset="50%" stopColor={OJO[humor]} />
          <stop offset="100%" stopColor="#7c3aed" />
        </radialGradient>
        <filter id={`${id}-shadow`} x="-20%" y="-10%" width="140%" height="140%">
          <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor={v.shadowColor} floodOpacity="0.30" />
        </filter>
        <radialGradient id={`${id}-ant`} cx="50%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#c084fc" />
          <stop offset="100%" stopColor="#7c3aed" />
        </radialGradient>
      </defs>

      {/* Antena */}
      <rect x="58" y="8" width="4" height="16" rx="2" fill={`url(#${id}-body)`} />
      {/* El latido va por opacity y scale, nunca por `r`: Framer no puede leer
          el valor inicial de un atributo SVG geometrico y escribe
          r="undefined" en el primer frame. scale es un transform y siempre
          tiene origen conocido. */}
      <motion.circle
        cx="60" cy="7" r={5} fill={`url(#${id}-ant)`}
        style={{ transformOrigin: '60px 7px' }}
        animate={animar ? { opacity: [1, 0.55, 1], scale: [1, 1.12, 1] } : { opacity: 1 }}
        transition={animar ? { duration: 2.4, repeat: Infinity, ease: 'easeInOut' } : { duration: 0 }}
      />

      {/* Orejas */}
      <rect x="16" y="54" width="8" height="14" rx="4" fill={`url(#${id}-body)`} filter={`url(#${id}-shadow)`} />
      <rect x="96" y="54" width="8" height="14" rx="4" fill={`url(#${id}-body)`} filter={`url(#${id}-shadow)`} />

      {/* Cabeza + cuerpo */}
      <rect x="22" y="24" width="76" height="72" rx="18" fill={`url(#${id}-body)`} filter={`url(#${id}-shadow)`} />
      <rect x="22" y="24" width="76" height="72" rx="18" fill={`url(#${id}-shine)`} />

      {/* Pantalla */}
      <rect x="34" y="44" width="52" height="36" rx="8" fill="#1a0840" opacity="0.9" />
      <rect x="36" y="46" width="48" height="32" rx="7" fill={`url(#${id}-screen)`} />

      {/* Cara: se desplaza con la mirada */}
      <g transform={`translate(${mirada.x} ${mirada.y})`}>
        {parpadea ? (
          <>
            <rect x="42" y="61" width="14" height="2.5" rx="1.25" fill={OJO[humor]} />
            <rect x="64" y="61" width="14" height="2.5" rx="1.25" fill={OJO[humor]} />
          </>
        ) : (
          <>
            <circle cx="49" cy="62" r="7" fill={`url(#${id}-eye-${humor})`} />
            <circle cx="71" cy="62" r="7" fill={`url(#${id}-eye-${humor})`} />
            <circle cx="46" cy="59" r="2" fill="white" opacity="0.6" />
            <circle cx="68" cy="59" r="2" fill="white" opacity="0.6" />
          </>
        )}
        <path d={BOCA[humor]} stroke="white" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.75" />
      </g>

      {/* Pies */}
      <rect x="34" y="93" width="18" height="10" rx="5" fill={`url(#${id}-body)`} />
      <rect x="68" y="93" width="18" height="10" rx="5" fill={`url(#${id}-body)`} />
    </motion.svg>
  )
}
