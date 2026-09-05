/**
 * Perfil financiero por defecto. Con el login por Google cada usuario tiene su
 * fila en `perfiles`; esto es solo el punto de partida de una cuenta nueva.
 *
 * Fuente: PROMPT_ESTRATEGIA_FINANCIERA_SANTANDER v2.0 (5 septiembre 2026).
 * Sustituye a la version Revolut, descartada por tipo de interes.
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
  { id: 'santander',  nombre: 'Santander',  subtitulo: 'Nómina y préstamo',       saldo: 0,      icon: 'piggybank',  color: '#EF4444', bg: '#FEE2E2' },
  { id: 'myinvestor', nombre: 'MyInvestor', subtitulo: 'S&P 500 — Inversión',     saldo: 136.00, icon: 'linechart',  color: '#14B8A6', bg: '#CCFBF1', inversion: true },
]

/** Objetivo principal: el colchon que hoy no existe. */
export const OBJETIVO = 2000
export const FECHA_OBJETIVO = new Date(2027, 2, 1) // marzo 2027, el checkpoint

/**
 * Fondo de emergencia: 2.000 € que no se tocan bajo ningun concepto salvo
 * una averia de coche (~800), ordenador (~900) o medico urgente. No es liquidez.
 * Sube de 1.500 a 2.000 con el prestamo Santander.
 */
export const FONDO_EMERGENCIA = 2000

/**
 * Prestamo Santander: decidido, no firmado. Arranca en octubre de 2026, asi
 * que NO se cuenta como deuda viva hasta que exista el primer cargo: hasta
 * entonces vive en el simulador, no en el patrimonio.
 *
 * Se eligio frente a Revolut (11,90% TIN) e ING (14,24% TIN). El plazo de 48
 * meses es el minimo de la entidad, no una preferencia.
 */
export const PRESTAMO = {
  entidad: 'Santander',
  capital: 7000,
  meses: 48,
  tin: 5.5,
  tae: 5.64,
  cuota: 162.8,
  /** Sin domiciliar la nomina la cuota sube a esto. */
  cuotaSinBonificar: 166,
  comisionApertura: 0,
  /** 1% si queda mas de un anio a vencimiento, 0,50% si queda uno o menos. */
  comisionCancelacion: 1,
  inicio: new Date(2026, 9, 1),  // octubre 2026
  fin: new Date(2030, 9, 1),     // octubre 2030
  /** Al amortizar, SIEMPRE reducir plazo: reducir cuota apenas ahorra nada. */
  modoAmortizacion: 'plazo' as const,
}

/** Reparto del capital del prestamo, del documento de estrategia. */
export const REPARTO_PRESTAMO = [
  { concepto: 'IRPF 2025 (expediente AEAT)', importe: 3360 },
  { concepto: 'Sequra (curso)',              importe: 165 },
  { concepto: 'Fondo de emergencia',         importe: 2000 },
  { concepto: 'Presupuesto de proyectos',    importe: 1475 },
]

/**
 * Presupuesto de proyectos. Sin el tope mensual, 1.475 € se evaporan en tres
 * meses y el prestamo se queda sin contrapartida.
 */
export const PRESUPUESTO_PROYECTOS = {
  total: 1475,
  topeMensual: 150,
}

/** Checkpoint de marzo 2027: al menos un proyecto generando esto al mes. */
export const CHECKPOINT = {
  fecha: new Date(2027, 2, 1),
  ingresoExtraObjetivo: 200,
  proyectos: ['LivaSonic', 'Bot Trading', 'Padelito'],
}

/** Umbrales de las alertas del documento de estrategia. */
export const ALERTAS = {
  bleapMensual: 120,        // sobreconsumo si se pasa
  bleapPresupuesto: 90,     // target
  diasSinIngresoExtra: 60,
  margenMinimo: 100,        // por debajo de esto el plan no respira
  diasAvisoCuota: 5,
}
