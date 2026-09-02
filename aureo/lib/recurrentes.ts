/**
 * Movimientos fijos del mes. Sirven de contenido por defecto mientras la tabla
 * `recurrentes` este vacia; en cuanto crees uno desde la app, manda la tabla.
 *
 * Fuente: estrategia financiera de septiembre 2026.
 * - La nomina llega entre el 1 y el 5.
 * - Prestamo padres y cuotas de deuda caen el 26.
 * - El IRPF aplazado y Sequra NO estan aqui: son deuda con saldo vivo y viven
 *   en la seccion Deuda, para no contarlos dos veces.
 */
export interface Recurrente {
  id: string
  nombre: string
  importe: number
  tipo: 'ingreso' | 'gasto' | 'inversion'
  dia: number
  categoria: string
  icono: string
  desde?: string
  nota?: string
}

export const RECURRENTES_BASE: Recurrente[] = [
  { id: 'nomina',   nombre: 'Nómina PwC',      importe: 1410, tipo: 'ingreso', dia: 1,  categoria: 'Recibo', icono: 'landmark' },
  { id: 'bleap',    nombre: 'Transf. Bleap',   importe: -90,  tipo: 'gasto',   dia: 1,  categoria: 'Bleap',  icono: 'creditcard',
    nota: 'Presupuesto objetivo de gasto diario' },
  { id: 'recibos',  nombre: 'Recibos (DIGI, agua, Simyo)', importe: -60, tipo: 'gasto', dia: 5, categoria: 'Recibo', icono: 'sparkles',
    nota: 'Estimado: tu plan dice ~150 €/mes entre Bleap y recibos. Sustitúyelo por los importes reales en Fijos' },
  { id: 'prestamo', nombre: 'Préstamo padres', importe: -687, tipo: 'gasto',   dia: 26, categoria: 'Recibo', icono: 'banknote' },
]
