import { coleccion, importeValido, textoValido } from '@/lib/coleccion'

export const dynamic = 'force-dynamic'

/** Catalogo de iconos que sabe pintar la app. */
const ICONOS_CUENTA = ['landmark', 'piggybank', 'creditcard', 'banknote', 'linechart', 'users', 'wallet'] as const

interface CuentaFila {
  slug: string
  nombre: string
  subtitulo: string | null
  saldo: number
  icon: string
  color: string
  bg: string
  hub: boolean
  inversion: boolean
}

const COLOR = /^#[0-9A-Fa-f]{6}$/

const api = coleccion<CuentaFila>('cuentas', 'created_at', (body) => {
  if (typeof body !== 'object' || body === null) return { error: 'Body inválido' }
  const { nombre, subtitulo, saldo, icon, color, bg, hub, inversion } = body as Record<string, unknown>

  const titulo = textoValido(nombre, 40)
  if (!titulo) return { error: 'El nombre es obligatorio (máx. 40 caracteres)' }

  // Un saldo puede ser 0 (cuenta recien abierta), asi que no vale importeValido
  const cantidad = typeof saldo === 'string' ? Number(saldo.replace(',', '.')) : saldo
  if (typeof cantidad !== 'number' || !Number.isFinite(cantidad) || Math.abs(cantidad) > 100_000_000) {
    return { error: 'Saldo inválido' }
  }

  const icono = typeof icon === 'string' && (ICONOS_CUENTA as readonly string[]).includes(icon) ? icon : 'landmark'
  const principal = typeof color === 'string' && COLOR.test(color) ? color : '#6C2BD9'
  const fondo = typeof bg === 'string' && COLOR.test(bg) ? bg : '#EFE7FB'

  return {
    valor: {
      slug: titulo.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 30) || 'cuenta',
      nombre: titulo,
      subtitulo: textoValido(subtitulo, 60),
      saldo: Math.round(cantidad * 100) / 100,
      icon: icono,
      color: principal,
      bg: fondo,
      hub: hub === true,
      inversion: inversion === true,
    },
  }
})

export const GET = api.GET
export const POST = api.POST
