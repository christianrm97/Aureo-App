import { coleccion } from '@/lib/coleccion'

export const dynamic = 'force-dynamic'

// DELETE /api/proyectos/:id — el validador no se usa en el borrado
export const DELETE = coleccion('proyectos', 'id', () => ({ error: 'no aplica' })).DELETE
