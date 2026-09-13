import { coleccion, importeValido, textoValido, diaValido } from '@/lib/coleccion'
import { TIPOS_INGRESO } from '@/lib/catalogo'

export const dynamic = 'force-dynamic'

interface Ingreso {
  categoria: string
  concepto: string
  importe: number
  tipo: 'recurrente' | 'puntual'
  dia: number
  ts: number
}

const api = coleccion<Ingreso>('ingresos', 'ts', (body) => {
  if (typeof body !== 'object' || body === null) return { error: 'Body inválido' }
  const { categoria, concepto, importe, tipo, dia } = body as Record<string, unknown>

  const cat = TIPOS_INGRESO.find((c) => c.id === categoria)
  if (!cat) return { error: `Categoría inválida. Válidas: ${TIPOS_INGRESO.map((c) => c.id).join(', ')}` }

  const valor = importeValido(importe, 1_000_000)
  if (valor === null) return { error: 'Importe inválido (0 < importe <= 1000000)' }

  // Recurrente cambia el ritmo mensual; puntual solo engorda el patrimonio una
  // vez. Confundirlos falsea la proyeccion, asi que no hay valor por defecto
  // silencioso: lo que no sea 'recurrente' es puntual.
  const recurrente = tipo === 'recurrente'

  return {
    valor: {
      categoria: cat.id,
      concepto: textoValido(concepto, 80) ?? cat.nombre,
      importe: valor,
      tipo: recurrente ? 'recurrente' : 'puntual',
      dia: diaValido(dia) ?? new Date().getDate(),
      ts: Date.now(),
    },
  }
})

export const GET = api.GET
export const POST = api.POST
