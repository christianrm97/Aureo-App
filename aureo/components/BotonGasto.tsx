'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'

const CATEGORIAS = ['Bleap', 'Cuenta Pareja', 'Efectivo', 'Suscripción', 'Recibo']

export default function BotonGasto({ onGastoCreado }: { onGastoCreado: () => void }) {
  const [abierto, setAbierto] = useState(false)
  const [nota, setNota] = useState('')
  const [importe, setImporte] = useState('')
  const [categoria, setCategoria] = useState('Bleap')
  const [guardando, setGuardando] = useState(false)

  const guardar = async () => {
    if (!nota.trim() || !importe) return
    setGuardando(true)
    if (!supabase) { setGuardando(false); return }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setGuardando(false); return }

    await supabase.from('gastos').insert({
      user_id: user.id,
      nota: nota.trim(),
      importe: parseFloat(importe),
      categoria,
    })

    setNota(''); setImporte(''); setCategoria('Bleap')
    setAbierto(false)
    setGuardando(false)
    onGastoCreado()
  }

  return (
    <>
      {/* Modal */}
      <AnimatePresence>
        {abierto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 flex items-end"
            onClick={() => setAbierto(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 400 }}
              className="w-full bg-aureo-surface rounded-t-3xl p-6 safe-bottom"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-aureo-text">Nuevo gasto</h2>
                <button onClick={() => setAbierto(false)}>
                  <X size={20} className="text-aureo-muted" />
                </button>
              </div>

              {/* Importe grande */}
              <div className="text-center mb-6">
                <div className="flex items-center justify-center gap-2">
                  <span className="text-4xl font-bold text-aureo-muted">€</span>
                  <input
                    type="number"
                    value={importe}
                    onChange={e => setImporte(e.target.value)}
                    placeholder="0,00"
                    className="num text-5xl font-bold text-aureo-text bg-transparent outline-none w-40 text-center placeholder:text-aureo-surface2"
                    autoFocus
                    inputMode="decimal"
                  />
                </div>
              </div>

              {/* Nota */}
              <input
                type="text"
                value={nota}
                onChange={e => setNota(e.target.value)}
                placeholder="¿En qué lo gastaste?"
                className="w-full bg-aureo-surface2 rounded-aureo-sm px-4 py-3 text-aureo-text placeholder:text-aureo-muted outline-none mb-4"
              />

              {/* Categorías */}
              <div className="flex gap-2 flex-wrap mb-6">
                {CATEGORIAS.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setCategoria(cat)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      categoria === cat
                        ? 'bg-aureo-green text-aureo-bg'
                        : 'bg-aureo-surface2 text-aureo-muted'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Guardar */}
              <button
                onClick={guardar}
                disabled={!nota.trim() || !importe || guardando}
                className="w-full bg-aureo-green text-aureo-bg font-bold py-4 rounded-aire disabled:opacity-40 transition-opacity text-base"
              >
                {guardando ? 'Guardando...' : 'Guardar gasto'}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Botón flotante */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={() => setAbierto(true)}
        className="fixed bottom-24 left-1/2 -translate-x-1/2 w-14 h-14 bg-aureo-green rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(0,200,150,0.4)] z-30"
      >
        <Plus size={26} className="text-aureo-bg" strokeWidth={2.5} />
      </motion.button>
    </>
  )
}
