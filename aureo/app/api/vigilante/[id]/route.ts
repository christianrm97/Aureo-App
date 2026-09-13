import { coleccion } from '@/lib/coleccion'

export const dynamic = 'force-dynamic'

// DELETE /api/vigilante/:id — el validador no se usa en el borrado
export const DELETE = coleccion('vigilante_informes', 'id', () => ({ error: 'no aplica' })).DELETE
