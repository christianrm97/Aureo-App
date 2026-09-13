import type { MetadataRoute } from 'next'
import { LEGAL } from '@/lib/legal'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Nada de esto tiene sentido en un buscador, y parte requiere sesion
      disallow: ['/api/', '/auth/', '/gracias'],
    },
    sitemap: `${LEGAL.url}/sitemap.xml`,
    host: LEGAL.url,
  }
}
