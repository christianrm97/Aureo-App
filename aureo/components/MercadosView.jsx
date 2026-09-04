'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, RefreshCw, Radio } from 'lucide-react'
import { GRUPOS, formatearPrecio } from '@/lib/mercados'
import { api, PageHeader, Vacio } from './ui'

const REFRESCO_MS = 30_000

/** Linea de tendencia dibujada a mano: 16 graficas de Recharts serian mucho. */
function Sparkline({ serie, color, ancho = 64, alto = 26 }) {
  if (!serie || serie.length < 2) return <div style={{ width: ancho, height: alto }} />
  const min = Math.min(...serie)
  const max = Math.max(...serie)
  const rango = max - min || 1
  const puntos = serie
    .map((v, i) => {
      const x = (i / (serie.length - 1)) * ancho
      const y = alto - ((v - min) / rango) * (alto - 3) - 1.5
      return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')

  return (
    <svg width={ancho} height={alto} viewBox={`0 0 ${ancho} ${alto}`} aria-hidden="true" className="flex-shrink-0">
      <polyline points={puntos} fill="none" stroke={color} strokeWidth="1.6"
        strokeLinecap="round" strokeLinejoin="round" opacity="0.9" />
    </svg>
  )
}

export default function MercadosView({ onBack }) {
  const [datos, setDatos] = useState(null)
  const [grupo, setGrupo] = useState('indices')
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const vivo = useRef(true)

  const cargar = async (silencioso = false) => {
    if (!silencioso) setCargando(true)
    const r = await api('precios').catch(() => null)
    if (r?.data) { setDatos(r); setError(null) }
    else if (!silencioso) setError('No se pudieron cargar las cotizaciones')
    setCargando(false)
  }

  useEffect(() => {
    cargar()
    // Refresco continuo, pero solo con la pestana visible: en segundo plano no
    // sirve de nada y gasta bateria y peticiones.
    const tick = () => { if (document.visibilityState === 'visible' && vivo.current) cargar(true) }
    const t = setInterval(tick, REFRESCO_MS)
    const alVolver = () => { if (document.visibilityState === 'visible') cargar(true) }
    document.addEventListener('visibilitychange', alVolver)
    return () => { vivo.current = false; clearInterval(t); document.removeEventListener('visibilitychange', alVolver) }
  }, [])

  const lista = useMemo(() => {
    if (!datos?.data) return []
    return Object.values(datos.data).filter((c) => c.grupo === grupo)
  }, [datos, grupo])

  const resumenGrupo = useMemo(() => {
    if (!lista.length) return 0
    return lista.reduce((s, c) => s + c.changePct, 0) / lista.length
  }, [lista])

  return (
    <>
      <PageHeader title="Mercados" onBack={onBack} right={
        <button onClick={() => cargar()} aria-label="Actualizar cotizaciones" disabled={cargando}
          className="w-9 h-9 rounded-full grid place-items-center flex-shrink-0"
          style={{ background: '#fff', border: '1px solid var(--aureo-border)' }}>
          <RefreshCw className={'w-4 h-4' + (cargando ? ' animate-spin' : '')} style={{ color: 'var(--aureo-purple)' }} />
        </button>
      } />

      <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        className="hero-gradient rounded-[28px] p-6 text-white">
        <span className="chip">
          <Radio className="w-3.5 h-3.5" /> En vivo · cada 30 s
        </span>
        <div className="tabular text-[36px] font-semibold mt-3 leading-none">
          {resumenGrupo >= 0 ? '+' : ''}{resumenGrupo.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} %
        </div>
        <div className="text-[13px] text-white/80 mt-1.5">
          Media de {GRUPOS.find((g) => g.id === grupo)?.nombre.toLowerCase()} hoy
          {datos ? ' · ' + new Date(datos.actualizado).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : ''}
        </div>
      </motion.section>

      <div className="flex gap-2 overflow-x-auto no-scrollbar mt-4 -mx-1 px-1 pb-1">
        {GRUPOS.map((g) => {
          const activo = grupo === g.id
          return (
            <button key={g.id} onClick={() => setGrupo(g.id)}
              className="px-4 py-2 rounded-full text-[13px] font-semibold whitespace-nowrap transition flex-shrink-0"
              style={{
                background: activo ? 'var(--aureo-purple)' : '#fff',
                color: activo ? '#fff' : 'var(--aureo-text-dim)',
                border: activo ? 'none' : '1px solid var(--aureo-border)',
              }}>
              {g.nombre}
            </button>
          )
        })}
      </div>

      {error && !datos && <div className="mt-4"><Vacio icon={TrendingDown} titulo="Sin cotizaciones" texto={error} /></div>}

      {cargando && !datos && (
        <div className="aureo-card mt-4 p-8 text-center text-[13px]" style={{ color: 'var(--aureo-text-dim)' }}>
          Consultando mercados…
        </div>
      )}

      {lista.length > 0 && (
        <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="aureo-card mt-4 overflow-hidden">
          {lista.map((c, i) => {
            const sube = c.changePct >= 0
            const tono = sube ? '#22C55E' : '#EF4444'
            return (
              <div key={c.id} className="flex items-center gap-3 px-4 py-3.5"
                style={{ borderTop: i === 0 ? 'none' : '1px solid var(--aureo-border)' }}>
                <div className="w-10 h-10 rounded-full grid place-items-center flex-shrink-0 text-[11px] font-bold"
                  style={{ background: c.color + '1A', color: c.color }}>
                  {c.nombre.replace(/[^A-Za-z0-9]/g, '').slice(0, 3).toUpperCase()}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="text-[14px] font-semibold truncate">{c.nombre}</div>
                  <div className="text-[11px] flex items-center gap-1" style={{ color: 'var(--aureo-text-mute)' }}>
                    {c.marketState === 'REGULAR'
                      ? <><span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: '#22C55E' }} /> abierto</>
                      : 'cerrado'}
                  </div>
                </div>

                <Sparkline serie={c.serie} color={tono} />

                <div className="text-right flex-shrink-0" style={{ minWidth: 92 }}>
                  <div className="tabular text-[14px] font-semibold">{formatearPrecio(c)}</div>
                  <div className="tabular text-[12px] font-semibold flex items-center justify-end gap-0.5" style={{ color: tono }}>
                    {sube ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {sube ? '+' : ''}{c.changePct.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} %
                  </div>
                </div>
              </div>
            )
          })}
        </motion.section>
      )}

      {datos?.fallidos?.length > 0 && (
        <p className="text-[11px] text-center mt-3" style={{ color: 'var(--aureo-text-mute)' }}>
          Sin datos ahora mismo de: {datos.fallidos.join(', ')}
        </p>
      )}

      <p className="text-[11px] text-center mt-4 leading-relaxed" style={{ color: 'var(--aureo-text-mute)' }}>
        Cotizaciones de Yahoo Finance con hasta 60 segundos de retardo. Son informativas:
        no sirven para operar ni son una recomendación de inversión.
      </p>
    </>
  )
}
