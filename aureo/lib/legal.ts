/**
 * Datos del responsable y del servicio. Todo el texto legal sale de aqui:
 * cambia estos campos y se actualizan la politica, los terminos y el aviso.
 *
 * OJO: los marcados como PENDIENTE salen visiblemente resaltados en la web.
 * Una politica de privacidad sin responsable identificado no cumple el RGPD,
 * asi que no se inventan: se configuran con las variables NEXT_PUBLIC_LEGAL_*
 * del entorno de despliegue. No estan en el codigo porque el repositorio es publico.
 */
/** Dominio publico del servicio. Sin barra final. */
const SITIO = (process.env.NEXT_PUBLIC_SITIO ?? 'https://aureo-app-blush.vercel.app').replace(/\/$/, '')

export const LEGAL = {
  servicio: 'Aureo',
  // El dominio sale de NEXT_PUBLIC_SITIO para poder cambiarlo desde Vercel sin
  // tocar codigo: de el cuelgan el sitemap, robots, los enlaces canonicos y las
  // tarjetas Open Graph, asi que apuntar mal aqui los rompe todos a la vez.
  dominio: SITIO.replace(/^https?:\/\//, ''),
  url: SITIO,

  /** Nombre y apellidos, o razon social si lo pones a nombre de una sociedad. */
  responsable: process.env.NEXT_PUBLIC_LEGAL_RESPONSABLE || 'PENDIENTE',
  /** NIF o CIF del responsable. */
  nif: process.env.NEXT_PUBLIC_LEGAL_NIF || 'PENDIENTE',
  /** Domicilio a efectos de notificaciones. */
  direccion: process.env.NEXT_PUBLIC_LEGAL_DIRECCION || 'PENDIENTE',
  /** Correo de contacto y de ejercicio de derechos. */
  email: process.env.NEXT_PUBLIC_LEGAL_EMAIL || 'aureo.app@outlook.com',

  /** Ultima revision del texto legal. */
  actualizado: '2026-09-06',

  /** Encargados del tratamiento: quien toca los datos por cuenta del servicio. */
  proveedores: [
    { nombre: 'Supabase', uso: 'Base de datos y autenticación', ubicacion: 'Unión Europea (eu-west)', web: 'https://supabase.com/privacy' },
    { nombre: 'Vercel', uso: 'Alojamiento de la aplicación', ubicacion: 'EE. UU., con cláusulas contractuales tipo', web: 'https://vercel.com/legal/privacy-policy' },
    { nombre: 'Google', uso: 'Inicio de sesión con tu cuenta', ubicacion: 'EE. UU., con cláusulas contractuales tipo', web: 'https://policies.google.com/privacy' },
  ],
} as const

export const faltaPorRellenar = (valor: string) => valor === 'PENDIENTE'
