/**
 * Autocomprobacion de la reserva de mercados. Un precio mal leido se pinta en
 * la app como si fuera real:  node --experimental-strip-types lib/mercados.check.ts
 */
import assert from 'node:assert/strict'
import { SIMBOLOS, FINNHUB, desdeFinnhub } from './mercados.ts'

// Cada activo de la app tiene su equivalente declarado en la reserva
for (const s of SIMBOLOS) assert.ok(FINNHUB[s.id], `sin simbolo de reserva: ${s.id}`)

const btc = SIMBOLOS.find((s) => s.id === 'btc')
assert.ok(btc)

// Cotizacion valida: variacion contra el cierre anterior, en la moneda del par
const c = desdeFinnhub(btc, { c: 60000, pc: 50000, t: 1 })
assert.ok(c)
assert.equal(c.currency, 'EUR')
assert.equal(Math.round(c.changePct), 20)
assert.equal(c.fuente, 'finnhub')
assert.deepEqual(c.serie, [50000, 60000])

// Finnhub responde con ceros cuando el simbolo no esta en el plan: no es un precio
assert.equal(desdeFinnhub(btc, { c: 0, pc: 0, t: 0 }), null)
assert.equal(desdeFinnhub(btc, null), null)
assert.equal(desdeFinnhub(btc, {}), null)
assert.equal(desdeFinnhub(btc, { c: 100 }), null, 'sin cierre anterior no hay variacion fiable')
assert.equal(desdeFinnhub({ ...btc, id: 'inventado' }, { c: 1, pc: 1 }), null, 'sin equivalente no se inventa')

console.log('mercados: OK')
