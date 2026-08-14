'use client'

import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Trash2, CreditCard, Banknote, Home, Calendar, Users, TrendingDown } from 'lucide-react'
import { TIPOS_DEUDA, tipoDeudaDe } from '@/lib/catalogo'
import { fmt, fmt2, PageHeader, Sheet, Campo, Boton, Vacio } from './ui'

const ICONOS = { creditcard: CreditCard, banknote: Banknote, home: Home, calendar: Calendar, users: Users }

export default function DeudaView({ deudas, onBack, oculto, onCrear, onBorrar }) {
  const [abierto, setAbierto] = useState(false)

  const { pendiente, cuotas, cara } = useMemo(() => {
    const pendiente = deudas.reduce((s, d) => s + Number(d.pendiente), 0)
    const cuotas = deudas.reduce((s, d) => s + Number(d.cuota), 0)
    // La deuda cara es la que hay que matar primero: metodo avalancha.
    const cara = [...deudas].sort((a, b) => (Number(b.tae) || 0) - (Number(a.tae) || 0))[0] ?? null
    return { pendiente, cuotas, cara }
  }, [deudas])

  const mesesLibre = cuotas > 0 ? Math.ceil(pendiente / cuotas) : 0

  return (
    <>
      <PageHeader title="Deuda" onBack={onBack} />

      <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-[28px] p-6 text-white relative overflow-hidden"
        style={{
          background: 'radial-gradient(120% 100% at 0% 0%, rgba(255,255,255,0.16) 0%, transparent 55%), linear-gradient(140deg, #B91C1C 0%, #7F1D1D 55%, #450A0A 100%)',
          boxShadow: '0 20px 40px -20px rgba(127,29,29,0.45)',
        }}>
        <span className="chip"><TrendingDown className="w-3.5 h-3.5" /> Deuda pendiente</span>
        <div className="tabular text-[42px] font-semibold mt-4 leading-none">{oculto ? '••••,•• €' : fmt2(pendiente)}</div>
        <div className="text-[13px] text-white/80 mt-2">
          {oculto ? '•••' : fmt(cuotas)}/mes
          {mesesLibre > 0 && ` · libre en ~${mesesLibre} ${mesesLibre === 1 ? 'mes' : 'meses'}`}
        </div>
      </motion.section>

      {cara && Number(cara.tae) > 0 && (
        <div className="aureo-card mt-4 p-4 flex items-start gap-3">
          <div className="w-9 h-9 rounded-full grid place-items-center flex-shrink-0" style={{ background: '#FEE2E2' }}>
            <TrendingDown className="w-4 h-4" style={{ color: '#EF4444' }} />
          </div>
          <div className="text-[13px]" style={{ color: 'var(--aureo-text-dim)' }}>
            <b style={{ color: 'var(--aureo-text)' }}>{cara.nombre}</b> es tu deuda más cara ({Number(cara.tae).toFixed(2)}% TAE).
            Cada euro extra que le metas rinde más que cualquier ahorro.
          </div>
        </div>
      )}

      <div className="mt-4">
        {!deudas.length ? (
          <Vacio icon={CreditCard} titulo="Sin deudas" texto="Préstamos, financiaciones, tarjetas o pagos aplazados" />
        ) : (
          <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="aureo-card overflow-hidden">
            <AnimatePresence>
              {deudas.map((d, i) => {
                const t = tipoDeudaDe(d.tipo)
                const Icon = ICONOS[t.icono] ?? Banknote
                const total = Number(d.pendiente)
                const cuota = Number(d.cuota)
                const meses = d.meses_restantes
                return (
                  <motion.div key={d.id} exit={{ opacity: 0, height: 0 }}
                    className="px-5 py-4 group" style={{ borderTop: i === 0 ? 'none' : '1px solid var(--aureo-border)' }}>
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-full grid place-items-center flex-shrink-0" style={{ background: t.bg }}>
                        <Icon className="w-5 h-5" style={{ color: t.color }} strokeWidth={2.1} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[15px] font-semibold truncate">{d.nombre}</div>
                        <div className="text-[12px] truncate" style={{ color: 'var(--aureo-text-dim)' }}>
                          {d.entidad ? `${d.entidad} · ` : ''}{fmt2(cuota)}/mes · día {d.dia}
                          {d.tae ? ` · ${Number(d.tae).toFixed(2)}% TAE` : ''}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="tabular text-[15px] font-semibold">{oculto ? '••• €' : fmt2(total)}</div>
                        <div className="text-[11px]" style={{ color: 'var(--aureo-text-mute)' }}>
                          {meses ? `${meses} meses` : 'sin fin fijo'}
                        </div>
                      </div>
                      <button onClick={() => onBorrar('deudas', d.id)} aria-label="Borrar"
                        className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition w-7 h-7 rounded-full grid place-items-center flex-shrink-0"
                        style={{ background: 'var(--aureo-bg)' }}>
                        <Trash2 className="w-3.5 h-3.5" style={{ color: 'var(--aureo-text-dim)' }} />
                      </button>
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </motion.section>
        )}
      </div>

      <button onClick={() => setAbierto(true)}
        className="pill-button w-full h-14 mt-4 flex items-center justify-center gap-2 font-semibold"
        style={{ background: 'var(--aureo-purple-soft)', color: 'var(--aureo-purple)' }}>
        <Plus className="w-5 h-5" /> Añadir deuda
      </button>

      <AnimatePresence>
        {abierto && <AltaDeuda onClose={() => setAbierto(false)} onCrear={onCrear} />}
      </AnimatePresence>
    </>
  )
}

function AltaDeuda({ onClose, onCrear }) {
  const [tipo, setTipo] = useState('prestamo')
  const [nombre, setNombre] = useState('')
  const [entidad, setEntidad] = useState('')
  const [pendiente, setPendiente] = useState('')
  const [cuota, setCuota] = useState('')
  const [dia, setDia] = useState('1')
  const [tae, setTae] = useState('')
  const [guardando, setGuardando] = useState(false)
  const t = tipoDeudaDe(tipo)

  const enviar = async (e) => {
    e.preventDefault()
    const saldo = parseFloat(String(pendiente).replace(',', '.'))
    const mensual = parseFloat(String(cuota).replace(',', '.'))
    if (!saldo || !mensual || saldo <= 0 || mensual <= 0 || guardando) return
    setGuardando(true)
    await onCrear('deudas', {
      tipo,
      nombre: nombre.trim() || t.nombre,
      entidad: entidad.trim() || null,
      pendiente: saldo,
      cuota: mensual,
      dia: Number(dia) || 1,
      tae: tae ? parseFloat(String(tae).replace(',', '.')) : null,
    })
    setGuardando(false)
    onClose()
  }

  return (
    <Sheet title="Nueva deuda" onClose={onClose} onSubmit={enviar}>
      <div className="mb-5">
        <span className="text-[11px] uppercase tracking-wider block mb-2.5" style={{ color: 'var(--aureo-text-mute)' }}>Tipo</span>
        <div className="grid grid-cols-3 gap-2">
          {TIPOS_DEUDA.map((x) => {
            const Icon = ICONOS[x.icono] ?? Banknote
            const activo = x.id === tipo
            return (
              <button key={x.id} type="button" onClick={() => setTipo(x.id)}
                className="flex flex-col items-center gap-1.5 p-3 rounded-2xl transition"
                style={{ background: activo ? x.bg : 'transparent', border: `1px solid ${activo ? x.color : 'var(--aureo-border)'}` }}>
                <Icon className="w-5 h-5" style={{ color: x.color }} strokeWidth={2.1} />
                <span className="text-[10px] font-medium text-center leading-tight">{x.nombre}</span>
              </button>
            )
          })}
        </div>
      </div>

      <Campo label="Nombre">
        <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder={t.nombre} maxLength={60}
          className="w-full bg-transparent outline-none text-[16px]" />
      </Campo>

      <Campo label="Entidad (opcional)">
        <input value={entidad} onChange={(e) => setEntidad(e.target.value)} placeholder="Santander, CaixaBank…" maxLength={60}
          className="w-full bg-transparent outline-none text-[16px]" />
      </Campo>

      <Campo label="Pendiente">
        <div className="flex items-baseline gap-1">
          <span className="text-[32px] font-semibold" style={{ color: 'var(--aureo-text-mute)' }}>€</span>
          <input autoFocus inputMode="decimal" value={pendiente} onChange={(e) => setPendiente(e.target.value)} placeholder="0,00"
            className="flex-1 min-w-0 bg-transparent outline-none tabular text-[32px] font-semibold" />
        </div>
      </Campo>

      <div className="grid grid-cols-2 gap-4">
        <Campo label="Cuota/mes">
          <input inputMode="decimal" value={cuota} onChange={(e) => setCuota(e.target.value)} placeholder="0,00"
            className="w-full bg-transparent outline-none tabular text-[18px] font-semibold" />
        </Campo>
        <Campo label="TAE % (opcional)">
          <input inputMode="decimal" value={tae} onChange={(e) => setTae(e.target.value)} placeholder="0,00"
            className="w-full bg-transparent outline-none tabular text-[18px] font-semibold" />
        </Campo>
      </div>

      <Campo label="Día de cargo">
        <input inputMode="numeric" value={dia} onChange={(e) => setDia(e.target.value)}
          className="w-full bg-transparent outline-none text-[16px]" />
      </Campo>

      <Boton type="submit" disabled={guardando}>{guardando ? 'Guardando…' : 'Añadir deuda'}</Boton>
    </Sheet>
  )
}
