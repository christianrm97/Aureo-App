/** Contrato compartido entre las rutas de gastos y el Atajo de iPhone. */

export const CATEGORIAS = ['Bleap', 'Cuenta Pareja', 'Efectivo', 'Suscripcion', 'Recibo'] as const
export type Categoria = (typeof CATEGORIAS)[number]

export const IMPORTE_MAX = 100_000
export const NOTA_MAX = 120

export interface GastoNuevo {
  nota: string
  importe: number
  categoria: Categoria
}

/** 'Suscripción' y 'suscripcion' entran igual: el Atajo escribe con tildes. */
export function categoriaValida(valor: unknown): Categoria | null {
  if (typeof valor !== 'string') return null
  const buscado = valor.trim()
  // sensitivity 'base' ignora tildes y mayusculas: "Suscripción" == "Suscripcion"
  return CATEGORIAS.find((c) => c.localeCompare(buscado, 'es', { sensitivity: 'base' }) === 0) ?? null
}

/**
 * Valida el body de POST /api/gastos. El endpoint es público (lo llama el
 * navegador sin sesión), así que aquí no se confía en nada.
 */
export function validarGasto(body: unknown): { gasto: GastoNuevo } | { error: string } {
  if (typeof body !== 'object' || body === null) return { error: 'Body inválido' }
  const { nota, importe, categoria } = body as Record<string, unknown>

  const valor = typeof importe === 'string' ? Number(importe.replace(',', '.')) : importe
  if (typeof valor !== 'number' || !Number.isFinite(valor) || valor <= 0 || valor > IMPORTE_MAX) {
    return { error: `Importe inválido (0 < importe <= ${IMPORTE_MAX})` }
  }

  const cat = categoriaValida(categoria)
  if (!cat) return { error: `Categoría inválida. Válidas: ${CATEGORIAS.join(', ')}` }

  if (nota != null && typeof nota !== 'string') return { error: 'Nota inválida' }

  return {
    gasto: {
      nota: String(nota ?? '').trim().slice(0, NOTA_MAX),
      importe: Math.round(valor * 100) / 100,
      categoria: cat,
    },
  }
}
