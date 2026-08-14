'use client'

import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { ChevronRight, X } from 'lucide-react'

export const fmt = (n) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)
export const fmt2 = (n) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n)

export async function api(path, opts = {}) {
  const r = await fetch(`/api/${path}`, { headers: { 'Content-Type': 'application/json' }, ...opts })
  return r.json()
}

export function SectionHeader({ title, right, onRight }) {
  return (
    <div className="flex items-center justify-between mt-6 mb-3 px-1">
      <h2 className="text-[15px] font-semibold">{title}</h2>
      {right && (
        <button onClick={onRight} className="text-[13px] font-medium flex items-center gap-0.5" style={{color:'var(--aureo-purple)'}}>
          {right}<ChevronRight className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  )
}

export function PageHeader({ title, onBack, right }) {
  return (
    <div className="flex items-center gap-3 py-3 mb-2">
      <button onClick={onBack} aria-label="Volver" className="w-9 h-9 rounded-full grid place-items-center flex-shrink-0" style={{background:'#fff', border:'1px solid var(--aureo-border)'}}>
        <ChevronRight className="w-4 h-4 rotate-180" />
      </button>
      <h1 className="text-[20px] font-semibold flex-1">{title}</h1>
      {right}
    </div>
  )
}

/** Bottom sheet: el mismo gesto y muelle que el modal de gasto. */
export function Sheet({ title, onClose, children, onSubmit }) {
  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}
        className="fixed inset-0 z-40" style={{background:'rgba(20,16,27,0.35)', backdropFilter:'blur(4px)'}} />
      <motion.form onSubmit={onSubmit}
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 320, damping: 32 }}
        className="fixed left-0 right-0 bottom-0 z-50 max-w-md mx-auto max-h-[92vh] overflow-y-auto no-scrollbar">
        <div className="m-3 p-6 rounded-[28px]" style={{background:'#fff', border:'1px solid var(--aureo-border)', boxShadow:'0 30px 60px -20px rgba(20,16,27,0.25)'}}>
          <div className="w-10 h-1 rounded-full mx-auto -mt-2 mb-4" style={{background:'var(--aureo-border-strong)'}} />
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-[18px] font-semibold">{title}</h3>
            <button type="button" onClick={onClose} aria-label="Cerrar" className="w-9 h-9 rounded-full grid place-items-center" style={{background:'var(--aureo-bg)'}}>
              <X className="w-4 h-4" />
            </button>
          </div>
          {children}
        </div>
      </motion.form>
    </>
  )
}

export function Campo({ label, children }) {
  return (
    <div className="mb-5">
      <span className="text-[11px] uppercase tracking-wider block mb-1" style={{color:'var(--aureo-text-mute)'}}>{label}</span>
      {children}
      <div className="h-px mt-2" style={{background:'var(--aureo-border)'}} />
    </div>
  )
}

export function Boton({ children, ...props }) {
  return (
    <button {...props}
      className="pill-button w-full h-14 text-white flex items-center justify-center disabled:opacity-70"
      style={{background:'var(--aureo-purple)', boxShadow:'0 10px 24px -8px rgba(108,43,217,0.5)'}}>
      {children}
    </button>
  )
}

export function Vacio({ icon: Icon, titulo, texto }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="aureo-card p-8 text-center">
      <div className="w-14 h-14 rounded-full grid place-items-center mx-auto mb-3" style={{background:'var(--aureo-purple-soft)'}}>
        <Icon className="w-6 h-6" style={{color:'var(--aureo-purple)'}} />
      </div>
      <div className="text-[14px] font-semibold">{titulo}</div>
      <div className="text-[12px] mt-1" style={{color:'var(--aureo-text-dim)'}}>{texto}</div>
    </motion.div>
  )
}
