import { coleccion, importeValido, textoValido } from '@/lib/coleccion'
import { TIPOS_PROYECTO } from '@/lib/catalogo'

export const dynamic = 'force-dynamic'

interface MovimientoProyecto {
  proyecto: string
  tipo: 'inversion' | 'ingreso'
  concepto: string
  importe: number
  ts: number
}

const api = coleccion<MovimientoProyecto>('proyectos', 'ts', (body) => {
  if (typeof body !== 'object' || body === null) return { error: 'Body inválido' }
  const { proyecto, tipo, concepto, importe } = body as Record<string, unknown>

  const p = TIPOS_PROYECTO.find((t) => t.id === proyecto)
  if (!p) return { error: `Proyecto inválido. Válidos: ${TIPOS_PROYECTO.map((t) => t.id).join(', ')}` }

  // Sin valor por defecto: confundir inversion con ingreso invierte el ROI.
  if (tipo !== 'inversion' && tipo !== 'ingreso') return { error: "tipo debe ser 'inversion' o 'ingreso'" }

  const valor = importeValido(importe, 1_000_000)
  if (valor === null) return { error: 'Importe inválido (0 < importe <= 1000000)' }

  return {
    valor: {
      proyecto: p.id,
      tipo,
      concepto: textoValido(concepto, 80) ?? p.nombre,
      importe: valor,
      ts: Date.now(),
    },
  }
})

export const GET = api.GET
export const POST = api.POST
