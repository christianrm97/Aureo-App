/**
 * Simuladores de prestamo, hipoteca y ahorro. Matematica financiera pura:
 * sistema frances de amortizacion (cuota constante) e interes compuesto.
 *
 * Todo el modulo trabaja con TIN (tipo nominal). La TAE se calcula aparte
 * porque incluye la capitalizacion mensual y no es lo mismo: un TIN del 5%
 * pagado mes a mes es una TAE del 5,12%.
 */

export interface Prestamo {
  /** Capital solicitado. */
  capital: number
  /** Tipo de Interes Nominal anual, en % (5 = 5%). */
  tin: number
  /** Plazo en meses. */
  meses: number
  /** Comisiones de apertura y otros gastos iniciales, en euros. */
  comisionApertura?: number
  /** Seguros u otros costes mensuales obligatorios. */
  costeMensualExtra?: number
}

export interface Cuota {
  numero: number
  cuota: number
  intereses: number
  amortizado: number
  pendiente: number
}

export interface ResultadoPrestamo {
  cuota: number
  /** Cuota + seguros, que es lo que sale de la cuenta cada mes. */
  cuotaTotal: number
  totalPagado: number
  totalIntereses: number
  tae: number
  cuadro: Cuota[]
}

const redondear = (n: number) => Math.round(n * 100) / 100

/**
 * Cuota del sistema frances: c = C * i / (1 - (1+i)^-n)
 * Con interes cero la formula se indetermina, asi que se reparte el capital.
 */
export function cuotaFrancesa(capital: number, tin: number, meses: number): number {
  if (meses <= 0) return 0
  const i = tin / 100 / 12
  if (i === 0) return redondear(capital / meses)
  return redondear((capital * i) / (1 - Math.pow(1 + i, -meses)))
}

/**
 * TAE a partir del TIN: refleja la capitalizacion mensual y las comisiones.
 * Sin comisiones es (1 + TIN/12)^12 - 1.
 */
export function calcularTae(p: Prestamo): number {
  const i = p.tin / 100 / 12
  const base = (Math.pow(1 + i, 12) - 1) * 100
  const comision = p.comisionApertura ?? 0
  if (comision <= 0 || p.capital <= 0) return Math.round(base * 100) / 100

  // La comision encarece el credito: se reparte sobre la vida del prestamo.
  const anios = p.meses / 12
  const recargo = (comision / p.capital / anios) * 100
  return Math.round((base + recargo) * 100) / 100
}

export function simularPrestamo(p: Prestamo): ResultadoPrestamo {
  const cuota = cuotaFrancesa(p.capital, p.tin, p.meses)
  const i = p.tin / 100 / 12
  const cuadro: Cuota[] = []

  let pendiente = p.capital
  let totalIntereses = 0

  for (let n = 1; n <= p.meses; n++) {
    const intereses = redondear(pendiente * i)
    // La ultima cuota salda el resto: evita dejar centimos vivos por redondeo.
    const amortizado = n === p.meses ? pendiente : redondear(cuota - intereses)
    pendiente = redondear(pendiente - amortizado)
    totalIntereses += intereses
    cuadro.push({
      numero: n,
      cuota: redondear(amortizado + intereses),
      intereses,
      amortizado,
      pendiente: Math.max(0, pendiente),
    })
  }

  const costeExtra = (p.costeMensualExtra ?? 0) * p.meses
  return {
    cuota,
    cuotaTotal: redondear(cuota + (p.costeMensualExtra ?? 0)),
    totalPagado: redondear(cuadro.reduce((s, c) => s + c.cuota, 0) + (p.comisionApertura ?? 0) + costeExtra),
    totalIntereses: redondear(totalIntereses),
    tae: calcularTae(p),
    cuadro,
  }
}

/**
 * Amortizacion anticipada. Reducir cuota alivia el mes; reducir plazo ahorra
 * mas intereses. La app dice cuanto, no elige por ti.
 */
export function amortizarAnticipado(
  p: Prestamo,
  importe: number,
  modo: 'plazo' | 'cuota',
): { ahorroIntereses: number; mesesAhorrados: number; cuotaNueva: number } {
  const original = simularPrestamo(p)
  if (importe <= 0 || importe >= p.capital) {
    return { ahorroIntereses: 0, mesesAhorrados: 0, cuotaNueva: original.cuota }
  }

  const capitalRestante = p.capital - importe

  if (modo === 'cuota') {
    const nuevo = simularPrestamo({ ...p, capital: capitalRestante })
    return {
      ahorroIntereses: redondear(original.totalIntereses - nuevo.totalIntereses),
      mesesAhorrados: 0,
      cuotaNueva: nuevo.cuota,
    }
  }

  // Mismo pago mensual sobre menos capital: se acorta el plazo.
  const i = p.tin / 100 / 12
  let pendiente = capitalRestante
  let intereses = 0
  let meses = 0
  while (pendiente > 0.01 && meses < 1200) {
    const int = pendiente * i
    const amort = original.cuota - int
    if (amort <= 0) break // la cuota no cubre ni los intereses
    pendiente -= amort
    intereses += int
    meses++
  }

  return {
    ahorroIntereses: redondear(original.totalIntereses - intereses),
    mesesAhorrados: p.meses - meses,
    cuotaNueva: original.cuota,
  }
}

export interface PlanAhorro {
  inicial: number
  aportacionMensual: number
  meses: number
  /** Rentabilidad anual esperada en %, 0 para una cuenta corriente. */
  rentabilidadAnual: number
}

export interface PuntoAhorro {
  mes: number
  aportado: number
  intereses: number
  total: number
}

/** Interes compuesto con aportacion periodica, capitalizado cada mes. */
export function simularAhorro(plan: PlanAhorro): PuntoAhorro[] {
  const i = plan.rentabilidadAnual / 100 / 12
  const puntos: PuntoAhorro[] = []
  let total = plan.inicial
  let aportado = plan.inicial

  for (let mes = 1; mes <= plan.meses; mes++) {
    total = total * (1 + i) + plan.aportacionMensual
    aportado += plan.aportacionMensual
    puntos.push({
      mes,
      aportado: redondear(aportado),
      intereses: redondear(total - aportado),
      total: redondear(total),
    })
  }
  return puntos
}

/**
 * Compara dos escenarios de margen mensual. Es la pregunta del documento de
 * estrategia: pedir el prestamo, o no pedirlo.
 */
export interface Escenario {
  nombre: string
  ingresos: number
  gastos: number
  cuotaDeuda: number
}

export function compararEscenarios(a: Escenario, b: Escenario) {
  const margen = (e: Escenario) => redondear(e.ingresos - e.gastos - e.cuotaDeuda)
  const ma = margen(a)
  const mb = margen(b)
  return {
    a: { ...a, margen: ma },
    b: { ...b, margen: mb },
    diferencia: redondear(mb - ma),
    mejor: mb > ma ? b.nombre : ma > mb ? a.nombre : 'empate',
  }
}
