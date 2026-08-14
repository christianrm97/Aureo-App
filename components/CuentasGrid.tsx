'use client'

import { motion } from 'framer-motion'

function formatEuro(n: number) {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2 }).format(n)
}

interface Cuenta {
  id: string; nombre: string; tipo: string; saldo: number; color: string; icono?: string; ticker?: string
}

export default function CuentasGrid({ cuentas, preciosVivos }: { cuentas: Cuenta[], preciosVivos: Record<string, any> }) {
  return (
    <div>
      <p className="text-aureo-muted text-sm font-medium mb-3">Mis cuentas</p>
      <div className="grid grid-cols-2 gap-3">
        {cuentas.map((cuenta, i) => {
          const precioVivo = cuenta.ticker ? preciosVivos[cuenta.ticker] : null
          const saldoMostrado = precioVivo
            ? cuenta.saldo * precioVivo.precio
            : cuenta.saldo
          const cambioPct = precioVivo?.cambio_pct ?? null

          return (
            <motion.div
              key={cuenta.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass p-4 cursor-pointer active:scale-[0.97] transition-transform"
            >
              <div className="flex items-center gap-2 mb-3">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-sm"
                  style={{ background: cuenta.color + '22' }}
                >
                  {cuenta.icono ?? '🏦'}
                </div>
                <p className="text-aureo-muted text-xs truncate flex-1">{cuenta.nombre}</p>
              </div>
              <p className="num text-xl font-bold text-aureo-text">
                {formatEuro(saldoMostrado)}
              </p>
              {cambioPct !== null && (
                <p className={`num text-xs mt-1 font-medium ${cambioPct >= 0 ? 'text-aureo-green' : 'text-aureo-red'}`}>
                  {cambioPct >= 0 ? '▲' : '▼'} {Math.abs(cambioPct).toFixed(2)}% hoy
                </p>
              )}
              {cuenta.tipo === 'inversion' && cambioPct === null && (
                <p className="text-xs text-aureo-muted mt-1">~9% anual</p>
              )}
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
