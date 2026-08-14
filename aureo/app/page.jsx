'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, ReferenceLine,
  PieChart, Pie, Cell,
} from 'recharts'
import {
  Plus, ArrowUpRight, ArrowDownLeft, PieChart as PieIcon, Target,
  Home, CreditCard, Bell, Repeat, Calendar, Landmark, PiggyBank, Users,
  Banknote, LineChart, Wallet, X, TrendingUp, Sparkles, Eye, EyeOff,
  Trash2, RefreshCw, ArrowUp, ArrowDown, Receipt, TrendingDown, AlertTriangle,
} from 'lucide-react'

import AureoRobot from '@/components/AureoRobot'
import FijosView, { mensualizar } from '@/components/FijosView'
import DeudaView from '@/components/DeudaView'
import ConsejoAureo, { useConsejoDiario } from '@/components/ConsejoAureo'
import { fmt, fmt2, api, SectionHeader, PageHeader, Vacio } from '@/components/ui'
import { plataformaDe, tipoReciboDe } from '@/lib/catalogo'
import { resumen, analizar, proyectar, impactoGasto } from '@/lib/finanzas'

// -------------- DATOS BASE --------------
const CUENTAS_BASE = [
  { id: 'openbank',   nombre: 'OpenBank',       subtitulo: 'Cuenta remunerada 2,47%', saldo: 1539.00, icon: 'landmark',  color: '#6C2BD9', bg: '#EFE7FB', hub: true },
  { id: 'santander',  nombre: 'Santander',      subtitulo: 'Cuenta principal',        saldo: 200.00,  icon: 'piggybank', color: '#EF4444', bg: '#FEE2E2' },
  { id: 'pareja',     nombre: 'Cuenta pareja',  subtitulo: 'Santander conjunta',      saldo: 150.00,  icon: 'users',     color: '#EC4899', bg: '#FCE7F3' },
  { id: 'bleap',      nombre: 'Bleap',          subtitulo: 'Gasto diario',            saldo: 106.71,  icon: 'creditcard', color: '#8B5CF6', bg: '#EDE4FE' },
  { id: 'cajamar',    nombre: 'Cajamar',        subtitulo: 'Reserva',                 saldo: 100.00,  icon: 'banknote',  color: '#F59E0B', bg: '#FEF3C7' },
  { id: 'myinvestor', nombre: 'MyInvestor',     subtitulo: 'S&P 500 — Inversión',     saldo: 136.00,  icon: 'linechart', color: '#14B8A6', bg: '#CCFBF1', inversion: true },
]

const ICONS = {
  landmark: Landmark, piggybank: PiggyBank, users: Users, creditcard: CreditCard,
  banknote: Banknote, linechart: LineChart, sparkles: Sparkles,
}

const OBJETIVO = 3663
const FECHA_OBJETIVO = new Date(2027, 0, 1)

const CATEGORIAS = [
  { id: 'Bleap',         label: 'Bleap',         color: '#8B5CF6', bg: '#EDE4FE' },
  { id: 'Cuenta Pareja', label: 'Cuenta Pareja', color: '#EC4899', bg: '#FCE7F3' },
  { id: 'Efectivo',      label: 'Efectivo',      color: '#F59E0B', bg: '#FEF3C7' },
  { id: 'Suscripcion',   label: 'Suscripción',   color: '#3B82F6', bg: '#DBEAFE' },
  { id: 'Recibo',        label: 'Recibo',        color: '#22C55E', bg: '#DCFCE7' },
]

const catDe = (id) => CATEGORIAS.find((c) => c.id === id) || CATEGORIAS[0]

// ==================== APP ====================
export default function App() {
  const [gastos, setGastos] = useState([])
  const [recurrentes, setRecurrentes] = useState([])
  const [suscripciones, setSuscripciones] = useState([])
  const [recibos, setRecibos] = useState([])
  const [deudas, setDeudas] = useState([])
  const [noticias, setNoticias] = useState([])
  const [precios, setPrecios] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [oculto, setOculto] = useState(false)
  const [tab, setTab] = useState('home')
  const [consejoAbierto, setConsejoAbierto] = useConsejoDiario()

  const setters = useMemo(() => ({
    suscripciones: setSuscripciones, recibos: setRecibos, deudas: setDeudas,
  }), [])

  const cargar = useCallback(async () => {
    const [g, r, s, re, d, p] = await Promise.all([
      api('gastos?limit=100').catch(() => null),
      api('recurrentes').catch(() => null),
      api('suscripciones').catch(() => null),
      api('recibos').catch(() => null),
      api('deudas').catch(() => null),
      api('precios').catch(() => null),
    ])
    if (g?.items) setGastos(g.items)
    if (r?.items) setRecurrentes(r.items)
    if (s?.items) setSuscripciones(s.items)
    if (re?.items) setRecibos(re.items)
    if (d?.items) setDeudas(d.items)
    if (p?.data) setPrecios(p.data)
  }, [])

  useEffect(() => { cargar() }, [cargar])

  // Las noticias van aparte: caducan en 15 min, no en 60 s
  useEffect(() => {
    api('noticias').then((n) => n?.items && setNoticias(n.items)).catch(() => {})
  }, [])

  useEffect(() => {
    const t = setInterval(cargar, 60_000)
    return () => clearInterval(t)
  }, [cargar])

  const gastadoTotal = useMemo(() => gastos.reduce((s, g) => s + Number(g.importe), 0), [gastos])

  const cuentas = useMemo(() => {
    const spChange = precios?.sp500?.changePct ?? 0
    return CUENTAS_BASE.map((c) => {
      if (c.id === 'myinvestor' && precios?.sp500?.price) {
        return { ...c, saldo: c.saldo + c.saldo * (spChange / 100), changePct: spChange, live: true }
      }
      return c
    })
  }, [precios])

  const patrimonio = useMemo(() => cuentas.reduce((s, c) => s + c.saldo, 0) - gastadoTotal, [cuentas, gastadoTotal])
  const liquido = useMemo(() => cuentas.filter((c) => !c.inversion).reduce((s, c) => s + c.saldo, 0) - gastadoTotal, [cuentas, gastadoTotal])
  const progreso = Math.min(100, Math.max(0, (liquido / OBJETIVO) * 100))

  // Estado que consume el motor: todo lo que compromete dinero cada mes
  const estado = useMemo(() => ({
    liquido,
    objetivo: OBJETIVO,
    fechaObjetivo: FECHA_OBJETIVO,
    recurrentes: recurrentes.map((r) => ({ importe: Number(r.importe), tipo: r.tipo, dia: r.dia })),
    suscripciones: suscripciones.map((s) => ({ cuota: Number(s.cuota) })),
    recibos: recibos.map((r) => ({ importe: mensualizar({ ...r, importe: Number(r.importe) }) })),
    deudas: deudas.map((d) => ({ cuota: Number(d.cuota), pendiente: Number(d.pendiente), tipo: d.tipo })),
    inversionMensual: recurrentes.filter((r) => r.tipo === 'inversion').reduce((s, r) => s + Math.abs(Number(r.importe)), 0),
  }), [liquido, recurrentes, suscripciones, recibos, deudas])

  const balance = useMemo(() => resumen(estado), [estado])
  const analisis = useMemo(() => analizar(estado), [estado])
  const proyeccion = useMemo(() => proyectar(estado), [estado])

  const crear = async (coleccion, datos) => {
    const res = await api(coleccion, { method: 'POST', body: JSON.stringify(datos) })
    if (res.ok) setters[coleccion]((prev) => [...prev, res.item])
    return res
  }

  const borrar = async (coleccion, id) => {
    await api(`${coleccion}/${id}`, { method: 'DELETE' })
    setters[coleccion]((prev) => prev.filter((x) => x.id !== id))
  }

  const handleAddGasto = async (g) => {
    const res = await api('gastos', { method: 'POST', body: JSON.stringify(g) })
    if (res.ok) setGastos((prev) => [res.gasto, ...prev])
    setModalOpen(false)
  }

  const handleDelete = async (id) => {
    await api(`gastos/${id}`, { method: 'DELETE' })
    setGastos((prev) => prev.filter((x) => x.id !== id))
  }

  return (
    <div className="min-h-screen pb-28" style={{ background: 'var(--aureo-bg)' }}>
      <div className="max-w-md mx-auto px-4 pt-3">
        {/* Header */}
        <div className="flex items-center justify-between py-3">
          <div className="flex items-center gap-2">
            <AureoRobot size={44} variant="lavanda" vivo humor={analisis.severidad === 'ok' ? 'feliz' : 'pensando'} />
            <div className="flex flex-col -mt-0.5">
              <span className="text-[26px] font-bold leading-none tracking-tight" style={{ color: 'var(--aureo-purple)' }}>Aureo</span>
              <span className="text-[12px] leading-tight" style={{ color: 'var(--aureo-text-mute)' }}>Hola, Christian</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button onClick={() => setOculto((v) => !v)} aria-label={oculto ? 'Mostrar importes' : 'Ocultar importes'}
              className="w-9 h-9 rounded-full grid place-items-center" style={{ background: '#fff', border: '1px solid var(--aureo-border)' }}>
              {oculto ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
            <button onClick={() => setConsejoAbierto(true)} aria-label="Consejo de Aureo"
              className="w-9 h-9 rounded-full grid place-items-center relative" style={{ background: '#fff', border: '1px solid var(--aureo-border)' }}>
              <Bell className="w-4 h-4" />
              <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full" style={{ background: 'var(--aureo-purple)' }} />
            </button>
          </div>
        </div>

        {tab === 'home' && (
          <>
            <HeroCard patrimonio={patrimonio} liquido={liquido} oculto={oculto} spChange={precios?.sp500?.changePct}
              onRobot={() => setConsejoAbierto(true)} humor={analisis.severidad === 'riesgo' ? 'alerta' : 'feliz'} />
            <ActionsRow onAdd={() => setModalOpen(true)} onFijos={() => setTab('fijos')} onGoal={() => setTab('goal')} onDeuda={() => setTab('deuda')} />
            <AnalisisAureo analisis={analisis} oculto={oculto} onAbrir={() => setConsejoAbierto(true)} />
            <SpaceObjetivo liquido={liquido} objetivo={OBJETIVO} progreso={progreso} oculto={oculto} analisis={analisis} />
            <SectionHeader title="Cuentas" />
            <CuentasLista cuentas={cuentas} gastadoTotal={gastadoTotal} oculto={oculto} />
            <SectionHeader title="Compromisos" right="Ver todos" onRight={() => setTab('fijos')} />
            <ResumenCompromisos balance={balance} oculto={oculto}
              onFijos={() => setTab('fijos')} onDeuda={() => setTab('deuda')}
              nSubs={suscripciones.length} nRecibos={recibos.length} nDeudas={deudas.length} />
            <SectionHeader title="Próximas" right="Ver todas" onRight={() => setTab('fijos')} />
            <RecurrentesWidget recurrentes={recurrentes} oculto={oculto} />
            <SectionHeader title="Proyección" right="Ene 2027" />
            <ProyeccionCard data={proyeccion} objetivo={OBJETIVO} balance={balance} />
            <SectionHeader title="Actividad reciente" right={gastos.length > 6 ? 'Ver todo' : null} onRight={() => setTab('analysis')} />
            <UltimosGastos gastos={gastos} onDelete={handleDelete} />
          </>
        )}

        {tab === 'analysis' && <AnalisisView gastos={gastos} onBack={() => setTab('home')} oculto={oculto} />}

        {tab === 'fijos' && (
          <FijosView suscripciones={suscripciones} recibos={recibos} recurrentes={recurrentes}
            onBack={() => setTab('home')} oculto={oculto} onCrear={crear} onBorrar={borrar} />
        )}

        {tab === 'deuda' && (
          <DeudaView deudas={deudas} onBack={() => setTab('home')} oculto={oculto} onCrear={crear} onBorrar={borrar} />
        )}

        {tab === 'goal' && (
          <GoalView liquido={liquido} objetivo={OBJETIVO} progreso={progreso} proyeccion={proyeccion}
            analisis={analisis} balance={balance} onBack={() => setTab('home')} oculto={oculto} />
        )}
      </div>

      <BottomNav onAdd={() => setModalOpen(true)} tab={tab} setTab={setTab} />

      <AnimatePresence>
        {modalOpen && <ModalGasto onClose={() => setModalOpen(false)} onSubmit={handleAddGasto} estado={estado} />}
      </AnimatePresence>

      <AnimatePresence>
        {consejoAbierto && (
          <ConsejoAureo analisis={analisis} noticias={noticias} onClose={() => setConsejoAbierto(false)} />
        )}
      </AnimatePresence>
    </div>
  )
}

// -------------- HERO --------------
function HeroCard({ patrimonio, liquido, oculto, spChange, onRobot, humor }) {
  const mask = (v) => (oculto ? '••••,•• €' : fmt2(v))
  const isPos = (spChange || 0) >= 0
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="hero-gradient rounded-[28px] p-6 text-white relative overflow-hidden"
      style={{ boxShadow: '0 20px 40px -20px rgba(76, 29, 149, 0.45)' }}
    >
      <div className="flex items-center justify-between">
        <span className="chip"><Wallet className="w-3.5 h-3.5" /> Patrimonio total</span>
        {spChange != null && (
          <span className="chip">
            {isPos ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
            S&amp;P {spChange.toFixed(2)}%
          </span>
        )}
      </div>
      <motion.div key={String(oculto) + patrimonio} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="mt-6">
        <div className="tabular text-[46px] font-semibold leading-none tracking-tight">{mask(patrimonio)}</div>
      </motion.div>
      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-white/80">
          <TrendingUp className="w-4 h-4" />
          <span className="text-[13px]">Líquido</span>
          <span className="tabular text-[13px] font-medium text-white">{mask(liquido)}</span>
        </div>
        <div className="text-[12px] text-white/70 flex items-center gap-1">
          <RefreshCw className="w-3 h-3" /> En vivo
        </div>
      </div>
      <div className="absolute -right-16 -bottom-16 w-56 h-56 rounded-full" style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.10) 0%, transparent 70%)' }} />
      <button onClick={onRobot} aria-label="Hablar con Aureo" className="absolute right-1 bottom-0">
        <AureoRobot size={104} variant="lavanda" vivo humor={humor} />
      </button>
    </motion.section>
  )
}

function ActionsRow({ onAdd, onFijos, onGoal, onDeuda }) {
  const items = [
    { label: 'Añadir',   icon: Plus,        onClick: onAdd, primary: true },
    { label: 'Fijos',    icon: Repeat,      onClick: onFijos },
    { label: 'Objetivo', icon: Target,      onClick: onGoal },
    { label: 'Deuda',    icon: TrendingDown, onClick: onDeuda },
  ]
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="grid grid-cols-4 gap-3 mt-5">
      {items.map((it) => {
        const Icon = it.icon
        return (
          <button key={it.label} onClick={it.onClick} className="flex flex-col items-center gap-2 group">
            <div className="w-14 h-14 rounded-full grid place-items-center transition"
              style={{
                background: it.primary ? 'var(--aureo-purple)' : '#fff',
                border: it.primary ? 'none' : '1px solid var(--aureo-border)',
                boxShadow: it.primary ? '0 8px 20px -8px rgba(108,43,217,0.5)' : '0 1px 2px rgba(0,0,0,0.03)',
              }}>
              <Icon className="w-5 h-5" style={{ color: it.primary ? '#fff' : 'var(--aureo-text)' }} strokeWidth={2.2} />
            </div>
            <span className="text-[12px] font-medium">{it.label}</span>
          </button>
        )
      })}
    </motion.div>
  )
}

// -------------- ANALISIS DEL ROBOT --------------
const TONO = {
  ok:     { color: '#22C55E', bg: '#DCFCE7', Icon: Sparkles },
  ajuste: { color: '#F59E0B', bg: '#FEF3C7', Icon: TrendingDown },
  riesgo: { color: '#EF4444', bg: '#FEE2E2', Icon: AlertTriangle },
}

function AnalisisAureo({ analisis, oculto, onAbrir }) {
  const t = TONO[analisis.severidad]
  return (
    <motion.button onClick={onAbrir} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}
      className="aureo-card mt-5 p-4 w-full text-left flex items-start gap-3">
      <div className="w-11 h-11 rounded-full grid place-items-center flex-shrink-0" style={{ background: t.bg }}>
        <t.Icon className="w-5 h-5" style={{ color: t.color }} strokeWidth={2.1} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[14px] font-semibold">{analisis.titulo}</div>
        <div className="text-[12px] leading-snug mt-0.5" style={{ color: 'var(--aureo-text-dim)' }}>
          {oculto ? 'Toca para ver el análisis de Aureo' : analisis.acciones[0].texto}
        </div>
      </div>
    </motion.button>
  )
}

function SectionHeaderLocal() { return null }

function SpaceObjetivo({ liquido, objetivo, progreso, oculto, analisis }) {
  const falta = Math.max(0, objetivo - liquido)
  return (
    <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="aureo-card mt-5 p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full grid place-items-center" style={{ background: '#EFE7FB' }}>
            <Target className="w-5 h-5" style={{ color: 'var(--aureo-purple)' }} />
          </div>
          <div>
            <div className="text-[14px] font-semibold">Objetivo enero 2027</div>
            <div className="text-[12px]" style={{ color: 'var(--aureo-text-dim)' }}>
              {analisis.mesLlegada ? `Llegas en ${analisis.mesLlegada}` : 'Espacio de ahorro'}
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--aureo-text-mute)' }}>Meta</div>
          <div className="tabular text-[14px] font-semibold">{fmt(objetivo)}</div>
        </div>
      </div>
      <div className="h-2 rounded-full overflow-hidden" style={{ background: '#F0EBF6' }}>
        <motion.div initial={{ width: 0 }} animate={{ width: `${progreso}%` }} transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          className="h-full rounded-full" style={{ background: 'linear-gradient(90deg, #6C2BD9 0%, #8B5CF6 100%)' }} />
      </div>
      <div className="flex items-center justify-between mt-2.5 text-[12px]">
        <span style={{ color: 'var(--aureo-text-dim)' }}>{progreso.toFixed(1)}% conseguido</span>
        <span className="tabular font-medium" style={{ color: 'var(--aureo-text-dim)' }}>Faltan {oculto ? '•••' : fmt(falta)}</span>
      </div>
    </motion.section>
  )
}

function ResumenCompromisos({ balance, oculto, onFijos, onDeuda, nSubs, nRecibos, nDeudas }) {
  const filas = [
    { id: 'subs',    label: 'Suscripciones', valor: balance.suscripciones, n: nSubs,    color: '#3B82F6', bg: '#DBEAFE', Icon: Repeat,       onClick: onFijos },
    { id: 'recibos', label: 'Recibos',       valor: balance.recibos,       n: nRecibos, color: '#22C55E', bg: '#DCFCE7', Icon: Receipt,      onClick: onFijos },
    { id: 'deuda',   label: 'Deuda',         valor: balance.deuda,         n: nDeudas,  color: '#EF4444', bg: '#FEE2E2', Icon: TrendingDown, onClick: onDeuda },
  ]
  return (
    <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="aureo-card overflow-hidden">
      {filas.map((f, i) => (
        <button key={f.id} onClick={f.onClick} className="w-full flex items-center gap-3 px-5 py-3.5 text-left"
          style={{ borderTop: i === 0 ? 'none' : '1px solid var(--aureo-border)' }}>
          <div className="w-11 h-11 rounded-full grid place-items-center flex-shrink-0" style={{ background: f.bg }}>
            <f.Icon className="w-5 h-5" style={{ color: f.color }} strokeWidth={2.1} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[14px] font-semibold">{f.label}</div>
            <div className="text-[12px]" style={{ color: 'var(--aureo-text-dim)' }}>
              {f.n} {f.n === 1 ? 'activo' : 'activos'}
            </div>
          </div>
          <div className="tabular text-[14px] font-semibold">{oculto ? '••• €' : `${fmt2(f.valor)}/mes`}</div>
        </button>
      ))}
    </motion.section>
  )
}

function CuentasLista({ cuentas, gastadoTotal, oculto }) {
  return (
    <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="aureo-card overflow-hidden">
      {cuentas.map((c, i) => {
        const Icon = ICONS[c.icon] || Landmark
        const saldo = c.id === 'bleap' ? Math.max(0, c.saldo - gastadoTotal) : c.saldo
        return (
          <div key={c.id} className="flex items-center gap-3 px-5 py-4" style={{ borderTop: i === 0 ? 'none' : '1px solid var(--aureo-border)' }}>
            <div className="w-11 h-11 rounded-full grid place-items-center flex-shrink-0" style={{ background: c.bg }}>
              <Icon className="w-5 h-5" style={{ color: c.color }} strokeWidth={2.1} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[15px] font-semibold truncate">{c.nombre}</span>
                {c.hub && <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded font-semibold" style={{ background: 'var(--aureo-purple-soft)', color: 'var(--aureo-purple)' }}>Hub</span>}
                {c.live && <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded font-semibold flex items-center gap-0.5" style={{ background: '#DCFCE7', color: '#15803D' }}><span className="w-1.5 h-1.5 rounded-full" style={{ background: '#22C55E' }} />LIVE</span>}
              </div>
              <div className="text-[12px] truncate" style={{ color: 'var(--aureo-text-dim)' }}>
                {c.subtitulo}
                {c.changePct != null && (
                  <span className="ml-1 font-medium" style={{ color: c.changePct >= 0 ? '#22C55E' : '#EF4444' }}>
                    {c.changePct >= 0 ? '+' : ''}{c.changePct.toFixed(2)}%
                  </span>
                )}
              </div>
            </div>
            <div className="tabular text-[15px] font-semibold">{oculto ? '•••• €' : fmt2(saldo)}</div>
          </div>
        )
      })}
    </motion.section>
  )
}

function RecurrentesWidget({ recurrentes, oculto }) {
  if (!recurrentes.length) return null
  const hoy = new Date().getDate()
  const proximos = [...recurrentes]
    .map((r) => ({ ...r, diasHasta: ((r.dia - hoy) + 30) % 30 }))
    .sort((a, b) => a.diasHasta - b.diasHasta)
    .slice(0, 3)

  return (
    <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="aureo-card overflow-hidden">
      {proximos.map((r, i) => {
        const Icon = ICONS[r.icono] || Sparkles
        const cat = catDe(r.categoria)
        const isIngreso = r.tipo === 'ingreso'
        return (
          <div key={r.id} className="flex items-center gap-3 px-5 py-3.5" style={{ borderTop: i === 0 ? 'none' : '1px solid var(--aureo-border)' }}>
            <div className="w-11 h-11 rounded-full grid place-items-center flex-shrink-0" style={{ background: isIngreso ? '#DCFCE7' : cat.bg }}>
              <Icon className="w-5 h-5" style={{ color: isIngreso ? '#22C55E' : cat.color }} strokeWidth={2.1} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[14px] font-semibold truncate">{r.nombre}</div>
              <div className="text-[12px] flex items-center gap-1" style={{ color: 'var(--aureo-text-dim)' }}>
                <Calendar className="w-3 h-3" />
                {r.diasHasta === 0 ? 'Hoy' : `En ${r.diasHasta} días`} · día {r.dia}
              </div>
            </div>
            <div className="tabular text-[14px] font-semibold" style={{ color: isIngreso ? '#22C55E' : '#14101B' }}>
              {oculto ? '••• €' : `${isIngreso ? '+' : ''}${fmt2(r.importe)}`}
            </div>
          </div>
        )
      })}
    </motion.section>
  )
}

// -------------- PROYECCION --------------
function ProyeccionCard({ data, objetivo, balance }) {
  const alcanza = data.find((d) => d.liquido >= objetivo)
  const positivo = balance.ahorroMensual >= 0
  return (
    <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="aureo-card p-5">
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="text-[13px]" style={{ color: 'var(--aureo-text-dim)' }}>Trayectoria líquida</div>
          <div className="text-[15px] font-semibold mt-0.5">
            {alcanza ? <>Objetivo en <span style={{ color: 'var(--aureo-purple)' }}>{alcanza.mes}</span></> : 'Camino al objetivo'}
          </div>
        </div>
        <div className="flex items-center gap-1 text-[12px] font-medium" style={{ color: positivo ? 'var(--aureo-green)' : 'var(--aureo-red)' }}>
          <Sparkles className="w-3.5 h-3.5" /> {positivo ? 'En camino' : 'En números rojos'}
        </div>
      </div>

      <div className="h-48 -mx-1">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 6, right: 6, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="barActive" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6C2BD9" stopOpacity={1} />
                <stop offset="100%" stopColor="#8B5CF6" stopOpacity={0.55} />
              </linearGradient>
              <linearGradient id="barPending" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#DDD3E6" stopOpacity={1} />
                <stop offset="100%" stopColor="#ECE7F1" stopOpacity={0.9} />
              </linearGradient>
            </defs>
            <XAxis dataKey="mes" tick={{ fill: '#9A93A8', fontSize: 10 }} axisLine={false} tickLine={false} interval={2} />
            <YAxis hide domain={[0, Math.max(objetivo * 1.15, ...data.map((d) => d.liquido))]} />
            <Tooltip cursor={{ fill: 'rgba(108,43,217,0.06)' }}
              contentStyle={{ background: '#fff', border: '1px solid #ECE7F1', borderRadius: 12, fontSize: 12, color: '#14101B', boxShadow: '0 8px 24px rgba(20,16,27,0.08)' }}
              formatter={(v) => [fmt(v), 'Líquido']} />
            <ReferenceLine y={objetivo} stroke="#6C2BD9" strokeDasharray="4 4" strokeOpacity={0.55} />
            <Bar dataKey="liquido" radius={[6, 6, 0, 0]}
              shape={(props) => {
                const { x, y, width, height, payload } = props
                const fill = payload.liquido >= objetivo ? 'url(#barActive)' : 'url(#barPending)'
                return <rect x={x} y={y} width={width} height={height} rx={5} fill={fill} />
              }} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <MiniStat label="Ingresos" value={fmt(balance.ingresos)} tone="positive" />
        <MiniStat label="Fijos" value={fmt(balance.gastosFijos + balance.suscripciones + balance.recibos + balance.deuda)} tone="negative" />
        <MiniStat label="Ahorro" value={fmt(Math.abs(balance.ahorroMensual))} tone={balance.ahorroMensual >= 0 ? 'positive' : 'negative'} hint="al mes" />
      </div>
    </motion.section>
  )
}

function MiniStat({ label, value, tone, hint }) {
  const isPos = tone === 'positive'
  return (
    <div className="rounded-2xl p-3" style={{ background: 'var(--aureo-surface-2)', border: '1px solid var(--aureo-border)' }}>
      <div className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--aureo-text-mute)' }}>{label}</div>
      <div className="tabular text-[13px] font-semibold mt-1" style={{ color: isPos ? 'var(--aureo-green)' : 'var(--aureo-red)' }}>
        {isPos ? '+' : '−'}{value.replace('-', '')}
      </div>
      {hint && <div className="text-[10px] mt-0.5" style={{ color: 'var(--aureo-text-mute)' }}>{hint}</div>}
    </div>
  )
}

// -------------- GASTOS RECIENTES --------------
function UltimosGastos({ gastos, onDelete }) {
  if (gastos.length === 0) {
    return <Vacio icon={ArrowUpRight} titulo="Sin gastos aún" texto="Pulsa + para añadir uno rápidamente" />
  }
  return (
    <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="aureo-card overflow-hidden">
      <AnimatePresence>
        {gastos.slice(0, 8).map((g, i) => {
          const cat = catDe(g.categoria)
          const time = new Date(Number(g.ts)).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
          return (
            <motion.div key={g.id}
              initial={{ opacity: 0, x: -8, height: 0 }} animate={{ opacity: 1, x: 0, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              className="flex items-center gap-3 px-5 py-3.5 group"
              style={{ borderTop: i === 0 ? 'none' : '1px solid var(--aureo-border)' }}>
              <div className="w-11 h-11 rounded-full grid place-items-center flex-shrink-0" style={{ background: cat.bg }}>
                <ArrowDownLeft className="w-5 h-5" style={{ color: cat.color }} strokeWidth={2.2} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[15px] font-semibold truncate flex items-center gap-1.5">
                  {g.nota || cat.label}
                  {g.source === 'shortcut' && <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded font-semibold" style={{ background: '#DBEAFE', color: '#1D4ED8' }}>iPhone</span>}
                </div>
                <div className="text-[12px]" style={{ color: 'var(--aureo-text-dim)' }}>{cat.label} · {time}</div>
              </div>
              <div className="flex items-center gap-2">
                <div className="tabular text-[15px] font-semibold" style={{ color: 'var(--aureo-red)' }}>−{fmt2(g.importe)}</div>
                <button onClick={() => onDelete(g.id)} aria-label="Borrar gasto"
                  className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition w-7 h-7 rounded-full grid place-items-center"
                  style={{ background: 'var(--aureo-bg)' }}>
                  <Trash2 className="w-3.5 h-3.5" style={{ color: 'var(--aureo-text-dim)' }} />
                </button>
              </div>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </motion.section>
  )
}

// -------------- ANALISIS VIEW --------------
function AnalisisView({ gastos, onBack, oculto }) {
  const byCat = useMemo(() => {
    const map = {}
    for (const g of gastos) map[g.categoria] = (map[g.categoria] || 0) + Number(g.importe)
    return Object.entries(map).map(([id, value]) => {
      const c = catDe(id)
      return { id, label: c.label, value: Math.round(value * 100) / 100, color: c.color, bg: c.bg }
    }).sort((a, b) => b.value - a.value)
  }, [gastos])
  const total = byCat.reduce((s, x) => s + x.value, 0)

  return (
    <>
      <PageHeader title="Análisis" onBack={onBack} />
      <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="aureo-card p-6">
        <div className="text-[12px] uppercase tracking-wider" style={{ color: 'var(--aureo-text-mute)' }}>Gasto total</div>
        <div className="tabular text-[32px] font-semibold mt-1">{oculto ? '•••• €' : fmt2(total)}</div>
        <div className="text-[12px] mt-1" style={{ color: 'var(--aureo-text-dim)' }}>{gastos.length} movimientos</div>

        {total > 0 ? (
          <div className="h-56 mt-4 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={byCat} dataKey="value" nameKey="label" innerRadius={55} outerRadius={90} paddingAngle={2} strokeWidth={0}>
                  {byCat.map((c) => <Cell key={c.id} fill={c.color} />)}
                </Pie>
                <Tooltip formatter={(v) => fmt2(v)} contentStyle={{ background: '#fff', border: '1px solid #ECE7F1', borderRadius: 12, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 grid place-items-center pointer-events-none">
              <div className="text-center">
                <div className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--aureo-text-mute)' }}>Categorías</div>
                <div className="tabular text-[18px] font-semibold">{byCat.length}</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-10 text-[13px]" style={{ color: 'var(--aureo-text-dim)' }}>Añade gastos para ver el análisis</div>
        )}
      </motion.section>

      <div className="aureo-card overflow-hidden mt-4">
        {byCat.map((c, i) => {
          const pct = total ? (c.value / total) * 100 : 0
          return (
            <div key={c.id} className="px-5 py-4" style={{ borderTop: i === 0 ? 'none' : '1px solid var(--aureo-border)' }}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full" style={{ background: c.color }} />
                  <span className="text-[14px] font-semibold">{c.label}</span>
                </div>
                <div className="tabular text-[14px] font-semibold">{oculto ? '•••' : fmt2(c.value)}</div>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--aureo-border)' }}>
                <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8 }} className="h-full rounded-full" style={{ background: c.color }} />
              </div>
              <div className="mt-1 text-[11px]" style={{ color: 'var(--aureo-text-mute)' }}>{pct.toFixed(1)}% del total</div>
            </div>
          )
        })}
      </div>
    </>
  )
}

// -------------- GOAL VIEW --------------
function GoalView({ liquido, objetivo, progreso, proyeccion, analisis, balance, onBack, oculto }) {
  const t = TONO[analisis.severidad]
  return (
    <>
      <PageHeader title="Objetivo" onBack={onBack} />
      <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="hero-gradient rounded-[28px] p-6 text-white relative overflow-hidden">
        <span className="chip"><Target className="w-3.5 h-3.5" /> Meta enero 2027</span>
        <div className="tabular text-[46px] font-semibold mt-4">{oculto ? '•••• €' : fmt(objetivo)}</div>
        <div className="text-[13px] text-white/80 mt-1">
          Actualmente: <span className="font-medium text-white tabular">{oculto ? '•••' : fmt(liquido)}</span>
        </div>
        <div className="h-2 rounded-full overflow-hidden mt-5" style={{ background: 'rgba(255,255,255,0.15)' }}>
          <motion.div initial={{ width: 0 }} animate={{ width: `${progreso}%` }} transition={{ duration: 1 }} className="h-full rounded-full" style={{ background: '#fff' }} />
        </div>
        <div className="flex justify-between mt-2 text-[12px] text-white/80">
          <span>{progreso.toFixed(1)}%</span>
          {analisis.mesLlegada && <span>Se alcanzará en {analisis.mesLlegada}</span>}
        </div>
      </motion.section>

      <div className="aureo-card mt-4 p-5">
        <div className="flex items-center gap-3 mb-3">
          <AureoRobot size={52} vivo humor={analisis.severidad === 'ok' ? 'celebrando' : 'pensando'} />
          <div className="flex-1">
            <div className="text-[15px] font-semibold flex items-center gap-1.5">
              <t.Icon className="w-4 h-4" style={{ color: t.color }} />{analisis.titulo}
            </div>
            <div className="text-[12px] mt-0.5" style={{ color: 'var(--aureo-text-dim)' }}>{analisis.detalle}</div>
          </div>
        </div>
        <div className="space-y-2">
          {analisis.acciones.map((a) => (
            <div key={a.texto} className="rounded-2xl p-3 text-[12.5px] leading-snug"
              style={{ background: 'var(--aureo-surface-2)', border: '1px solid var(--aureo-border)' }}>
              {a.texto}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2 mt-3">
          <MiniStat label="Ahorras" value={fmt(Math.abs(balance.ahorroMensual))} tone={balance.ahorroMensual >= 0 ? 'positive' : 'negative'} hint="al mes" />
          <MiniStat label="Necesitas" value={fmt(analisis.necesarioMensual)} tone="negative" hint={`${analisis.mesesRestantes} meses`} />
        </div>
      </div>

      <div className="mt-4">
        <ProyeccionCard data={proyeccion} objetivo={objetivo} balance={balance} />
      </div>
    </>
  )
}

// -------------- BOTTOM NAV --------------
function BottomNav({ onAdd, tab, setTab }) {
  const items = [
    { id: 'home',     label: 'Inicio',   icon: Home },
    { id: 'fijos',    label: 'Fijos',    icon: Repeat },
    { id: 'add',      label: '',         icon: Plus, primary: true, onClick: onAdd },
    { id: 'deuda',    label: 'Deuda',    icon: TrendingDown },
    { id: 'goal',     label: 'Meta',     icon: Target },
  ]
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 pb-[env(safe-area-inset-bottom,0px)]">
      <div className="max-w-md mx-auto px-4 pb-3">
        <div className="rounded-full flex items-center justify-between px-4 py-2" style={{ background: '#fff', border: '1px solid var(--aureo-border)', boxShadow: '0 10px 30px -10px rgba(20,16,27,0.15)' }}>
          {items.map((it) => {
            const Icon = it.icon
            const isActive = tab === it.id
            if (it.primary) {
              return (
                <motion.button key={it.id} onClick={it.onClick} whileTap={{ scale: 0.9 }} aria-label="Añadir gasto"
                  className="w-12 h-12 rounded-full grid place-items-center -my-3"
                  style={{ background: 'var(--aureo-purple)', boxShadow: '0 8px 20px -6px rgba(108,43,217,0.5)' }}>
                  <Icon className="w-6 h-6 text-white" strokeWidth={2.4} />
                </motion.button>
              )
            }
            return (
              <button key={it.id} onClick={() => setTab(it.id)} className="flex flex-col items-center gap-0.5 py-1.5 px-3">
                <Icon className="w-5 h-5" strokeWidth={2.1} style={{ color: isActive ? 'var(--aureo-purple)' : 'var(--aureo-text-mute)' }} />
                <span className="text-[10px] font-medium" style={{ color: isActive ? 'var(--aureo-purple)' : 'var(--aureo-text-mute)' }}>{it.label}</span>
              </button>
            )
          })}
        </div>
      </div>
    </nav>
  )
}

// -------------- MODAL GASTO --------------
function ModalGasto({ onClose, onSubmit, estado }) {
  const [nota, setNota] = useState('')
  const [importe, setImporte] = useState('')
  const [categoria, setCategoria] = useState('Bleap')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])

  const valor = parseFloat(String(importe).replace(',', '.'))
  const impacto = valor > 0 ? impactoGasto(estado, valor) : null

  const submit = async (e) => {
    e.preventDefault()
    if (!valor || valor <= 0 || saving) return
    setSaving(true)
    setError(null)
    try {
      await onSubmit({ nota: nota.trim(), importe: valor, categoria })
    } catch {
      setError('No se pudo guardar. Inténtalo otra vez.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}
        className="fixed inset-0 z-40" style={{ background: 'rgba(20,16,27,0.35)', backdropFilter: 'blur(4px)' }} />
      <motion.form onSubmit={submit}
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 320, damping: 32 }}
        className="fixed left-0 right-0 bottom-0 z-50 max-w-md mx-auto">
        <div className="m-3 p-6 rounded-[28px]" style={{ background: '#fff', border: '1px solid var(--aureo-border)', boxShadow: '0 30px 60px -20px rgba(20,16,27,0.25)' }}>
          <div className="w-10 h-1 rounded-full mx-auto -mt-2 mb-4" style={{ background: 'var(--aureo-border-strong)' }} />
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-[18px] font-semibold">Nuevo gasto</h3>
            <button type="button" onClick={onClose} aria-label="Cerrar" className="w-9 h-9 rounded-full grid place-items-center" style={{ background: 'var(--aureo-bg)' }}>
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="mb-5">
            <label className="text-[11px] uppercase tracking-wider" style={{ color: 'var(--aureo-text-mute)' }} htmlFor="importe">Importe</label>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-[44px] font-semibold" style={{ color: 'var(--aureo-text-mute)' }}>€</span>
              <input id="importe" autoFocus inputMode="decimal" value={importe} onChange={(e) => setImporte(e.target.value)}
                placeholder="0,00" className="flex-1 min-w-0 bg-transparent outline-none tabular text-[44px] font-semibold"
                style={{ color: 'var(--aureo-text)' }} />
            </div>
            <div className="h-px mt-2" style={{ background: 'var(--aureo-border)' }} />
            <AnimatePresence>
              {impacto && (
                <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="flex items-center gap-1.5 mt-2 text-[12px]" style={{ color: 'var(--aureo-text-dim)' }}>
                  <AureoRobot size={22} variant="lavanda" />
                  {impacto}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="mb-5">
            <label className="text-[11px] uppercase tracking-wider" style={{ color: 'var(--aureo-text-mute)' }} htmlFor="nota">Nota</label>
            <input id="nota" value={nota} onChange={(e) => setNota(e.target.value)} placeholder="Ej. Café con Ana" maxLength={120}
              className="mt-1 w-full bg-transparent outline-none text-[16px]" style={{ color: 'var(--aureo-text)' }} />
            <div className="h-px mt-2" style={{ background: 'var(--aureo-border)' }} />
          </div>

          <div className="mb-6">
            <span className="text-[11px] uppercase tracking-wider block mb-2.5" style={{ color: 'var(--aureo-text-mute)' }}>Categoría</span>
            <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-1 px-1">
              {CATEGORIAS.map((c) => {
                const active = categoria === c.id
                return (
                  <button key={c.id} type="button" onClick={() => setCategoria(c.id)} aria-pressed={active}
                    className="px-4 py-2 rounded-full text-[13px] font-medium whitespace-nowrap transition"
                    style={{ background: active ? c.color : c.bg, color: active ? '#fff' : c.color, border: active ? 'none' : `1px solid ${c.bg}` }}>
                    {c.label}
                  </button>
                )
              })}
            </div>
          </div>

          {error && <div className="mb-3 text-[13px]" style={{ color: 'var(--aureo-red)' }}>{error}</div>}

          <button type="submit" disabled={saving}
            className="pill-button w-full h-14 text-white flex items-center justify-center disabled:opacity-70"
            style={{ background: 'var(--aureo-purple)', boxShadow: '0 10px 24px -8px rgba(108,43,217,0.5)' }}>
            {saving ? 'Guardando…' : 'Añadir gasto'}
          </button>
        </div>
      </motion.form>
    </>
  )
}
