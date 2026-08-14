import { NextResponse } from 'next/server'
import * as simpleIcons from 'simple-icons'

// Los iconos se sirven desde el servidor: importar simple-icons en el cliente
// mete 3.400 marcas en el bundle para usar treinta.
export const revalidate = 31_536_000

type Icono = { path: string; hex: string; title: string }

// GET /api/logo/:slug — SVG monocromo de simple-icons, coloreado por query (?c=E50914)
export async function GET(_req: Request, { params }: { params: { slug: string } }) {
  const slug = params.slug.replace(/[^a-z0-9]/gi, '').toLowerCase()
  const clave = `si${slug.charAt(0).toUpperCase()}${slug.slice(1)}`
  const icono = (simpleIcons as unknown as Record<string, Icono>)[clave]

  if (!icono) return new NextResponse('No encontrado', { status: 404 })

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#${icono.hex}" role="img" aria-label="${icono.title}"><path d="${icono.path}"/></svg>`

  return new NextResponse(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  })
}
