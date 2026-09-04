import { NextResponse } from 'next/server'

/**
 * Limitador de peticiones por IP. Ventana deslizante en memoria.
 *
 * ponytail: el contador vive en la instancia, asi que con varias instancias en
 * paralelo el limite real es N veces el configurado. Sirve para frenar bucles y
 * scripts tontos, que es el 99 % del abuso. Si algun dia hace falta un limite
 * exacto y compartido, esto se cambia por Upstash Redis sin tocar las rutas.
 */
type Registro = { golpes: number[]; }
const memoria = new Map<string, Registro>()

// Sin limpieza, un pico de trafico deja el mapa creciendo para siempre
const LIMPIEZA_MS = 600_000
let ultimaLimpieza = Date.now()

function limpiar(ahora: number) {
  if (ahora - ultimaLimpieza < LIMPIEZA_MS) return
  ultimaLimpieza = ahora
  for (const [clave, reg] of memoria) {
    if (!reg.golpes.some((t) => ahora - t < 3_600_000)) memoria.delete(clave)
  }
}

export function ipDe(req: Request): string {
  const h = req.headers
  // En Vercel la IP real viene en x-forwarded-for; el primero es el cliente
  return (
    h.get('x-real-ip') ??
    h.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    'desconocida'
  )
}

export interface Limite {
  /** Peticiones permitidas en la ventana. */
  max: number
  /** Tamano de la ventana en milisegundos. */
  ventanaMs: number
}

/**
 * Devuelve una respuesta 429 si se paso del limite, o `null` si puede seguir.
 * Se llama al principio de la ruta.
 */
export function comprobarLimite(req: Request, ambito: string, limite: Limite): NextResponse | null {
  const ahora = Date.now()
  limpiar(ahora)

  const clave = `${ambito}:${ipDe(req)}`
  const reg = memoria.get(clave) ?? { golpes: [] }
  const vigentes = reg.golpes.filter((t) => ahora - t < limite.ventanaMs)

  if (vigentes.length >= limite.max) {
    const masAntiguo = vigentes[0]
    const esperaS = Math.max(1, Math.ceil((limite.ventanaMs - (ahora - masAntiguo)) / 1000))
    memoria.set(clave, { golpes: vigentes })
    return NextResponse.json(
      { ok: false, error: 'Demasiadas peticiones. Prueba en unos segundos.' },
      { status: 429, headers: { 'Retry-After': String(esperaS) } },
    )
  }

  vigentes.push(ahora)
  memoria.set(clave, { golpes: vigentes })
  return null
}

/** Limites por tipo de ruta. */
export const LIMITES = {
  /** Escrituras del usuario: generoso, pero corta un bucle descontrolado. */
  escritura: { max: 60, ventanaMs: 60_000 },
  /** Atajo de iPhone: un gasto cada pocos segundos ya es mucho. */
  atajo: { max: 20, ventanaMs: 60_000 },
  /** Rutas publicas y caras (feeds, cotizaciones). */
  publica: { max: 120, ventanaMs: 60_000 },
} as const
