import { coleccion } from '@/lib/coleccion'

export const dynamic = 'force-dynamic'

// DELETE /api/suscripciones/:id — el validador no se usa en el borrado
export const DELETE = coleccion('suscripciones', 'id', () => ({ error: 'no aplica' })).DELETE
