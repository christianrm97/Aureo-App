/**
 * Motor financiero de Aureo. Todo es puro y deterministico: entra el estado
 * del mes, sale el impacto sobre el objetivo y las palancas a mover.
 */

export interface Recurrente { importe: number; tipo: 'ingreso' | 'gasto' | 'inversion'; dia: number }
export interface Suscripcion { cuota: number; activa?: boolean }
export interface Recibo { importe: number; activo?: boolean }
export interface Deuda { cuota: number; pendiente: number; meses_restantes?: number | null; tipo: string }
/** Ingreso ajeno a la nomina: recurrente suma cada mes, puntual solo una vez. */
export interface IngresoExtra { importe: number; tipo: 'recurrente' | 'puntual' }

export interface Estado {
  liquido: number
  objetivo: number
  fechaObjetivo: Date
  recurrentes: Recurrente[]
  suscripciones: Suscripcion[]
  recibos: Recibo[]
  deudas: Deuda[]
  ingresosExtra: IngresoExtra[]
  /** Palancas ajustables: lo que hoy va a inversion y a la cuenta de ahorro. */
  inversionMensual: number
}

export interface Resumen {
  ingresos: number
  /** Parte de `ingresos` que no viene de la nomina. */
  ingresosExtra: number
  /** Cobrado una sola vez: engorda el patrimonio, no el ritmo mensual. */
  ingresosPuntuales: number
  gastosFijos: number
  suscripciones: number
  recibos: number
  deuda: number
  inversion: number
  /** Lo que queda cada mes para el objetivo. Puede ser negativo. */
  ahorroMensual: number
  deudaTotal: number
}

const suma = (ns: number[]) => ns.reduce((a, b) => a + b, 0)
const abs = (n: number) => Math.abs(n)

export function resumen(e: Estado): Resumen {
  const nomina = suma(e.recurrentes.filter((r) => r.tipo === 'ingreso').map((r) => abs(r.importe)))
  const extra = suma(e.ingresosExtra.filter((i) => i.tipo === 'recurrente').map((i) => abs(i.importe)))
  const puntuales = suma(e.ingresosExtra.filter((i) => i.tipo === 'puntual').map((i) => abs(i.importe)))
  const ingresos = nomina + extra
  // La inversion se cuenta aparte: sigue siendo patrimonio, no gasto quemado.
  const gastosFijos = suma(e.recurrentes.filter((r) => r.tipo === 'gasto').map((r) => abs(r.importe)))
  const suscripciones = suma(e.suscripciones.filter((s) => s.activa !== false).map((s) => abs(s.cuota)))
  const recibos = suma(e.recibos.filter((r) => r.activo !== false).map((r) => abs(r.importe)))
  const deuda = suma(e.deudas.map((d) => abs(d.cuota)))
  const inversion = abs(e.inversionMensual)

  return {
    ingresos,
    ingresosExtra: extra,
    ingresosPuntuales: puntuales,
    gastosFijos,
    suscripciones,
    recibos,
    deuda,
    inversion,
    ahorroMensual: ingresos - gastosFijos - suscripciones - recibos - deuda - inversion,
    deudaTotal: suma(e.deudas.map((d) => abs(d.pendiente))),
  }
}

export function mesesHasta(desde: Date, hasta: Date): number {
  return (hasta.getFullYear() - desde.getFullYear()) * 12 + (hasta.getMonth() - desde.getMonth())
}

export interface Punto { mes: string; liquido: number; objetivo: number }

/** Proyeccion mes a mes desde el mes actual. */
export function proyectar(e: Estado, meses = 19): Punto[] {
  const { ahorroMensual } = resumen(e)
  const hoy = new Date()
  const puntos: Punto[] = []
  let liquido = e.liquido

  for (let i = 0; i < meses; i++) {
    const d = new Date(hoy.getFullYear(), hoy.getMonth() + i, 1)
    const etiqueta = d.toLocaleDateString('es-ES', { month: 'short' }).replace('.', '')
    liquido = Math.max(0, liquido + (i === 0 ? 0 : ahorroMensual))
    puntos.push({
      mes: `${etiqueta} ${String(d.getFullYear()).slice(2)}`,
      liquido: Math.round(liquido),
      objetivo: e.objetivo,
    })
  }
  return puntos
}

export type Severidad = 'ok' | 'ajuste' | 'riesgo'

export interface Accion {
  palanca: 'inversion' | 'suscripciones' | 'deuda' | 'ingresos' | 'ahorro' | 'ninguna'
  texto: string
  /** Euros/mes a mover. Positivo = liberar hacia el objetivo. */
  delta: number
}

export interface Analisis {
  severidad: Severidad
  titulo: string
  detalle: string
  acciones: Accion[]
  /** Ahorro mensual necesario para llegar a tiempo. */
  necesarioMensual: number
  ahorroMensual: number
  mesesRestantes: number
  /** Mes en que se alcanza el objetivo al ritmo actual, o null si no llega. */
  mesLlegada: string | null
}

const eur = (n: number) => `${n.toFixed(0)}€`

/**
 * Compara el ritmo de ahorro con lo que exige el objetivo y propone que mover.
 * El orden de las palancas es deliberado: primero lo reversible (inversion),
 * luego lo prescindible (suscripciones), y la deuda cara solo si hay margen.
 */
export function analizar(e: Estado): Analisis {
  const r = resumen(e)
  const meses = Math.max(0, mesesHasta(new Date(), e.fechaObjetivo))
  const falta = Math.max(0, e.objetivo - e.liquido)
  const necesario = meses > 0 ? falta / meses : falta

  const puntos = proyectar(e, Math.max(meses + 1, 24))
  const llegada = puntos.find((p) => p.liquido >= e.objetivo)?.mes ?? null

  const holgura = r.ahorroMensual - necesario
  const acciones: Accion[] = []
  let severidad: Severidad = 'ok'
  let titulo: string
  let detalle: string

  if (falta === 0) {
    titulo = 'Objetivo cubierto'
    detalle = `Ya tienes ${eur(e.liquido)} líquidos. El objetivo de ${eur(e.objetivo)} está alcanzado.`
    acciones.push({
      palanca: 'inversion',
      delta: Math.max(0, Math.round(r.ahorroMensual * 0.5)),
      texto: `Puedes subir la inversión ${eur(Math.max(0, r.ahorroMensual * 0.5))}/mes sin tocar el objetivo.`,
    })
  } else if (holgura >= 0) {
    titulo = 'Vas en camino'
    detalle = `Ahorras ${eur(r.ahorroMensual)}/mes y necesitas ${eur(necesario)}/mes. Te sobran ${eur(holgura)}.`
    if (holgura >= 20) {
      acciones.push({
        palanca: 'inversion',
        delta: Math.round(holgura * 0.6),
        texto: `Sobra margen: puedes llevar ${eur(holgura * 0.6)}/mes más a MyInvestor y seguir llegando a tiempo.`,
      })
    }
    const tarjeta = e.deudas.find((d) => d.tipo === 'tarjeta' && abs(d.pendiente) > 0)
    if (tarjeta && holgura >= 30) {
      acciones.push({
        palanca: 'deuda',
        delta: Math.round(holgura * 0.4),
        texto: `Amortiza ${eur(holgura * 0.4)}/mes de la tarjeta: es la deuda más cara que tienes.`,
      })
    }
  } else {
    const hueco = -holgura
    severidad = hueco > r.inversion + r.suscripciones ? 'riesgo' : 'ajuste'
    titulo = severidad === 'riesgo' ? 'El objetivo se aleja' : 'Toca reajustar'
    detalle = `Ahorras ${eur(r.ahorroMensual)}/mes pero el objetivo pide ${eur(necesario)}/mes. Faltan ${eur(hueco)} cada mes.`

    const deInversion = Math.min(r.inversion, hueco)
    if (deInversion > 0) {
      acciones.push({
        palanca: 'inversion',
        delta: Math.round(deInversion),
        texto: `Baja la aportación a MyInvestor ${eur(deInversion)}/mes hasta enero. Es reversible y no quema dinero.`,
      })
    }
    const resto = hueco - deInversion
    if (resto > 0 && r.suscripciones > 0) {
      const deSubs = Math.min(r.suscripciones, resto)
      acciones.push({
        palanca: 'suscripciones',
        delta: Math.round(deSubs),
        texto: `Recorta ${eur(deSubs)}/mes en suscripciones: son ${eur(r.suscripciones)} al mes, ${eur(r.suscripciones * 12)} al año.`,
      })
    }
    const resto2 = resto - Math.min(r.suscripciones, resto)
    if (resto2 > 0) {
      acciones.push({
        palanca: 'ingresos',
        delta: Math.round(resto2),
        texto: r.ingresosExtra > 0
          ? `Faltan ${eur(resto2)}/mes. Tus ingresos extra ya aportan ${eur(r.ingresosExtra)}/mes: subirlos a ${eur(r.ingresosExtra + resto2)} cierra el hueco.`
          : `Faltan ${eur(resto2)}/mes. Un trabajo puntual de ${eur(resto2 * meses)} repartido hasta enero cubre lo que queda.`,
      })
    }
  }

  if (!acciones.length) acciones.push({ palanca: 'ninguna', delta: 0, texto: 'Nada que tocar este mes.' })

  return {
    severidad,
    titulo,
    detalle,
    acciones,
    necesarioMensual: Math.round(necesario * 100) / 100,
    ahorroMensual: Math.round(r.ahorroMensual * 100) / 100,
    mesesRestantes: meses,
    mesLlegada: llegada,
  }
}

/** Impacto de un gasto puntual sobre la fecha de llegada al objetivo. */
export function impactoGasto(e: Estado, importe: number): string {
  const r = resumen(e)
  if (r.ahorroMensual <= 0) return `${eur(importe)} menos para el objetivo.`
  const dias = (importe / r.ahorroMensual) * 30
  if (dias < 1) return `Impacto mínimo: ${(dias * 24).toFixed(0)} h de ahorro.`
  return `Retrasa el objetivo ${dias.toFixed(1)} días.`
}
