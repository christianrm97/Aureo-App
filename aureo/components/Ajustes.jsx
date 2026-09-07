'use client'

import { useState } from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { LogOut, Copy, Check, RefreshCw, Smartphone, Target, ShieldCheck, Pencil, ChevronDown } from 'lucide-react'
import { CATEGORIAS } from '@/lib/gastos'
import { fmt2, api, PageHeader, Campo, Boton } from './ui'

/**
 * Ajustes del usuario: su objetivo, sus cuentas, el token del Atajo de iPhone
 * y el cierre de sesion.
 */
export default function Ajustes({ usuario, perfil, cuentas, onBack, onCambio }) {
  const [objetivo, setObjetivo] = useState(String(perfil?.objetivo ?? ''))
  const [fondo, setFondo] = useState(String(perfil?.fondo_emergencia ?? ''))
  const [guardando, setGuardando] = useState(false)
  const [copiado, setCopiado] = useState(null)
  const [guiaAbierta, setGuiaAbierta] = useState(false)
  const [aviso, setAviso] = useState(null)

  const guardar = async () => {
    setGuardando(true)
    const res = await api('perfil', {
      method: 'PATCH',
      body: JSON.stringify({
        objetivo: parseFloat(String(objetivo).replace(',', '.')) || 0,
        fondo_emergencia: parseFloat(String(fondo).replace(',', '.')) || 0,
      }),
    }).catch(() => null)
    setGuardando(false)
    setAviso(res && res.ok ? 'Guardado' : 'No se pudo guardar')
    if (res && res.ok) onCambio(res.perfil)
  }

  const copiar = async (clave, texto) => {
    try {
      await navigator.clipboard.writeText(texto)
      setCopiado(clave)
      setTimeout(() => setCopiado(null), 2000)
    } catch {
      setAviso('Tu navegador no deja copiar. Selecciónalo a mano.')
    }
  }

  const regenerar = async () => {
    const res = await api('perfil', { method: 'PATCH', body: JSON.stringify({ regenerar_token: true }) }).catch(() => null)
    if (res && res.ok) { onCambio(res.perfil); setAviso('Token nuevo. Actualízalo en el Atajo.') }
  }

  const saldoTotal = cuentas.reduce((s, c) => s + Number(c.saldo), 0)

  return (
    <>
      <PageHeader title="Ajustes" onBack={onBack} />

      <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="aureo-card p-5">
        <div className="flex items-center gap-3">
          {usuario?.avatar ? (
            <Image src={usuario.avatar} alt={'Foto de perfil de ' + (usuario.nombre ?? 'tu cuenta')}
              width={52} height={52} className="rounded-full" referrerPolicy="no-referrer" />
          ) : (
            <div className="rounded-full grid place-items-center text-white font-semibold"
              style={{ width: 52, height: 52, background: 'var(--aureo-purple)' }}>
              {(usuario?.nombre ?? '?').charAt(0).toUpperCase()}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="text-[16px] font-semibold truncate">{usuario?.nombre}</div>
            <div className="text-[12.5px] truncate" style={{ color: 'var(--aureo-text-dim)' }}>{usuario?.email}</div>
          </div>
        </div>
        <form action="/auth/signout" method="post" className="mt-4">
          <button type="submit"
            className="pill-button w-full h-12 flex items-center justify-center gap-2 font-semibold"
            style={{ background: '#FEE2E2', color: '#B91C1C' }}>
            <LogOut className="w-4 h-4" /> Cerrar sesión
          </button>
        </form>
      </motion.section>

      <div className="aureo-card mt-4 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Target className="w-4 h-4" style={{ color: 'var(--aureo-purple)' }} />
          <span className="text-[14px] font-semibold">Tu objetivo</span>
        </div>
        <Campo label="Objetivo de patrimonio líquido">
          <div className="flex items-baseline gap-1">
            <span className="text-[26px] font-semibold" style={{ color: 'var(--aureo-text-mute)' }}>€</span>
            <input inputMode="decimal" value={objetivo} onChange={(e) => setObjetivo(e.target.value)}
              className="flex-1 min-w-0 bg-transparent outline-none tabular text-[26px] font-semibold" />
          </div>
        </Campo>
        <Campo label="Fondo de emergencia (intocable)">
          <div className="flex items-baseline gap-1">
            <span className="text-[26px] font-semibold" style={{ color: 'var(--aureo-text-mute)' }}>€</span>
            <input inputMode="decimal" value={fondo} onChange={(e) => setFondo(e.target.value)}
              className="flex-1 min-w-0 bg-transparent outline-none tabular text-[26px] font-semibold" />
          </div>
        </Campo>
        <Boton type="button" onClick={guardar} disabled={guardando}>
          {guardando ? 'Guardando…' : 'Guardar objetivo'}
        </Boton>
        {aviso && <div className="text-[12.5px] text-center mt-2.5" style={{ color: 'var(--aureo-text-dim)' }}>{aviso}</div>}
      </div>

      <AtajoIPhone token={perfil?.shortcut_token} copiado={copiado} onCopiar={copiar}
        abierta={guiaAbierta} onAbrir={() => setGuiaAbierta((v) => !v)} onRegenerar={regenerar} />

      <div className="aureo-card mt-4 overflow-hidden">
        <div className="px-5 pt-5 pb-3 flex items-center gap-2">
          <Pencil className="w-4 h-4" style={{ color: 'var(--aureo-purple)' }} />
          <span className="text-[14px] font-semibold">Tus cuentas</span>
          <span className="tabular text-[13px] ml-auto font-semibold">{fmt2(saldoTotal)}</span>
        </div>
        {cuentas.map((c) => <SaldoEditable key={c.id} cuenta={c} onCambio={onCambio} />)}
      </div>

      <div className="flex items-start gap-2 mt-5 mb-2 px-1">
        <ShieldCheck className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--aureo-green)' }} />
        <p className="text-[11.5px] leading-relaxed" style={{ color: 'var(--aureo-text-mute)' }}>
          Tus datos están aislados por usuario en la base de datos: ninguna otra cuenta
          puede leerlos. Aureo no se conecta a tu banco ni pide credenciales bancarias.
        </p>
      </div>
    </>
  )
}

/** El saldo se guarda al salir del campo: sin botones por fila. */
function SaldoEditable({ cuenta, onCambio }) {
  const [valor, setValor] = useState(String(cuenta.saldo).replace('.', ','))
  const [estado, setEstado] = useState('quieto')

  const guardar = async () => {
    const saldo = parseFloat(String(valor).replace(',', '.'))
    if (!Number.isFinite(saldo) || saldo === Number(cuenta.saldo)) return
    setEstado('guardando')
    const res = await api('cuentas/' + cuenta.id, {
      method: 'PATCH', body: JSON.stringify({ saldo }),
    }).catch(() => null)
    setEstado(res && res.ok ? 'guardado' : 'error')
    if (res && res.ok) onCambio()
    setTimeout(() => setEstado('quieto'), 1600)
  }

  const color = estado === 'guardado' ? 'var(--aureo-green)'
    : estado === 'error' ? 'var(--aureo-red)' : 'var(--aureo-text)'

  return (
    <div className="flex items-center gap-3 px-5 py-3.5" style={{ borderTop: '1px solid var(--aureo-border)' }}>
      <div className="flex-1 min-w-0">
        <div className="text-[14px] font-semibold truncate">{cuenta.nombre}</div>
        {cuenta.subtitulo && (
          <div className="text-[11.5px] truncate" style={{ color: 'var(--aureo-text-mute)' }}>{cuenta.subtitulo}</div>
        )}
      </div>
      <input inputMode="decimal" value={valor} onChange={(e) => setValor(e.target.value)} onBlur={guardar}
        aria-label={'Saldo de ' + cuenta.nombre}
        className="tabular text-[15px] font-semibold text-right bg-transparent outline-none w-24"
        style={{ color }} />
      <span className="text-[14px]" style={{ color: 'var(--aureo-text-mute)' }}>€</span>
    </div>
  )
}

/** Fila copiable: el valor a la izquierda, el boton de copiar a la derecha. */
function Copiable({ etiqueta, valor, clave, copiado, onCopiar }) {
  return (
    <div className="mt-2.5">
      <div className="text-[11px] uppercase tracking-wider mb-1" style={{ color: 'var(--aureo-text-mute)' }}>
        {etiqueta}
      </div>
      <div className="rounded-2xl p-3 flex items-center gap-2"
        style={{ background: 'var(--aureo-surface-2)', border: '1px solid var(--aureo-border)' }}>
        <code className="text-[11.5px] flex-1 min-w-0 truncate">{valor}</code>
        <button type="button" onClick={() => onCopiar(clave, valor)} aria-label={`Copiar ${etiqueta}`}
          className="w-8 h-8 rounded-full grid place-items-center flex-shrink-0" style={{ background: '#fff' }}>
          {copiado === clave
            ? <Check className="w-4 h-4" style={{ color: '#22C55E' }} />
            : <Copy className="w-4 h-4" style={{ color: 'var(--aureo-text-dim)' }} />}
        </button>
      </div>
    </div>
  )
}

/**
 * Guia del Atajo de iPhone. iOS no deja instalar un atajo desde una web, asi
 * que lo unico util que puede hacer la app es dar cada pieza lista para pegar.
 *
 * El token viaja en la cabecera, nunca en la URL: una URL acaba en el historial
 * y en los logs del servidor, y con el token cualquiera podria escribir gastos
 * en esta cuenta.
 */
function AtajoIPhone({ token, copiado, onCopiar, abierta, onAbrir, onRegenerar }) {
  const endpoint = typeof window === 'undefined' ? '' : `${window.location.origin}/api/gastos`
  const cabecera = token ? `Bearer ${token}` : '—'

  return (
    <div className="aureo-card mt-4 p-5">
      <div className="flex items-center gap-2 mb-1">
        <Smartphone className="w-4 h-4" style={{ color: 'var(--aureo-purple)' }} />
        <span className="text-[14px] font-semibold">Atajo de iPhone</span>
      </div>
      <p className="text-[12.5px] leading-snug" style={{ color: 'var(--aureo-text-dim)' }}>
        Registra un gasto desde el móvil en dos toques, sin abrir la app. El token es
        personal: identifica tu cuenta, así que no lo compartas.
      </p>

      <Copiable etiqueta="Token" valor={token ?? '—'} clave="token" copiado={copiado} onCopiar={onCopiar} />

      <button type="button" onClick={onAbrir}
        className="flex items-center gap-1.5 text-[12.5px] font-medium mt-3"
        style={{ color: 'var(--aureo-purple)' }} aria-expanded={abierta}>
        <ChevronDown className="w-3.5 h-3.5 transition-transform"
          style={{ transform: abierta ? 'rotate(180deg)' : 'none' }} />
        {abierta ? 'Ocultar cómo montarlo' : 'Cómo montar el Atajo'}
      </button>

      {abierta && (
        <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--aureo-border)' }}>
          <ol className="text-[12.5px] leading-relaxed space-y-2 list-decimal pl-4"
            style={{ color: 'var(--aureo-text-dim)' }}>
            <li>Abre <b style={{ color: 'var(--aureo-text)' }}>Atajos</b> y crea uno nuevo.</li>
            <li>
              Añade <b style={{ color: 'var(--aureo-text)' }}>Pedir entrada</b> de tipo Número, con la
              pregunta &laquo;¿Cuánto?&raquo;. Es el popup que sale al lanzarlo.
            </li>
            <li>
              Añade <b style={{ color: 'var(--aureo-text)' }}>Elegir de un menú</b> con estas opciones:{' '}
              {CATEGORIAS.join(', ')}.
            </li>
            <li>
              En cada rama, añade{' '}
              <b style={{ color: 'var(--aureo-text)' }}>Obtener contenido de una URL</b> con los datos de
              abajo, poniendo en <code>categoria</code> el nombre de esa rama.
            </li>
            <li>
              Ponle icono, y añádelo a la pantalla de inicio o al{' '}
              <b style={{ color: 'var(--aureo-text)' }}>Tocar atrás</b> de Ajustes &rsaquo; Accesibilidad
              para lanzarlo con dos golpecitos en la tapa.
            </li>
          </ol>

          <Copiable etiqueta="URL (método POST)" valor={endpoint} clave="url" copiado={copiado} onCopiar={onCopiar} />
          <Copiable etiqueta="Cabecera Authorization" valor={cabecera} clave="cabecera" copiado={copiado} onCopiar={onCopiar} />
          <Copiable etiqueta="Cabecera Content-Type" valor="application/json" clave="tipo" copiado={copiado} onCopiar={onCopiar} />

          <div className="text-[11px] uppercase tracking-wider mt-2.5 mb-1" style={{ color: 'var(--aureo-text-mute)' }}>
            Cuerpo (JSON)
          </div>
          <div className="rounded-2xl p-3" style={{ background: 'var(--aureo-surface-2)', border: '1px solid var(--aureo-border)' }}>
            <pre className="text-[11.5px] whitespace-pre-wrap break-words m-0">{`{
  "importe": <la entrada pedida>,
  "categoria": "Bleap",
  "nota": "Café"
}`}</pre>
          </div>
          <p className="text-[11.5px] leading-snug mt-2" style={{ color: 'var(--aureo-text-mute)' }}>
            La respuesta trae <code>mensaje</code>: enséñalo con una notificación y sabrás que se ha
            guardado sin abrir la app.
          </p>
        </div>
      )}

      <button type="button" onClick={onRegenerar} className="flex items-center gap-1.5 text-[12.5px] font-medium mt-3"
        style={{ color: 'var(--aureo-purple)' }}>
        <RefreshCw className="w-3.5 h-3.5" /> Generar un token nuevo
      </button>
    </div>
  )
}
