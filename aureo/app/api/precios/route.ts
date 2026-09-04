import { NextResponse } from 'next/server'
import { comprobarLimite, LIMITES } from '@/lib/limite'
import { SIMBOLOS, type Cotizacion } from '@/lib/mercados'

// 60 s de cache compartida: con mil usuarios mirando, Yahoo recibe una peticion
// por simbolo y minuto, no mil.
export const revalidate = 60

const CABECERAS = { 'User-Agent': 'Mozilla/5.0 (compatible; AureoBot/1.0)' }

async function cotizar(s: (typeof SIMBOLOS)[number]): Promise<Cotizacion | null> {
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
    }
  } catch {
    return null
  }
}

// GET /api/precios — indices, cripto, divisas y materias primas
export async function GET(req: Request) {
  const frenado = comprobarLimite(req, "precios", LIMITES.publica)
  if (frenado) return frenado

  const resultados = await Promise.all(SIMBOLOS.map(cotizar))

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
  })
}
