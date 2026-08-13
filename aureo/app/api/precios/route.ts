import { NextRequest, NextResponse } from 'next/server'

// Cachear precios 60 segundos para no martillar las APIs
export const revalidate = 60

// GET /api/precios?tickers=CSPX,BTC-USD,ETH-USD
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const tickers = searchParams.get('tickers')?.split(',') ?? []

  const precios: Record<string, { precio: number; cambio: number; cambio_pct: number }> = {}

  await Promise.allSettled(
    tickers.map(async (ticker) => {
      try {
        // Cripto via CoinCap (gratis, sin auth)
        if (['BTC', 'ETH', 'SOL', 'BTC-USD', 'ETH-USD'].includes(ticker)) {
          const slug = ticker.replace('-USD', '').toLowerCase()
          const res = await fetch(`https://api.coincap.io/v2/assets/${slug}`, {
            next: { revalidate: 60 }
          })
          const json = await res.json()
          const p = parseFloat(json.data?.priceUsd ?? '0')
          const cambio = parseFloat(json.data?.changePercent24Hr ?? '0')
          precios[ticker] = { precio: p, cambio: (p * cambio) / 100, cambio_pct: cambio }
          return
        }

        // Fondos/ETF via Yahoo Finance (gratuito)
        const encoded = encodeURIComponent(ticker)
        const res = await fetch(
          `https://query1.finance.yahoo.com/v8/finance/chart/${encoded}?interval=1d&range=2d`,
          {
            headers: { 'User-Agent': 'Mozilla/5.0' },
            next: { revalidate: 60 }
          }
        )
        const json = await res.json()
        const meta = json?.chart?.result?.[0]?.meta
        if (meta) {
          const precio = meta.regularMarketPrice ?? 0
          const prev = meta.previousClose ?? precio
          const cambio = precio - prev
          precios[ticker] = {
            precio,
            cambio,
            cambio_pct: prev > 0 ? (cambio / prev) * 100 : 0,
          }
        }
      } catch (e) {
        console.warn(`No se pudo obtener precio de ${ticker}:`, e)
      }
    })
  )

  return NextResponse.json({ precios, timestamp: new Date().toISOString() })
}
