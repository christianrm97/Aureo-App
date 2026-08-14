'use client'

import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Trash2, Zap, Droplet, Flame, Wifi, Smartphone, Landmark, Trash, Building2, Shield, Receipt, Repeat, Calendar } from 'lucide-react'
import { PLATAFORMAS, TIPOS_RECIBO, plataformaDe, tipoReciboDe } from '@/lib/catalogo'
import Logo from './Logo'
import { fmt, fmt2, api, PageHeader, Sheet, Campo, Boton, Vacio } from './ui'

const ICONOS_RECIBO = {
  zap: Zap, droplet: Droplet, flame: Flame, wifi: Wifi, smartphone: Smartphone,
  landmark: Landmark, trash: Trash, building: Building2, shield: Shield, receipt: Receipt,
}

/** Un recibo trimestral no cuesta lo mismo al mes que uno mensual. */
const DIVISOR = { mensual: 1, bimestral: 2, trimestral: 3, anual: 12 }
export const mensualizar = (r) => r.importe / (DIVISOR[r.periodicidad] ?? 1)

export default function FijosView({ suscripciones, recibos, onBack, oculto, onCrear, onBorrar }) {
  const [pestana, setPestana] = useState('suscripciones')
  const [sheet, setSheet] = useState(null)

  const totalSubs = useMemo(() => suscripciones.reduce((s, x) => s + Number(x.cuota), 0), [suscripciones])
  const totalRecibos = useMemo(() => recibos.reduce((s, x) => s + mensualizar(x), 0), [recibos])
  const total = totalSubs + totalRecibos

  return (
    <>
      <PageHeader title="Fijos" onBack={onBack} />

      <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="hero-gradient rounded-[28px] p-6 text-white">
        <span className="chip"><Repeat className="w-3.5 h-3.5" /> Compromiso mensual</span>
        <div className="tabular text-[38px] font-semibold mt-4 leading-none">{oculto ? '••••,•• €' : fmt2(total)}</div>
        <div className="text-[13px] text-white/80 mt-2">
          {oculto ? '•••' : fmt(total * 12)} al año · {suscripciones.length} suscripciones · {recibos.length} recibos
        </div>
      </motion.section>

      <div className="flex gap-2 mt-5 mb-4">
        {[
          { id: 'suscripciones', label: 'Suscripciones', total: totalSubs },
          { id: 'recibos', label: 'Recibos', total: totalRecibos },
        ].map((t) => {
          const activa = pestana === t.id
          return (
            <button key={t.id} onClick={() => setPestana(t.id)}
              className="flex-1 py-2.5 rounded-full text-[13px] font-semibold transition"
              style={{
                background: activa ? 'var(--aureo-purple)' : '#fff',
                color: activa ? '#fff' : 'var(--aureo-text-dim)',
                border: activa ? 'none' : '1px solid var(--aureo-border)',
              }}>
              {t.label} · {oculto ? '•••' : fmt(t.total)}
            </button>
          )
        })}
      </div>

      {pestana === 'suscripciones' ? (
        <Lista
          items={suscripciones}
          vacio={{ titulo: 'Sin suscripciones', texto: 'Añade Netflix, Spotify, el gimnasio…' }}
          render={(s) => ({
            icono: <Logo plataforma={plataformaDe(s.plataforma)} />,
            titulo: s.nombre,
            sub: `${s.plan} · día ${s.dia}`,
            importe: Number(s.cuota),
          })}
          oculto={oculto}
          onBorrar={(id) => onBorrar('suscripciones', id)}
        />
      ) : (
        <Lista
          items={recibos}
          vacio={{ titulo: 'Sin recibos', texto: 'Luz, agua, internet, móvil, IBI…' }}
          render={(r) => {
            const t = tipoReciboDe(r.tipo)
            const Icon = ICONOS_RECIBO[t.icono] ?? Receipt
            return {
              icono: (
                <div className="w-11 h-11 rounded-full grid place-items-center flex-shrink-0" style={{ background: t.bg }}>
                  <Icon className="w-5 h-5" style={{ color: t.color }} strokeWidth={2.1} />
                </div>
              ),
              titulo: r.companyia ? `${t.nombre} · ${r.companyia}` : t.nombre,
              sub: `${r.periodicidad} · día ${r.dia}${r.periodicidad !== 'mensual' ? ` · ${fmt2(mensualizar(r))}/mes` : ''}`,
              importe: Number(r.importe),
            }
          }}
          oculto={oculto}
          onBorrar={(id) => onBorrar('recibos', id)}
        />
      )}

      <button onClick={() => setSheet(pestana)}
        className="pill-button w-full h-14 mt-4 flex items-center justify-center gap-2 font-semibold"
        style={{ background: 'var(--aureo-purple-soft)', color: 'var(--aureo-purple)' }}>
        <Plus className="w-5 h-5" /> Añadir {pestana === 'suscripciones' ? 'suscripción' : 'recibo'}
      </button>

      <AnimatePresence>
        {sheet === 'suscripciones' && (
          <AltaSuscripcion onClose={() => setSheet(null)} onCrear={onCrear} />
        )}
        {sheet === 'recibos' && (
          <AltaRecibo onClose={() => setSheet(null)} onCrear={onCrear} />
        )}
      </AnimatePresence>
    </>
  )
}

function Lista({ items, render, oculto, onBorrar, vacio }) {
  if (!items.length) return <Vacio icon={Receipt} titulo={vacio.titulo} texto={vacio.texto} />
  return (
    <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="aureo-card overflow-hidden">
      <AnimatePresence>
        {items.map((it, i) => {
          const d = render(it)
          return (
            <motion.div key={it.id} exit={{ opacity: 0, height: 0 }}
              className="flex items-center gap-3 px-5 py-4 group"
              style={{ borderTop: i === 0 ? 'none' : '1px solid var(--aureo-border)' }}>
              {d.icono}
              <div className="flex-1 min-w-0">
                <div className="text-[15px] font-semibold truncate">{d.titulo}</div>
                <div className="text-[12px] truncate" style={{ color: 'var(--aureo-text-dim)' }}>{d.sub}</div>
              </div>
              <div className="tabular text-[15px] font-semibold">{oculto ? '••• €' : fmt2(d.importe)}</div>
              <button onClick={() => onBorrar(it.id)} aria-label="Borrar"
                className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition w-7 h-7 rounded-full grid place-items-center flex-shrink-0"
                style={{ background: 'var(--aureo-bg)' }}>
                <Trash2 className="w-3.5 h-3.5" style={{ color: 'var(--aureo-text-dim)' }} />
              </button>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </motion.section>
  )
}

function AltaSuscripcion({ onClose, onCrear }) {
  const [plataforma, setPlataforma] = useState('netflix')
  const p = plataformaDe(plataforma)
  const [plan, setPlan] = useState(p.planes[0].nombre)
  const [cuota, setCuota] = useState(String(p.planes[0].precio).replace('.', ','))
  const [dia, setDia] = useState('1')
  const [guardando, setGuardando] = useState(false)

  const elegir = (id) => {
    const nueva = plataformaDe(id)
    setPlataforma(id)
    setPlan(nueva.planes[0].nombre)
    setCuota(String(nueva.planes[0].precio).replace('.', ','))
  }

  const elegirPlan = (nombre) => {
    setPlan(nombre)
    const encontrado = p.planes.find((x) => x.nombre === nombre)
    if (encontrado) setCuota(String(encontrado.precio).replace('.', ','))
  }

  const enviar = async (e) => {
    e.preventDefault()
    const valor = parseFloat(String(cuota).replace(',', '.'))
    if (!valor || valor <= 0 || guardando) return
    setGuardando(true)
    await onCrear('suscripciones', { plataforma, plan, cuota: valor, dia: Number(dia) || 1 })
    setGuardando(false)
    onClose()
  }

  return (
    <Sheet title="Nueva suscripción" onClose={onClose} onSubmit={enviar}>
      <div className="mb-5">
        <span className="text-[11px] uppercase tracking-wider block mb-2.5" style={{ color: 'var(--aureo-text-mute)' }}>Plataforma</span>
        <div className="grid grid-cols-4 gap-2 max-h-52 overflow-y-auto no-scrollbar">
          {PLATAFORMAS.map((x) => {
            const activa = x.id === plataforma
            return (
              <button key={x.id} type="button" onClick={() => elegir(x.id)}
                className="flex flex-col items-center gap-1.5 p-2 rounded-2xl transition"
                style={{ background: activa ? 'var(--aureo-purple-soft)' : 'transparent', border: `1px solid ${activa ? 'var(--aureo-purple)' : 'var(--aureo-border)'}` }}>
                <Logo plataforma={x} size={36} />
                <span className="text-[10px] font-medium text-center leading-tight line-clamp-2">{x.nombre}</span>
              </button>
            )
          })}
        </div>
      </div>

      <Campo label="Plan">
        <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-1 px-1 pt-1">
          {p.planes.map((x) => {
            const activo = plan === x.nombre
            return (
              <button key={x.nombre} type="button" onClick={() => elegirPlan(x.nombre)}
                className="px-3.5 py-2 rounded-full text-[13px] font-medium whitespace-nowrap transition"
                style={{ background: activo ? p.color : `${p.color}1A`, color: activo ? '#fff' : p.color }}>
                {x.nombre}
              </button>
            )
          })}
        </div>
      </Campo>

      <Campo label="Cuota mensual">
        <div className="flex items-baseline gap-1">
          <span className="text-[32px] font-semibold" style={{ color: 'var(--aureo-text-mute)' }}>€</span>
          <input inputMode="decimal" value={cuota} onChange={(e) => setCuota(e.target.value)}
            className="flex-1 min-w-0 bg-transparent outline-none tabular text-[32px] font-semibold" />
        </div>
      </Campo>

      <Campo label="Día de cobro">
        <input inputMode="numeric" value={dia} onChange={(e) => setDia(e.target.value)}
          className="w-full bg-transparent outline-none text-[16px]" />
      </Campo>

      <Boton type="submit" disabled={guardando}>{guardando ? 'Guardando…' : 'Añadir suscripción'}</Boton>
    </Sheet>
  )
}

function AltaRecibo({ onClose, onCrear }) {
  const [tipo, setTipo] = useState('luz')
  const [companyia, setCompanyia] = useState('')
  const [importe, setImporte] = useState('')
  const [dia, setDia] = useState('1')
  const [periodicidad, setPeriodicidad] = useState('mensual')
  const [guardando, setGuardando] = useState(false)
  const t = tipoReciboDe(tipo)

  const enviar = async (e) => {
    e.preventDefault()
    const valor = parseFloat(String(importe).replace(',', '.'))
    if (!valor || valor <= 0 || guardando) return
    setGuardando(true)
    await onCrear('recibos', { tipo, companyia: companyia.trim() || null, importe: valor, dia: Number(dia) || 1, periodicidad })
    setGuardando(false)
    onClose()
  }

  return (
    <Sheet title="Nuevo recibo" onClose={onClose} onSubmit={enviar}>
      <div className="mb-5">
        <span className="text-[11px] uppercase tracking-wider block mb-2.5" style={{ color: 'var(--aureo-text-mute)' }}>Tipo</span>
        <div className="grid grid-cols-5 gap-2">
          {TIPOS_RECIBO.map((x) => {
            const Icon = ICONOS_RECIBO[x.icono] ?? Receipt
            const activo = x.id === tipo
            return (
              <button key={x.id} type="button" onClick={() => setTipo(x.id)}
                className="flex flex-col items-center gap-1 p-2 rounded-2xl transition"
                style={{ background: activo ? x.bg : 'transparent', border: `1px solid ${activo ? x.color : 'var(--aureo-border)'}` }}>
                <Icon className="w-5 h-5" style={{ color: x.color }} strokeWidth={2.1} />
                <span className="text-[9px] font-medium leading-tight">{x.nombre}</span>
              </button>
            )
          })}
        </div>
      </div>

      <Campo label="Compañía (opcional)">
        <input value={companyia} onChange={(e) => setCompanyia(e.target.value)} placeholder="Iberdrola, Movistar…" maxLength={60}
          className="w-full bg-transparent outline-none text-[16px]" />
      </Campo>

      <Campo label="Importe">
        <div className="flex items-baseline gap-1">
          <span className="text-[32px] font-semibold" style={{ color: 'var(--aureo-text-mute)' }}>€</span>
          <input autoFocus inputMode="decimal" value={importe} onChange={(e) => setImporte(e.target.value)}
            placeholder={String(t.tipico).replace('.', ',')}
            className="flex-1 min-w-0 bg-transparent outline-none tabular text-[32px] font-semibold" />
        </div>
      </Campo>

      <Campo label="Periodicidad">
        <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-1 px-1 pt-1">
          {['mensual', 'bimestral', 'trimestral', 'anual'].map((p) => {
            const activo = periodicidad === p
            return (
              <button key={p} type="button" onClick={() => setPeriodicidad(p)}
                className="px-3.5 py-2 rounded-full text-[13px] font-medium capitalize transition"
                style={{ background: activo ? t.color : t.bg, color: activo ? '#fff' : t.color }}>
                {p}
              </button>
            )
          })}
        </div>
      </Campo>

      <Campo label="Día de cargo">
        <input inputMode="numeric" value={dia} onChange={(e) => setDia(e.target.value)}
          className="w-full bg-transparent outline-none text-[16px]" />
      </Campo>

      <Boton type="submit" disabled={guardando}>{guardando ? 'Guardando…' : 'Añadir recibo'}</Boton>
    </Sheet>
  )
}
