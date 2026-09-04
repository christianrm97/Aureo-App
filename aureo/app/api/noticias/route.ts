import { NextResponse } from 'next/server'
import { comprobarLimite, LIMITES } from '@/lib/limite'

export const revalidate = 600 // 10 min: son titulares, no cotizaciones

/**
 * Fuentes por RSS oficial. No se reescribe ni se resume ningun titular: se
 * muestra el texto del medio, su hora de publicacion y el enlace al original.
 * Asi lo que lee el usuario es exactamente lo que publico el medio.
 */
const FUENTES = [
  { medio: 'Investing',    seccion: 'mercados', url: 'https://es.investing.com/rss/market_overview.rss' },
  { medio: 'Investing',    seccion: 'mercados', url: 'https://es.investing.com/rss/news.rss' },
  { medio: 'Investing',    seccion: 'bolsa',    url: 'https://es.investing.com/rss/stock_Indices.rss' },
  { medio: 'Expansión',    seccion: 'mercados', url: 'https://www.expansion.com/rss/mercados.xml' },
  { medio: 'Expansión',    seccion: 'ahorro',   url: 'https://www.expansion.com/rss/ahorro.xml' },
  { medio: 'Expansión',    seccion: 'economia', url: 'https://www.expansion.com/rss/economia.xml' },
  { medio: 'El País',      seccion: 'economia', url: 'https://feeds.elpais.com/mrss-s/pages/ep/site/elpais.com/section/economia/portada' },
  { medio: 'ABC',          seccion: 'economia', url: 'https://www.abc.es/rss/2.0/economia/' },
  { medio: 'elDiario.es',  seccion: 'economia', url: 'https://www.eldiario.es/rss/economia/' },
  { medio: '20minutos',    seccion: 'economia', url: 'https://www.20minutos.es/rss/economia/' },
  // elEconomista responde 403 a cualquier peticion de servidor (proteccion
  // antibot). Queda declarado: si abren el feed, entra sin tocar codigo.
  { medio: 'elEconomista', seccion: 'mercados', url: 'https://www.eleconomista.es/rss/rss-category.php?category=mercados' },
]

export interface Noticia {
  id: string
  titulo: string
  resumen: string
  url: string
  medio: string
  seccion: string
  fecha: number
}

const CABECERAS = {
  'User-Agent': 'Mozilla/5.0 (compatible; AureoBot/1.0; +https://aureo-app-blush.vercel.app)',
  Accept: 'application/rss+xml, application/xml;q=0.9, */*;q=0.8',
  'Accept-Language': 'es-ES,es;q=0.9',
}

const limpiar = (s: string) =>
  s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'")
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim()

/** Solo http(s): un feed es contenido de terceros, no se enlaza a ciegas. */
function urlSegura(valor: string): string | null {
  try {
    const u = new URL(valor)
    return u.protocol === 'http:' || u.protocol === 'https:' ? u.toString() : null
  } catch {
    return null
  }
}

const campo = (item: string, etiqueta: string) =>
  limpiar(item.match(new RegExp('<' + etiqueta + '[^>]*>([^]*?)</' + etiqueta + '>', 'i'))?.[1] ?? '')

function parsear(xml: string, medio: string, seccion: string): Noticia[] {
  const items = xml.match(/<item[\s>][\s\S]*?<\/item>/gi) ?? []
  const noticias: Noticia[] = []

  for (const item of items) {
    const titulo = campo(item, 'title')
    // Algunos feeds ponen el enlace en <link/> vacio con el href en <guid>
    const enlace = campo(item, 'link') || campo(item, 'guid')
    const url = urlSegura(enlace)
    if (!titulo || !url) continue

    const fechaTexto = campo(item, 'pubDate') || campo(item, 'dc:date')
    const fecha = Date.parse(fechaTexto)
    const resumen = campo(item, 'description')

    noticias.push({
      id: url,
      titulo: titulo.slice(0, 200),
      resumen: resumen.slice(0, 240),
      url,
      medio,
      seccion,
      fecha: Number.isNaN(fecha) ? Date.now() : fecha,
    })
  }
  return noticias
}

async function leerFuente(f: (typeof FUENTES)[number]): Promise<Noticia[]> {
  try {
    const res = await fetch(f.url, { headers: CABECERAS, next: { revalidate } })
    if (!res.ok) return []
    return parsear(await res.text(), f.medio, f.seccion)
  } catch {
    return []
  }
}

// GET /api/noticias?limit=60 — titulares financieros agregados
export async function GET(req: Request) {
  const frenado = comprobarLimite(req, "noticias", LIMITES.publica)
  if (frenado) return frenado

  const limite = Math.min(Number(new URL(req.url).searchParams.get('limit')) || 60, 120)
  const tandas = await Promise.all(FUENTES.map(leerFuente))

  const vistos = new Set<string>()
  const items = tandas
    .flat()
    .filter((n) => {
      const clave = n.titulo.toLowerCase().slice(0, 80)
      if (vistos.has(clave)) return false
      vistos.add(clave)
      return true
    })
    // Una noticia con fecha futura es un feed mal formado: no la colamos arriba
    .filter((n) => n.fecha <= Date.now() + 3_600_000)
    .sort((a, b) => b.fecha - a.fecha)
    .slice(0, limite)

  const medios = [...new Set(items.map((i) => i.medio))].sort()

  return NextResponse.json({
    ok: true,
    items,
    medios,
    // El cliente muestra cuando se leyeron los feeds: si la cache sirve algo
    // viejo, se ve.
    actualizado: Date.now(),
  })
}
