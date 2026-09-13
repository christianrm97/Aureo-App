/**
 * Valores por defecto del perfil financiero. Con el login por Google cada
 * usuario tiene su propia fila en `perfiles`; esto es solo el punto de partida
 * de una cuenta nueva y los parametros del plan de proyectos.
 *
 * Aqui no van saldos, deudas ni datos de nadie: el repositorio es publico.
 * Los datos personales se cargan en la base de datos, no en el codigo.
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

/** Objetivo principal: el colchon de emergencia completo. */
export const OBJETIVO = 3000
export const FECHA_OBJETIVO = new Date(2027, 2, 1) // marzo 2027, el checkpoint

/**
 * Fondo de emergencia: no se toca bajo ningun concepto salvo una averia de
 * coche, un ordenador o un medico urgente. No es liquidez disponible.
 */
export const FONDO_EMERGENCIA = 3000

/**
 * Presupuesto de proyectos. Suele compartir cuenta con el gasto personal, asi
 * que el unico control es este calculo sobre lo registrado.
 *
 * Arranca con un importe inicial y recibe una aportacion cada mes; gastando al
 * tope se agota justo en el checkpoint de marzo, que es lo que se busca.
 */
export const PRESUPUESTO_PROYECTOS = {
  inicial: 430,
  aporteMensual: 70,
  topeMensual: 150,
  inicio: new Date(2026, 9, 1), // octubre 2026
}

/**
 * Cuanto se ha aportado hasta hoy al presupuesto de proyectos y cuanto queda.
 * El mes de inicio ya cuenta con su aportacion.
 */
export function presupuestoProyectos(invertido: number, hoy = new Date()): { total: number; disponible: number } {
  const { inicial, aporteMensual, inicio } = PRESUPUESTO_PROYECTOS
  const mesesDesdeInicio = (hoy.getFullYear() - inicio.getFullYear()) * 12 + (hoy.getMonth() - inicio.getMonth())
  const aportaciones = mesesDesdeInicio >= 0 ? mesesDesdeInicio + 1 : 0
  const total = inicial + aporteMensual * aportaciones
  return { total, disponible: Math.max(0, Math.round((total - invertido) * 100) / 100) }
}

/** Checkpoint de marzo 2027: al menos un proyecto generando esto al mes. */
export const CHECKPOINT = {
  fecha: new Date(2027, 2, 1),
  ingresoExtraObjetivo: 200,
}
