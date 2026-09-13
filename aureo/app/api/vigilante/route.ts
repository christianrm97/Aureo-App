import { coleccion } from '@/lib/coleccion'

export const dynamic = 'force-dynamic'

interface InformeFila {
  desde: string
  hasta: string
  recurrente_mensual: number
  datos: unknown
  markdown: string
  ts: number
}

const FECHA = /^\d{4}-\d{2}-\d{2}$/
/** Un informe real ocupa unos pocos KB; esto frena a quien intente llenar la base. */
const MAX_MARKDOWN = 60_000
const MAX_DATOS = 200_000

const api = coleccion<InformeFila>('vigilante_informes', 'ts', (body) => {
  if (typeof body !== 'object' || body === null) return { error: 'Body inválido' }
  const { desde, hasta, recurrente_mensual, datos, markdown } = body as Record<string, unknown>

  if (typeof desde !== 'string' || !FECHA.test(desde) || typeof hasta !== 'string' || !FECHA.test(hasta)) {
    return { error: 'Fechas inválidas (AAAA-MM-DD)' }
  }

  const total = Number(recurrente_mensual)
  if (!Number.isFinite(total) || total < 0 || total > 10_000_000) return { error: 'Total mensual inválido' }

  if (typeof markdown !== 'string' || !markdown.trim() || markdown.length > MAX_MARKDOWN) {
    return { error: 'Informe inválido o demasiado grande' }
  }

  if (typeof datos !== 'object' || datos === null || JSON.stringify(datos).length > MAX_DATOS) {
    return { error: 'Datos del informe inválidos o demasiado grandes' }
  }

  return {
    valor: { desde, hasta, recurrente_mensual: Math.round(total * 100) / 100, datos, markdown, ts: Date.now() },
  }
})

export const GET = api.GET
export const POST = api.POST
