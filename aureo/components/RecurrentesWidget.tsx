'use client'

import { motion } from 'framer-motion'

function fmt(n: number) {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(n)
}

const ICONOS_DEFAULT: Record<string, string> = {
  'netflix': '🎬', 'spotify': '🎵', 'claude': '🤖', 'disney': '🏰',
  'amazon': '📦', 'ibi': '🏠', 'agua': '💧', 'luz': '💡',
  'seguro': '🛡️', 'openbank': '🏦', 'digi': '📱', 'simyo': '📱',
  'irpf': '📋', 'préstamo': '🏠', 'sequra': '🛒',
}

function getIcono(nombre: string, icono?: string) {
  if (icono) return icono
  const clave = Object.keys(ICONOS_DEFAULT).find(k => nombre.toLowerCase().includes(k))
  return clave ? ICONOS_DEFAULT[clave] : '💳'
}

const COLORES_TIPO: Record<string, string> = {
  'suscripcion': '#4a9eff',
  'recibo': '#ed8936',
  'prestamo': '#ff4d6a',
  'irpf': '#ffc542',
}

// Recurrentes por defecto (hasta que lleguen de Supabase)
const RECURRENTES_DEFAULT = [
  { id: '1', nombre: 'IRPF cuota', importe: 280.90, tipo: 'irpf', dia_cargo: 5, periodicidad: 'mensual' },
  { id: '2', nombre: 'Préstamo padres', importe: 686, tipo: 'prestamo', dia_cargo: 26, periodicidad: 'mensual' },
  { id: '3', nombre: 'Netflix', importe: 17.99, tipo: 'suscripcion', dia_cargo: 15, periodicidad: 'mensual' },
  { id: '4', nombre: 'Spotify', importe: 11.99, tipo: 'suscripcion', dia_cargo: 12, periodicidad: 'mensual' },
  { id: '5', nombre: 'Claude Pro', importe: 18, tipo: 'suscripcion', dia_cargo: 1, periodicidad: 'mensual' },
  { id: '6', nombre: 'DIGI', importe: 10, tipo: 'recibo', dia_cargo: 15, periodicidad: 'mensual' },
  { id: '7', nombre: 'Agua Patronato', importe: 26.85, tipo: 'recibo', dia_cargo: 1, periodicidad: 'trimestral' },
  { id: '8', nombre: 'Club del Libro', importe: 10.26, tipo: 'suscripcion', dia_cargo: 10, periodicidad: 'mensual' },
]

export default function RecurrentesWidget({ recurrentes }: { recurrentes: any[] }) {
  const datos = recurrentes.length > 0 ? recurrentes : RECURRENTES_DEFAULT
  const totalMensual = datos
    .filter(r => r.periodicidad === 'mensual')
    .reduce((a, r) => a + r.importe, 0)

  const suscripciones = datos.filter(r => r.tipo === 'suscripcion')
  const recibos = datos.filter(r => r.tipo === 'recibo')
  const compromisos = datos.filter(r => r.tipo === 'prestamo' || r.tipo === 'irpf')

  const Grupo = ({ titulo, items }: { titulo: string; items: typeof datos }) => (
    <div className="mb-4">
      <p className="text-xs text-aureo-muted uppercase tracking-wide mb-2">{titulo}</p>
      <div className="space-y-2">
        {items.map((r, i) => (
          <motion.div
            key={r.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.03 }}
            className="flex items-center gap-3"
          >
            <div
              className="w-8 h-8 rounded-aureo-sm flex items-center justify-center text-sm flex-shrink-0"
              style={{ background: (COLORES_TIPO[r.tipo] ?? '#8e8ea0') + '22' }}
            >
              {getIcono(r.nombre, r.icono)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-aureo-text">{r.nombre}</p>
              <p className="text-xs text-aureo-muted">
                {r.periodicidad === 'mensual' ? `Día ${r.dia_cargo}` : r.periodicidad}
              </p>
            </div>
            <p className="num text-sm font-semibold" style={{ color: COLORES_TIPO[r.tipo] ?? '#8e8ea0' }}>
              {fmt(r.importe)}
            </p>
          </motion.div>
        ))}
      </div>
    </div>
  )

  return (
    <div className="glass p-4">
      <div className="flex items-center justify-between mb-4">
        <p className="text-aureo-text font-semibold text-sm">Recurrentes</p>
        <p className="num text-xs text-aureo-muted">{fmt(totalMensual)}/mes</p>
      </div>

      {compromisos.length > 0 && <Grupo titulo="Compromisos" items={compromisos} />}
      {suscripciones.length > 0 && <Grupo titulo="Suscripciones" items={suscripciones} />}
      {recibos.length > 0 && <Grupo titulo="Recibos" items={recibos} />}
    </div>
  )
}
