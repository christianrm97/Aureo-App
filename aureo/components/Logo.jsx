'use client'

import { useState } from 'react'

/**
 * Logo de marca. Las que estan en simple-icons se sirven desde /api/logo;
 * el resto (Disney+, Amazon, Microsoft, Adobe, electricas espanolas) caen a
 * monograma sobre el color corporativo.
 */
export default function Logo({ plataforma, size = 44 }) {
  const [falla, setFalla] = useState(false)
  const { icono, color, nombre } = plataforma
  const usaImagen = Boolean(icono) && !falla

  return (
    <div
      className="rounded-full grid place-items-center flex-shrink-0 overflow-hidden"
      style={{ width: size, height: size, background: `${color}1A` }}
    >
      {usaImagen ? (
        <img
          src={`/api/logo/${icono}`}
          alt=""
          width={size * 0.5}
          height={size * 0.5}
          style={{ width: size * 0.5, height: size * 0.5 }}
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
