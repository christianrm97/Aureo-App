'use client'

import { useState } from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { LogOut, Copy, Check, RefreshCw, Smartphone, Target, ShieldCheck, Pencil, ChevronDown, Download, Trash2, Rocket, HelpCircle } from 'lucide-react'
import { CATEGORIAS } from '@/lib/gastos'
import { fmt2, api, PageHeader, Campo, Boton } from './ui'
import { PieLegal } from './Legal'

/**
 * Ajustes del usuario: su objetivo, sus cuentas, el token del Atajo de iPhone
 * y el cierre de sesion.
 */
export default function Ajustes({ usuario, perfil, cuentas, onBack, onCambio }) {
  const [objetivo, setObjetivo] = useState(String(perfil?.objetivo ?? ''))
  const [fondo, setFondo] = useState(String(perfil?.fondo_emergencia ?? ''))
  const [fechaObjetivo, setFechaObjetivo] = useState(perfil?.fecha_objetivo ?? '')
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
        ...(fechaObjetivo ? { fecha_objetivo: fechaObjetivo } : {}),
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
        <Campo label="Fecha del objetivo">
          <input type="date" value={fechaObjetivo} onChange={(e) => setFechaObjetivo(e.target.value)}
            aria-label="Fecha del objetivo" className="w-full bg-transparent outline-none text-[16px]" />
        </Campo>
        <Boton type="button" onClick={guardar} disabled={guardando}>
          {guardando ? 'Guardando…' : 'Guardar objetivo'}
        </Boton>
        {aviso && <div className="text-[12.5px] text-center mt-2.5" style={{ color: 'var(--aureo-text-dim)' }}>{aviso}</div>}
      </div>

      <PlanPersonal perfil={perfil} onCambio={onCambio} />

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

      <a href="/faq" className="aureo-card mt-4 p-5 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full grid place-items-center flex-shrink-0" style={{ background: 'var(--aureo-purple-soft)' }}>
          <HelpCircle className="w-5 h-5" style={{ color: 'var(--aureo-purple)' }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[14px] font-semibold">Preguntas frecuentes</div>
          <div className="text-[12px]" style={{ color: 'var(--aureo-text-dim)' }}>
            Privacidad, bancos, extractos CSV, iPhone y tus datos
          </div>
        </div>
      </a>

      <TusDatos />

      <div className="flex items-start gap-2 mt-5 mb-2 px-1">
        <ShieldCheck className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--aureo-green)' }} />
        <p className="text-[11.5px] leading-relaxed" style={{ color: 'var(--aureo-text-mute)' }}>
          Tus datos están aislados por usuario en la base de datos: ninguna otra cuenta
          puede leerlos. Aureo no se conecta a tu banco ni pide credenciales bancarias.
        </p>
      </div>

      <PieLegal />
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
  "categoria": "${CATEGORIAS[0]}",
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

/**
 * Portabilidad y supresion de datos (RGPD) sin tener que escribir a nadie.
 * Borrar pide teclear ELIMINAR: no se puede deshacer, asi que no puede
 * depender de un toque despistado.
 */
function TusDatos() {
  const [confirmando, setConfirmando] = useState(false)
  const [texto, setTexto] = useState('')
  const [borrando, setBorrando] = useState(false)
  const [error, setError] = useState(null)
  const listo = texto === 'ELIMINAR'

  const eliminar = async () => {
    if (!listo || borrando) return
    setBorrando(true)
    setError(null)
    const res = await api('datos', { method: 'DELETE', body: JSON.stringify({ confirmar: 'ELIMINAR' }) }).catch(() => null)
    if (res && res.ok) {
      window.location.href = '/login'
      return
    }
    setError(res?.error ?? 'No se pudo eliminar la cuenta. Inténtalo otra vez.')
    setBorrando(false)
  }

  const cancelar = () => {
    setConfirmando(false)
    setTexto('')
    setError(null)
  }

  return (
    <div className="aureo-card mt-4 p-5">
      <div className="flex items-center gap-2 mb-1">
        <ShieldCheck className="w-4 h-4" style={{ color: 'var(--aureo-purple)' }} />
        <span className="text-[14px] font-semibold">Tus datos</span>
      </div>
      <p className="text-[12.5px] leading-snug" style={{ color: 'var(--aureo-text-dim)' }}>
        Son tuyos. Descárgalos cuando quieras o elimina la cuenta con todo lo que contiene.
      </p>

      <a href="/api/datos" download
        className="pill-button w-full h-12 mt-3 flex items-center justify-center gap-2 font-semibold text-[14px]"
        style={{ background: 'var(--aureo-surface-2)', color: 'var(--aureo-text)', border: '1px solid var(--aureo-border)' }}>
        <Download className="w-4 h-4" /> Descargar mis datos (JSON)
      </a>

      {!confirmando ? (
        <button type="button" onClick={() => setConfirmando(true)}
          className="flex items-center gap-1.5 text-[12.5px] font-medium mt-3" style={{ color: '#DC2626' }}>
          <Trash2 className="w-3.5 h-3.5" /> Eliminar mi cuenta
        </button>
      ) : (
        <div className="mt-3 rounded-2xl p-3" style={{ background: '#FEF2F2', border: '1px solid #FECACA' }}>
          <p className="text-[12.5px] leading-snug" style={{ color: '#991B1B' }}>
            Se borrarán tus cuentas, gastos, recibos, deudas, proyectos e informes.{' '}
            <b>No se puede deshacer.</b> Escribe ELIMINAR para confirmar.
          </p>
          <input value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="ELIMINAR"
            autoCapitalize="characters" autoComplete="off" aria-label="Escribe ELIMINAR para confirmar"
            className="w-full mt-2 rounded-xl px-3 h-10 text-[14px] outline-none"
            style={{ background: '#fff', border: '1px solid #FECACA' }} />
          {error && <p role="alert" className="text-[12px] mt-2" style={{ color: '#991B1B' }}>{error}</p>}
          <div className="grid grid-cols-2 gap-2 mt-2">
            <button type="button" onClick={cancelar} className="h-10 rounded-xl text-[13px] font-medium"
              style={{ background: '#fff', border: '1px solid var(--aureo-border)' }}>
              Cancelar
            </button>
            <button type="button" onClick={eliminar} disabled={!listo || borrando}
              className="h-10 rounded-xl text-[13px] font-semibold text-white"
              style={{ background: '#DC2626', opacity: !listo || borrando ? 0.5 : 1 }}>
              {borrando ? 'Eliminando…' : 'Eliminar para siempre'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Presupuesto de proyectos y checkpoint de este usuario. Son opcionales: si no
 * los rellena, esas tarjetas no aparecen. Vaciar un campo lo quita.
 */
function PlanPersonal({ perfil, onCambio }) {
  const texto = (v) => (v === null || v === undefined ? '' : String(v))
  const [v, setV] = useState({
    proyectos_inicial: texto(perfil?.proyectos_inicial),
    proyectos_aporte: texto(perfil?.proyectos_aporte),
    proyectos_tope: texto(perfil?.proyectos_tope),
    proyectos_inicio: texto(perfil?.proyectos_inicio),
    checkpoint_fecha: texto(perfil?.checkpoint_fecha),
    checkpoint_ingreso: texto(perfil?.checkpoint_ingreso),
  })
  const [estado, setEstado] = useState(null)
  const cambiar = (campo) => (e) => setV({ ...v, [campo]: e.target.value })

  const guardar = async () => {
    setEstado('Guardando…')
    const cuerpo = Object.fromEntries(
      Object.entries(v).map(([k, x]) => [k, String(x).trim() === '' ? null : String(x).trim().replace(',', '.')]),
    )
    const res = await api('perfil', { method: 'PATCH', body: JSON.stringify(cuerpo) }).catch(() => null)
    if (res && res.ok) {
      onCambio(res.perfil)
      setEstado('Guardado')
    } else {
      setEstado(res?.error ?? 'No se pudo guardar')
    }
  }

  const euros = (campo, etiqueta) => (
    <Campo label={etiqueta}>
      <div className="flex items-baseline gap-1">
        <span className="text-[18px] font-semibold" style={{ color: 'var(--aureo-text-mute)' }}>€</span>
        <input inputMode="decimal" value={v[campo]} onChange={cambiar(campo)} placeholder="—" aria-label={etiqueta}
          className="flex-1 min-w-0 bg-transparent outline-none tabular text-[18px] font-semibold" />
      </div>
    </Campo>
  )
  const fecha = (campo, etiqueta) => (
    <Campo label={etiqueta}>
      <input type="date" value={v[campo]} onChange={cambiar(campo)} aria-label={etiqueta}
        className="w-full bg-transparent outline-none text-[15px]" />
    </Campo>
  )

  return (
    <div className="aureo-card mt-4 p-5">
      <div className="flex items-center gap-2 mb-1">
        <Rocket className="w-4 h-4" style={{ color: 'var(--aureo-purple)' }} />
        <span className="text-[14px] font-semibold">Proyectos y checkpoint</span>
      </div>
      <p className="text-[12.5px] leading-snug mb-3" style={{ color: 'var(--aureo-text-dim)' }}>
        Opcional. Si tienes proyectos paralelos, define cuánto les dedicas y cuándo deberían dar resultados.
      </p>
      <div className="grid grid-cols-2 gap-x-3">
        {euros('proyectos_inicial', 'Presupuesto inicial')}
        {euros('proyectos_aporte', 'Aportación al mes')}
        {euros('proyectos_tope', 'Tope de gasto al mes')}
        {fecha('proyectos_inicio', 'Desde')}
        {fecha('checkpoint_fecha', 'Fecha del checkpoint')}
        {euros('checkpoint_ingreso', 'Ingreso extra objetivo')}
      </div>
      <Boton type="button" onClick={guardar}>Guardar plan</Boton>
      {estado && <div role="status" className="text-[12.5px] text-center mt-2.5" style={{ color: 'var(--aureo-text-dim)' }}>{estado}</div>}
    </div>
  )
}
