import { NextResponse } from 'next/server'

export const revalidate = 900 // 15 min: son titulares, no cotizaciones

const FUENTES = [
  { medio: 'Investing', url: 'https://es.investing.com/rss/market_overview.rss' },
  { medio: 'Investing', url: 'https://es.investing.com/rss/news.rss' },
  { medio: 'Expansión', url: 'https://www.expansion.com/rss/mercados.xml' },
  { medio: 'ABC Economía', url: 'https://www.abc.es/rss/2.0/economia/' },
  // elEconomista responde 403 a peticiones de servidor (proteccion antibot).
  // Se deja declarado: si algun dia abre el feed, entra sin tocar codigo.
  { medio: 'elEconomista', url: 'https://www.eleconomista.es/rss/rss-category.php?category=mercados' },
]

export interface Noticia {
  titulo: string
  url: string
  medio: string
  fecha: number
}

const CABECERAS = {
  'User-Agent': 'Mozilla/5.0 (compatible; AureoBot/1.0; +https://github.com/christianrm97/Aureo-App)',
  Accept: 'application/rss+xml, application/xml;q=0.9, */*;q=0.8',
  'Accept-Language': 'es-ES,es;q=0.9',
}

const limpiar = (s: string) =>
  s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/<[^>]*>/g, '')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'")
    .replace(/&amp;/g, '&')
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

function parsear(xml: string, medio: string): Noticia[] {
  const items = xml.match(/<item[\s>][\s\S]*?<\/item>/gi) ?? []
  const noticias: Noticia[] = []

  for (const item of items) {
    const titulo = limpiar(item.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? '')
    const enlace = limpiar(item.match(/<link[^>]*>([\s\S]*?)<\/link>/i)?.[1] ?? '')
    const fechaTexto = limpiar(item.match(/<pubDate[^>]*>([\s\S]*?)<\/pubDate>/i)?.[1] ?? '')
    const url = urlSegura(enlace)
    if (!titulo || !url) continue

    const fecha = Date.parse(fechaTexto)
    noticias.push({ titulo: titulo.slice(0, 180), url, medio, fecha: Number.isNaN(fecha) ? Date.now() : fecha })
  }
  return noticias
}

async function leerFuente(f: (typeof FUENTES)[number]): Promise<Noticia[]> {
  try {
    const res = await fetch(f.url, { headers: CABECERAS, next: { revalidate: 900 } })
    if (!res.ok) return []
    return parsear(await res.text(), f.medio)
  } catch {
    return []
  }
}

// GET /api/noticias — titulares financieros agregados de varios medios
export async function GET() {
  const tandas = await Promise.all(FUENTES.map(leerFuente))
  const vistos = new Set<string>()

  const items = tandas
    .flat()
    .filter((n) => {
      const clave = n.titulo.toLowerCase()
      if (vistos.has(clave)) return false
      vistos.add(clave)
      return true
    })
    .sort((a, b) => b.fecha - a.fecha)
    .slice(0, 24)

  return NextResponse.json({ ok: true, items, fuentes: [...new Set(items.map((i) => i.medio))] })
}
