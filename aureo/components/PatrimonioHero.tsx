'use client'

import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface Props {
  patrimonioTotal: number
  saldoLiquido: number
  saldoInversion: number
  objetivoEnero: number
  loading: boolean
}

function formatEuro(n: number, decimals = 2) {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(n)
}

export default function PatrimonioHero({
  patrimonioTotal, saldoLiquido, saldoInversion, objetivoEnero, loading
}: Props) {
  const progresoHaciaObjetivo = Math.min((saldoLiquido / objetivoEnero) * 100, 100)

  return (
    <div className="relative px-4 pt-6 pb-8 overflow-hidden">
      {/* Fondo con gradiente verde sutil */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          background: 'radial-gradient(ellipse at 50% 0%, rgba(0,200,150,0.3) 0%, transparent 70%)',
        }}
      />

      <div className="relative">
        {/* Label */}
        <p className="text-aureo-muted text-sm font-medium tracking-wide uppercase mb-2">
          Patrimonio neto
        </p>

        {/* Número principal */}
        <motion.div
          key={patrimonioTotal}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        >
          <p className="num text-5xl font-bold text-aureo-text tracking-tight">
            {loading ? '—' : formatEuro(patrimonioTotal, 0)}
          </p>
        </motion.div>

        {/* Subdetalles */}
        <div className="flex gap-6 mt-4">
          <div>
            <p className="text-aureo-muted text-xs mb-1">Liquidez</p>
            <p className="num text-base font-semibold text-aureo-text">
              {formatEuro(saldoLiquido, 0)}
            </p>
          </div>
          <div className="w-px bg-aureo-border" />
          <div>
            <p className="text-aureo-muted text-xs mb-1">Inversión</p>
            <p className="num text-base font-semibold text-aureo-green">
              {formatEuro(saldoInversion, 0)}
            </p>
          </div>
          <div className="w-px bg-aureo-border" />
          <div>
            <p className="text-aureo-muted text-xs mb-1">Objetivo Ene 27</p>
            <p className="num text-base font-semibold text-aureo-yellow">
              {formatEuro(objetivoEnero, 0)}
            </p>
          </div>
        </div>

        {/* Barra de progreso hacia el objetivo */}
        <div className="mt-5">
          <div className="flex justify-between items-center mb-1.5">
            <p className="text-aureo-muted text-xs">Progreso al objetivo</p>
            <p className="num text-xs text-aureo-green font-semibold">
              {progresoHaciaObjetivo.toFixed(1)}%
            </p>
          </div>
          <div className="h-1.5 bg-aureo-surface2 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-aureo-green rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progresoHaciaObjetivo}%` }}
              transition={{ duration: 1, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
