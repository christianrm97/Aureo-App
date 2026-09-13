import { coleccion } from '@/lib/coleccion'

export const dynamic = 'force-dynamic'

// DELETE /api/ingresos/:id — el validador no se usa en el borrado
export const DELETE = coleccion('ingresos', 'id', () => ({ error: 'no aplica' })).DELETE
