/**
 * Vigilante de gastos: lee el CSV que exporta el banco y busca lo que se come
 * el dinero sin que te enteres. Cargos que se repiten, suscripciones que ya no
 * usas, subidas de precio silenciosas y cargos raros.
 *
 * Todo corre en el navegador: el extracto nunca sale del dispositivo. Solo se
 * guarda el informe resultante, para compararlo con el de la semana siguiente.
 *
 * Autocomprobacion:  node --experimental-strip-types lib/vigilante.check.ts
 */

export interface Movimiento {
  fecha: Date
  concepto: string
  /** Negativo = cargo, positivo = abono. */
  importe: number
}

export type Frecuencia = 'semanal' | 'mensual' | 'trimestral' | 'anual'

export interface Recurrente {
  comercio: string
  /** Precio actual: el importe de su ultimo cargo. */
  importe: number
  frecuencia: Frecuencia
  veces: number
  /** Suma de sus cargos en los ultimos 3 meses del extracto. */
  total3m: number
  /** Lo que cuesta al mes, pase con la frecuencia que pase. */
  mensual: number
  /** Mensual y por debajo de 100 EUR: de las que se olvidan. */
  enDuda: boolean
  ultimaFecha: string
}

export interface SubidaPrecio {
  comercio: string
  antes: number
  despues: number
  fecha: string
}

export interface Rareza {
  tipo: 'duplicado' | 'atipico'
  comercio: string
  importe: number
  fecha: string
  detalle: string
}

export interface Informe {
  generado: string
  desde: string
  hasta: string
  cargos: number
  recurrentes: Recurrente[]
  subidas: SubidaPrecio[]
  rarezas: Rareza[]
  resumen: {
    recurrenteMensual: number
    revisar: { comercio: string; mensual: number; motivo: string }[]
    ahorroAnual: number
  }
}

export interface Comparacion {
  anterior: string
  nuevos: Recurrente[]
  desaparecidos: Recurrente[]
  cambios: { comercio: string; antes: number; despues: number }[]
  diferenciaMensual: number
}

const DIA = 86_400_000
/** Una cuota mensual por debajo de esto se pone en duda: son las que se olvidan. */
export const UMBRAL_EN_DUDA = 100

const redondear = (n: number) => Math.round(n * 100) / 100
const iso = (d: Date) => d.toISOString().slice(0, 10)
const sinTildes = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '')

function mediana(valores: number[]): number {
  if (!valores.length) return 0
  const orden = [...valores].sort((a, b) => a - b)
  const mitad = Math.floor(orden.length / 2)
  return orden.length % 2 ? orden[mitad] : (orden[mitad - 1] + orden[mitad]) / 2
}

// ---------------------------------------------------------------- CSV

/**
 * Importe en cualquiera de los formatos que exportan los bancos: 1.234,56,
 * -12,99, 12.50, 1,234.56, (20,00) o 20,00-. El ultimo separador que aparece
 * es el decimal.
 */
export function leerImporte(bruto: string): number | null {
  let s = bruto.replace(/EUR|€|\s/gi, '')
  if (!s) return null

  let negativo = false
  if (/^\(.*\)$/.test(s)) { negativo = true; s = s.slice(1, -1) }
  if (s.endsWith('-')) { negativo = true; s = s.slice(0, -1) }

  const coma = s.lastIndexOf(',')
  const punto = s.lastIndexOf('.')
  if (coma > -1 && punto > -1) {
    s = coma > punto ? s.replace(/\./g, '').replace(',', '.') : s.replace(/,/g, '')
  } else if (coma > -1) {
    // Varias comas solo pueden ser miles; una sola, en un banco espanol, es decimal.
    s = (s.match(/,/g)?.length ?? 0) > 1 ? s.replace(/,/g, '') : s.replace(',', '.')
  } else if (/^-?\d{1,3}(\.\d{3})+$/.test(s)) {
    s = s.replace(/\./g, '')
  }

  const n = Number(s)
  if (!Number.isFinite(n)) return null
  return negativo ? -Math.abs(n) : n
}

function crearFecha(anio: number, mes: number, dia: number): Date | null {
  if (mes < 1 || mes > 12 || dia < 1 || dia > 31) return null
  const f = new Date(Date.UTC(anio, mes - 1, dia))
  // 31/02 no existe: Date lo convertiria en marzo sin avisar.
  return f.getUTCDate() === dia ? f : null
}

/** dd/mm/aaaa, dd-mm-aa, dd.mm.aaaa o aaaa-mm-dd. En UTC, sin saltos de zona. */
export function leerFecha(bruto: string): Date | null {
  const s = bruto.trim()
  let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/)
  if (m) return crearFecha(+m[1], +m[2], +m[3])
  m = s.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})/)
  if (m) {
    const anio = +m[3] < 100 ? +m[3] + 2000 : +m[3]
    return crearFecha(anio, +m[2], +m[1])
  }
  return null
}

function partirLinea(linea: string, sep: string): string[] {
  const campos: string[] = []
  let actual = ''
  let entreComillas = false
  for (let i = 0; i < linea.length; i++) {
    const c = linea[i]
    if (entreComillas) {
      if (c !== '"') actual += c
      else if (linea[i + 1] === '"') { actual += '"'; i++ }
      else entreComillas = false
    } else if (c === '"') entreComillas = true
    else if (c === sep) { campos.push(actual.trim()); actual = '' }
    else actual += c
  }
  campos.push(actual.trim())
  return campos
}

const COLUMNAS = {
  fecha: /^(fecha|f\.? ?(operacion|valor|contable)|date|dia)/,
  concepto: /(concepto|descripcion|detalle|comercio|movimiento|merchant|description|payee|beneficiario)/,
  importe: /^(importe|cantidad|amount|monto)/,
  cargo: /^(cargo|debe|debito|gasto)/,
  abono: /^(abono|haber|credito|ingreso)/,
}

const normalizarCabecera = (s: string) => sinTildes(s).toLowerCase().trim()

/**
 * Lee el CSV exportado por el banco. Detecta el separador, salta las lineas de
 * cabecera que algunos bancos meten antes de la tabla y encuentra las columnas
 * por su nombre, asi que no hay que configurar nada.
 *
 * ponytail: un campo entre comillas con saltos de linea dentro se parte en dos.
 * Ningun extracto bancario los usa; si aparece uno, habria que leer por caracter.
 */
export function leerCSV(texto: string): { movimientos: Movimiento[]; avisos: string[] } {
  const lineas = texto.replace(/^\uFEFF/, '').split(/\r?\n/).filter((l) => l.trim())
  const avisos: string[] = []

  for (const sep of [';', ',', '\t']) {
    for (let fila = 0; fila < Math.min(lineas.length, 30); fila++) {
      const cabecera = partirLinea(lineas[fila], sep).map(normalizarCabecera)
      const buscar = (re: RegExp) => cabecera.findIndex((h) => re.test(h) && !h.includes('saldo'))

      const iFecha = buscar(COLUMNAS.fecha)
      const iConcepto = buscar(COLUMNAS.concepto)
      const iImporte = buscar(COLUMNAS.importe)
      const iCargo = buscar(COLUMNAS.cargo)
      const iAbono = buscar(COLUMNAS.abono)
      if (iFecha < 0 || iConcepto < 0 || (iImporte < 0 && iCargo < 0)) continue

      const movimientos: Movimiento[] = []
      let descartadas = 0
      for (const linea of lineas.slice(fila + 1)) {
        const c = partirLinea(linea, sep)
        const fecha = leerFecha(c[iFecha] ?? '')

        let importe: number | null
        if (iImporte >= 0) {
          importe = leerImporte(c[iImporte] ?? '')
        } else {
          // Bancos que separan debe y haber: el cargo resta aunque venga en positivo.
          const cargo = leerImporte(c[iCargo] ?? '')
          const abono = iAbono >= 0 ? leerImporte(c[iAbono] ?? '') : null
          importe = cargo ? -Math.abs(cargo) : abono ? Math.abs(abono) : null
        }

        const concepto = (c[iConcepto] ?? '').trim()
        if (!fecha || importe === null || !concepto) { descartadas++; continue }
        movimientos.push({ fecha, concepto, importe })
      }

      if (descartadas) avisos.push(`${descartadas} filas sin fecha, concepto o importe válidos se han ignorado.`)
      return { movimientos, avisos }
    }
  }

  return {
    movimientos: [],
    avisos: ['No encuentro las columnas de fecha, concepto e importe. ¿Es el CSV de movimientos de tu banco?'],
  }
}

// ---------------------------------------------------------------- ANALISIS

const RUIDO = /\b(COMPRA|PAGO|CARGO|RECIBO|ADEUDO|TRANSACCION|TARJETA|TARJ|DOMICILIADO|SEPA|CONTACTLESS|APPLE PAY|GOOGLE PAY|EN|DE|POR|CON)\b/g

/**
 * Agrupa "COMPRA TARJ. 4512XXXX NETFLIX.COM 05/09" y "NETFLIX.COM AMSTERDAM"
 * bajo la misma clave.
 *
 * ponytail: heuristica de palabras. Un comercio que cambia de nombre en el
 * extracto sale como dos; reglas por usuario lo arreglarian si hace falta.
 */
export function normalizarComercio(concepto: string): string {
  const limpio = sinTildes(concepto)
    .toUpperCase()
    .replace(/\b\d{1,2}[/.-]\d{1,2}([/.-]\d{2,4})?\b/g, ' ')
    .replace(/X{3,}\d*|\*+\d*|\d{4,}/g, ' ')
    .replace(RUIDO, ' ')
    .replace(/[^A-Z0-9&.' ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  // Al quitar 'TARJ' de 'TARJ.' queda el punto suelto: se limpian los bordes de
  // cada palabra, pero no el interior ('NETFLIX.COM' sigue entero).
  const palabras = limpio.split(' ').map((w) => w.replace(/^[.&']+|[.&']+$/g, '')).filter(Boolean)
  return palabras.slice(0, 3).join(' ') || sinTildes(concepto).toUpperCase().trim().slice(0, 30)
}

function frecuenciaDe(intervalo: number): Frecuencia | null {
  if (intervalo >= 5 && intervalo <= 9) return 'semanal'
  if (intervalo >= 25 && intervalo <= 35) return 'mensual'
  if (intervalo >= 80 && intervalo <= 100) return 'trimestral'
  if (intervalo >= 330 && intervalo <= 400) return 'anual'
  return null
}

const A_MENSUAL: Record<Frecuencia, number> = { semanal: 52 / 12, mensual: 1, trimestral: 1 / 3, anual: 1 / 12 }

/** Oscilacion maxima del importe para considerarlo un cargo fijo y no un habito. */
const OSCILACION_FIJO = 0.25
/** Un cargo suelto por debajo de esto no es raro aunque se salga de la media. */
const MINIMO_ATIPICO = 30

export function analizar(movimientos: Movimiento[], ahora = new Date()): Informe {
  const cargos = movimientos
    .filter((m) => m.importe < 0)
    .map((m) => ({ ...m, importe: redondear(-m.importe), comercio: normalizarComercio(m.concepto) }))
    .sort((a, b) => a.fecha.getTime() - b.fecha.getTime())

  const vacio: Informe = {
    generado: ahora.toISOString(), desde: '', hasta: '', cargos: 0,
    recurrentes: [], subidas: [], rarezas: [],
    resumen: { recurrenteMensual: 0, revisar: [], ahorroAnual: 0 },
  }
  if (!cargos.length) return vacio

  const hasta = cargos[cargos.length - 1].fecha
  const inicio3m = hasta.getTime() - 91 * DIA

  const porComercio = new Map<string, typeof cargos>()
  for (const c of cargos) porComercio.set(c.comercio, [...(porComercio.get(c.comercio) ?? []), c])

  // 1 y 2: recurrentes y suscripciones en duda
  const recurrentes: Recurrente[] = []
  const subidas: SubidaPrecio[] = []
  for (const [comercio, lista] of porComercio) {
    if (lista.length < 2) continue
    const importes = lista.map((c) => c.importe)
    const tipico = mediana(importes)
    // Un comercio que cobra cada semana cantidades distintas es un habito
    // (el supermercado), no un cargo recurrente.
    if (tipico <= 0 || (Math.max(...importes) - Math.min(...importes)) / tipico > OSCILACION_FIJO) continue

    const intervalos = lista.slice(1).map((c, i) => (c.fecha.getTime() - lista[i].fecha.getTime()) / DIA)
    const frecuencia = frecuenciaDe(mediana(intervalos))
    if (!frecuencia) continue

    // La mediana decide si el importe es estable, pero lo que cuesta y lo que
    // ahorrarias es el precio de hoy: tras una subida, la mediana mentiria.
    const actual = lista[lista.length - 1].importe

    recurrentes.push({
      comercio,
      importe: actual,
      frecuencia,
      veces: lista.length,
      total3m: redondear(lista.filter((c) => c.fecha.getTime() > inicio3m).reduce((s, c) => s + c.importe, 0)),
      mensual: redondear(actual * A_MENSUAL[frecuencia]),
      enDuda: frecuencia === 'mensual' && actual < UMBRAL_EN_DUDA,
      ultimaFecha: iso(lista[lista.length - 1].fecha),
    })

    // 3: la subida mas reciente, aunque despues se haya mantenido el precio nuevo
    for (let i = lista.length - 1; i > 0; i--) {
      const antes = lista[i - 1].importe
      const despues = lista[i].importe
      if (despues - antes > 0.01) {
        subidas.push({ comercio, antes, despues, fecha: iso(lista[i].fecha) })
        break
      }
    }
  }
  recurrentes.sort((a, b) => b.mensual - a.mensual)

  // 4: lo raro
  const rarezas: Rareza[] = []
  const mismoDia = new Map<string, typeof cargos>()
  for (const c of cargos) {
    const clave = `${c.comercio}|${iso(c.fecha)}|${c.importe}`
    mismoDia.set(clave, [...(mismoDia.get(clave) ?? []), c])
  }
  for (const grupo of mismoDia.values()) {
    if (grupo.length < 2) continue
    rarezas.push({
      tipo: 'duplicado', comercio: grupo[0].comercio, importe: grupo[0].importe, fecha: iso(grupo[0].fecha),
      detalle: `${grupo.length} cargos idénticos el mismo día`,
    })
  }

  // Desviacion absoluta mediana: una compra grande no infla el umbral como lo haria la media.
  const todos = cargos.map((c) => c.importe)
  const med = mediana(todos)
  const mad = mediana(todos.map((x) => Math.abs(x - med)))
  const umbralGlobal = Math.max(MINIMO_ATIPICO, med + 5 * mad)
  const esRecurrente = new Set(recurrentes.map((r) => r.comercio))

  for (const [comercio, lista] of porComercio) {
    if (esRecurrente.has(comercio)) continue
    if (lista.length === 1) {
      const c = lista[0]
      if (c.importe >= umbralGlobal) {
        rarezas.push({
          tipo: 'atipico', comercio, importe: c.importe, fecha: iso(c.fecha),
          detalle: `Aparece una sola vez y es muy superior a tu cargo habitual (${redondear(med)} €)`,
        })
      }
      continue
    }
    const tipico = mediana(lista.map((c) => c.importe))
    for (const c of lista) {
      if (c.importe >= Math.max(MINIMO_ATIPICO, tipico * 3)) {
        rarezas.push({
          tipo: 'atipico', comercio, importe: c.importe, fecha: iso(c.fecha),
          detalle: `Triplica lo que sueles gastar aquí (${redondear(tipico)} €)`,
        })
      }
    }
  }
  rarezas.sort((a, b) => b.importe - a.importe)

  // 5: resumen
  const candidatos = new Map<string, { comercio: string; mensual: number; motivo: string }>()
  for (const s of subidas) {
    const r = recurrentes.find((x) => x.comercio === s.comercio)
    if (r) candidatos.set(r.comercio, { comercio: r.comercio, mensual: r.mensual, motivo: `Ha subido de ${s.antes} € a ${s.despues} €` })
  }
  for (const r of recurrentes.filter((x) => x.enDuda)) {
    if (!candidatos.has(r.comercio)) {
      candidatos.set(r.comercio, { comercio: r.comercio, mensual: r.mensual, motivo: 'Suscripción mensual: ¿la sigues usando?' })
    }
  }
  const revisar = [...candidatos.values()].sort((a, b) => b.mensual - a.mensual).slice(0, 3)
  for (const r of recurrentes) {
    if (revisar.length >= 3) break
    if (!revisar.some((x) => x.comercio === r.comercio)) {
      revisar.push({ comercio: r.comercio, mensual: r.mensual, motivo: 'Uno de tus cargos fijos más altos' })
    }
  }

  return {
    generado: ahora.toISOString(),
    desde: iso(cargos[0].fecha),
    hasta: iso(hasta),
    cargos: cargos.length,
    recurrentes,
    subidas,
    rarezas,
    resumen: {
      recurrenteMensual: redondear(recurrentes.reduce((s, r) => s + r.mensual, 0)),
      revisar,
      ahorroAnual: redondear(revisar.reduce((s, r) => s + r.mensual, 0) * 12),
    },
  }
}

/** Lo que ha cambiado desde el informe anterior: altas, bajas y cambios de cuota. */
export function compararInformes(anterior: Informe, actual: Informe): Comparacion {
  const previo = new Map(anterior.recurrentes.map((r) => [r.comercio, r]))
  const ahora = new Map(actual.recurrentes.map((r) => [r.comercio, r]))

  return {
    anterior: anterior.generado,
    nuevos: actual.recurrentes.filter((r) => !previo.has(r.comercio)),
    desaparecidos: anterior.recurrentes.filter((r) => !ahora.has(r.comercio)),
    cambios: actual.recurrentes
      .filter((r) => previo.has(r.comercio) && Math.abs(r.importe - previo.get(r.comercio)!.importe) > 0.01)
      .map((r) => ({ comercio: r.comercio, antes: previo.get(r.comercio)!.importe, despues: r.importe })),
    diferenciaMensual: redondear(actual.resumen.recurrenteMensual - anterior.resumen.recurrenteMensual),
  }
}

// ---------------------------------------------------------------- MARKDOWN

const eur = (n: number) => `${n.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`
const tabla = (cabecera: string[], filas: string[][]) =>
  [`| ${cabecera.join(' | ')} |`, `|${cabecera.map(() => '---').join('|')}|`, ...filas.map((f) => `| ${f.join(' | ')} |`)].join('\n')

/** vigilante-gastos.md: el informe en un formato que se lee sin la app. */
export function aMarkdown(informe: Informe, comparacion: Comparacion | null = null): string {
  const r = informe.resumen
  const partes: string[] = [
    '# Vigilante de gastos',
    '',
    `> Extracto del ${informe.desde} al ${informe.hasta} · ${informe.cargos} cargos analizados · generado el ${informe.generado.slice(0, 10)}`,
    '',
    '## 1. Cargos recurrentes',
    '',
    informe.recurrentes.length
      ? tabla(
          ['Comercio', 'Importe', 'Frecuencia', 'Últimos 3 meses', 'Al mes'],
          informe.recurrentes.map((x) => [x.comercio, eur(x.importe), x.frecuencia, eur(x.total3m), eur(x.mensual)]),
        )
      : 'No se han detectado cargos recurrentes.',
    '',
    '## 2. Suscripciones en duda',
    '',
    ...(informe.recurrentes.some((x) => x.enDuda)
      ? informe.recurrentes.filter((x) => x.enDuda).map((x) => `- **${x.comercio}** — ${eur(x.importe)}/mes. ¿La sigues usando?`)
      : ['Ninguna suscripción mensual por debajo de 100 €.']),
    '',
    '## 3. Subidas de precio',
    '',
    ...(informe.subidas.length
      ? informe.subidas.map((s) => `- **${s.comercio}** — de ${eur(s.antes)} a ${eur(s.despues)} (desde el ${s.fecha})`)
      : ['Ningún cargo recurrente ha subido de precio.']),
    '',
    '## 4. Lo raro',
    '',
    ...(informe.rarezas.length
      ? informe.rarezas.map((x) => `- ${x.tipo === 'duplicado' ? '🔁' : '⚠️'} **${x.comercio}** — ${eur(x.importe)} el ${x.fecha}. ${x.detalle}`)
      : ['Nada fuera de tu patrón habitual.']),
    '',
    '## 5. Resumen',
    '',
    `- Gasto recurrente mensual: **${eur(r.recurrenteMensual)}**`,
    `- Ahorro anual si quitas los cargos a revisar: **${eur(r.ahorroAnual)}**`,
    '',
    ...(r.revisar.length
      ? ['**Revisa estos tres:**', '', ...r.revisar.map((x, i) => `${i + 1}. **${x.comercio}** — ${eur(x.mensual)}/mes. ${x.motivo}`)]
      : []),
  ]

  if (comparacion) {
    const signo = comparacion.diferenciaMensual > 0 ? '+' : ''
    partes.push(
      '',
      `## Cambios desde el informe del ${comparacion.anterior.slice(0, 10)}`,
      '',
      `- Recurrente mensual: ${signo}${eur(comparacion.diferenciaMensual)}`,
      ...comparacion.nuevos.map((x) => `- 🆕 Nuevo: **${x.comercio}** (${eur(x.mensual)}/mes)`),
      ...comparacion.desaparecidos.map((x) => `- ✅ Ya no aparece: **${x.comercio}** (${eur(x.mensual)}/mes)`),
      ...comparacion.cambios.map((x) => `- 📈 **${x.comercio}**: de ${eur(x.antes)} a ${eur(x.despues)}`),
    )
    if (!comparacion.nuevos.length && !comparacion.desaparecidos.length && !comparacion.cambios.length) {
      partes.push('- Sin cambios en tus cargos recurrentes.')
    }
  }

  return partes.join('\n') + '\n'
}
