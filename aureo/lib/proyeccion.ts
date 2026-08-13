export interface PlanConfig {
  nomina: number
  bleap_mensual: number
  cuenta_pareja_mensual: number
  myinvestor_mensual: number
  saldo_inicial: number
}

export interface MesProyeccion {
  mes: string
  mesCorto: string
  liquidoInicio: number
  nomina: number
  bonos: number
  fijos: number
  irpf: number
  temporales: number
  bleap: number
  cuentaPareja: number
  myinvestor: number
  liquidoFin: number
  delta: number
}

// Cuotas IRPF de septiembre 2026 a agosto 2027
const IRPF_CUOTAS = [280.90, 281.83, 282.79, 283.72, 284.69, 285.68, 286.67, 287.67, 288.67, 289.68, 290.69, 291.30]

// Gastos temporales por mes (0 = agosto, 1 = septiembre, ...)
const TEMPORALES: Record<number, number> = {
  0: 187,     // IBI agosto
  1: 200,     // Dentista septiembre
  2: 26.85,   // Agua octubre
  5: 26.85,   // Agua enero
}

const FIJOS_BASE = 13.76 + 5 + 10 + 10.26 + 3.50 // recibos + AECC + DIGI + Club + Simyo = 42.52€

const NOMBRES_MESES = ['Ago 26', 'Sep 26', 'Oct 26', 'Nov 26', 'Dic 26', 'Ene 27']
const NOMBRES_CORTOS = ['Ago', 'Sep', 'Oct', 'Nov', 'Dic', 'Ene']

export function calcularProyeccion(config: PlanConfig): MesProyeccion[] {
  const meses: MesProyeccion[] = []
  let saldo = config.saldo_inicial

  for (let i = 0; i < 6; i++) {
    const esAgosto = i === 0
    const nomina = esAgosto ? 0 : config.nomina
    const bonos = i === 0 ? 200 : 20 // bono openbank 200€ en agosto, 20€ meses siguientes
    const irpf = i === 0 ? 0 : IRPF_CUOTAS[i - 1]
    const temporales = TEMPORALES[i] ?? 0
    const myinvestor = i === 0 ? 0 : config.myinvestor_mensual

    const totalEntradas = nomina + bonos
    const totalSalidas = FIJOS_BASE + irpf + temporales + config.bleap_mensual + config.cuenta_pareja_mensual + myinvestor

    const delta = totalEntradas - totalSalidas
    const inicio = saldo
    saldo = saldo + delta

    meses.push({
      mes: NOMBRES_MESES[i],
      mesCorto: NOMBRES_CORTOS[i],
      liquidoInicio: inicio,
      nomina,
      bonos,
      fijos: FIJOS_BASE,
      irpf,
      temporales,
      bleap: config.bleap_mensual,
      cuentaPareja: config.cuenta_pareja_mensual,
      myinvestor,
      liquidoFin: saldo,
      delta,
    })
  }

  return meses
}

export function calcularPatrimonioTotal(
  saldoLiquido: number,
  saldoInversion: number,
  deudas: number = 0
): number {
  return saldoLiquido + saldoInversion - deudas
}

// Proyección MyInvestor interés compuesto
export function calcularMyInvestor(
  capitalInicial: number,
  aportacionMensual: number,
  anios: number = 10,
  rentabilidadAnual: number = 0.09
) {
  const rentMensual = Math.pow(1 + rentabilidadAnual, 1 / 12) - 1
  let saldo = capitalInicial
  let aportado = capitalInicial
  const datos = []

  for (let i = 1; i <= anios * 12; i++) {
    saldo = saldo * (1 + rentMensual) + aportacionMensual
    aportado += aportacionMensual

    if (i % 12 === 0) {
      datos.push({
        anio: i / 12,
        aportado,
        valor: saldo,
        beneficio: saldo - aportado,
        roi: ((saldo - aportado) / aportado) * 100,
      })
    }
  }

  return datos
}
