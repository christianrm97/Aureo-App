'use client'

import { useState } from 'react'

/** "Iberdrola Clientes" -> "iberdrolaclientes", para buscar dominio por marca. */
export const slugDe = (texto) => String(texto ?? '').toLowerCase().replace(/[^a-z0-9]/g, '')

/**
 * Logo de marca. La ruta /api/logo resuelve primero simple-icons y, si la marca
 * no esta ahi, el favicon oficial del dominio. Si tampoco hay nada, monograma
 * sobre el color corporativo.
 */
export default function Logo({ plataforma, size = 44 }) {
  const [falla, setFalla] = useState(false)
  const { icono, id, color, nombre } = plataforma
  const clave = icono || id
  const usaImagen = Boolean(clave) && !falla

  return (
    <div
      className="rounded-full grid place-items-center flex-shrink-0 overflow-hidden"
      style={{ width: size, height: size, background: `${color}1A` }}
    >
      {usaImagen ? (
        <img
          src={`/api/logo/${clave}`}
          alt=""
          width={size * 0.55}
          height={size * 0.55}
          style={{ width: size * 0.55, height: size * 0.55, objectFit: 'contain' }}
          onError={() => setFalla(true)}
        />
      ) : (
        <span className="font-bold leading-none" style={{ color, fontSize: size * 0.38 }}>
          {nombre.replace(/[^\p{L}\p{N}]/gu, '').slice(0, 2).toUpperCase()}
        </span>
      )}
    </div>
  )
}
