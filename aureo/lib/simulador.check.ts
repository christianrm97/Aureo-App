/**
 * Autocomprobacion del simulador. Es matematica de dinero: si esto falla, la
 * app miente sobre una decision de 6.000 euros.
 *   node --experimental-strip-types lib/simulador.check.ts
 */
import assert from 'node:assert/strict'
import {
  cuotaFrancesa, simularPrestamo, calcularTae, amortizarAnticipado,
  simularAhorro, compararEscenarios,
} from './simulador.ts'

const cerca = (a: number, b: number, tol = 0.02) =>
  assert.ok(Math.abs(a - b) <= tol, `esperaba ~${b}, salio ${a}`)

// --- Caso real del documento: Revolut 6.000 EUR, 24 meses, TIN 5% ---
// El documento dice cuota 263 EUR y TAE 5,12%. Si el motor no reproduce eso,
// esta mal.
const revolut = { capital: 6000, tin: 5, meses: 24 }
cerca(cuotaFrancesa(6000, 5, 24), 263.23, 0.5)
cerca(calcularTae(revolut), 5.12, 0.01)

const r = simularPrestamo(revolut)
assert.equal(r.cuadro.length, 24)
cerca(r.totalIntereses, 317.5, 2)
cerca(r.totalPagado, 6317.5, 2)
// El cuadro tiene que dejar la deuda a cero, sin centimos vivos
assert.equal(r.cuadro[23].pendiente, 0)
// La primera cuota paga mas intereses que la ultima (sistema frances)
assert.ok(r.cuadro[0].intereses > r.cuadro[23].intereses)
// Suma de amortizado = capital
cerca(r.cuadro.reduce((s, c) => s + c.amortizado, 0), 6000, 0.5)

// --- Interes cero: no se indetermina ---
assert.equal(cuotaFrancesa(1200, 0, 12), 100)
assert.equal(simularPrestamo({ capital: 1200, tin: 0, meses: 12 }).totalIntereses, 0)

// --- Hipoteca larga: 150.000 a 30 anios al 3% ---
cerca(cuotaFrancesa(150000, 3, 360), 632.41, 1)
const hip = simularPrestamo({ capital: 150000, tin: 3, meses: 360 })
cerca(hip.totalIntereses, 77666, 500)
assert.equal(hip.cuadro[359].pendiente, 0)

// --- Comision de apertura encarece la TAE ---
assert.ok(calcularTae({ capital: 6000, tin: 5, meses: 24, comisionApertura: 120 }) > calcularTae(revolut))

// --- Amortizacion anticipada ---
const porPlazo = amortizarAnticipado(revolut, 2000, 'plazo')
const porCuota = amortizarAnticipado(revolut, 2000, 'cuota')
assert.ok(porPlazo.ahorroIntereses > 0, 'amortizar tiene que ahorrar intereses')
assert.ok(porPlazo.mesesAhorrados > 0, 'reducir plazo acorta el prestamo')
assert.ok(porCuota.cuotaNueva < r.cuota, 'reducir cuota baja el pago mensual')
// Reducir plazo ahorra mas intereses que reducir cuota: es el criterio que la
// app le va a recomendar al usuario, mas vale que sea cierto.
assert.ok(porPlazo.ahorroIntereses > porCuota.ahorroIntereses)
// Amortizar mas que el capital no rompe nada
assert.equal(amortizarAnticipado(revolut, 99999, 'plazo').ahorroIntereses, 0)

// --- Ahorro ---
const sinInteres = simularAhorro({ inicial: 1000, aportacionMensual: 300, meses: 12, rentabilidadAnual: 0 })
assert.equal(sinInteres.length, 12)
assert.equal(sinInteres[11].total, 1000 + 300 * 12)
assert.equal(sinInteres[11].intereses, 0)

const conInteres = simularAhorro({ inicial: 1000, aportacionMensual: 300, meses: 12, rentabilidadAnual: 5 })
assert.ok(conInteres[11].total > sinInteres[11].total, 'el interes tiene que sumar')
assert.ok(conInteres[11].intereses > 0)

// --- Comparativa del documento: sin prestamo 293 EUR/mes, con prestamo 310 ---
const comp = compararEscenarios(
  { nombre: 'Sin préstamo', ingresos: 1410, gastos: 150, cuotaDeuda: 687 + 280 },
  { nombre: 'Con préstamo', ingresos: 1410, gastos: 150, cuotaDeuda: 687 + 263 },
)
assert.equal(comp.a.margen, 293)
assert.equal(comp.b.margen, 310)
assert.equal(comp.diferencia, 17)
assert.equal(comp.mejor, 'Con préstamo')

console.log('simulador: OK')
