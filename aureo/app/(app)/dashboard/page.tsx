'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { calcularProyeccion, calcularPatrimonioTotal } from '@/lib/proyeccion'
import PatrimonioHero from '@/components/PatrimonioHero'
import CuentasGrid from '@/components/CuentasGrid'
import GastosRecientes from '@/components/GastosRecientes'
import ProyeccionChart from '@/components/ProyeccionChart'
import RecurrentesWidget from '@/components/RecurrentesWidget'
import BottomNav from '@/components/layout/BottomNav'
import BotonGasto from '@/components/BotonGasto'

// Datos por defecto hasta que cargue Supabase
const DEFAULTS = {
  plan: { nomina: 1410.67, bleap_mensual: 90, cuenta_pareja_mensual: 150, myinvestor_mensual: 80 },
  cuentas: [
    { id: '1', nombre: 'OpenBank', tipo: 'banco', saldo: 1539, color: '#4a9eff', icono: '🏦' },
    { id: '2', nombre: 'Santander', tipo: 'banco', saldo: 200, color: '#e53e3e', icono: '🏛️' },
    { id: '3', nombre: 'Santander Conjunta', tipo: 'banco', saldo: 150, color: '#805ad5', icono: '👫' },
    { id: '4', nombre: 'Bleap', tipo: 'banco', saldo: 106.71, color: '#00c896', icono: '💳' },
    { id: '5', nombre: 'Cajamar', tipo: 'banco', saldo: 100, color: '#ed8936', icono: '🌾' },
    { id: '6', nombre: 'MyInvestor S&P 500', tipo: 'inversion', saldo: 136, color: '#00c896', icono: '📈' },
  ],
}

export default function Dashboard() {
  const [cuentas, setCuentas] = useState(DEFAULTS.cuentas)
  const [gastos, setGastos] = useState<any[]>([])
  const [recurrentes, setRecurrentes] = useState<any[]>([])
  const [plan, setPlan] = useState(DEFAULTS.plan)
  const [loading, setLoading] = useState(true)
  const [preciosVivos, setPreciosVivos] = useState<Record<string, any>>({})

  const saldoLiquido = cuentas
    .filter(c => c.tipo === 'banco')
    .reduce((a, c) => a + c.saldo, 0)

  const saldoInversion = cuentas
    .filter(c => c.tipo === 'inversion')
    .reduce((a, c) => a + c.saldo, 0)

  const patrimonioTotal = calcularPatrimonioTotal(saldoLiquido, saldoInversion)

  const proyeccion = calcularProyeccion({
    nomina: plan.nomina,
    bleap_mensual: plan.bleap_mensual,
    cuenta_pareja_mensual: plan.cuenta_pareja_mensual,
    myinvestor_mensual: plan.myinvestor_mensual,
    saldo_inicial: saldoLiquido,
  })

  const objetivoEnero = proyeccion[proyeccion.length - 1]?.liquidoFin ?? 0

  // Suscripción realtime a gastos
  const cargarDatos = useCallback(async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    const [
      { data: cuentasDB },
      { data: gastosDB },
      { data: recurrentesDB },
      { data: planDB },
    ] = await Promise.all([
      supabase.from('cuentas').select('*').eq('user_id', user.id).eq('activa', true),
      supabase.from('gastos').select('*').eq('user_id', user.id).order('fecha', { ascending: false }).limit(20),
      supabase.from('recurrentes').select('*').eq('user_id', user.id).eq('activa', true),
      supabase.from('plan_config').select('*').eq('user_id', user.id).single(),
    ])

    if (cuentasDB?.length) setCuentas(cuentasDB as any)
    if (gastosDB) setGastos(gastosDB)
    if (recurrentesDB) setRecurrentes(recurrentesDB)
    if (planDB) setPlan(planDB as any)
    setLoading(false)
  }, [])

  // Precios en vivo
  const actualizarPrecios = useCallback(async () => {
    const tickers = cuentas
      .filter(c => c.tipo === 'inversion' || c.tipo === 'cripto')
      .map((c: any) => c.ticker)
      .filter(Boolean)
      .join(',')

    if (!tickers) return

    const res = await fetch(`/api/precios?tickers=${tickers}`)
    const { precios } = await res.json()
    setPreciosVivos(precios)
  }, [cuentas])

  useEffect(() => {
    cargarDatos()
  }, [cargarDatos])

  // Actualizar precios cada 60s
  useEffect(() => {
    actualizarPrecios()
    const interval = setInterval(actualizarPrecios, 60_000)
    return () => clearInterval(interval)
  }, [actualizarPrecios])

  // Realtime: escuchar nuevos gastos
  useEffect(() => {
    const channel = supabase
      .channel('gastos-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'gastos' }, (payload) => {
        setGastos(prev => [payload.new as any, ...prev.slice(0, 19)])
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  const gastosEsteMes = gastos.reduce((a, g) => {
    const fecha = new Date(g.fecha)
    const ahora = new Date()
    if (fecha.getMonth() === ahora.getMonth() && fecha.getFullYear() === ahora.getFullYear()) {
      return a + g.importe
    }
    return a
  }, 0)

  return (
    <div className="min-h-screen bg-aureo-bg pb-24 safe-top">
      {/* Hero — Patrimonio en vivo */}
      <PatrimonioHero
        patrimonioTotal={patrimonioTotal}
        saldoLiquido={saldoLiquido}
        saldoInversion={saldoInversion}
        objetivoEnero={objetivoEnero}
        loading={loading}
      />

      <div className="px-4 space-y-4 mt-4">
        {/* Cuentas */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <CuentasGrid cuentas={cuentas} preciosVivos={preciosVivos} />
        </motion.div>

        {/* Proyección */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <ProyeccionChart
            datos={proyeccion}
            objetivo={objetivoEnero}
            plan={plan}
            onPlanChange={(key, value) => setPlan(prev => ({ ...prev, [key]: value }))}
          />
        </motion.div>

        {/* Gastos recientes */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <GastosRecientes gastos={gastos} totalEsteMes={gastosEsteMes} />
        </motion.div>

        {/* Recurrentes y suscripciones */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <RecurrentesWidget recurrentes={recurrentes} />
        </motion.div>
      </div>

      {/* Botón central añadir gasto */}
      <BotonGasto onGastoCreado={cargarDatos} />

      {/* Tab bar */}
      <BottomNav activo="dashboard" />
    </div>
  )
}
