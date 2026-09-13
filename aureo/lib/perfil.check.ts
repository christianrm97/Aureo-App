/**
 * Autocomprobacion del presupuesto de proyectos: 430 iniciales, 70 al mes y
 * gasto al tope de 150.  node --experimental-strip-types lib/perfil.check.ts
 */
import assert from 'node:assert/strict'
import { presupuestoProyectos } from './perfil.ts'

// Antes de octubre de 2026 solo existe el importe inicial
assert.deepEqual(presupuestoProyectos(0, new Date(2026, 8, 13)), { total: 430, disponible: 430 })

// Primer mes: 430 + 70 de aportacion - 150 gastados = 350
assert.deepEqual(presupuestoProyectos(150, new Date(2026, 9, 15)), { total: 500, disponible: 350 })

// Febrero 2027 al tope todos los meses: 430 + 70x5 - 150x5 = 30
assert.equal(presupuestoProyectos(750, new Date(2027, 1, 20)).disponible, 30)

// Marzo 2027: se agota justo en el checkpoint y nunca baja de cero
assert.equal(presupuestoProyectos(900, new Date(2027, 2, 10)).disponible, 0)
assert.equal(presupuestoProyectos(900, new Date(2027, 2, 10)).total, 850)

console.log('perfil: OK')
