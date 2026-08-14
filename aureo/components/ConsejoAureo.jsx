'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { X, ExternalLink, Sparkles, TrendingDown, AlertTriangle, Newspaper } from 'lucide-react'
import AureoRobot from './AureoRobot'
import { fmt } from './ui'

/** Consejos propios. Rotan por dia del ano para que no repita cada apertura. */
const CONSEJOS = [
  'Antes de una compra de más de 50 €, espera 24 h. La mitad de las veces se te pasan las ganas.',
  'Una suscripción de 12 €/mes son 144 € al año. Míralas como cuota anual y decide otra vez.',
  'El colchón de emergencia va antes que la inversión: 3 meses de gastos fijos en cuenta remunerada.',
  'Domicilia el ahorro el día que cobras. Lo que no ves, no te lo gastas.',
  'La deuda de tarjeta al 20 % TAE rinde más amortizándola que cualquier fondo indexado.',
  'Revisa la tarifa de luz cada año. Cambiar de comercializadora cuesta cero y suele bajar la factura.',
  'Indexado global y aportación mensual fija: el 90 % de los gestores activos no bate eso a 10 años.',
  'Cancela lo que no has usado en 30 días. Si lo echas de menos, vuelves a suscribirte.',
  'El IBI y los seguros anuales duelen menos si los provisionas cada mes.',
  'Sube la aportación al ahorro cada vez que suba la nómina. Es la subida que no se nota.',
  'Compara el precio por uso, no por cuota: 10 €/mes viendo dos películas son 5 € la película.',
  'Un gasto hormiga de 3 € al día son 1.095 € al año. El café cuenta.',
]

const ICONO_SEVERIDAD = { ok: Sparkles, ajuste: TrendingDown, riesgo: AlertTriangle }
const COLOR_SEVERIDAD = { ok: '#22C55E', ajuste: '#F59E0B', riesgo: '#EF4444' }
const HUMOR_SEVERIDAD = { ok: 'celebrando', ajuste: 'pensando', riesgo: 'alerta' }

const consejoDelDia = () => {
  const inicio = new Date(new Date().getFullYear(), 0, 0)
  const dia = Math.floor((Date.now() - inicio.getTime()) / 86_400_000)
  return CONSEJOS[dia % CONSEJOS.length]
}

/** Se abre solo una vez al dia; el resto, tocando el robot. */
export function useConsejoDiario() {
  const [abierto, setAbierto] = useState(false)

  useEffect(() => {
    const hoy = new Date().toISOString().slice(0, 10)
    let visto = null
    try {
      visto = window.localStorage.getItem('aureo-consejo')
    } catch {
      return // navegacion privada: mejor no molestar
    }
    if (visto === hoy) return
    const t = setTimeout(() => {
      setAbierto(true)
      try { window.localStorage.setItem('aureo-consejo', hoy) } catch {}
    }, 1400)
    return () => clearTimeout(t)
  }, [])

  return [abierto, setAbierto]
}

export default function ConsejoAureo({ analisis, noticias = [], onClose }) {
  const Icono = ICONO_SEVERIDAD[analisis?.severidad ?? 'ok'] ?? Sparkles
  const color = COLOR_SEVERIDAD[analisis?.severidad ?? 'ok']
  const humor = HUMOR_SEVERIDAD[analisis?.severidad ?? 'ok']
  const hayAjuste = analisis && analisis.severidad !== 'ok'
  const titulares = noticias.slice(0, 3)

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-[60]"
        style={{ background: 'rgba(20,16,27,0.45)', backdropFilter: 'blur(6px)' }}
      />
      <motion.div
        role="dialog" aria-modal="true" aria-label="Consejo de Aureo"
        initial={{ opacity: 0, scale: 0.92, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ type: 'spring', stiffness: 280, damping: 26 }}
        className="fixed z-[70] inset-x-0 top-1/2 -translate-y-1/2 mx-auto max-w-[22rem] px-4"
      >
        <div className="rounded-[28px] p-6 relative"
          style={{ background: '#fff', border: '1px solid var(--aureo-border)', boxShadow: '0 40px 80px -24px rgba(20,16,27,0.45)' }}>

          <button onClick={onClose} aria-label="Cerrar"
            className="absolute top-4 right-4 w-8 h-8 rounded-full grid place-items-center"
            style={{ background: 'var(--aureo-bg)' }}>
            <X className="w-4 h-4" />
          </button>

          <div className="flex flex-col items-center text-center">
            <AureoRobot size={92} vivo humor={humor} />
            <div className="text-[11px] uppercase tracking-widest mt-2" style={{ color: 'var(--aureo-text-mute)' }}>
              Aureo dice
            </div>
            <h3 className="text-[18px] font-semibold mt-1 flex items-center gap-1.5">
              <Icono className="w-4 h-4" style={{ color }} />
              {hayAjuste ? analisis.titulo : 'Consejo del día'}
            </h3>
          </div>

          <p className="text-[14px] leading-relaxed mt-3 text-center" style={{ color: 'var(--aureo-text-dim)' }}>
            {hayAjuste ? analisis.detalle : consejoDelDia()}
          </p>

          {hayAjuste && (
            <div className="mt-4 space-y-2">
              {analisis.acciones.slice(0, 2).map((a) => (
                <div key={a.texto} className="rounded-2xl p-3 flex items-start gap-2.5"
                  style={{ background: 'var(--aureo-surface-2)', border: '1px solid var(--aureo-border)' }}>
                  <div className="w-6 h-6 rounded-full grid place-items-center flex-shrink-0 mt-0.5"
                    style={{ background: 'var(--aureo-purple-soft)' }}>
                    <Sparkles className="w-3 h-3" style={{ color: 'var(--aureo-purple)' }} />
                  </div>
                  <span className="text-[12.5px] leading-snug">{a.texto}</span>
                </div>
              ))}
            </div>
          )}

          {analisis && (
            <div className="mt-4 grid grid-cols-2 gap-2">
              <Dato label="Ahorras" valor={fmt(analisis.ahorroMensual)} tono={analisis.ahorroMensual >= 0 ? 'ok' : 'mal'} />
              <Dato label="Necesitas" valor={`${fmt(analisis.necesarioMensual)}/mes`} />
            </div>
          )}

          {titulares.length > 0 && (
            <div className="mt-5">
              <div className="text-[11px] uppercase tracking-wider mb-2 flex items-center gap-1.5" style={{ color: 'var(--aureo-text-mute)' }}>
                <Newspaper className="w-3.5 h-3.5" /> Hoy en los mercados
              </div>
              <div className="space-y-2">
                {titulares.map((n) => (
                  <a key={n.url} href={n.url} target="_blank" rel="noopener noreferrer"
                    className="flex items-start gap-2 text-[12.5px] leading-snug group">
                    <ExternalLink className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: 'var(--aureo-purple)' }} />
                    <span className="group-hover:underline">
                      {n.titulo}
                      <span className="ml-1" style={{ color: 'var(--aureo-text-mute)' }}>· {n.medio}</span>
                    </span>
                  </a>
                ))}
              </div>
            </div>
          )}

          <button onClick={onClose}
            className="pill-button w-full h-12 mt-5 text-white flex items-center justify-center"
            style={{ background: 'var(--aureo-purple)', boxShadow: '0 10px 24px -8px rgba(108,43,217,0.5)' }}>
            Entendido
          </button>
        </div>
      </motion.div>
    </>
  )
}

function Dato({ label, valor, tono }) {
  const color = tono === 'ok' ? 'var(--aureo-green)' : tono === 'mal' ? 'var(--aureo-red)' : 'var(--aureo-text)'
  return (
    <div className="rounded-2xl p-3 text-center" style={{ background: 'var(--aureo-surface-2)', border: '1px solid var(--aureo-border)' }}>
      <div className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--aureo-text-mute)' }}>{label}</div>
      <div className="tabular text-[15px] font-semibold mt-0.5" style={{ color }}>{valor}</div>
    </div>
  )
}
