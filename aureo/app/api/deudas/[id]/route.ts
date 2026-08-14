import { coleccion } from '@/lib/coleccion'

export const dynamic = 'force-dynamic'

// DELETE /api/deudas/:id — el validador no se usa en el borrado
export const DELETE = coleccion('deudas', 'id', () => ({ error: 'no aplica' })).DELETE
