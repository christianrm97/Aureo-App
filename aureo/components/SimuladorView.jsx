'use client'

import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { Calculator, Home, PiggyBank, Banknote, TrendingDown } from 'lucide-react'
import { simularPrestamo, simularAhorro, amortizarAnticipado } from '@/lib/simulador'
import { fmt, fmt2, PageHeader } from './ui'
import AureoRobot from './AureoRobot'

const MODOS = [
  { id: 'prestamo', label: 'Préstamo', icon: Banknote,  color: '#6C2BD9' },
  { id: 'hipoteca', label: 'Hipoteca', icon: Home,      color: '#3B82F6' },
  { id: 'ahorro',   label: 'Ahorro',   icon: PiggyBank, color: '#22C55E' },
]

/** El preset de prestamo es el caso real que tienes sobre la mesa: Santander
 *  7.000 EUR a 48 meses al 5,50% TIN, con 0% de comision de apertura. */
const INICIAL = {
  prestamo: { capital: 7000,   tin: 5.5, meses: 48,  comision: 0 },
  hipoteca: { capital: 150000, tin: 3, meses: 360, comision: 0 },
  ahorro:   { inicial: 1000, mensual: 300, meses: 24, rentabilidad: 2.47 },
}

export default function SimuladorView({ onBack, margenActual = 0, cuotasActuales = 0, ingresos = 0 }) {
  const [modo, setModo] = useState('prestamo')

  return (
    <>
      <PageHeader title="Simulador" onBack={onBack} />

      <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        className="hero-gradient rounded-[28px] p-6 text-white relative overflow-hidden">
        <span className="chip"><Calculator className="w-3.5 h-3.5" /> Proyecta antes de decidir</span>
        <div className="text-[20px] font-semibold mt-3 leading-tight max-w-[72%]">
          Mira lo que cuesta de verdad antes de firmar
        </div>
        <AureoRobot size={86} variant="lavanda" vivo humor="pensando"
          className="absolute -right-1 -bottom-1 opacity-95 pointer-events-none" />
      </motion.section>

      <div className="grid grid-cols-3 gap-2 mt-5">
        {MODOS.map((m) => {
          const activo = modo === m.id
          return (
            <button key={m.id} onClick={() => setModo(m.id)}
              className="flex flex-col items-center gap-1.5 py-3 rounded-2xl transition"
              style={{
                background: activo ? m.color : '#fff',
                border: activo ? 'none' : '1px solid var(--aureo-border)',
                boxShadow: activo ? '0 8px 20px -8px rgba(20,16,27,0.35)' : 'none',
              }}>
              <m.icon className="w-5 h-5" style={{ color: activo ? '#fff' : m.color }} strokeWidth={2.2} />
              <span className="text-[12px] font-semibold" style={{ color: activo ? '#fff' : 'var(--aureo-text)' }}>
                {m.label}
              </span>
            </button>
          )
        })}
      </div>

      {modo === 'ahorro'
        ? <SimAhorro margenActual={margenActual} />
        : <SimPrestamo modo={modo} margenActual={margenActual} cuotasActuales={cuotasActuales} ingresos={ingresos} />}
    </>
  )
}

// ---------------- PRESTAMO / HIPOTECA ----------------
function SimPrestamo({ modo, margenActual, cuotasActuales, ingresos }) {
  const [v, setV] = useState(INICIAL[modo])
  const [amortizar, setAmortizar] = useState(0)
  const [ultimoModo, setUltimoModo] = useState(modo)

  // Cambiar de pestana reinicia los valores al preset de ese producto
  if (ultimoModo !== modo) {
    setUltimoModo(modo)
    setV(INICIAL[modo])
    setAmortizar(0)
  }

  const r = useMemo(
    () => simularPrestamo({ capital: v.capital, tin: v.tin, meses: v.meses, comisionApertura: v.comision }),
    [v],
  )

  // Con 360 cuotas no se pintan 360 puntos: se muestrea el cuadro
  const datos = useMemo(() => {
    const paso = Math.max(1, Math.floor(r.cuadro.length / 40))
    return r.cuadro
      .filter((_, i) => i % paso === 0 || i === r.cuadro.length - 1)
      .map((c) => ({ mes: c.numero, Pendiente: Math.round(c.pendiente), Intereses: Math.round(c.intereses) }))
  }, [r])

  const anticipada = useMemo(
    () => (amortizar > 0
      ? amortizarAnticipado({ capital: v.capital, tin: v.tin, meses: v.meses }, amortizar, 'plazo')
      : null),
    [amortizar, v],
  )

  // Esfuerzo: que parte de tus ingresos se llevan todas las cuotas juntas.
  // Por encima del 35 % un banco lo considera riesgo.
  const esfuerzo = ingresos > 0 ? ((cuotasActuales + r.cuota) / ingresos) * 100 : 0
  const margenTras = margenActual - r.cuota

  return (
    <>
      <div className="aureo-card mt-4 p-5">
        <Deslizador label="Capital" valor={v.capital} sufijo=" €"
          min={modo === 'hipoteca' ? 20000 : 500} max={modo === 'hipoteca' ? 500000 : 60000}
          paso={modo === 'hipoteca' ? 5000 : 500} onChange={(x) => setV({ ...v, capital: x })} />
        <Deslizador label="TIN" valor={v.tin} sufijo=" %" min={0} max={20} paso={0.05} decimales={2}
          onChange={(x) => setV({ ...v, tin: x })} />
        <Deslizador label="Plazo" valor={v.meses} sufijo=" meses" min={6}
          max={modo === 'hipoteca' ? 480 : 96} paso={6} onChange={(x) => setV({ ...v, meses: x })} />
        <Deslizador label="Comisión de apertura" valor={v.comision} sufijo=" €" min={0}
          max={Math.round(v.capital * 0.05)} paso={10} onChange={(x) => setV({ ...v, comision: x })} />
      </div>

      <div className="grid grid-cols-2 gap-3 mt-4">
        <Dato label="Cuota mensual" valor={fmt2(r.cuota)} destacado />
        <Dato label="TAE" valor={r.tae.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' %'} />
        <Dato label="Intereses totales" valor={fmt2(r.totalIntereses)} tono="malo" />
        <Dato label="Total a devolver" valor={fmt2(r.totalPagado)} />
      </div>

      {ingresos > 0 && (
        <div className="aureo-card mt-4 p-5">
          <div className="text-[13px] font-semibold mb-3">Qué te deja cada mes</div>
          <Fila label="Margen actual" valor={fmt2(margenActual)} tono={margenActual >= 0 ? 'bueno' : 'malo'} />
          <Fila label="Menos esta cuota" valor={'− ' + fmt2(r.cuota)} tono="malo" />
          <div className="h-px my-2.5" style={{ background: 'var(--aureo-border)' }} />
          <Fila label="Margen resultante" valor={fmt2(margenTras)} tono={margenTras >= 0 ? 'bueno' : 'malo'} fuerte />

          <div className="mt-4">
            <div className="flex items-center justify-between text-[12px] mb-1.5">
              <span style={{ color: 'var(--aureo-text-dim)' }}>Esfuerzo sobre ingresos</span>
              <span className="tabular font-semibold" style={{ color: esfuerzo > 35 ? '#EF4444' : '#22C55E' }}>
                {Math.round(esfuerzo)} %
              </span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: '#F0EBF6' }}>
              <motion.div initial={{ width: 0 }} animate={{ width: Math.min(100, esfuerzo) + '%' }}
                transition={{ duration: 0.6 }} className="h-full rounded-full"
                style={{ background: esfuerzo > 35 ? '#EF4444' : 'linear-gradient(90deg,#6C2BD9,#8B5CF6)' }} />
            </div>
            <div className="text-[11px] mt-1.5" style={{ color: 'var(--aureo-text-mute)' }}>
              {esfuerzo > 35
                ? 'Por encima del 35 % un banco lo considera riesgo. Baja el capital o alarga el plazo.'
                : 'Por debajo del 35 %, que es el umbral que miran los bancos.'}
            </div>
          </div>
        </div>
      )}

      <div className="aureo-card mt-4 p-5">
        <div className="text-[13px] font-semibold mb-1">Cómo baja la deuda</div>
        <div className="text-[12px] mb-3" style={{ color: 'var(--aureo-text-dim)' }}>
          Las primeras cuotas van casi todas a intereses. Es el sistema francés.
        </div>
        <div className="h-52 -mx-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={datos} margin={{ top: 6, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="gPend" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6C2BD9" stopOpacity={0.65} />
                  <stop offset="100%" stopColor="#8B5CF6" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <XAxis dataKey="mes" tick={{ fill: '#9A93A8', fontSize: 10 }} axisLine={false} tickLine={false}
                interval="preserveStartEnd" minTickGap={28} />
              <YAxis hide />
              <Tooltip formatter={(val, name) => [fmt(val), name]} labelFormatter={(m) => 'Mes ' + m}
                contentStyle={{ background: '#fff', border: '1px solid #ECE7F1', borderRadius: 12, fontSize: 12 }} />
              <Legend verticalAlign="top" height={26} iconType="circle" wrapperStyle={{ fontSize: 11, color: '#6B647A' }} />
              <Area type="monotone" dataKey="Pendiente" stroke="#6C2BD9" strokeWidth={2} fill="url(#gPend)" />
              <Area type="monotone" dataKey="Intereses" stroke="#EF4444" strokeWidth={1.5} fill="none" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="aureo-card mt-4 p-5">
        <div className="text-[13px] font-semibold mb-1 flex items-center gap-1.5">
          <TrendingDown className="w-4 h-4" style={{ color: 'var(--aureo-purple)' }} /> Amortización anticipada
        </div>
        <div className="text-[12px] mb-3" style={{ color: 'var(--aureo-text-dim)' }}>
          Si un mes te sobra dinero y lo metes aquí reduciendo plazo.
        </div>
        <Deslizador label="Aportación extra" valor={amortizar} sufijo=" €" min={0}
          max={Math.round(v.capital * 0.8)} paso={100} onChange={setAmortizar} />
        {anticipada && amortizar > 0 && (
          <div className="grid grid-cols-2 gap-3">
            <Dato label="Ahorro en intereses" valor={fmt2(anticipada.ahorroIntereses)} tono="bueno" />
            <Dato label="Meses menos" valor={String(anticipada.mesesAhorrados)} tono="bueno" />
          </div>
        )}
      </div>
    </>
  )
}

// ---------------- AHORRO ----------------
function SimAhorro({ margenActual }) {
  const [v, setV] = useState({
    ...INICIAL.ahorro,
    mensual: Math.max(0, Math.round(margenActual) || INICIAL.ahorro.mensual),
  })

  const puntos = useMemo(
    () => simularAhorro({
      inicial: v.inicial, aportacionMensual: v.mensual, meses: v.meses, rentabilidadAnual: v.rentabilidad,
    }),
    [v],
  )
  const final = puntos[puntos.length - 1]
  const datos = puntos.map((p) => ({ mes: p.mes, Aportado: p.aportado, Total: p.total }))

  return (
    <>
      <div className="aureo-card mt-4 p-5">
        <Deslizador label="Ahorro inicial" valor={v.inicial} sufijo=" €" min={0} max={20000} paso={100}
          onChange={(x) => setV({ ...v, inicial: x })} />
        <Deslizador label="Aportación mensual" valor={v.mensual} sufijo=" €" min={0} max={2000} paso={10}
          onChange={(x) => setV({ ...v, mensual: x })} />
        <Deslizador label="Plazo" valor={v.meses} sufijo=" meses" min={3} max={240} paso={3}
          onChange={(x) => setV({ ...v, meses: x })} />
        <Deslizador label="Rentabilidad anual" valor={v.rentabilidad} sufijo=" %" min={0} max={12} paso={0.01}
          decimales={2} onChange={(x) => setV({ ...v, rentabilidad: x })} />
      </div>

      <div className="grid grid-cols-2 gap-3 mt-4">
        <Dato label="Tendrás" valor={fmt2(final ? final.total : 0)} destacado />
        <Dato label="De tu bolsillo" valor={fmt2(final ? final.aportado : 0)} />
        <Dato label="Intereses ganados" valor={fmt2(final ? final.intereses : 0)} tono="bueno" />
        <Dato label="Al mes" valor={fmt2(v.mensual)} />
      </div>

      <div className="aureo-card mt-4 p-5">
        <div className="text-[13px] font-semibold mb-3">Lo que aportas frente a lo que crece</div>
        <div className="h-52 -mx-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={datos} margin={{ top: 6, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="gTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22C55E" stopOpacity={0.6} />
                  <stop offset="100%" stopColor="#22C55E" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <XAxis dataKey="mes" tick={{ fill: '#9A93A8', fontSize: 10 }} axisLine={false} tickLine={false}
                interval="preserveStartEnd" minTickGap={28} />
              <YAxis hide />
              <Tooltip formatter={(val, name) => [fmt(val), name]} labelFormatter={(m) => 'Mes ' + m}
                contentStyle={{ background: '#fff', border: '1px solid #ECE7F1', borderRadius: 12, fontSize: 12 }} />
              <Legend verticalAlign="top" height={26} iconType="circle" wrapperStyle={{ fontSize: 11, color: '#6B647A' }} />
              <Area type="monotone" dataKey="Total" stroke="#22C55E" strokeWidth={2} fill="url(#gTotal)" />
              <Area type="monotone" dataKey="Aportado" stroke="#9A93A8" strokeWidth={1.5} strokeDasharray="4 4" fill="none" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </>
  )
}

// ---------------- PIEZAS ----------------
function Deslizador({ label, valor, sufijo = '', min, max, paso, decimales = 0, onChange }) {
  return (
    <div className="mb-4 last:mb-0">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[12px]" style={{ color: 'var(--aureo-text-dim)' }}>{label}</span>
        <span className="tabular text-[15px] font-semibold">
          {valor.toLocaleString('es-ES', { minimumFractionDigits: decimales, maximumFractionDigits: decimales })}{sufijo}
        </span>
      </div>
      <input type="range" min={min} max={max} step={paso} value={valor} aria-label={label}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-7 accent-violet-700" />
    </div>
  )
}

function Dato({ label, valor, tono, destacado }) {
  const color = tono === 'bueno' ? 'var(--aureo-green)' : tono === 'malo' ? 'var(--aureo-red)' : 'var(--aureo-text)'
  return (
    <div className="rounded-2xl p-3.5"
      style={{
        background: destacado ? 'var(--aureo-purple-soft)' : 'var(--aureo-surface)',
        border: '1px solid ' + (destacado ? 'transparent' : 'var(--aureo-border)'),
      }}>
      <div className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--aureo-text-mute)' }}>{label}</div>
      <div className="tabular text-[18px] font-semibold mt-0.5"
        style={{ color: destacado ? 'var(--aureo-purple)' : color }}>{valor}</div>
    </div>
  )
}

function Fila({ label, valor, tono, fuerte }) {
  const color = tono === 'bueno' ? 'var(--aureo-green)' : tono === 'malo' ? 'var(--aureo-red)' : 'var(--aureo-text)'
  return (
    <div className="flex items-center justify-between py-1">
      <span style={{ color: fuerte ? 'var(--aureo-text)' : 'var(--aureo-text-dim)', fontSize: fuerte ? 14 : 13, fontWeight: fuerte ? 600 : 400 }}>
        {label}
      </span>
      <span className="tabular font-semibold" style={{ color, fontSize: fuerte ? 16 : 14 }}>{valor}</span>
    </div>
  )
}
