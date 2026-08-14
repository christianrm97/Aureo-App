/**
 * Autocomprobacion del motor financiero. Es la ruta del dinero, asi que no
 * se toca sin pasar esto:  node --experimental-strip-types lib/finanzas.check.ts
 */
import assert from 'node:assert/strict'
import { resumen, analizar, proyectar, mesesHasta, impactoGasto, type Estado } from './finanzas.ts'

const base = (): Estado => ({
  liquido: 2000,
  objetivo: 3663,
  fechaObjetivo: new Date(new Date().getFullYear(), new Date().getMonth() + 5, 1),
  recurrentes: [
    { importe: 1410.67, tipo: 'ingreso', dia: 28 },
    { importe: -686, tipo: 'gasto', dia: 26 },
    { importe: -280.9, tipo: 'gasto', dia: 20 },
  ],
  suscripciones: [{ cuota: 13.99 }, { cuota: 10.99 }],
  recibos: [{ importe: 65 }, { importe: 35 }],
  deudas: [{ cuota: 120, pendiente: 1200, tipo: 'tarjeta' }],
  inversionMensual: 80,
})

// resumen: los signos de entrada no importan, todo se normaliza a positivo
const r = resumen(base())
assert.equal(r.ingresos, 1410.67)
assert.equal(r.gastosFijos, 966.9)
assert.equal(round(r.suscripciones), 24.98)
assert.equal(r.recibos, 100)
assert.equal(r.deuda, 120)
assert.equal(round(r.ahorroMensual), round(1410.67 - 966.9 - 24.98 - 100 - 120 - 80))
assert.equal(r.deudaTotal, 1200)

// una suscripcion inactiva no cuenta
const conPausa = { ...base(), suscripciones: [{ cuota: 13.99 }, { cuota: 10.99, activa: false }] }
assert.equal(round(resumen(conPausa).suscripciones), 13.99)

// mesesHasta
assert.equal(mesesHasta(new Date(2026, 0, 1), new Date(2027, 0, 1)), 12)
assert.equal(mesesHasta(new Date(2026, 7, 1), new Date(2026, 7, 28)), 0)

// proyeccion: arranca en el liquido actual y crece al ritmo de ahorro
const p = proyectar(base(), 3)
assert.equal(p.length, 3)
assert.equal(p[0].liquido, 2000)
assert.equal(p[1].liquido, Math.round(2000 + resumen(base()).ahorroMensual))

// holgura -> sin recortes, propone invertir mas
const holgado = { ...base(), liquido: 3600 }
const aHolgado = analizar(holgado)
assert.equal(aHolgado.severidad, 'ok')

// hueco -> primero baja inversion, luego suscripciones
const apretado = { ...base(), liquido: 100, inversionMensual: 80 }
const aApretado = analizar(apretado)
assert.notEqual(aApretado.severidad, 'ok')
assert.equal(aApretado.acciones[0].palanca, 'inversion')
assert.ok(aApretado.acciones[0].delta <= 80, 'no puede recortar mas inversion de la que hay')

// objetivo ya cubierto
const cubierto = { ...base(), liquido: 5000 }
assert.equal(analizar(cubierto).titulo, 'Objetivo cubierto')

// sin margen de ahorro no se divide por cero
const ahogado = { ...base(), recurrentes: [{ importe: 100, tipo: 'ingreso' as const, dia: 28 }] }
assert.ok(resumen(ahogado).ahorroMensual < 0)
assert.ok(impactoGasto(ahogado, 20).includes('20€'))
assert.ok(impactoGasto(base(), 50).length > 0)

// objetivo en el pasado: meses = 0, no revienta
const vencido = { ...base(), fechaObjetivo: new Date(2020, 0, 1) }
assert.equal(analizar(vencido).mesesRestantes, 0)

function round(n: number) { return Math.round(n * 100) / 100 }

console.log('finanzas: OK')
