/**
 * Perfil financiero. Hoy es una constante con los datos de Christian; cuando
 * entre el login por Google pasa a ser una fila por usuario en Supabase.
 *
 * Fuente: PROMPT_ESTRATEGIA_FINANCIERA_REVOLUT (situacion a septiembre 2026).
 * El prestamo Revolut NO esta aqui: es una decision de octubre, y se evalua
 * en el simulador antes de firmarla.
 */

export interface Cuenta {
  id: string
  nombre: string
  subtitulo: string
  saldo: number
  icon: string
  color: string
  bg: string
  hub?: boolean
  inversion?: boolean
}

export const CUENTAS: Cuenta[] = [
  { id: 'openbank',   nombre: 'OpenBank',   subtitulo: 'Cuenta remunerada 2,47%', saldo: 857.89, icon: 'landmark',   color: '#6C2BD9', bg: '#EFE7FB', hub: true },
  { id: 'bleap',      nombre: 'Bleap',      subtitulo: 'Gasto diario',            saldo: 82.00,  icon: 'creditcard', color: '#8B5CF6', bg: '#EDE4FE' },
  { id: 'cajamar',    nombre: 'Cajamar',    subtitulo: 'Reserva',                 saldo: 79.99,  icon: 'banknote',   color: '#F59E0B', bg: '#FEF3C7' },
  { id: 'santander',  nombre: 'Santander',  subtitulo: 'Cuenta principal',        saldo: 0,      icon: 'piggybank',  color: '#EF4444', bg: '#FEE2E2' },
  { id: 'myinvestor', nombre: 'MyInvestor', subtitulo: 'S&P 500 — Inversión',     saldo: 136.00, icon: 'linechart',  color: '#14B8A6', bg: '#CCFBF1', inversion: true },
]

/** Objetivo principal: el colchon que hoy no existe. */
export const OBJETIVO = 1500
export const FECHA_OBJETIVO = new Date(2027, 2, 1) // marzo 2027, el checkpoint

/**
 * Fondo de emergencia: 1.500 € que no se tocan bajo ningun concepto. Solo
 * averia de coche, ordenador roto o medico urgente. No es liquidez disponible.
 */
export const FONDO_EMERGENCIA = 1500

/** Checkpoint de marzo 2027: al menos un proyecto generando esto al mes. */
export const CHECKPOINT = {
  fecha: new Date(2027, 2, 1),
  ingresoExtraObjetivo: 200,
  proyectos: ['LivaSonic', 'Bot Trading', 'Padelito'],
}

/** Umbrales de las alertas del documento de estrategia. */
export const ALERTAS = {
  bleapMensual: 120,      // sobreconsumo si se pasa
  bleapPresupuesto: 90,   // target
  diasSinIngresoExtra: 60,
}
