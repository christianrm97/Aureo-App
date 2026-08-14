/**
 * Recurrentes fijos de Christian: nomina, transferencias y prestamos. Sirven de
 * seed en Supabase y de contenido por defecto mientras no haya base de datos.
 *
 * Netflix y Spotify vivian aqui y se movieron a la seccion Suscripciones, que
 * lleva plataforma, plan y logo. Si tu tabla los tiene de un seed anterior:
 *   delete from recurrentes where categoria = 'Suscripcion';
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
}

export const RECURRENTES_BASE: Recurrente[] = [
  { id: 'bleap',      nombre: 'Transf. Bleap',   importe: -90,     tipo: 'gasto',     dia: 1,  categoria: 'Bleap',         icono: 'creditcard' },
  { id: 'pareja',     nombre: 'C. Pareja',       importe: -150,    tipo: 'gasto',     dia: 1,  categoria: 'Cuenta Pareja', icono: 'users' },
  { id: 'myinvestor', nombre: 'MyInvestor S&P',  importe: -80,     tipo: 'inversion', dia: 1,  categoria: 'Recibo',        icono: 'linechart', desde: '2025-09-01' },
  { id: 'irpf',       nombre: 'IRPF',            importe: -280.90, tipo: 'gasto',     dia: 20, categoria: 'Recibo',        icono: 'landmark',  desde: '2025-09-01' },
  { id: 'prestamo',   nombre: 'Préstamo padres', importe: -686,    tipo: 'gasto',     dia: 26, categoria: 'Recibo',        icono: 'banknote' },
  { id: 'nomina',     nombre: 'Nómina PwC',      importe: 1410.67, tipo: 'ingreso',   dia: 28, categoria: 'Recibo',        icono: 'landmark' },
]
