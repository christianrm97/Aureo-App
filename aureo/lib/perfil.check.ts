/**
 * Autocomprobacion del plan personal: que un usuario nuevo no herede el plan
 * de nadie y que el presupuesto de proyectos cuadre mes a mes.
 *   node --experimental-strip-types lib/perfil.check.ts
 */
import assert from 'node:assert/strict'
import { presupuestoProyectos, planProyectosDe, checkpointDe, fechaObjetivoDe, leerFechaISO, DEFECTO } from './perfil.ts'

// Un perfil vacio no tiene plan de proyectos ni checkpoint
assert.equal(planProyectosDe(null), null)
assert.equal(planProyectosDe({}), null)
assert.equal(planProyectosDe({ proyectos_inicial: 500 }), null, 'sin tope no hay plan')
assert.equal(checkpointDe(null), null)
assert.equal(checkpointDe({ checkpoint_fecha: '2026-06-01' }), null, 'sin importe no hay checkpoint')
assert.equal(checkpointDe({ checkpoint_ingreso: 300 }), null, 'sin fecha no hay checkpoint')

// Plan de 500 iniciales + 100 al mes, tope 200, desde enero de 2026.
// Los numeros llegan como texto desde Postgres (numeric): tiene que dar igual.
const plan = planProyectosDe({ proyectos_inicial: '500', proyectos_aporte: '100', proyectos_tope: '200', proyectos_inicio: '2026-01-01' })
assert.ok(plan)
assert.deepEqual(presupuestoProyectos(0, plan, new Date(2025, 11, 20)), { total: 500, disponible: 500 }, 'antes de empezar solo cuenta el inicial')
assert.deepEqual(presupuestoProyectos(200, plan, new Date(2026, 0, 15)), { total: 600, disponible: 400 }, 'el mes de inicio ya aporta')
assert.equal(presupuestoProyectos(600, plan, new Date(2026, 2, 10)).disponible, 200)
assert.equal(presupuestoProyectos(1200, plan, new Date(2026, 4, 1)).disponible, 0, 'nunca baja de cero')

// Sin fecha de inicio no se suman aportaciones inventadas
const sinInicio = planProyectosDe({ proyectos_inicial: 200, proyectos_aporte: 50, proyectos_tope: 100 })
assert.ok(sinInicio)
assert.equal(presupuestoProyectos(0, sinInicio, new Date(2030, 0, 1)).total, 200)

// Checkpoint completo
const cp = checkpointDe({ checkpoint_fecha: '2026-06-01', checkpoint_ingreso: '300' })
assert.ok(cp)
assert.equal(cp.ingresoObjetivo, 300)
assert.equal(cp.fecha.getMonth(), 5)

// Fecha del objetivo: la del usuario o, sin ella, a un anio vista
assert.equal(fechaObjetivoDe({ fecha_objetivo: '2026-06-01' }).getMonth(), 5)
const porDefecto = fechaObjetivoDe(null, new Date(2026, 3, 13))
assert.equal(porDefecto.getFullYear(), 2027)
assert.equal(porDefecto.getMonth(), 3)
assert.equal(leerFechaISO('no-es-fecha'), null)
assert.ok(DEFECTO.objetivo > 0 && DEFECTO.fondoEmergencia >= 0)

console.log('perfil: OK')
