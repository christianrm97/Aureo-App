import { coleccion, importeValido, textoValido, diaValido } from '@/lib/coleccion'
import { TIPOS_DEUDA } from '@/lib/catalogo'

export const dynamic = 'force-dynamic'

interface Deuda {
  tipo: string
  nombre: string
  entidad: string | null
  pendiente: number
  cuota: number
  dia: number
  tae: number | null
  meses_restantes: number | null
}

const api = coleccion<Deuda>('deudas', 'dia', (body) => {
  if (typeof body !== 'object' || body === null) return { error: 'Body inválido' }
  const { tipo, nombre, entidad, pendiente, cuota, dia, tae } = body as Record<string, unknown>

  const t = TIPOS_DEUDA.find((x) => x.id === tipo)
  if (!t) return { error: `Tipo inválido. Válidos: ${TIPOS_DEUDA.map((x) => x.id).join(', ')}` }

  const saldo = importeValido(pendiente, 10_000_000)
  if (saldo === null) return { error: 'Pendiente inválido' }

  const mensual = importeValido(cuota, 100_000)
  if (mensual === null) return { error: 'Cuota inválida' }

  const interes = tae == null || tae === '' ? null : Number(tae)
  if (interes !== null && (!Number.isFinite(interes) || interes < 0 || interes > 100)) {
    return { error: 'TAE inválida (0-100)' }
  }

  // Sin intereses el calculo es exacto; con TAE es una estimacion que ya
  // sirve para ordenar deudas por urgencia.
  const meses = t.revolving ? null : Math.ceil(saldo / mensual)

  return {
    valor: {
      tipo: t.id,
      nombre: textoValido(nombre, 60) ?? t.nombre,
      entidad: textoValido(entidad, 60),
      pendiente: saldo,
      cuota: mensual,
      dia: diaValido(dia) ?? 1,
      tae: interes,
      meses_restantes: meses,
    },
  }
})

export const GET = api.GET
export const POST = api.POST
