import type { MetadataRoute } from 'next'

/** Manifest PWA: permite instalar Aureo en la pantalla de inicio del movil. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Aureo — Tu dinero, claro',
    short_name: 'Aureo',
    description: 'Patrimonio, gastos, deuda y objetivo en un solo sitio.',
    start_url: '/',
    display: 'standalone',
    background_color: '#F4F1F7',
    theme_color: '#6C2BD9',
    lang: 'es-ES',
    orientation: 'portrait',
    icons: [
      { src: '/icono-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icono-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icono-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
