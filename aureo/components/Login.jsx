'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Wallet, LineChart, Zap, Repeat, Calculator, ShieldCheck, AlertTriangle,
} from 'lucide-react'
import AureoRobot from './AureoRobot'
import { supabaseNavegador } from '@/lib/supabase/navegador'

const SERVICIOS = [
  { icon: Wallet,      titulo: 'Patrimonio neto en vivo',    texto: 'Banco, inversión y deuda en un número que late.' },
  { icon: LineChart,   titulo: 'Inversión en tiempo real',   texto: 'Precios en directo y proyección por periodo.' },
  { icon: Zap,         titulo: 'Movimientos en segundos',    texto: 'Un gasto desde el móvil sin escribir casi nada.' },
  { icon: Repeat,      titulo: 'Recurrentes y presupuestos', texto: 'Controla lo fijo cada mes, sin sorpresas.' },
  { icon: Calculator,  titulo: 'Simuladores',                texto: 'Proyecta préstamos, hipoteca y ahorro antes de decidir.' },
  { icon: ShieldCheck, titulo: 'Privacidad total',           texto: 'Tus datos son solo tuyos. Siempre.' },
]

export default function Login({ configurado, error, volver }) {
  const [cargando, setCargando] = useState(false)
  const [fallo, setFallo] = useState(error ?? null)

  const entrar = async () => {
    const db = supabaseNavegador()
    if (!db) {
      setFallo('La app todavía no tiene Supabase configurado.')
      return
    }
    setCargando(true)
    setFallo(null)

    const destino = new URL('/auth/callback', window.location.origin)
    if (volver && volver.startsWith('/')) destino.searchParams.set('volver', volver)

    const { error: e } = await db.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: destino.toString(),
        queryParams: { access_type: 'offline', prompt: 'consent' },
      },
    })

    if (e) {
      setFallo(
        /provider is not enabled/i.test(e.message)
          ? 'Google todavía no está activado como proveedor en Supabase.'
          : e.message,
      )
      setCargando(false)
    }
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--aureo-bg)' }}>
      <div className="max-w-md mx-auto px-5 py-10">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="hero-gradient rounded-[28px] p-7 text-white relative overflow-hidden"
          style={{ boxShadow: '0 20px 40px -20px rgba(76, 29, 149, 0.45)' }}>
          <div className="flex items-center gap-3">
            <AureoRobot size={64} variant="lavanda" vivo humor="feliz" />
            <div>
              <div className="text-[30px] font-bold leading-none tracking-tight">Aureo</div>
              <div className="text-[13px] text-white/80 mt-1">Tu dinero, claro</div>
            </div>
          </div>
          <h1 className="text-[22px] font-semibold leading-tight mt-6">
            Todo tu dinero en un número que entiendes
          </h1>
          <p className="text-[13.5px] text-white/85 leading-relaxed mt-2">
            Cuentas, gastos, suscripciones, deuda y objetivo. Aureo lo junta, lo calcula
            y te dice qué mover para llegar.
          </p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="mt-5">
          <button onClick={entrar} disabled={cargando || !configurado}
            className="pill-button w-full h-14 flex items-center justify-center gap-3 font-semibold disabled:opacity-60"
            style={{ background: '#fff', border: '1px solid var(--aureo-border)', boxShadow: '0 10px 24px -12px rgba(20,16,27,0.3)' }}>
            <LogoGoogle />
            {cargando ? 'Abriendo Google…' : 'Continuar con Google'}
          </button>

          <p className="text-[11.5px] text-center mt-3 leading-relaxed" style={{ color: 'var(--aureo-text-mute)' }}>
            Solo pedimos tu nombre y tu correo para identificar tu perfil.
            Tus datos financieros los escribes tú y no salen de tu cuenta.
          </p>

          {(fallo || !configurado) && (
            <div className="mt-4 rounded-2xl p-4 flex items-start gap-2.5"
              style={{ background: '#FEE2E2', border: '1px solid #FCA5A5' }}>
              <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#B91C1C' }} />
              <div className="text-[12.5px] leading-snug" style={{ color: '#7F1D1D' }}>
                {fallo ?? 'La app todavía no tiene Supabase configurado.'}
              </div>
            </div>
          )}
        </motion.div>

        <div className="grid grid-cols-2 gap-3 mt-7">
          {SERVICIOS.map((s, i) => (
            <motion.div key={s.titulo} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + i * 0.05 }} className="aureo-card p-4">
              <div className="w-9 h-9 rounded-full grid place-items-center mb-2.5"
                style={{ background: 'var(--aureo-purple-soft)' }}>
                <s.icon className="w-4 h-4" style={{ color: 'var(--aureo-purple)' }} strokeWidth={2.2} />
              </div>
              <div className="text-[13px] font-semibold leading-tight">{s.titulo}</div>
              <div className="text-[11.5px] leading-snug mt-1" style={{ color: 'var(--aureo-text-dim)' }}>
                {s.texto}
              </div>
            </motion.div>
          ))}
        </div>

        <p className="text-[11px] text-center mt-8" style={{ color: 'var(--aureo-text-mute)' }}>
          Aureo no se conecta a tu banco ni pide credenciales bancarias.
          Los datos los introduces tú.
        </p>
      </div>
    </div>
  )
}

function LogoGoogle() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  )
}
