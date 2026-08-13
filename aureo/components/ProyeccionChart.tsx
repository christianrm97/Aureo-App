'use client'

import { useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { ChevronDown, ChevronUp } from 'lucide-react'
import type { MesProyeccion } from '@/lib/proyeccion'

function fmt(n: number) {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)
}

interface PlanConfig { bleap_mensual: number; cuenta_pareja_mensual: number; myinvestor_mensual: number }

interface Props {
  datos: MesProyeccion[]
  objetivo: number
  plan: PlanConfig
  onPlanChange: (key: string, value: number) => void
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload as MesProyeccion
  return (
    <div className="glass p-3 text-xs space-y-1 min-w-[140px]">
      <p className="font-semibold text-aureo-text mb-2">{d.mes}</p>
      {d.nomina > 0 && <p className="text-aureo-green">+ Nómina: {fmt(d.nomina)}</p>}
      {d.irpf > 0 && <p className="text-aureo-red">– IRPF: {fmt(d.irpf)}</p>}
      {d.temporales > 0 && <p className="text-aureo-red">– Extras: {fmt(d.temporales)}</p>}
      <p className="text-aureo-muted">– Bleap: {fmt(d.bleap)}</p>
      <p className="text-aureo-muted">– Pareja: {fmt(d.cuentaPareja)}</p>
      {d.myinvestor > 0 && <p className="text-aureo-blue">– MyInvestor: {fmt(d.myinvestor)}</p>}
      <div className="border-t border-aureo-border pt-1 mt-1">
        <p className="font-bold text-aureo-text">= {fmt(d.liquidoFin)}</p>
      </div>
    </div>
  )
}

export default function ProyeccionChart({ datos, objetivo, plan, onPlanChange }: Props) {
  const [abierto, setAbierto] = useState(false)

  return (
    <div className="glass p-4">
      <div className="flex items-center justify-between mb-1">
        <p className="text-aureo-text font-semibold text-sm">Proyección Enero 2027</p>
        <p className="num text-aureo-green font-bold text-sm">{fmt(objetivo)}</p>
      </div>
      <p className="text-aureo-muted text-xs mb-4">Toca una barra para ver el detalle</p>

      {/* Gráfica */}
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={datos} barSize={32} margin={{ top: 4, right: 0, left: -30, bottom: 0 }}>
            <XAxis
              dataKey="mesCorto"
              tick={{ fill: '#8e8ea0', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: '#8e8ea0', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={v => `${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
            <Bar dataKey="liquidoFin" radius={[6, 6, 0, 0]}>
              {datos.map((entry, i) => (
                <Cell
                  key={i}
                  fill={i === datos.length - 1 ? '#00c896' : '#1a1a24'}
                  stroke={i === datos.length - 1 ? '#00c896' : '#ffffff11'}
                  strokeWidth={1}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Controles ajustables */}
      <button
        onClick={() => setAbierto(!abierto)}
        className="flex items-center gap-2 mt-3 text-aureo-muted text-xs hover:text-aureo-text transition-colors"
      >
        {abierto ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        Ajustar presupuestos mensuales
      </button>

      {abierto && (
        <div className="mt-3 space-y-3 border-t border-aureo-border pt-3">
          {[
            { key: 'bleap_mensual', label: 'Bleap', emoji: '💳' },
            { key: 'cuenta_pareja_mensual', label: 'Cuenta Pareja', emoji: '👫' },
            { key: 'myinvestor_mensual', label: 'MyInvestor', emoji: '📈' },
          ].map(({ key, label, emoji }) => (
            <div key={key} className="flex items-center justify-between">
              <span className="text-xs text-aureo-muted">{emoji} {label}</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onPlanChange(key, Math.max(0, (plan as any)[key] - 10))}
                  className="w-7 h-7 rounded-full bg-aureo-surface2 text-aureo-text text-sm flex items-center justify-center"
                >−</button>
                <span className="num text-sm font-semibold text-aureo-text w-14 text-center">
                  {(plan as any)[key]}€
                </span>
                <button
                  onClick={() => onPlanChange(key, (plan as any)[key] + 10)}
                  className="w-7 h-7 rounded-full bg-aureo-surface2 text-aureo-text text-sm flex items-center justify-center"
                >+</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
