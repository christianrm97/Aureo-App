import { NextResponse } from 'next/server'
import { comprobarLimite, LIMITES } from '@/lib/limite'
import { SIMBOLOS, FINNHUB, desdeFinnhub, type Cotizacion, type Simbolo } from '@/lib/mercados'

// 60 s de cache compartida: con mil usuarios mirando, cada proveedor recibe una
// peticion por simbolo y minuto, no mil.
export const revalidate = 60

const CABECERAS = { 'User-Agent': 'Mozilla/5.0 (compatible; AureoBot/1.0)' }

async function cotizar(s: Simbolo): Promise<Cotizacion | null> {
  try {
    const res = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(s.symbol)}?interval=1d&range=1mo`,
      { headers: CABECERAS, next: { revalidate } },
    )
    if (!res.ok) return null

    const json = await res.json()
    const resultado = json?.chart?.result?.[0]
    const meta = resultado?.meta
    const price = Number(meta?.regularMarketPrice)
    if (!Number.isFinite(price)) return null

    // Serie de cierres para la linea de tendencia; se descartan los huecos que
    // Yahoo devuelve como null en dias sin sesion.
    const cierres: number[] = (resultado?.indicators?.quote?.[0]?.close ?? [])
      .filter((n: unknown): n is number => typeof n === 'number' && Number.isFinite(n))
      .slice(-30)

    // El cierre de referencia es el de la sesion anterior, no el del principio
    // del rango. Pidiendo un mes de historico, `chartPreviousClose` es el
    // cierre de hace un mes: usarlo daba variaciones mensuales disfrazadas de
    // diarias (bitcoin marcaba +23 % en un dia que subia el 1 %).
    const cierreAnterior = cierres.length >= 2 ? cierres[cierres.length - 2] : Number(meta?.chartPreviousClose ?? meta?.previousClose)
    const previous = Number(cierreAnterior)
    if (!Number.isFinite(previous) || previous === 0) return null

    return {
      id: s.id,
      symbol: s.symbol,
      nombre: s.nombre,
      grupo: s.grupo,
      currency: meta?.currency ?? 'USD',
      price,
      previous,
      changePct: ((price - previous) / previous) * 100,
      marketState: meta?.marketState ?? 'UNKNOWN',
      decimales: s.decimales ?? 2,
      color: s.color,
      serie: cierres,
      fuente: 'yahoo',
    }
  } catch {
    return null
  }
}

/**
 * Reserva: Finnhub, solo para lo que Yahoo no ha podido servir. Yahoo es un
 * endpoint no oficial que puede cambiar sin avisar; con la reserva la pestana
 * de mercados no se queda en blanco.
 *
 * La clave viaja en cabecera y no en la URL, para que no acabe en ningun
 * registro de peticiones.
 */
async function reserva(s: Simbolo): Promise<Cotizacion | null> {
  const clave = process.env.FINNHUB_API_KEY
  const destino = FINNHUB[s.id]
  if (!clave || !destino) return null
  try {
    const res = await fetch(`https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(destino.symbol)}`, {
      headers: { 'X-Finnhub-Token': clave },
      next: { revalidate },
    })
    if (!res.ok) return null
    return desdeFinnhub(s, await res.json())
  } catch {
    return null
  }
}

// GET /api/precios — indices, cripto, divisas y materias primas
export async function GET(req: Request) {
  const frenado = comprobarLimite(req, 'precios', LIMITES.publica)
  if (frenado) return frenado

  const yahoo = await Promise.all(SIMBOLOS.map(cotizar))
  // Solo se gasta cuota de Finnhub en los simbolos que Yahoo no ha servido.
  const resultados = await Promise.all(SIMBOLOS.map((s, i) => yahoo[i] ?? reserva(s)))

  const data: Record<string, Cotizacion> = {}
  for (const c of resultados) {
    if (c) data[c.id] = c
  }

  // Compatibilidad: la portada lee data.sp500 desde antes de existir mercados
  return NextResponse.json({
    ok: true,
    data,
    actualizado: Date.now(),
    fallidos: SIMBOLOS.filter((s) => !data[s.id]).map((s) => s.id),
    reserva: Object.values(data).filter((c) => c.fuente === 'finnhub').map((c) => c.id),
  })
}
