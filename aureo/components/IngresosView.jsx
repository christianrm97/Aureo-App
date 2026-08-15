'use client'

import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Trash2, Laptop, Wrench, Tag, Home, Gift, LineChart, Undo2, Sparkles, TrendingUp, Calendar, Repeat } from 'lucide-react'
import { TIPOS_INGRESO, tipoIngresoDe } from '@/lib/catalogo'
import { fmt, fmt2, PageHeader, Sheet, Campo, Boton, Vacio } from './ui'

const ICONOS = {
  laptop: Laptop, wrench: Wrench, tag: Tag, home: Home, gift: Gift,
  linechart: LineChart, undo: Undo2, sparkles: Sparkles,
}

export default function IngresosView({ ingresos, nomina, onBack, oculto, onCrear, onBorrar }) {
  const [abierto, setAbierto] = useState(false)

  const { recurrente, puntual } = useMemo(() => ({
    recurrente: ingresos.filter((i) => i.tipo === 'recurrente').reduce((s, i) => s + Number(i.importe), 0),
    puntual: ingresos.filter((i) => i.tipo === 'puntual').reduce((s, i) => s + Number(i.importe), 0),
  }), [ingresos])

  return (
    <>
      <PageHeader title="Ingresos" onBack={onBack} />

      <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-[28px] p-6 text-white relative overflow-hidden"
        style={{
          background: 'radial-gradient(120% 100% at 0% 0%, rgba(255,255,255,0.16) 0%, transparent 55%), linear-gradient(140deg, #15803D 0%, #166534 55%, #052E16 100%)',
          boxShadow: '0 20px 40px -20px rgba(21,128,61,0.45)',
        }}>
        <span className="chip"><TrendingUp className="w-3.5 h-3.5" /> Ingresos del mes</span>
        <div className="tabular text-[42px] font-semibold mt-4 leading-none">
          {oculto ? '••••,•• €' : fmt2(nomina + recurrente + puntual)}
        </div>
        <div className="text-[13px] text-white/80 mt-2">
          Nómina {oculto ? '•••' : fmt(nomina)}
          {recurrente > 0 && ` · extra fijo ${oculto ? '•••' : fmt(recurrente)}`}
          {puntual > 0 && ` · puntual ${oculto ? '•••' : fmt(puntual)}`}
        </div>
      </motion.section>

      <div className="grid grid-cols-2 gap-3 mt-4">
        <div className="aureo-card p-4">
          <div className="text-[11px] uppercase tracking-wider flex items-center gap-1" style={{ color: 'var(--aureo-text-mute)' }}>
            <Repeat className="w-3 h-3" /> Recurrente
          </div>
          <div className="tabular text-[20px] font-semibold mt-1" style={{ color: '#22C55E' }}>
            +{oculto ? '•••' : fmt(recurrente)}
          </div>
          <div className="text-[11px] mt-0.5" style={{ color: 'var(--aureo-text-mute)' }}>cada mes al objetivo</div>
        </div>
        <div className="aureo-card p-4">
          <div className="text-[11px] uppercase tracking-wider flex items-center gap-1" style={{ color: 'var(--aureo-text-mute)' }}>
            <Sparkles className="w-3 h-3" /> Puntual
          </div>
          <div className="tabular text-[20px] font-semibold mt-1" style={{ color: '#22C55E' }}>
            +{oculto ? '•••' : fmt(puntual)}
          </div>
          <div className="text-[11px] mt-0.5" style={{ color: 'var(--aureo-text-mute)' }}>una sola vez</div>
        </div>
      </div>

      <div className="mt-4">
        {!ingresos.length ? (
          <Vacio icon={TrendingUp} titulo="Sin ingresos extra"
            texto="Freelance, servicios, ventas, alquiler… todo suma al objetivo" />
        ) : (
          <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="aureo-card overflow-hidden">
            <AnimatePresence>
              {ingresos.map((i, idx) => {
                const t = tipoIngresoDe(i.categoria)
                const Icon = ICONOS[t.icono] ?? Sparkles
                const esRecurrente = i.tipo === 'recurrente'
                return (
                  <motion.div key={i.id} exit={{ opacity: 0, height: 0 }}
                    className="flex items-center gap-3 px-5 py-4 group"
                    style={{ borderTop: idx === 0 ? 'none' : '1px solid var(--aureo-border)' }}>
                    <div className="w-11 h-11 rounded-full grid place-items-center flex-shrink-0" style={{ background: t.bg }}>
                      <Icon className="w-5 h-5" style={{ color: t.color }} strokeWidth={2.1} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[15px] font-semibold truncate">{i.concepto}</div>
                      <div className="text-[12px] flex items-center gap-1 truncate" style={{ color: 'var(--aureo-text-dim)' }}>
                        {esRecurrente
                          ? <><Repeat className="w-3 h-3" /> cada mes · día {i.dia}</>
                          : <><Calendar className="w-3 h-3" /> {new Date(Number(i.ts)).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}</>}
                        {' · '}{t.nombre}
                      </div>
                    </div>
                    <div className="tabular text-[15px] font-semibold" style={{ color: '#22C55E' }}>
                      +{oculto ? '••• €' : fmt2(i.importe)}
                    </div>
                    <button onClick={() => onBorrar('ingresos', i.id)} aria-label="Borrar"
                      className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition w-7 h-7 rounded-full grid place-items-center flex-shrink-0"
                      style={{ background: 'var(--aureo-bg)' }}>
                      <Trash2 className="w-3.5 h-3.5" style={{ color: 'var(--aureo-text-dim)' }} />
                    </button>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </motion.section>
        )}
      </div>

      <button onClick={() => setAbierto(true)}
        className="pill-button w-full h-14 mt-4 flex items-center justify-center gap-2 font-semibold"
        style={{ background: '#DCFCE7', color: '#15803D' }}>
        <Plus className="w-5 h-5" /> Añadir ingreso
      </button>

      <AnimatePresence>
        {abierto && <AltaIngreso onClose={() => setAbierto(false)} onCrear={onCrear} />}
      </AnimatePresence>
    </>
  )
}

function AltaIngreso({ onClose, onCrear }) {
  const [categoria, setCategoria] = useState('freelance')
  const [concepto, setConcepto] = useState('')
  const [importe, setImporte] = useState('')
  const [tipo, setTipo] = useState('puntual')
  const [dia, setDia] = useState(String(new Date().getDate()))
  const [guardando, setGuardando] = useState(false)
  const t = tipoIngresoDe(categoria)

  const enviar = async (e) => {
    e.preventDefault()
    const valor = parseFloat(String(importe).replace(',', '.'))
    if (!valor || valor <= 0 || guardando) return
    setGuardando(true)
    await onCrear('ingresos', {
      categoria,
      concepto: concepto.trim() || t.nombre,
      importe: valor,
      tipo,
      dia: Number(dia) || 1,
    })
    setGuardando(false)
    onClose()
  }

  return (
    <Sheet title="Nuevo ingreso" onClose={onClose} onSubmit={enviar}>
      <div className="mb-5">
        <span className="text-[11px] uppercase tracking-wider block mb-2.5" style={{ color: 'var(--aureo-text-mute)' }}>Origen</span>
        <div className="grid grid-cols-4 gap-2">
          {TIPOS_INGRESO.map((x) => {
            const Icon = ICONOS[x.icono] ?? Sparkles
            const activo = x.id === categoria
            return (
              <button key={x.id} type="button" onClick={() => setCategoria(x.id)}
                className="flex flex-col items-center gap-1 p-2 rounded-2xl transition"
                style={{ background: activo ? x.bg : 'transparent', border: `1px solid ${activo ? x.color : 'var(--aureo-border)'}` }}>
                <Icon className="w-5 h-5" style={{ color: x.color }} strokeWidth={2.1} />
                <span className="text-[9px] font-medium leading-tight text-center">{x.nombre}</span>
              </button>
            )
          })}
        </div>
      </div>

      <Campo label="Importe">
        <div className="flex items-baseline gap-1">
          <span className="text-[36px] font-semibold" style={{ color: 'var(--aureo-text-mute)' }}>€</span>
          <input autoFocus inputMode="decimal" value={importe} onChange={(e) => setImporte(e.target.value)} placeholder="0,00"
            className="flex-1 min-w-0 bg-transparent outline-none tabular text-[36px] font-semibold" />
        </div>
      </Campo>

      <Campo label="Concepto">
        <input value={concepto} onChange={(e) => setConcepto(e.target.value)} placeholder="Ej. Diseño web para cliente" maxLength={80}
          className="w-full bg-transparent outline-none text-[16px]" />
      </Campo>

      <div className="mb-5">
        <span className="text-[11px] uppercase tracking-wider block mb-2.5" style={{ color: 'var(--aureo-text-mute)' }}>Frecuencia</span>
        <div className="grid grid-cols-2 gap-2">
          {[
            { id: 'puntual',    label: 'Puntual',    nota: 'suma una vez' },
            { id: 'recurrente', label: 'Cada mes',   nota: 'cambia el ritmo' },
          ].map((op) => {
            const activo = tipo === op.id
            return (
              <button key={op.id} type="button" onClick={() => setTipo(op.id)}
                className="p-3 rounded-2xl text-left transition"
                style={{ background: activo ? '#DCFCE7' : 'transparent', border: `1px solid ${activo ? '#22C55E' : 'var(--aureo-border)'}` }}>
                <div className="text-[14px] font-semibold">{op.label}</div>
                <div className="text-[11px]" style={{ color: 'var(--aureo-text-mute)' }}>{op.nota}</div>
              </button>
            )
          })}
        </div>
      </div>

      {tipo === 'recurrente' && (
        <Campo label="Día de cobro">
          <input inputMode="numeric" value={dia} onChange={(e) => setDia(e.target.value)}
            className="w-full bg-transparent outline-none text-[16px]" />
        </Campo>
      )}

      <Boton type="submit" disabled={guardando}>{guardando ? 'Guardando…' : 'Añadir ingreso'}</Boton>
    </Sheet>
  )
}
