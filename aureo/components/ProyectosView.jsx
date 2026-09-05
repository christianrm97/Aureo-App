'use client'

import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Trash2, Store, LineChart, Trophy, Sparkles, Rocket, AlertTriangle, Flag, TrendingDown, TrendingUp } from 'lucide-react'
import { TIPOS_PROYECTO, tipoProyectoDe } from '@/lib/catalogo'
import { PRESUPUESTO_PROYECTOS, CHECKPOINT } from '@/lib/perfil'
import { fmt, fmt2, PageHeader, Sheet, Campo, Boton, Vacio, ErrorCampo } from './ui'

const ICONOS = { store: Store, linechart: LineChart, trophy: Trophy, sparkles: Sparkles }

/** Un movimiento cuenta para el mes en curso si cae en este mes natural. */
const esDeEsteMes = (ts) => {
  const d = new Date(Number(ts))
  const hoy = new Date()
  return d.getMonth() === hoy.getMonth() && d.getFullYear() === hoy.getFullYear()
}

export default function ProyectosView({ movimientos, onBack, oculto, onCrear, onBorrar }) {
  const [abierto, setAbierto] = useState(false)

  const resumen = useMemo(() => {
    let invertido = 0
    let ingresado = 0
    let gastadoEsteMes = 0
    const porProyecto = new Map()

    for (const m of movimientos) {
      const importe = Number(m.importe)
      const inversion = m.tipo === 'inversion'
      const acc = porProyecto.get(m.proyecto) ?? { invertido: 0, ingresado: 0, ingresosMes: 0 }

      if (inversion) {
        invertido += importe
        acc.invertido += importe
        if (esDeEsteMes(m.ts)) gastadoEsteMes += importe
      } else {
        ingresado += importe
        acc.ingresado += importe
        if (esDeEsteMes(m.ts)) acc.ingresosMes += importe
      }
      porProyecto.set(m.proyecto, acc)
    }

    const filas = [...porProyecto.entries()]
      .map(([id, v]) => ({ id, ...v, roi: v.invertido > 0 ? (v.ingresado / v.invertido - 1) * 100 : null }))
      .sort((a, b) => b.invertido + b.ingresado - (a.invertido + a.ingresado))

    return {
      invertido,
      ingresado,
      gastadoEsteMes,
      restante: Math.max(0, PRESUPUESTO_PROYECTOS.total - invertido),
      filas,
      // El checkpoint pide UN proyecto llegando al objetivo por si solo, no la
      // suma de los tres: sumarlos daria por bueno un plan que no lo esta.
      mejorDelMes: filas.reduce((m, f) => Math.max(m, f.ingresosMes), 0),
    }
  }, [movimientos])

  const pasado = resumen.gastadoEsteMes > PRESUPUESTO_PROYECTOS.topeMensual
  const pctPresupuesto = Math.min(100, (resumen.invertido / PRESUPUESTO_PROYECTOS.total) * 100)

  const hoy = new Date()
  const mesesCheckpoint = Math.max(
    0,
    (CHECKPOINT.fecha.getFullYear() - hoy.getFullYear()) * 12 + (CHECKPOINT.fecha.getMonth() - hoy.getMonth()),
  )
  const pctCheckpoint = Math.min(100, (resumen.mejorDelMes / CHECKPOINT.ingresoExtraObjetivo) * 100)

  return (
    <>
      <PageHeader title="Proyectos" onBack={onBack} />

      <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-[28px] p-6 text-white relative overflow-hidden"
        style={{
          background: 'radial-gradient(120% 100% at 0% 0%, rgba(255,255,255,0.16) 0%, transparent 55%), linear-gradient(140deg, #6C2BD9 0%, #4C1D95 55%, #2E1065 100%)',
          boxShadow: '0 20px 40px -20px rgba(76,29,149,0.45)',
        }}>
        <span className="chip"><Rocket className="w-3.5 h-3.5" /> Presupuesto restante</span>
        <div className="tabular text-[42px] font-semibold mt-4 leading-none">
          {oculto ? '••••,•• €' : fmt2(resumen.restante)}
        </div>
        <div className="text-[13px] text-white/80 mt-2">
          de {fmt(PRESUPUESTO_PROYECTOS.total)} · gastado {oculto ? '•••' : fmt(resumen.invertido)}
        </div>
        <div className="h-1.5 rounded-full mt-4 overflow-hidden" style={{ background: 'rgba(255,255,255,0.22)' }}>
          <motion.div className="h-full rounded-full" style={{ background: '#fff' }}
            initial={{ width: 0 }} animate={{ width: `${pctPresupuesto}%` }} transition={{ duration: 0.7 }} />
        </div>
      </motion.section>

      <div className="grid grid-cols-2 gap-3 mt-4">
        <div className="aureo-card p-4">
          <div className="text-[11px] uppercase tracking-wider flex items-center gap-1" style={{ color: 'var(--aureo-text-mute)' }}>
            <TrendingDown className="w-3 h-3" /> Este mes
          </div>
          <div className="tabular text-[20px] font-semibold mt-1" style={{ color: pasado ? '#EF4444' : 'var(--aureo-text)' }}>
            {oculto ? '•••' : fmt(resumen.gastadoEsteMes)}
          </div>
          <div className="text-[11px] mt-0.5" style={{ color: 'var(--aureo-text-mute)' }}>
            tope {fmt(PRESUPUESTO_PROYECTOS.topeMensual)}
          </div>
        </div>
        <div className="aureo-card p-4">
          <div className="text-[11px] uppercase tracking-wider flex items-center gap-1" style={{ color: 'var(--aureo-text-mute)' }}>
            <TrendingUp className="w-3 h-3" /> Generado
          </div>
          <div className="tabular text-[20px] font-semibold mt-1" style={{ color: '#22C55E' }}>
            +{oculto ? '•••' : fmt(resumen.ingresado)}
          </div>
          <div className="text-[11px] mt-0.5" style={{ color: 'var(--aureo-text-mute)' }}>desde el inicio</div>
        </div>
      </div>

      {pasado && (
        <div className="aureo-card mt-4 p-4 flex items-start gap-3">
          <div className="w-9 h-9 rounded-full grid place-items-center flex-shrink-0" style={{ background: '#FEE2E2' }}>
            <AlertTriangle className="w-4 h-4" style={{ color: '#EF4444' }} />
          </div>
          <div className="text-[13px]" style={{ color: 'var(--aureo-text-dim)' }}>
            Te has pasado {fmt(resumen.gastadoEsteMes - PRESUPUESTO_PROYECTOS.topeMensual)} del tope de este mes.
            Sin ese tope, {fmt(PRESUPUESTO_PROYECTOS.total)} duran tres meses en vez de diez.
          </div>
        </div>
      )}

      <div className="aureo-card mt-4 p-5">
        <div className="flex items-center justify-between">
          <div className="text-[11px] uppercase tracking-wider flex items-center gap-1" style={{ color: 'var(--aureo-text-mute)' }}>
            <Flag className="w-3 h-3" /> Checkpoint
          </div>
          <div className="text-[11px]" style={{ color: 'var(--aureo-text-mute)' }}>
            {mesesCheckpoint === 0 ? 'este mes' : `en ${mesesCheckpoint} ${mesesCheckpoint === 1 ? 'mes' : 'meses'}`}
          </div>
        </div>
        <div className="tabular text-[24px] font-semibold mt-1">
          {oculto ? '•••' : fmt(resumen.mejorDelMes)}
          <span className="text-[12px] font-normal" style={{ color: 'var(--aureo-text-mute)' }}>
            {' '}/ {fmt(CHECKPOINT.ingresoExtraObjetivo)}
          </span>
        </div>
        <div className="h-1.5 rounded-full mt-3 overflow-hidden" style={{ background: 'var(--aureo-bg)' }}>
          <motion.div className="h-full rounded-full" style={{ background: pctCheckpoint >= 100 ? '#22C55E' : '#6C2BD9' }}
            initial={{ width: 0 }} animate={{ width: `${pctCheckpoint}%` }} transition={{ duration: 0.7 }} />
        </div>
        <div className="text-[12px] mt-2" style={{ color: 'var(--aureo-text-dim)' }}>
          {pctCheckpoint >= 100
            ? 'Ya hay un proyecto sosteniéndose solo: mantén la inversión y empieza a amortizar con lo que genera.'
            : 'Mejor proyecto este mes. Si en marzo ninguno llega, el plan dice cerrar el grifo y redirigir 100 €/mes a amortizar.'}
        </div>
      </div>

      <div className="mt-4">
        {!resumen.filas.length ? (
          <Vacio icon={Rocket} titulo="Sin movimientos"
            texto="Apunta cada euro que metes y cada euro que genera un proyecto" />
        ) : (
          <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="aureo-card overflow-hidden">
            {resumen.filas.map((f, i) => {
              const t = tipoProyectoDe(f.id)
              const Icon = ICONOS[t.icono] ?? Sparkles
              return (
                <div key={f.id} className="px-5 py-4"
                  style={{ borderTop: i === 0 ? 'none' : '1px solid var(--aureo-border)' }}>
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full grid place-items-center flex-shrink-0" style={{ background: t.bg }}>
                      <Icon className="w-5 h-5" style={{ color: t.color }} strokeWidth={2.1} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[15px] font-semibold truncate">{t.nombre}</div>
                      <div className="text-[12px] truncate" style={{ color: 'var(--aureo-text-dim)' }}>
                        {oculto ? '•••' : fmt(f.invertido)} invertido · {oculto ? '•••' : fmt(f.ingresado)} generado
                      </div>
                    </div>
                    {f.roi !== null && (
                      <div className="tabular text-[15px] font-semibold flex-shrink-0"
                        style={{ color: f.roi >= 0 ? '#22C55E' : '#EF4444' }}>
                        {f.roi >= 0 ? '+' : ''}{f.roi.toFixed(0)}%
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </motion.section>
        )}
      </div>

      {movimientos.length > 0 && (
        <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="aureo-card overflow-hidden mt-4">
          <AnimatePresence>
            {[...movimientos].sort((a, b) => Number(b.ts) - Number(a.ts)).map((m, i) => {
              const t = tipoProyectoDe(m.proyecto)
              const inversion = m.tipo === 'inversion'
              return (
                <motion.div key={m.id} exit={{ opacity: 0, height: 0 }}
                  className="flex items-center gap-3 px-5 py-3 group"
                  style={{ borderTop: i === 0 ? 'none' : '1px solid var(--aureo-border)' }}>
                  <div className="flex-1 min-w-0">
                    <div className="text-[14px] font-medium truncate">{m.concepto}</div>
                    <div className="text-[11px] truncate" style={{ color: 'var(--aureo-text-dim)' }}>
                      {t.nombre} · {new Date(Number(m.ts)).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                    </div>
                  </div>
                  <div className="tabular text-[14px] font-semibold" style={{ color: inversion ? '#EF4444' : '#22C55E' }}>
                    {inversion ? '−' : '+'}{oculto ? '••• €' : fmt2(m.importe)}
                  </div>
                  <button onClick={() => onBorrar('proyectos', m.id)} aria-label="Borrar movimiento"
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

      <button onClick={() => setAbierto(true)}
        className="pill-button w-full h-14 mt-4 flex items-center justify-center gap-2 font-semibold"
        style={{ background: '#EFE7FB', color: '#6C2BD9' }}>
        <Plus className="w-5 h-5" /> Añadir movimiento
      </button>

      <AnimatePresence>
        {abierto && <AltaMovimiento onClose={() => setAbierto(false)} onCrear={onCrear} />}
      </AnimatePresence>
    </>
  )
}

function AltaMovimiento({ onClose, onCrear }) {
  const [proyecto, setProyecto] = useState('livasonic')
  const [tipo, setTipo] = useState('inversion')
  const [concepto, setConcepto] = useState('')
  const [importe, setImporte] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState(null)
  const t = tipoProyectoDe(proyecto)

  const enviar = async (e) => {
    e.preventDefault()
    const valor = parseFloat(String(importe).replace(',', '.'))
    if (guardando) return
    if (!valor || valor <= 0) { setError('Escribe un importe mayor que 0'); return }
    setGuardando(true)
    setError(null)
    const res = await onCrear('proyectos', {
      proyecto,
      tipo,
      concepto: concepto.trim() || t.nombre,
      importe: valor,
    })
    setGuardando(false)
    if (!res || !res.ok) { setError(res?.error ?? 'No se pudo guardar. Inténtalo otra vez.'); return }
    onClose()
  }

  return (
    <Sheet title="Movimiento de proyecto" onClose={onClose} onSubmit={enviar}>
      <div className="mb-5">
        <span className="text-[11px] uppercase tracking-wider block mb-2.5" style={{ color: 'var(--aureo-text-mute)' }}>Proyecto</span>
        <div className="grid grid-cols-4 gap-2">
          {TIPOS_PROYECTO.map((x) => {
            const Icon = ICONOS[x.icono] ?? Sparkles
            const activo = x.id === proyecto
            return (
              <button key={x.id} type="button" onClick={() => setProyecto(x.id)}
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
        <input value={concepto} onChange={(e) => setConcepto(e.target.value)} placeholder="Ej. Meta Ads semana 1" maxLength={80}
          className="w-full bg-transparent outline-none text-[16px]" />
      </Campo>

      <div className="mb-5">
        <span className="text-[11px] uppercase tracking-wider block mb-2.5" style={{ color: 'var(--aureo-text-mute)' }}>Tipo</span>
        <div className="grid grid-cols-2 gap-2">
          {[
            { id: 'inversion', label: 'Inversión', nota: 'sale del presupuesto', color: '#EF4444', bg: '#FEE2E2' },
            { id: 'ingreso', label: 'Ingreso', nota: 'cuenta para marzo', color: '#22C55E', bg: '#DCFCE7' },
          ].map((op) => {
            const activo = tipo === op.id
            return (
              <button key={op.id} type="button" onClick={() => setTipo(op.id)}
                className="p-3 rounded-2xl text-left transition"
                style={{ background: activo ? op.bg : 'transparent', border: `1px solid ${activo ? op.color : 'var(--aureo-border)'}` }}>
                <div className="text-[14px] font-semibold">{op.label}</div>
                <div className="text-[11px]" style={{ color: 'var(--aureo-text-mute)' }}>{op.nota}</div>
              </button>
            )
          })}
        </div>
      </div>

      <ErrorCampo>{error}</ErrorCampo>
      <Boton type="submit" disabled={guardando}>{guardando ? 'Guardando…' : 'Guardar movimiento'}</Boton>
    </Sheet>
  )
}
