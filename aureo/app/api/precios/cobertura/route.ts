import { NextResponse } from 'next/server'
import { SIMBOLOS, FINNHUB, desdeFinnhub } from '@/lib/mercados'

/**
 * GET /api/precios/cobertura — que activos puede servir la reserva de Finnhub
 * con la clave configurada.
 *
 * No devuelve la clave ni precios, y no gasta cuota con cada visita: el
 * resultado se recalcula como mucho una vez por hora para todos.
 */
export const revalidate = 3600

export async function GET() {
  const clave = process.env.FINNHUB_API_KEY
  if (!clave) return NextResponse.json({ ok: true, configurada: false, activos: [] })

  const activos = await Promise.all(
    SIMBOLOS.map(async (s) => {
      const destino = FINNHUB[s.id]
      if (!destino) return { id: s.id, symbol: null, disponible: false, estado: 0 }
      try {
        const res = await fetch(`https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(destino.symbol)}`, {
          headers: { 'X-Finnhub-Token': clave },
          next: { revalidate },
        })
        const cotizacion = res.ok ? desdeFinnhub(s, await res.json()) : null
        return { id: s.id, symbol: destino.symbol, disponible: Boolean(cotizacion), estado: res.status }
      } catch {
        return { id: s.id, symbol: destino.symbol, disponible: false, estado: 0 }
      }
    }),
  )

  return NextResponse.json({
    ok: true,
    configurada: true,
    cubiertos: activos.filter((a) => a.disponible).length,
    total: activos.length,
    activos,
    comprobado: new Date().toISOString(),
  })
}
