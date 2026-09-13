import { coleccion, importeValido, textoValido, diaValido } from '@/lib/coleccion'
import { TIPOS_RECIBO } from '@/lib/catalogo'

export const dynamic = 'force-dynamic'

interface Recibo {
  tipo: string
  nombre: string
  companyia: string | null
  importe: number
  dia: number
  periodicidad: 'mensual' | 'bimestral' | 'trimestral' | 'anual'
}

const PERIODOS = ['mensual', 'bimestral', 'trimestral', 'anual'] as const

const api = coleccion<Recibo>('recibos', 'dia', (body) => {
  if (typeof body !== 'object' || body === null) return { error: 'Body inválido' }
  const { tipo, companyia, importe, dia, periodicidad } = body as Record<string, unknown>

  const t = TIPOS_RECIBO.find((x) => x.id === tipo)
  if (!t) return { error: `Tipo inválido. Válidos: ${TIPOS_RECIBO.map((x) => x.id).join(', ')}` }

  const valor = importeValido(importe, 10_000)
  if (valor === null) return { error: 'Importe inválido (0 < importe <= 10000)' }

  const periodo = PERIODOS.find((p) => p === periodicidad) ?? 'mensual'

  return {
    valor: {
      tipo: t.id,
      nombre: t.nombre,
      companyia: textoValido(companyia, 60),
      importe: valor,
      dia: diaValido(dia) ?? 1,
      periodicidad: periodo,
    },
  }
})

export const GET = api.GET
export const POST = api.POST
