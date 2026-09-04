import type { MetadataRoute } from 'next'
import { LEGAL } from '@/lib/legal'

/**
 * Solo entran las paginas publicas. El panel esta detras del login: indexarlo
 * seria enviar a Google a una redireccion.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = LEGAL.url
  const hoy = new Date(LEGAL.actualizado)

  return [
    { url: `${base}/`,           lastModified: hoy, changeFrequency: 'weekly',  priority: 1 },
    { url: `${base}/login`,      lastModified: hoy, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${base}/privacidad`, lastModified: hoy, changeFrequency: 'yearly',  priority: 0.4 },
    { url: `${base}/terminos`,   lastModified: hoy, changeFrequency: 'yearly',  priority: 0.4 },
    { url: `${base}/contacto`,   lastModified: hoy, changeFrequency: 'yearly',  priority: 0.5 },
  ]
}
