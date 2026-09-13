/**
 * Valores por defecto y lectura del plan de cada usuario.
 *
 * Aqui no hay datos de nadie. El objetivo, su fecha, el colchon, el
 * presupuesto de proyectos y el checkpoint viven en la fila `perfiles` de cada
 * usuario y se cambian desde Ajustes. Este modulo solo pone un punto de partida
 * neutro y convierte esa fila en valores listos para calcular.
 *
 * Autocomprobacion:  node --experimental-strip-types lib/perfil.check.ts
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

/** Punto de partida de una cuenta nueva. Neutro a proposito: cada usuario pone el suyo. */
export const DEFECTO = {
  objetivo: 1000,
  fondoEmergencia: 1000,
  /** El objetivo nace a un anio vista. */
  mesesObjetivo: 12,
}

/** Lo que llega de la tabla `perfiles`. Todo opcional: un perfil a medias es valido. */
export interface PerfilFila {
  objetivo?: number | string | null
  fondo_emergencia?: number | string | null
  fecha_objetivo?: string | null
  proyectos_inicial?: number | string | null
  proyectos_aporte?: number | string | null
  proyectos_tope?: number | string | null
  proyectos_inicio?: string | null
  checkpoint_fecha?: string | null
  checkpoint_ingreso?: number | string | null
}

/** 'AAAA-MM-DD' a fecha local. Una fecha mal formada cuenta como no puesta. */
export function leerFechaISO(valor: string | null | undefined): Date | null {
  const m = typeof valor === 'string' ? valor.match(/^(\d{4})-(\d{2})-(\d{2})/) : null
  if (!m) return null
  const fecha = new Date(+m[1], +m[2] - 1, +m[3])
  return Number.isNaN(fecha.getTime()) ? null : fecha
}

function numero(valor: unknown): number | null {
  if (valor === null || valor === undefined || valor === '') return null
  const n = Number(valor)
  return Number.isFinite(n) ? n : null
}

/** La fecha que puso el usuario o, si no hay, el dia 1 del mes dentro de un anio. */
export function fechaObjetivoDe(perfil: PerfilFila | null | undefined, hoy = new Date()): Date {
  return leerFechaISO(perfil?.fecha_objetivo) ?? new Date(hoy.getFullYear(), hoy.getMonth() + DEFECTO.mesesObjetivo, 1)
}

export interface PlanProyectos {
  inicial: number
  aporteMensual: number
  topeMensual: number
  /** Sin fecha de inicio no se suman aportaciones: no se inventa dinero. */
  inicio: Date | null
}

/** El plan de proyectos solo existe si el usuario ha puesto un tope mensual. */
export function planProyectosDe(perfil: PerfilFila | null | undefined): PlanProyectos | null {
  const tope = numero(perfil?.proyectos_tope)
  if (!tope || tope <= 0) return null
  return {
    inicial: Math.max(0, numero(perfil?.proyectos_inicial) ?? 0),
    aporteMensual: Math.max(0, numero(perfil?.proyectos_aporte) ?? 0),
    topeMensual: tope,
    inicio: leerFechaISO(perfil?.proyectos_inicio),
  }
}

/**
 * Cuanto se ha aportado hasta hoy al presupuesto de proyectos y cuanto queda.
 * El mes de inicio ya cuenta con su aportacion.
 */
export function presupuestoProyectos(invertido: number, plan: PlanProyectos, hoy = new Date()): { total: number; disponible: number } {
  let aportaciones = 0
  if (plan.inicio) {
    const meses = (hoy.getFullYear() - plan.inicio.getFullYear()) * 12 + (hoy.getMonth() - plan.inicio.getMonth())
    aportaciones = meses >= 0 ? meses + 1 : 0
  }
  const total = plan.inicial + plan.aporteMensual * aportaciones
  return { total, disponible: Math.max(0, Math.round((total - invertido) * 100) / 100) }
}

export interface Checkpoint {
  fecha: Date
  /** Ingreso extra mensual que deberia estar entrando en esa fecha. */
  ingresoObjetivo: number
}

/** El checkpoint es opcional: hacen falta fecha e importe para que exista. */
export function checkpointDe(perfil: PerfilFila | null | undefined): Checkpoint | null {
  const fecha = leerFechaISO(perfil?.checkpoint_fecha)
  const ingreso = numero(perfil?.checkpoint_ingreso)
  if (!fecha || !ingreso || ingreso <= 0) return null
  return { fecha, ingresoObjetivo: ingreso }
}

/** "mar 2027": para etiquetas cortas como "Objetivo mar 2027". */
export function mesCorto(fecha: Date): string {
  return fecha.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' }).replace('.', '')
}
