/**
 * Autocomprobacion del Vigilante de gastos. Decide que suscripciones se ponen
 * en duda y cuanto dinero se promete ahorrar, asi que no se toca sin pasar esto:
 *   node --experimental-strip-types lib/vigilante.check.ts
 */
import assert from 'node:assert/strict'
import { leerCSV, leerImporte, leerFecha, normalizarComercio, analizar, compararInformes, aMarkdown } from './vigilante.ts'

// --- Importes en los formatos que exportan los bancos ---
assert.equal(leerImporte('1.234,56'), 1234.56)
assert.equal(leerImporte('-12,99'), -12.99)
assert.equal(leerImporte('12.50'), 12.5)
assert.equal(leerImporte('1,234.56'), 1234.56)
assert.equal(leerImporte('(20,00)'), -20)
assert.equal(leerImporte('20,00-'), -20)
assert.equal(leerImporte('-1.500'), -1500)
assert.equal(leerImporte('12,99 €'), 12.99)
assert.equal(leerImporte(''), null)
assert.equal(leerImporte('abc'), null)

// --- Fechas ---
assert.equal(leerFecha('05/09/2026')?.toISOString().slice(0, 10), '2026-09-05')
assert.equal(leerFecha('2026-09-05')?.toISOString().slice(0, 10), '2026-09-05')
assert.equal(leerFecha('05-09-26')?.toISOString().slice(0, 10), '2026-09-05')
assert.equal(leerFecha('31/02/2026'), null, 'el 31 de febrero no existe')

// --- Mismo comercio aunque el banco le ponga ruido distinto ---
assert.equal(normalizarComercio('COMPRA TARJ. 4512XXXX1234 NETFLIX.COM 05/09'), normalizarComercio('NETFLIX.COM'))

// --- Extracto sintetico con todos los casos del encargo ---
const filas: string[] = [
  'Cuenta;ES12 0000 0000 0000 0000',   // preambulo que algunos bancos meten antes de la tabla
  '',
  'Fecha operación;Fecha valor;Concepto;Importe;Saldo',
]
const mov = (fecha: string, concepto: string, importe: string) => filas.push(`${fecha};${fecha};${concepto};${importe};1000,00`)

// Netflix mensual que sube de 12,99 a 13,99: recurrente, en duda y subida
mov('05/06/2026', 'COMPRA TARJ. NETFLIX.COM', '-12,99')
mov('05/07/2026', 'COMPRA TARJ. NETFLIX.COM', '-12,99')
mov('05/08/2026', 'COMPRA TARJ. NETFLIX.COM', '-13,99')
mov('05/09/2026', 'COMPRA TARJ. NETFLIX.COM', '-13,99')
// Spotify estable: recurrente y en duda, sin subida
for (const m of ['06', '07', '08', '09']) mov(`10/${m}/2026`, 'SPOTIFY P3F2A1', '-10,99')
// Seguro mensual de 120: recurrente pero NO en duda (supera los 100)
for (const m of ['06', '07', '08', '09']) mov(`01/${m}/2026`, 'RECIBO SEGUROS MAPFRE', '-120,00')
// Supermercado semanal con importes muy distintos: habito, no recurrente
const super_ = [
  ['01/07/2026', '-31,20'], ['08/07/2026', '-78,45'], ['15/07/2026', '-45,10'],
  ['22/07/2026', '-62,90'], ['29/07/2026', '-29,99'], ['05/08/2026', '-81,00'],
]
for (const [fecha, imp] of super_) mov(fecha, 'MERCADONA', imp)
// Cargo duplicado el mismo dia
mov('15/08/2026', 'AMAZON MKTPLACE', '-25,00')
mov('15/08/2026', 'AMAZON MKTPLACE', '-25,00')
// Comercio que aparece una vez con un importe muy fuera de patron
mov('20/07/2026', 'JOYERIA LUNA', '-450,00')
// Nomina: es un abono, no debe contar en nada
mov('28/08/2026', 'NOMINA EMPRESA SA', '1.500,00')
// Concepto entre comillas con el separador dentro
filas.push('22/08/2026;22/08/2026;"BAR PEPE; CAFE";-2,50;1000,00')

const { movimientos, avisos } = leerCSV(filas.join('\n'))
assert.equal(avisos.length, 0, `avisos inesperados: ${avisos.join(' | ')}`)
assert.ok(movimientos.some((m) => m.concepto === 'BAR PEPE; CAFE'), 'el separador entre comillas no parte el campo')
assert.ok(movimientos.some((m) => m.importe === 1500), 'la nomina se lee como abono')

const informe = analizar(movimientos, new Date('2026-09-13T10:00:00Z'))
const buscar = (texto: string) => informe.recurrentes.find((r) => r.comercio.includes(texto))

// 1. Recurrentes
const netflix = buscar('NETFLIX')
const spotify = buscar('SPOTIFY')
const seguro = buscar('MAPFRE')
assert.ok(netflix && spotify && seguro, 'Netflix, Spotify y el seguro son recurrentes')
assert.equal(netflix.frecuencia, 'mensual')
assert.equal(spotify.veces, 4)
assert.equal(buscar('MERCADONA'), undefined, 'el super con importes variables no es un cargo recurrente')

// 2. En duda: mensual y por debajo de 100
assert.equal(netflix.enDuda, true)
assert.equal(spotify.enDuda, true)
assert.equal(seguro.enDuda, false, '120 EUR supera el umbral')

// 3. Subida de precio con antes y despues
const subida = informe.subidas.find((s) => s.comercio.includes('NETFLIX'))
assert.ok(subida, 'la subida de Netflix se detecta')
assert.equal(subida.antes, 12.99)
assert.equal(subida.despues, 13.99)
assert.equal(informe.subidas.some((s) => s.comercio.includes('SPOTIFY')), false)

// 4. Lo raro
assert.ok(informe.rarezas.some((r) => r.tipo === 'duplicado' && r.comercio.includes('AMAZON')), 'duplicado detectado')
assert.ok(informe.rarezas.some((r) => r.tipo === 'atipico' && r.comercio.includes('JOYERIA')), 'cargo atipico detectado')
assert.equal(informe.rarezas.some((r) => r.comercio.includes('NOMINA')), false, 'los abonos no son rarezas')

// 5. Resumen: 120 + 13,99 + 10,99 al mes, y el ahorro sale de los tres a revisar
assert.equal(informe.resumen.recurrenteMensual, 144.98)
assert.equal(informe.resumen.revisar.length, 3)
const esperado = Math.round(informe.resumen.revisar.reduce((s, r) => s + r.mensual, 0) * 12 * 100) / 100
assert.equal(informe.resumen.ahorroAnual, esperado)
// La subida va primero entre los candidatos por coste, pero todos los motivos llevan explicacion
assert.ok(informe.resumen.revisar.every((r) => r.motivo.length > 0))

// --- Comparacion con la semana siguiente: Netflix dado de baja ---
const sinNetflix = analizar(movimientos.filter((m) => !m.concepto.includes('NETFLIX')), new Date('2026-09-20T10:00:00Z'))
const cambios = compararInformes(informe, sinNetflix)
assert.ok(cambios.desaparecidos.some((r) => r.comercio.includes('NETFLIX')))
assert.equal(cambios.nuevos.length, 0)
assert.equal(cambios.diferenciaMensual, -13.99)

// --- Markdown ---
const md = aMarkdown(sinNetflix, cambios)
for (const seccion of ['## 1. Cargos recurrentes', '## 2. Suscripciones en duda', '## 3. Subidas de precio', '## 4. Lo raro', '## 5. Resumen', '## Cambios desde']) {
  assert.ok(md.includes(seccion), `falta la seccion: ${seccion}`)
}

// --- CSV que no es de movimientos ---
assert.equal(leerCSV('nombre,edad\nAna,30').movimientos.length, 0)
assert.equal(leerCSV('nombre,edad\nAna,30').avisos.length, 1)
// Extracto sin cargos
assert.equal(analizar([]).recurrentes.length, 0)

console.log('vigilante: OK')
