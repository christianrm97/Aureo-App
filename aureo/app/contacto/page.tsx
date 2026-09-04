import type { Metadata } from 'next'
import { PaginaLegal, Dato } from '@/components/Legal'
import { LEGAL } from '@/lib/legal'

export const metadata: Metadata = {
  title: 'Contacto',
  description: 'Cómo contactar con el equipo de Aureo para dudas, incidencias o ejercicio de derechos.',
  alternates: { canonical: '/contacto' },
}

export default function Contacto() {
  return (
    <PaginaLegal titulo="Contacto" subtitulo="Una persona lee todo lo que llega.">
      <h2>Escríbenos</h2>
      <p>
        Para dudas, incidencias o cualquier cosa relacionada con tus datos:
        <br />
        <a href={`mailto:${LEGAL.email}`} className="text-[18px] font-semibold">{LEGAL.email}</a>
      </p>
      <p>Respondemos en un plazo de 2 días laborables. Para peticiones sobre datos personales, el plazo legal es de un mes.</p>

      <h2>Datos del responsable</h2>
      <ul>
        <li><strong>Titular:</strong> {LEGAL.responsable}</li>
        <li><strong>NIF:</strong> <Dato valor={LEGAL.nif} /></li>
        <li><strong>Domicilio:</strong> <Dato valor={LEGAL.direccion} /></li>
        <li><strong>Sitio web:</strong> <a href={LEGAL.url}>{LEGAL.dominio}</a></li>
      </ul>

      <h2>Antes de escribir</h2>
      <ul>
        <li><strong>¿Aureo se conecta a mi banco?</strong> No. Los saldos y movimientos los introduces tú.</li>
        <li><strong>¿Puedo borrar mi cuenta?</strong> Sí, escríbenos y la eliminamos con todos tus datos.</li>
        <li><strong>¿Esto es asesoramiento financiero?</strong> No. Es una herramienta de cálculo; las decisiones son tuyas.</li>
      </ul>
    </PaginaLegal>
  )
}
