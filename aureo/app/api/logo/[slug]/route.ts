import { NextRequest, NextResponse } from 'next/server'
import * as simpleIcons from 'simple-icons'
import { PLATAFORMAS } from '@/lib/catalogo'

// Los logos se sirven desde el servidor por dos razones: importar simple-icons
// en el cliente mete 3.400 marcas en el bundle, y proxear el favicon evita que
// el navegador del usuario pida nada a terceros.
export const revalidate = 31_536_000

type Icono = { path: string; hex: string; title: string }

const cabeceras = (tipo: string) => ({
  'Content-Type': tipo,
  'Cache-Control': 'public, max-age=31536000, immutable',
})

/**
 * GET /api/logo/:slug
 *
 * 1. simple-icons (CC0, monocromo con el color de marca).
 * 2. Si la marca no esta ahi — Disney+, Amazon, Microsoft, Adobe, las
 *    electricas espanolas — cae al favicon oficial del dominio.
 * 3. Si tampoco hay favicon, 404 y el cliente pinta el monograma.
 */
export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  const slug = params.slug.toLowerCase().replace(/[^a-z0-9]/g, '')
  const clave = `si${slug.charAt(0).toUpperCase()}${slug.slice(1)}`
  const icono = (simpleIcons as unknown as Record<string, Icono>)[clave]

  if (icono) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#${icono.hex}" role="img" aria-label="${icono.title}"><path d="${icono.path}"/></svg>`
    return new NextResponse(svg, { headers: cabeceras('image/svg+xml') })
  }

  // El dominio sale del catalogo, nunca del query: no somos un proxy abierto.
  const desdeCatalogo = PLATAFORMAS.find((p) => p.id === slug)?.dominio
  const dominio = desdeCatalogo || DOMINIOS_EXTRA[slug]
  if (!dominio) return new NextResponse('No encontrado', { status: 404 })

  try {
    const res = await fetch(`https://www.google.com/s2/favicons?domain=${encodeURIComponent(dominio)}&sz=128`, {
      next: { revalidate: 31_536_000 },
    })
    if (!res.ok) return new NextResponse('No encontrado', { status: 404 })

    const buffer = await res.arrayBuffer()
    if (buffer.byteLength < 100) return new NextResponse('No encontrado', { status: 404 })

    return new NextResponse(buffer, { headers: cabeceras(res.headers.get('content-type') ?? 'image/png') })
  } catch {
    return new NextResponse('No encontrado', { status: 404 })
  }
}

/** Marcas de recibos y entidades que no estan en el catalogo de plataformas. */
const DOMINIOS_EXTRA: Record<string, string> = {
  iberdrola: 'iberdrola.es',
  endesa: 'endesa.com',
  naturgy: 'naturgy.es',
  repsol: 'repsol.es',
  totalenergies: 'totalenergies.es',
  holaluz: 'holaluz.com',
  movistar: 'movistar.es',
  vodafone: 'vodafone.es',
  orange: 'orange.es',
  yoigo: 'yoigo.com',
  digi: 'digimobil.es',
  pepephone: 'pepephone.com',
  lowi: 'lowi.es',
  o2: 'o2online.es',
  masmovil: 'masmovil.es',
  canaldeisabelii: 'canaldeisabelsegunda.es',
  aguasdevalencia: 'aguasdevalencia.es',
  mapfre: 'mapfre.es',
  mutua: 'mutua.es',
  axa: 'axa.es',
  allianz: 'allianz.es',
  santander: 'bancosantander.es',
  bbva: 'bbva.es',
  caixabank: 'caixabank.es',
  sabadell: 'bancsabadell.com',
  bankinter: 'bankinter.com',
  openbank: 'openbank.es',
  cajamar: 'cajamar.es',
  myinvestor: 'myinvestor.es',
  ing: 'ing.es',
  cetelem: 'cetelem.es',
  cofidis: 'cofidis.es',
  wizink: 'wizink.es',
}
