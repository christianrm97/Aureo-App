import { coleccion } from '@/lib/coleccion'

export const dynamic = 'force-dynamic'

// DELETE /api/recibos/:id — el validador no se usa en el borrado
export const DELETE = coleccion('recibos', 'id', () => ({ error: 'no aplica' })).DELETE
