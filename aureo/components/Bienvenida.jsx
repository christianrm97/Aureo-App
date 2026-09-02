'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Trash2, Landmark, PiggyBank, CreditCard, Banknote, LineChart, Wallet, Check } from 'lucide-react'
import AureoRobot from './AureoRobot'
import { fmt2, api, Boton } from './ui'

const ICONOS = {
  landmark: Landmark, piggybank: PiggyBank, creditcard: CreditCard,
  banknote: Banknote, linechart: LineChart, wallet: Wallet,
}

/** Atajos para no escribir de cero. El usuario cambia lo que quiera. */
const PLANTILLAS = [
  { nombre: 'Cuenta corriente', icon: 'landmark',   color: '#6C2BD9', bg: '#EFE7FB', hub: true },
  { nombre: 'Ahorro',           icon: 'piggybank',  color: '#EF4444', bg: '#FEE2E2' },
  { nombre: 'Tarjeta',          icon: 'creditcard', color: '#8B5CF6', bg: '#EDE4FE' },
  { nombre: 'Efectivo',         icon: 'banknote',   color: '#F59E0B', bg: '#FEF3C7' },
  { nombre: 'Inversión',        icon: 'linechart',  color: '#14B8A6', bg: '#CCFBF1', inversion: true },
  { nombre: 'Otra',             icon: 'wallet',     color: '#3B82F6', bg: '#DBEAFE' },
]

export default function Bienvenida({ nombre, onListo }) {
  const [cuentas, setCuentas] = useState([])
  const [plantilla, setPlantilla] = useState(PLANTILLAS[0])
  const [nombreCuenta, setNombreCuenta] = useState('')
  const [saldo, setSaldo] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState(null)

  const total = cuentas.reduce((s, c) => s + c.saldo, 0)

  const anadir = (e) => {
    e.preventDefault()
    const valor = parseFloat(String(saldo).replace(',', '.'))
    if (!Number.isFinite(valor)) { setError('Escribe el saldo, aunque sea 0'); return }
    setError(null)
    setCuentas((prev) => [...prev, {
      ...plantilla,
      nombre: nombreCuenta.trim() || plantilla.nombre,
      saldo: Math.round(valor * 100) / 100,
      tmp: Math.random().toString(36).slice(2),
    }])
    setNombreCuenta('')
    setSaldo('')
  }

  const guardar = async () => {
    if (!cuentas.length || guardando) return
    setGuardando(true)
    setError(null)
    for (const c of cuentas) {
      const res = await api('cuentas', {
        method: 'POST',
        body: JSON.stringify({
          nombre: c.nombre, saldo: c.saldo, icon: c.icon, color: c.color, bg: c.bg,
          hub: Boolean(c.hub), inversion: Boolean(c.inversion),
        }),
      }).catch(() => null)
      if (!res || !res.ok) {
        setError('No se pudieron guardar las cuentas. Inténtalo otra vez.')
        setGuardando(false)
        return
      }
    }
    onListo()
  }

  return (
    <div className="min-h-screen pb-10" style={{ background: 'var(--aureo-bg)' }}>
      <div className="max-w-md mx-auto px-4 py-8">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          className="hero-gradient rounded-[28px] p-6 text-white relative overflow-hidden">
          <span className="chip">Bienvenido</span>
          <h1 className="text-[22px] font-semibold leading-tight mt-3 max-w-[74%]">
            Hola{nombre ? ', ' + nombre.split(' ')[0] : ''}. Empecemos por tus cuentas
          </h1>
          <p className="text-[13px] text-white/85 mt-2 max-w-[74%] leading-relaxed">
            Dime dónde tienes el dinero y cuánto hay. Con eso ya puedo calcular tu patrimonio.
          </p>
          <AureoRobot size={92} variant="lavanda" vivo humor="feliz"
            className="absolute -right-2 -bottom-2 pointer-events-none" />
        </motion.div>

        <form onSubmit={anadir} className="aureo-card mt-5 p-5">
          <span className="text-[11px] uppercase tracking-wider block mb-2.5" style={{ color: 'var(--aureo-text-mute)' }}>
            Tipo de cuenta
          </span>
          <div className="grid grid-cols-3 gap-2 mb-5">
            {PLANTILLAS.map((p) => {
              const Icon = ICONOS[p.icon]
              const activa = plantilla.nombre === p.nombre
              return (
                <button key={p.nombre} type="button" onClick={() => setPlantilla(p)}
                  className="flex flex-col items-center gap-1.5 p-2.5 rounded-2xl transition"
                  style={{ background: activa ? p.bg : 'transparent', border: '1px solid ' + (activa ? p.color : 'var(--aureo-border)') }}>
                  <Icon className="w-5 h-5" style={{ color: p.color }} strokeWidth={2.1} />
                  <span className="text-[10px] font-medium leading-tight text-center">{p.nombre}</span>
                </button>
              )
            })}
          </div>

          <span className="text-[11px] uppercase tracking-wider block mb-1" style={{ color: 'var(--aureo-text-mute)' }}>
            Nombre
          </span>
          <input value={nombreCuenta} onChange={(e) => setNombreCuenta(e.target.value)} maxLength={40}
            placeholder={plantilla.nombre === 'Efectivo' ? 'Ej. Cartera' : 'Ej. OpenBank'}
            className="w-full bg-transparent outline-none text-[16px]" />
          <div className="h-px mt-2 mb-5" style={{ background: 'var(--aureo-border)' }} />

          <span className="text-[11px] uppercase tracking-wider block mb-1" style={{ color: 'var(--aureo-text-mute)' }}>
            Saldo actual
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-[32px] font-semibold" style={{ color: 'var(--aureo-text-mute)' }}>€</span>
            <input inputMode="decimal" value={saldo} onChange={(e) => setSaldo(e.target.value)} placeholder="0,00"
              className="flex-1 min-w-0 bg-transparent outline-none tabular text-[32px] font-semibold" />
          </div>
          <div className="h-px mt-2 mb-4" style={{ background: 'var(--aureo-border)' }} />

          <button type="submit"
            className="pill-button w-full h-12 flex items-center justify-center gap-2 font-semibold"
            style={{ background: 'var(--aureo-purple-soft)', color: 'var(--aureo-purple)' }}>
            <Plus className="w-4 h-4" /> Añadir esta cuenta
          </button>
        </form>

        <AnimatePresence>
          {cuentas.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className="aureo-card mt-4 overflow-hidden">
              {cuentas.map((c, i) => {
                const Icon = ICONOS[c.icon]
                return (
                  <div key={c.tmp} className="flex items-center gap-3 px-5 py-3.5"
                    style={{ borderTop: i === 0 ? 'none' : '1px solid var(--aureo-border)' }}>
                    <div className="w-10 h-10 rounded-full grid place-items-center flex-shrink-0" style={{ background: c.bg }}>
                      <Icon className="w-4 h-4" style={{ color: c.color }} strokeWidth={2.1} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[14px] font-semibold truncate">{c.nombre}</div>
                      {c.inversion && <div className="text-[11px]" style={{ color: 'var(--aureo-text-mute)' }}>Inversión</div>}
                    </div>
                    <div className="tabular text-[14px] font-semibold">{fmt2(c.saldo)}</div>
                    <button onClick={() => setCuentas((p) => p.filter((x) => x.tmp !== c.tmp))} aria-label="Quitar"
                      className="w-7 h-7 rounded-full grid place-items-center flex-shrink-0" style={{ background: 'var(--aureo-bg)' }}>
                      <Trash2 className="w-3.5 h-3.5" style={{ color: 'var(--aureo-text-dim)' }} />
                    </button>
                  </div>
                )
              })}
              <div className="flex items-center justify-between px-5 py-3.5"
                style={{ borderTop: '1px solid var(--aureo-border)', background: 'var(--aureo-surface-2)' }}>
                <span className="text-[13px] font-semibold">Patrimonio inicial</span>
                <span className="tabular text-[16px] font-semibold" style={{ color: 'var(--aureo-purple)' }}>{fmt2(total)}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {error && <div className="mt-3 text-[13px] text-center" style={{ color: 'var(--aureo-red)' }}>{error}</div>}

        <div className="mt-5">
          <Boton type="button" onClick={guardar} disabled={!cuentas.length || guardando}>
            {guardando ? 'Guardando…' : 'Entrar en Aureo'}
          </Boton>
          <p className="text-[11.5px] text-center mt-3 leading-relaxed" style={{ color: 'var(--aureo-text-mute)' }}>
            Podrás editar los saldos y añadir más cuentas cuando quieras.
          </p>
        </div>
      </div>
    </div>
  )
}
