'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { LogOut, Copy, Check, RefreshCw, Smartphone, Target, ShieldCheck, Pencil } from 'lucide-react'
import { fmt2, api, PageHeader, Campo, Boton } from './ui'

/**
 * Ajustes del usuario: su objetivo, sus cuentas, el token del Atajo de iPhone
 * y el cierre de sesion.
 */
export default function Ajustes({ usuario, perfil, cuentas, onBack, onCambio }) {
  const [objetivo, setObjetivo] = useState(String(perfil?.objetivo ?? ''))
  const [fondo, setFondo] = useState(String(perfil?.fondo_emergencia ?? ''))
  const [guardando, setGuardando] = useState(false)
  const [copiado, setCopiado] = useState(false)
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

  const copiarToken = async () => {
    try {
      await navigator.clipboard.writeText(perfil?.shortcut_token ?? '')
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
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
            <img src={usuario.avatar} alt="" width={52} height={52} className="rounded-full"
              referrerPolicy="no-referrer" />
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

      <div className="aureo-card mt-4 p-5">
        <div className="flex items-center gap-2 mb-1">
          <Smartphone className="w-4 h-4" style={{ color: 'var(--aureo-purple)' }} />
          <span className="text-[14px] font-semibold">Atajo de iPhone</span>
        </div>
        <p className="text-[12.5px] leading-snug mb-3" style={{ color: 'var(--aureo-text-dim)' }}>
          Pega este token en la cabecera Authorization del Atajo para añadir gastos desde
          el móvil. Es personal: identifica tu cuenta.
        </p>
        <div className="rounded-2xl p-3 flex items-center gap-2"
          style={{ background: 'var(--aureo-surface-2)', border: '1px solid var(--aureo-border)' }}>
          <code className="text-[11.5px] flex-1 min-w-0 truncate">{perfil?.shortcut_token ?? '—'}</code>
          <button onClick={copiarToken} aria-label="Copiar token"
            className="w-8 h-8 rounded-full grid place-items-center flex-shrink-0" style={{ background: '#fff' }}>
            {copiado
              ? <Check className="w-4 h-4" style={{ color: '#22C55E' }} />
              : <Copy className="w-4 h-4" style={{ color: 'var(--aureo-text-dim)' }} />}
          </button>
        </div>
        <button onClick={regenerar} className="flex items-center gap-1.5 text-[12.5px] font-medium mt-3"
          style={{ color: 'var(--aureo-purple)' }}>
          <RefreshCw className="w-3.5 h-3.5" /> Generar uno nuevo
        </button>
      </div>

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
