'use client'

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { motion } from 'framer-motion'

function fmt(n: number) {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(n)
}

const COLORES: Record<string, string> = {
  'Bleap':          '#00c896',
  'Cuenta Pareja':  '#805ad5',
  'Efectivo':       '#ed8936',
  'Suscripción':    '#4a9eff',
  'Recibo':         '#ff4d6a',
}

export default function GastosRecientes({ gastos, totalEsteMes }: { gastos: any[], totalEsteMes: number }) {
  // Agrupar por categoría
  const porCategoria = gastos.reduce((acc: Record<string, number>, g) => {
    const fecha = new Date(g.fecha)
    const ahora = new Date()
    if (fecha.getMonth() === ahora.getMonth()) {
      acc[g.categoria] = (acc[g.categoria] ?? 0) + g.importe
    }
    return acc
  }, {})

  const donutData = Object.entries(porCategoria).map(([name, value]) => ({ name, value }))

  return (
    <div className="glass p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-aureo-text font-semibold text-sm">Gastos este mes</p>
          <p className="num text-2xl font-bold text-aureo-text mt-0.5">{fmt(totalEsteMes)}</p>
        </div>
        {donutData.length > 0 && (
          <div className="w-20 h-20">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={donutData} cx="50%" cy="50%" innerRadius={22} outerRadius={36} dataKey="value" strokeWidth={0}>
                  {donutData.map((entry, i) => (
                    <Cell key={i} fill={COLORES[entry.name] ?? '#8e8ea0'} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Leyenda categorías */}
      {donutData.length > 0 && (
        <div className="grid grid-cols-2 gap-2 mb-4">
          {donutData.map((cat) => (
            <div key={cat.name} className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: COLORES[cat.name] ?? '#8e8ea0' }} />
              <span className="text-xs text-aureo-muted truncate">{cat.name}</span>
              <span className="num text-xs text-aureo-text ml-auto">{fmt(cat.value)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Lista últimos gastos */}
      <div className="space-y-2.5">
        {gastos.slice(0, 5).map((g, i) => (
          <motion.div
            key={g.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.04 }}
            className="flex items-center gap-3"
          >
            <div
              className="w-8 h-8 rounded-aureo-sm flex items-center justify-center text-sm flex-shrink-0"
              style={{ background: (COLORES[g.categoria] ?? '#8e8ea0') + '22' }}
            >
              {g.categoria === 'Bleap' ? '💳' : g.categoria === 'Cuenta Pareja' ? '👫' : '💵'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-aureo-text truncate">{g.nota}</p>
              <p className="text-xs text-aureo-muted">{g.categoria} · {new Date(g.fecha).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}</p>
            </div>
            <p className="num text-sm font-semibold text-aureo-text flex-shrink-0">−{fmt(g.importe)}</p>
          </motion.div>
        ))}
        {gastos.length === 0 && (
          <p className="text-center text-aureo-muted text-sm py-4">Sin gastos registrados este mes</p>
        )}
      </div>
    </div>
  )
}
