import { coleccion, importeValido, textoValido, diaValido } from '@/lib/coleccion'
import { TIPOS_DEUDA } from '@/lib/catalogo'
import { cuotaFrancesa } from '@/lib/simulador'

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
  const { tipo, nombre, entidad, pendiente, cuota, dia, tae, meses } = body as Record<string, unknown>

  const t = TIPOS_DEUDA.find((x) => x.id === tipo)
  if (!t) return { error: `Tipo inválido. Válidos: ${TIPOS_DEUDA.map((x) => x.id).join(', ')}` }

  const saldo = importeValido(pendiente, 10_000_000)
  if (saldo === null) return { error: 'Pendiente inválido' }

  const interes = tae == null || tae === '' ? null : Number(tae)
  if (interes !== null && (!Number.isFinite(interes) || interes < 0 || interes > 100)) {
    return { error: 'TAE inválida (0-100)' }
  }

  const plazo = meses == null || meses === '' ? null : Number(meses)
  if (plazo !== null && (!Number.isInteger(plazo) || plazo < 1 || plazo > 600)) {
    return { error: 'Plazo inválido (1-600 meses)' }
  }

  // Una hipoteca o un prestamo se dan por capital, tipo y plazo: la cuota sale
  // de ahi. Solo se pide a mano cuando no hay plazo (tarjetas, revolving).
  let mensual = importeValido(cuota, 100_000)
  if (mensual === null && plazo !== null) {
    mensual = cuotaFrancesa(saldo, interes ?? 0, plazo)
  }
  if (mensual === null) return { error: 'Indica la cuota, o el plazo para calcularla' }

  // Meses restantes: con interes se resuelve con el cuadro real, no dividiendo.
  let restantes: number | null = null
  if (!t.revolving) {
    if (plazo !== null) {
      restantes = plazo
    } else if (interes && interes > 0) {
      const i = interes / 100 / 12
      // Si la cuota no cubre ni los intereses, la deuda no se acaba nunca.
      restantes = mensual > saldo * i
        ? Math.ceil(-Math.log(1 - (saldo * i) / mensual) / Math.log(1 + i))
        : null
    } else {
      restantes = Math.ceil(saldo / mensual)
    }
  }

  return {
    valor: {
      tipo: t.id,
      nombre: textoValido(nombre, 60) ?? t.nombre,
      entidad: textoValido(entidad, 60),
      pendiente: saldo,
      cuota: mensual,
      dia: diaValido(dia) ?? 1,
      tae: interes,
      meses_restantes: restantes,
    },
  }
})

export const GET = api.GET
export const POST = api.POST
