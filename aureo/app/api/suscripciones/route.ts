import { coleccion, importeValido, textoValido, diaValido } from '@/lib/coleccion'
import { PLATAFORMAS } from '@/lib/catalogo'

export const dynamic = 'force-dynamic'

interface Suscripcion {
  plataforma: string
  nombre: string
  plan: string
  cuota: number
  dia: number
}

const api = coleccion<Suscripcion>('suscripciones', 'cuota', (body) => {
  if (typeof body !== 'object' || body === null) return { error: 'Body inválido' }
  const { plataforma, plan, cuota, dia } = body as Record<string, unknown>

  const p = PLATAFORMAS.find((x) => x.id === plataforma)
  if (!p) return { error: 'Plataforma desconocida' }

  const importe = importeValido(cuota, 1000)
  if (importe === null) return { error: 'Cuota inválida (0 < cuota <= 1000)' }

  const nombrePlan = textoValido(plan, 60) ?? p.planes[0].nombre

  return { valor: { plataforma: p.id, nombre: p.nombre, plan: nombrePlan, cuota: importe, dia: diaValido(dia) ?? 1 } }
})

export const GET = api.GET
export const POST = api.POST
