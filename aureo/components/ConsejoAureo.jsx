'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { X, ExternalLink, Sparkles, TrendingDown, AlertTriangle, Newspaper, Shuffle, Target } from 'lucide-react'
import AureoRobot from './AureoRobot'
import { fmt } from './ui'

/** Consejos propios de ahorro e inversion. */
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
  'La cuenta remunerada al 2,47 % te da 25 € al año por cada 1.000 €. Es gratis, pero no es rico.',
  'Un ingreso extra puntual va entero al objetivo, no al gasto. Ese es el truco de los extras.',
  'Antes de financiar a 12 meses, pregunta el precio al contado. Si no baja, el interés está dentro.',
  'Fracciona el objetivo: 3.663 € asusta, 300 € al mes no.',
  'Los seguros se renuevan solos y suben solos. Pide presupuesto a otra compañía cada año.',
  'Si cobras variable, presupuesta con el mes peor. Lo que sobre es ahorro, no margen.',
  'Domiciliar la nómina suele bonificar comisiones. Comprueba qué te exige el banco a cambio.',
  'Ahorrar 100 € es más fácil que ganar 100 €: no pagas IRPF por lo que no gastas.',
]

const ICONO = { ok: Sparkles, ajuste: TrendingDown, riesgo: AlertTriangle }
const COLOR = { ok: '#22C55E', ajuste: '#F59E0B', riesgo: '#EF4444' }
const HUMOR = { ok: 'celebrando', ajuste: 'pensando', riesgo: 'alerta' }

/** Se abre solo una vez al dia; el resto, a demanda. */
export function useConsejoDiario() {
  const [abierto, setAbierto] = useState(false)

  useEffect(() => {
    const hoy = new Date().toISOString().slice(0, 10)
    try {
      if (window.localStorage.getItem('aureo-consejo') === hoy) return
    } catch {
      return // navegacion privada: mejor no molestar
    }
    const t = setTimeout(() => {
      setAbierto(true)
      try { window.localStorage.setItem('aureo-consejo', hoy) } catch {}
    }, 1400)
    return () => clearTimeout(t)
  }, [])

  return [abierto, setAbierto]
}

/**
 * Construye la baraja de mensajes: consejos propios, el analisis del objetivo
 * y los titulares del dia. Cada apertura saca uno distinto del anterior.
 */
function usarBaraja(analisis, noticias) {
  const baraja = useMemo(() => {
    const cartas = CONSEJOS.map((texto) => ({ tipo: 'consejo', titulo: 'Consejo del día', texto }))

    if (analisis) {
      cartas.push({
        tipo: 'analisis',
        titulo: analisis.titulo,
        texto: analisis.detalle,
        acciones: analisis.acciones.slice(0, 2),
      })
      for (const a of analisis.acciones) {
        if (a.palanca !== 'ninguna') {
          cartas.push({ tipo: 'analisis', titulo: 'Reajuste sugerido', texto: a.texto })
        }
      }
    }

    for (const n of noticias.slice(0, 8)) {
      cartas.push({ tipo: 'noticia', titulo: `Actualidad · ${n.medio}`, texto: n.titulo, url: n.url })
    }

    return cartas
  }, [analisis, noticias])

  const anterior = useRef(-1)
  const sacar = () => {
    if (baraja.length === 0) return 0
    if (baraja.length === 1) return 0
    let i = anterior.current
    // Sortea hasta que salga una distinta de la ultima: "otro consejo" tiene
    // que cambiar el mensaje siempre, no a veces.
    while (i === anterior.current) i = Math.floor(Math.random() * baraja.length)
    anterior.current = i
    return i
  }

  const [indice, setIndice] = useState(() => sacar())
  return [baraja[indice] ?? null, () => setIndice(sacar())]
}

export default function ConsejoAureo({ analisis, noticias = [], onClose }) {
  const [carta, siguiente] = usarBaraja(analisis, noticias)
  const severidad = analisis?.severidad ?? 'ok'
  const Icono = carta?.tipo === 'noticia' ? Newspaper : carta?.tipo === 'analisis' ? ICONO[severidad] : Sparkles
  const color = carta?.tipo === 'consejo' ? 'var(--aureo-purple)' : COLOR[severidad]
  const titulares = noticias.slice(0, 3)

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-[60]"
        style={{ background: 'rgba(20,16,27,0.45)', backdropFilter: 'blur(6px)' }}
      />
      {/* El centrado va por grid, no por -translate-y-1/2: Framer escribe
          `transform` para animar y pisaria la clase de Tailwind. */}
      <div className="fixed inset-0 z-[70] grid place-items-center p-4 pointer-events-none">
      <motion.div
        role="dialog" aria-modal="true" aria-label="Consejo de Aureo"
        initial={{ opacity: 0, scale: 0.92, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ type: 'spring', stiffness: 280, damping: 26 }}
        className="w-full max-w-[22rem] max-h-full pointer-events-auto"
      >
        <div className="rounded-[28px] p-6 relative max-h-[86vh] overflow-y-auto no-scrollbar"
          style={{ background: '#fff', border: '1px solid var(--aureo-border)', boxShadow: '0 40px 80px -24px rgba(20,16,27,0.45)' }}>

          <button onClick={onClose} aria-label="Cerrar"
            className="absolute top-4 right-4 w-8 h-8 rounded-full grid place-items-center z-10"
            style={{ background: 'var(--aureo-bg)' }}>
            <X className="w-4 h-4" />
          </button>

          <div className="flex flex-col items-center text-center">
            <AureoRobot size={92} vivo humor={HUMOR[severidad]} />
            <div className="text-[11px] uppercase tracking-widest mt-2" style={{ color: 'var(--aureo-text-mute)' }}>
              Aureo dice
            </div>
            <h3 className="text-[17px] font-semibold mt-1 flex items-center gap-1.5 justify-center">
              <Icono className="w-4 h-4 flex-shrink-0" style={{ color }} />
              {carta?.titulo ?? 'Sin novedades'}
            </h3>
          </div>

          {/* key: fuerza la transicion cuando cambia el mensaje */}
          <motion.p key={carta?.texto} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
            className="text-[14px] leading-relaxed mt-3 text-center" style={{ color: 'var(--aureo-text-dim)' }}>
            {carta?.texto ?? 'Añade tus gastos fijos y te digo por dónde va el objetivo.'}
          </motion.p>

          {carta?.url && (
            <a href={carta.url} target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 mt-2 text-[12.5px] font-medium"
              style={{ color: 'var(--aureo-purple)' }}>
              Leer la noticia <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}

          {carta?.acciones?.length > 0 && (
            <div className="mt-4 space-y-2">
              {carta.acciones.map((a) => (
                <div key={a.texto} className="rounded-2xl p-3 flex items-start gap-2.5"
                  style={{ background: 'var(--aureo-surface-2)', border: '1px solid var(--aureo-border)' }}>
                  <div className="w-6 h-6 rounded-full grid place-items-center flex-shrink-0 mt-0.5"
                    style={{ background: 'var(--aureo-purple-soft)' }}>
                    <Target className="w-3 h-3" style={{ color: 'var(--aureo-purple)' }} />
                  </div>
                  <span className="text-[12.5px] leading-snug">{a.texto}</span>
                </div>
              ))}
            </div>
          )}

          {analisis && (
            <div className="mt-4 grid grid-cols-2 gap-2">
              <Dato label="Ahorras" valor={`${fmt(analisis.ahorroMensual)}/mes`} tono={analisis.ahorroMensual >= 0 ? 'ok' : 'mal'} />
              <Dato label="Necesitas" valor={`${fmt(analisis.necesarioMensual)}/mes`} />
            </div>
          )}

          {titulares.length > 0 && carta?.tipo !== 'noticia' && (
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

          <div className="flex gap-2 mt-5">
            <button onClick={siguiente} type="button"
              className="pill-button h-12 px-4 flex items-center justify-center gap-1.5 font-semibold flex-shrink-0"
              style={{ background: 'var(--aureo-purple-soft)', color: 'var(--aureo-purple)' }}>
              <Shuffle className="w-4 h-4" /> Otro
            </button>
            <button onClick={onClose}
              className="pill-button h-12 flex-1 text-white flex items-center justify-center"
              style={{ background: 'var(--aureo-purple)', boxShadow: '0 10px 24px -8px rgba(108,43,217,0.5)' }}>
              Entendido
            </button>
          </div>
        </div>
      </motion.div>
      </div>
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
