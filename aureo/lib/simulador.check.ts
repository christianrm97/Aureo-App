/**
 * Autocomprobacion del simulador. Es matematica de dinero: si esto falla, la
 * app miente sobre decisiones de miles de euros.
 *   node --experimental-strip-types lib/simulador.check.ts
 */
import assert from 'node:assert/strict'
import {
  cuotaFrancesa, simularPrestamo, calcularTae, amortizarAnticipado,
  simularAhorro, compararEscenarios,
} from './simulador.ts'

const cerca = (a: number, b: number, tol = 0.02) =>
  assert.ok(Math.abs(a - b) <= tol, `esperaba ~${b}, salio ${a}`)

// --- Prestamo personal: 6.000 EUR, 24 meses, TIN 5% ---
// Cuota 263,23 EUR y TAE 5,12% calculadas con la formula del sistema frances.
// Si el motor no las reproduce, esta mal.
const personal = { capital: 6000, tin: 5, meses: 24 }
cerca(cuotaFrancesa(6000, 5, 24), 263.23, 0.5)
cerca(calcularTae(personal), 5.12, 0.01)

const r = simularPrestamo(personal)
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
assert.ok(calcularTae({ capital: 6000, tin: 5, meses: 24, comisionApertura: 120 }) > calcularTae(personal))

// --- Amortizacion anticipada ---
const porPlazo = amortizarAnticipado(personal, 2000, 'plazo')
const porCuota = amortizarAnticipado(personal, 2000, 'cuota')
assert.ok(porPlazo.ahorroIntereses > 0, 'amortizar tiene que ahorrar intereses')
assert.ok(porPlazo.mesesAhorrados > 0, 'reducir plazo acorta el prestamo')
assert.ok(porCuota.cuotaNueva < r.cuota, 'reducir cuota baja el pago mensual')
// Reducir plazo ahorra mas intereses que reducir cuota: es el criterio que la
// app le va a recomendar al usuario, mas vale que sea cierto.
assert.ok(porPlazo.ahorroIntereses > porCuota.ahorroIntereses)
// Amortizar mas que el capital no rompe nada
assert.equal(amortizarAnticipado(personal, 99999, 'plazo').ahorroIntereses, 0)

// --- Ahorro ---
const sinInteres = simularAhorro({ inicial: 1000, aportacionMensual: 300, meses: 12, rentabilidadAnual: 0 })
assert.equal(sinInteres.length, 12)
assert.equal(sinInteres[11].total, 1000 + 300 * 12)
assert.equal(sinInteres[11].intereses, 0)

const conInteres = simularAhorro({ inicial: 1000, aportacionMensual: 300, meses: 12, rentabilidadAnual: 5 })
assert.ok(conInteres[11].total > sinInteres[11].total, 'el interes tiene que sumar')
assert.ok(conInteres[11].intereses > 0)

// --- Comparativa: refinanciar una deuda con un prestamo de cuota menor ---
const comp = compararEscenarios(
  { nombre: 'Sin préstamo', ingresos: 1500, gastos: 150, cuotaDeuda: 700 + 280 },
  { nombre: 'Con préstamo', ingresos: 1500, gastos: 150, cuotaDeuda: 700 + 263 },
)
assert.equal(comp.a.margen, 370)
assert.equal(comp.b.margen, 387)
assert.equal(comp.diferencia, 17)
assert.equal(comp.mejor, 'Con préstamo')

// --- Prestamo a 48 meses: 7.000 EUR al 5,50% TIN ---
// Cuota 162,80, TAE 5,64% y 814 EUR de intereses, contrastados con un
// simulador bancario. Si el motor deja de reproducirlos, la pantalla de deuda miente.
const largo = simularPrestamo({ capital: 7000, tin: 5.5, meses: 48 })
assert.equal(largo.cuota, 162.8)
assert.equal(largo.tae, 5.64)
assert.equal(Math.round(largo.totalIntereses), 814)
assert.equal(Math.round(largo.totalPagado), 7814)

// Un tipo mucho mas bajo compensa un plazo mas largo en la cuota mensual
const caro = simularPrestamo({ capital: 6000, tin: 11.9, meses: 24 })
assert.ok(largo.cuota < caro.cuota, 'a menor tipo y mas plazo, menor cuota')

// Con el prestamo ya avanzado, reducir plazo tiene que ahorrar mucho mas que
// reducir cuota: es la recomendacion que hace la app al amortizar.
const vivo = { capital: 6207, tin: 5.5, meses: 42 }
const plazo = amortizarAnticipado(vivo, 1200, 'plazo')
const cuota = amortizarAnticipado(vivo, 1200, 'cuota')
assert.ok(plazo.ahorroIntereses > cuota.ahorroIntereses, 'reducir plazo ahorra mas')
assert.ok(plazo.mesesAhorrados > 0)

console.log('simulador: OK')
