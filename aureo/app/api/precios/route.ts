import { NextResponse } from 'next/server'

export const revalidate = 60

const SIMBOLOS = [
  { id: 'sp500',    symbol: 'SPY',       nombre: 'S&P 500' },
  { id: 'sp500eur', symbol: 'CSPX.L',    nombre: 'S&P 500 EUR' },
  { id: 'eurusd',   symbol: 'EURUSD=X',  nombre: 'EUR / USD' },
] as const

interface Precio {
  id: string
  symbol: string
  nombre: string
  currency: string
  price: number
  previous: number
  changePct: number
  marketState: string
}

async function leerYahoo(s: (typeof SIMBOLOS)[number]): Promise<Precio | null> {
  try {
    const res = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(s.symbol)}?interval=1d&range=5d`,
      { headers: { 'User-Agent': 'Mozilla/5.0' }, next: { revalidate: 60 } },
    )
    if (!res.ok) return null
    const json = await res.json()
    const meta = json?.chart?.result?.[0]?.meta
    const price = Number(meta?.regularMarketPrice)
    const previous = Number(meta?.chartPreviousClose ?? meta?.previousClose)
    if (!Number.isFinite(price) || !Number.isFinite(previous) || previous === 0) return null

    return {
      id: s.id,
      symbol: s.symbol,
      nombre: s.nombre,
      currency: meta?.currency ?? 'USD',
      price,
      previous,
      changePct: ((price - previous) / previous) * 100,
      marketState: meta?.marketState ?? 'UNKNOWN',
    }
  } catch {
    return null
  }
}

// GET /api/precios — cotizaciones en vivo (Yahoo Finance), cache 60s
export async function GET() {
  const resultados = await Promise.all(SIMBOLOS.map(leerYahoo))
  const data: Record<string, Precio> = {}
  for (const p of resultados) {
    if (p) data[p.id] = p
  }
  return NextResponse.json({ ok: true, data })
}
