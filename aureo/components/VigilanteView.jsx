'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Upload, ShieldCheck, Repeat, TrendingUp, AlertTriangle, Copy as Duplicado, Download,
  Trash2, History, Eye, Sparkles,
} from 'lucide-react'
import { leerCSV, analizar, compararInformes, aMarkdown } from '@/lib/vigilante'
import { fmt, fmt2, api, PageHeader, Vacio, ErrorCampo } from './ui'

/** Un extracto de un año entero ocupa unos cientos de KB; esto frena archivos equivocados. */
const MAX_BYTES = 5 * 1024 * 1024

/**
 * Los bancos espanoles exportan unos en UTF-8 y otros en Windows-1252. Leerlo
 * mal convierte "Comisión" en "ComisiÃ³n" y rompe la deteccion de columnas.
 */
async function leerTexto(archivo) {
  const bytes = await archivo.arrayBuffer()
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes)
  } catch {
    return new TextDecoder('windows-1252').decode(bytes)
  }
}

function descargar(nombre, contenido) {
  const url = URL.createObjectURL(new Blob([contenido], { type: 'text/markdown;charset=utf-8' }))
  const a = document.createElement('a')
  a.href = url
  a.download = nombre
  a.click()
  URL.revokeObjectURL(url)
}

export default function VigilanteView({ onBack, oculto }) {
  const [historial, setHistorial] = useState([])
  const [informe, setInforme] = useState(null)
  const [avisos, setAvisos] = useState([])
  const [error, setError] = useState(null)
  const [estado, setEstado] = useState('listo') // listo | leyendo | guardando | guardado
  const entrada = useRef(null)

  useEffect(() => {
    api('vigilante')
      .then((r) => r?.items && setHistorial([...r.items].sort((a, b) => Number(b.ts) - Number(a.ts))))
      .catch(() => {})
  }, [])

  // Se compara siempre contra el ultimo informe guardado, que es "el de la semana pasada".
  const anterior = historial[0]?.datos ?? null
  const comparacion = useMemo(
    () => (informe && anterior ? compararInformes(anterior, informe) : null),
    [informe, anterior],
  )

  const oc = (texto) => (oculto ? '•••' : texto)

  const alElegir = async (e) => {
    const archivo = e.target.files?.[0]
    e.target.value = '' // permite volver a elegir el mismo archivo
    if (!archivo) return

    setError(null)
    setAvisos([])
    setEstado('leyendo')
    if (archivo.size > MAX_BYTES) {
      setError('El archivo pesa más de 5 MB. Exporta un periodo más corto, por ejemplo los últimos 3 meses.')
      setEstado('listo')
      return
    }

    try {
      const { movimientos, avisos: leidos } = leerCSV(await leerTexto(archivo))
      setAvisos(leidos)
      if (!movimientos.length) {
        setInforme(null)
        setError('No he encontrado movimientos en ese archivo.')
      } else {
        setInforme(analizar(movimientos))
      }
    } catch {
      setError('No se ha podido leer el archivo. ¿Es un CSV?')
    }
    setEstado('listo')
  }

  const guardar = async () => {
    if (!informe || estado === 'guardando') return
    setEstado('guardando')
    setError(null)
    const res = await api('vigilante', {
      method: 'POST',
      body: JSON.stringify({
        desde: informe.desde,
        hasta: informe.hasta,
        recurrente_mensual: informe.resumen.recurrenteMensual,
        datos: informe,
        markdown: aMarkdown(informe, comparacion),
      }),
    }).catch(() => null)

    if (!res || !res.ok) {
      setError(res?.error ?? 'No se pudo guardar el informe. Inténtalo otra vez.')
      setEstado('listo')
      return
    }
    setHistorial((h) => [res.item, ...h])
    setEstado('guardado')
  }

  const borrar = async (id) => {
    const res = await api(`vigilante/${id}`, { method: 'DELETE' }).catch(() => null)
    if (res && res.ok) setHistorial((h) => h.filter((x) => x.id !== id))
  }

  return (
    <>
      <PageHeader title="Vigilante de gastos" onBack={onBack} />

      <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-[28px] p-6 text-white relative overflow-hidden"
        style={{
          background: 'radial-gradient(120% 100% at 0% 0%, rgba(255,255,255,0.16) 0%, transparent 55%), linear-gradient(140deg, #0F766E 0%, #115E59 55%, #042F2E 100%)',
          boxShadow: '0 20px 40px -20px rgba(15,118,110,0.45)',
        }}>
        <span className="chip"><Eye className="w-3.5 h-3.5" /> {informe ? 'Gasto recurrente al mes' : 'Sube tu extracto'}</span>
        {informe ? (
          <>
            <div className="tabular text-[42px] font-semibold mt-4 leading-none">{oc(fmt2(informe.resumen.recurrenteMensual))}</div>
            <div className="text-[13px] text-white/80 mt-2">
              {informe.cargos} cargos del {informe.desde} al {informe.hasta}
              {informe.resumen.ahorroAnual > 0 && ` · puedes ahorrar ${oc(fmt(informe.resumen.ahorroAnual))}/año`}
            </div>
          </>
        ) : (
          <p className="text-[14px] text-white/85 mt-4 leading-snug">
            Exporta los movimientos de tu banco o tarjeta en CSV y súbelos. Detecto suscripciones olvidadas,
            subidas de precio y cargos raros.
          </p>
        )}
      </motion.section>

      <div className="flex items-start gap-2 mt-3 px-1">
        <ShieldCheck className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--aureo-green)' }} />
        <p className="text-[11.5px] leading-snug" style={{ color: 'var(--aureo-text-mute)' }}>
          El extracto se analiza en este dispositivo y no se sube a ningún servidor. Solo se guarda el informe, si tú lo pides.
        </p>
      </div>

      <input ref={entrada} type="file" accept=".csv,text/csv" onChange={alElegir} className="hidden"
        aria-label="Elegir extracto CSV" />
      <button onClick={() => entrada.current?.click()} disabled={estado === 'leyendo'}
        className="pill-button w-full h-14 mt-4 flex items-center justify-center gap-2 font-semibold"
        style={{ background: '#CCFBF1', color: '#0F766E' }}>
        <Upload className="w-5 h-5" /> {estado === 'leyendo' ? 'Analizando…' : informe ? 'Analizar otro extracto' : 'Elegir extracto CSV'}
      </button>

      <ErrorCampo>{error}</ErrorCampo>
      {avisos.map((a) => (
        <p key={a} className="text-[12px] mt-2 px-1" style={{ color: 'var(--aureo-text-dim)' }}>{a}</p>
      ))}

      {informe && (
        <>
          {comparacion && <Cambios comparacion={comparacion} oc={oc} />}
          <Revisar informe={informe} oc={oc} />
          <Recurrentes informe={informe} oc={oc} />
          <Subidas informe={informe} oc={oc} />
          <Rarezas informe={informe} oc={oc} />

          <div className="grid grid-cols-2 gap-3 mt-4">
            <button onClick={guardar} disabled={estado === 'guardando' || estado === 'guardado'}
              className="pill-button h-12 flex items-center justify-center gap-2 font-semibold text-[14px]"
              style={{ background: 'var(--aureo-purple)', color: '#fff', opacity: estado === 'guardado' ? 0.6 : 1 }}>
              <History className="w-4 h-4" />
              {estado === 'guardando' ? 'Guardando…' : estado === 'guardado' ? 'Guardado' : 'Guardar informe'}
            </button>
            <button onClick={() => descargar('vigilante-gastos.md', aMarkdown(informe, comparacion))}
              className="pill-button h-12 flex items-center justify-center gap-2 font-semibold text-[14px]"
              style={{ background: '#fff', color: 'var(--aureo-text)', border: '1px solid var(--aureo-border)' }}>
              <Download className="w-4 h-4" /> vigilante-gastos.md
            </button>
          </div>
        </>
      )}

      {historial.length > 0 && <Historial historial={historial} oc={oc} onBorrar={borrar} />}
    </>
  )
}

function Tarjeta({ icono: Icono, color, bg, titulo, children }) {
  return (
    <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="aureo-card mt-4 overflow-hidden">
      <div className="px-5 pt-4 pb-2 flex items-center gap-2">
        <div className="w-7 h-7 rounded-full grid place-items-center" style={{ background: bg }}>
          <Icono className="w-3.5 h-3.5" style={{ color }} />
        </div>
        <h3 className="text-[14px] font-semibold">{titulo}</h3>
      </div>
      {children}
    </motion.section>
  )
}

function Fila({ primero, titulo, detalle, derecha, colorDerecha }) {
  return (
    <div className="flex items-center gap-3 px-5 py-3" style={{ borderTop: primero ? 'none' : '1px solid var(--aureo-border)' }}>
      <div className="flex-1 min-w-0">
        <div className="text-[14px] font-medium truncate">{titulo}</div>
        {detalle && <div className="text-[12px] truncate" style={{ color: 'var(--aureo-text-dim)' }}>{detalle}</div>}
      </div>
      {derecha && <div className="tabular text-[14px] font-semibold flex-shrink-0" style={{ color: colorDerecha }}>{derecha}</div>}
    </div>
  )
}

function Revisar({ informe, oc }) {
  const { revisar, ahorroAnual } = informe.resumen
  if (!revisar.length) return null
  return (
    <Tarjeta icono={Sparkles} color="#6C2BD9" bg="#EFE7FB" titulo={`Revisa estos ${revisar.length}`}>
      {revisar.map((r, i) => (
        <Fila key={r.comercio} primero={i === 0} titulo={r.comercio} detalle={r.motivo} derecha={`${oc(fmt2(r.mensual))}/mes`} />
      ))}
      <div className="px-5 py-3 text-[12.5px]" style={{ borderTop: '1px solid var(--aureo-border)', color: 'var(--aureo-text-dim)' }}>
        Si los quitas ahorras <b style={{ color: '#22C55E' }}>{oc(fmt2(ahorroAnual))}</b> al año.
      </div>
    </Tarjeta>
  )
}

function Recurrentes({ informe, oc }) {
  return (
    <Tarjeta icono={Repeat} color="#3B82F6" bg="#DBEAFE" titulo="Cargos recurrentes">
      {!informe.recurrentes.length ? (
        <p className="px-5 pb-4 text-[13px]" style={{ color: 'var(--aureo-text-dim)' }}>No hay cargos que se repitan con un importe fijo.</p>
      ) : informe.recurrentes.map((r, i) => (
        <Fila key={r.comercio} primero={i === 0} titulo={r.comercio}
          detalle={`${oc(fmt2(r.importe))} ${r.frecuencia} · ${oc(fmt(r.total3m))} en 3 meses${r.enDuda ? ' · ¿la sigues usando?' : ''}`}
          derecha={`${oc(fmt2(r.mensual))}/mes`} colorDerecha={r.enDuda ? '#D97706' : undefined} />
      ))}
    </Tarjeta>
  )
}

function Subidas({ informe, oc }) {
  if (!informe.subidas.length) return null
  return (
    <Tarjeta icono={TrendingUp} color="#EF4444" bg="#FEE2E2" titulo="Subidas de precio">
      {informe.subidas.map((s, i) => (
        <Fila key={s.comercio} primero={i === 0} titulo={s.comercio} detalle={`Desde el ${s.fecha}`}
          derecha={`${oc(fmt2(s.antes))} → ${oc(fmt2(s.despues))}`} colorDerecha="#EF4444" />
      ))}
    </Tarjeta>
  )
}

function Rarezas({ informe, oc }) {
  if (!informe.rarezas.length) return null
  return (
    <Tarjeta icono={AlertTriangle} color="#D97706" bg="#FEF3C7" titulo="Lo raro">
      {informe.rarezas.map((r, i) => (
        <div key={`${r.tipo}-${r.comercio}-${r.fecha}-${r.importe}`} className="flex items-start gap-3 px-5 py-3"
          style={{ borderTop: i === 0 ? 'none' : '1px solid var(--aureo-border)' }}>
          {r.tipo === 'duplicado'
            ? <Duplicado className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#D97706' }} aria-label="Duplicado" />
            : <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#D97706' }} aria-label="Atípico" />}
          <div className="flex-1 min-w-0">
            <div className="text-[14px] font-medium truncate">{r.comercio} · {oc(fmt2(r.importe))}</div>
            <div className="text-[12px]" style={{ color: 'var(--aureo-text-dim)' }}>{r.fecha}. {r.detalle}</div>
          </div>
        </div>
      ))}
    </Tarjeta>
  )
}

function Cambios({ comparacion, oc }) {
  const { nuevos, desaparecidos, cambios, diferenciaMensual } = comparacion
  const nada = !nuevos.length && !desaparecidos.length && !cambios.length
  return (
    <Tarjeta icono={History} color="#0F766E" bg="#CCFBF1" titulo={`Desde el informe del ${comparacion.anterior.slice(0, 10)}`}>
      <p className="px-5 pb-2 text-[13px]" style={{ color: 'var(--aureo-text-dim)' }}>
        {nada
          ? 'Tus cargos recurrentes no han cambiado.'
          : <>Recurrente mensual: <b style={{ color: diferenciaMensual > 0 ? '#EF4444' : '#22C55E' }}>
              {diferenciaMensual > 0 ? '+' : ''}{oc(fmt2(diferenciaMensual))}</b></>}
      </p>
      {nuevos.map((r) => <Fila key={`n-${r.comercio}`} titulo={`Nuevo: ${r.comercio}`} derecha={`${oc(fmt2(r.mensual))}/mes`} colorDerecha="#EF4444" />)}
      {desaparecidos.map((r) => <Fila key={`d-${r.comercio}`} titulo={`Ya no aparece: ${r.comercio}`} derecha={`−${oc(fmt2(r.mensual))}/mes`} colorDerecha="#22C55E" />)}
      {cambios.map((c) => <Fila key={`c-${c.comercio}`} titulo={c.comercio} derecha={`${oc(fmt2(c.antes))} → ${oc(fmt2(c.despues))}`} />)}
    </Tarjeta>
  )
}

function Historial({ historial, oc, onBorrar }) {
  return (
    <Tarjeta icono={History} color="var(--aureo-text-dim)" bg="var(--aureo-bg)" titulo="Informes guardados">
      <AnimatePresence>
        {historial.map((h, i) => (
          <motion.div key={h.id} exit={{ opacity: 0, height: 0 }} className="flex items-center gap-3 px-5 py-3 group"
            style={{ borderTop: i === 0 ? 'none' : '1px solid var(--aureo-border)' }}>
            <div className="flex-1 min-w-0">
              <div className="text-[14px] font-medium">{new Date(Number(h.ts)).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
              <div className="text-[12px]" style={{ color: 'var(--aureo-text-dim)' }}>Extracto del {h.desde} al {h.hasta}</div>
            </div>
            <div className="tabular text-[14px] font-semibold">{oc(fmt2(h.recurrente_mensual))}/mes</div>
            <button onClick={() => onBorrar(h.id)} aria-label="Borrar informe"
              className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition w-7 h-7 rounded-full grid place-items-center flex-shrink-0"
              style={{ background: 'var(--aureo-bg)' }}>
              <Trash2 className="w-3.5 h-3.5" style={{ color: 'var(--aureo-text-dim)' }} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
      {!historial.length && <Vacio icon={History} titulo="Sin informes" texto="Guarda el primero para compararlo la semana que viene" />}
    </Tarjeta>
  )
}
