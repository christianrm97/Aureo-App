import { coleccion, textoValido } from '@/lib/coleccion'

export const dynamic = 'force-dynamic'

/**
 * Editar una cuenta es sobre todo actualizar el saldo, que es lo que cambia
 * cada semana. El resto de campos son opcionales.
 */
const api = coleccion<Record<string, unknown>>('cuentas', 'created_at', (body) => {
  if (typeof body !== 'object' || body === null) return { error: 'Body inválido' }
  const { nombre, subtitulo, saldo } = body as Record<string, unknown>
  const cambios: Record<string, unknown> = { updated_at: new Date().toISOString() }

  if (saldo !== undefined) {
    const cantidad = typeof saldo === 'string' ? Number(saldo.replace(',', '.')) : saldo
    if (typeof cantidad !== 'number' || !Number.isFinite(cantidad) || Math.abs(cantidad) > 100_000_000) {
      return { error: 'Saldo inválido' }
    }
    cambios.saldo = Math.round(cantidad * 100) / 100
  }
  if (nombre !== undefined) {
    const titulo = textoValido(nombre, 40)
    if (!titulo) return { error: 'Nombre inválido' }
    cambios.nombre = titulo
  }
  if (subtitulo !== undefined) cambios.subtitulo = textoValido(subtitulo, 60)

  if (Object.keys(cambios).length === 1) return { error: 'Nada que actualizar' }
  return { valor: cambios }
})

export const PATCH = api.PATCH
export const DELETE = api.DELETE
