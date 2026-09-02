'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Newspaper, ExternalLink, RefreshCw, Clock } from 'lucide-react'
import { api, PageHeader, Vacio } from './ui'

const COLOR_MEDIO = {
  Investing: '#0BA5EC',
  'Expansión': '#C8102E',
  'El País': '#1A1A1A',
  ABC: '#D40000',
  'elDiario.es': '#00A6A6',
  '20minutos': '#E30613',
  elEconomista: '#F5A623',
}

/** "hace 12 min" / "hace 3 h" / "ayer" — la frescura importa mas que la fecha. */
function hace(ts) {
  const min = Math.floor((Date.now() - ts) / 60000)
  if (min < 1) return 'ahora'
  if (min < 60) return `hace ${min} min`
  const h = Math.floor(min / 60)
  if (h < 24) return `hace ${h} h`
  const d = Math.floor(h / 24)
  if (d === 1) return 'ayer'
  if (d < 7) return `hace ${d} días`
  return new Date(ts).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
}

export default function NoticiasView({ onBack }) {
  const [datos, setDatos] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [medio, setMedio] = useState('todos')

  const cargar = async () => {
    setCargando(true)
    const r = await api('noticias?limit=60').catch(() => null)
    if (r?.items) setDatos(r)
    setCargando(false)
  }

  useEffect(() => { cargar() }, [])

  const items = useMemo(() => {
    if (!datos?.items) return []
    return medio === 'todos' ? datos.items : datos.items.filter((n) => n.medio === medio)
  }, [datos, medio])

  return (
    <>
      <PageHeader title="Noticias" onBack={onBack} right={
        <button onClick={cargar} aria-label="Actualizar" disabled={cargando}
          className="w-9 h-9 rounded-full grid place-items-center flex-shrink-0"
          style={{ background: '#fff', border: '1px solid var(--aureo-border)' }}>
          <RefreshCw className={`w-4 h-4 ${cargando ? 'animate-spin' : ''}`} style={{ color: 'var(--aureo-purple)' }} />
        </button>
      } />

      <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        className="hero-gradient rounded-[28px] p-6 text-white">
        <span className="chip"><Newspaper className="w-3.5 h-3.5" /> Actualidad financiera</span>
        <div className="text-[22px] font-semibold mt-3 leading-tight">
          {datos ? `${datos.items.length} titulares` : 'Cargando titulares…'}
        </div>
        <div className="text-[12px] text-white/80 mt-1.5 flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {datos ? `${datos.medios.length} medios · actualizado ${hace(datos.actualizado)}` : 'Leyendo los feeds'}
        </div>
      </motion.section>

      {datos?.medios?.length > 0 && (
        <div className="flex gap-2 overflow-x-auto no-scrollbar mt-4 -mx-1 px-1 pb-1">
          {['todos', ...datos.medios].map((m) => {
            const activo = medio === m
            const color = COLOR_MEDIO[m] ?? 'var(--aureo-purple)'
            return (
              <button key={m} onClick={() => setMedio(m)}
                className="px-3.5 py-2 rounded-full text-[13px] font-medium whitespace-nowrap transition flex-shrink-0"
                style={{
                  background: activo ? color : '#fff',
                  color: activo ? '#fff' : 'var(--aureo-text-dim)',
                  border: activo ? 'none' : '1px solid var(--aureo-border)',
                }}>
                {m === 'todos' ? 'Todos' : m}
              </button>
            )
          })}
        </div>
      )}

      <div className="mt-3 space-y-3">
        {cargando && !datos && (
          <div className="aureo-card p-8 text-center text-[13px]" style={{ color: 'var(--aureo-text-dim)' }}>
            Leyendo Investing, Expansión, El País, ABC, elDiario y 20minutos…
          </div>
        )}

        {!cargando && items.length === 0 && (
          <Vacio icon={Newspaper} titulo="Sin titulares"
            texto="No se pudo leer ningún feed. Prueba a actualizar en unos minutos." />
        )}

        {items.map((n, i) => (
          <motion.a
            key={n.id} href={n.url} target="_blank" rel="noopener noreferrer"
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(i * 0.02, 0.3) }}
            className="aureo-card p-4 block group">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded font-semibold"
                style={{ background: `${COLOR_MEDIO[n.medio] ?? '#6C2BD9'}1A`, color: COLOR_MEDIO[n.medio] ?? '#6C2BD9' }}>
                {n.medio}
              </span>
              <span className="text-[11px]" style={{ color: 'var(--aureo-text-mute)' }}>{hace(n.fecha)}</span>
              <ExternalLink className="w-3.5 h-3.5 ml-auto flex-shrink-0" style={{ color: 'var(--aureo-text-mute)' }} />
            </div>
            <div className="text-[15px] font-semibold leading-snug group-hover:underline">{n.titulo}</div>
            {n.resumen && (
              <div className="text-[12.5px] leading-snug mt-1.5 line-clamp-2" style={{ color: 'var(--aureo-text-dim)' }}>
                {n.resumen}
              </div>
            )}
          </motion.a>
        ))}
      </div>

      <p className="text-[11px] text-center mt-5 leading-relaxed" style={{ color: 'var(--aureo-text-mute)' }}>
        Titulares tal cual los publican los medios, por sus canales RSS oficiales.
        Aureo no los reescribe ni los interpreta: toca uno para leer el original.
      </p>
    </>
  )
}
