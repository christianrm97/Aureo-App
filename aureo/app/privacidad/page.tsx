import type { Metadata } from 'next'
import { PaginaLegal, Dato } from '@/components/Legal'
import { LEGAL } from '@/lib/legal'

export const metadata: Metadata = {
  title: 'Política de privacidad',
  description: 'Qué datos trata Aureo, con qué base legal, cuánto los conserva y cómo ejercer tus derechos.',
  alternates: { canonical: '/privacidad' },
}

export default function Privacidad() {
  return (
    <PaginaLegal titulo="Política de privacidad"
      subtitulo="Qué datos tratamos, para qué y qué puedes exigirnos.">

      <h2>1. Quién es el responsable</h2>
      <p>
        El responsable del tratamiento es <strong>{LEGAL.responsable}</strong>, con NIF{' '}
        <Dato valor={LEGAL.nif} /> y domicilio en <Dato valor={LEGAL.direccion} />.
        Puedes escribirnos a <a href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a>.
      </p>

      <h2>2. Qué datos tratamos</h2>
      <ul>
        <li><strong>Identificación</strong>: nombre, correo electrónico y foto de perfil, que nos facilita Google al iniciar sesión.</li>
        <li><strong>Datos económicos que introduces tú</strong>: saldos de cuentas, gastos, ingresos, suscripciones, recibos, deudas y objetivos.</li>
        <li><strong>Datos técnicos</strong>: dirección IP y tipo de navegador en los registros del servidor, por seguridad.</li>
      </ul>
      <p>
        Aureo <strong>no se conecta a tu banco</strong>, no pide credenciales bancarias y no
        importa movimientos automáticamente. Todo dato económico lo escribes tú.
      </p>

      <h2>3. Para qué y con qué base legal</h2>
      <ul>
        <li><strong>Prestarte el servicio</strong> (calcular tu patrimonio, tu proyección y tus avisos): ejecución del contrato, artículo 6.1.b del RGPD.</li>
        <li><strong>Mantener la seguridad</strong> del servicio y evitar abusos: interés legítimo, artículo 6.1.f.</li>
        <li><strong>Medición de uso agregada y anónima</strong>: interés legítimo, sin perfilado ni publicidad.</li>
      </ul>
      <p>No usamos tus datos para publicidad, no los vendemos y no los cedemos a terceros para sus propios fines.</p>

      <h2>4. Quién los trata por nosotros</h2>
      <table>
        <thead><tr><th>Proveedor</th><th>Para qué</th><th>Dónde</th></tr></thead>
        <tbody>
          {LEGAL.proveedores.map((p) => (
            <tr key={p.nombre}>
              <td><a href={p.web} target="_blank" rel="noopener noreferrer">{p.nombre}</a></td>
              <td>{p.uso}</td>
              <td>{p.ubicacion}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p>
        Cuando un proveedor está fuera del Espacio Económico Europeo, la transferencia se ampara
        en las cláusulas contractuales tipo aprobadas por la Comisión Europea.
      </p>

      <h2>5. Cuánto tiempo los guardamos</h2>
      <p>
        Mientras tengas la cuenta activa. Si la eliminas, borramos tus datos económicos y tu perfil
        en un plazo máximo de 30 días, salvo los registros que debamos conservar por obligación legal.
      </p>

      <h2>6. Tus derechos</h2>
      <p>
        Puedes pedirnos acceso, rectificación, supresión, limitación, portabilidad y oposición
        escribiendo a <a href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a>. Te responderemos en un
        mes. Si crees que no hemos atendido bien tu petición, puedes reclamar ante la{' '}
        <a href="https://www.aepd.es" target="_blank" rel="noopener noreferrer">Agencia Española de Protección de Datos</a>.
      </p>

      <h2>7. Seguridad</h2>
      <p>
        Cada usuario está aislado a nivel de base de datos mediante políticas de seguridad por fila:
        aunque el servicio tuviera un fallo de programación, la base de datos no permite leer datos
        de otra cuenta. El tráfico va cifrado con TLS y las sesiones caducan automáticamente.
      </p>

      <h2>8. Cambios</h2>
      <p>
        Si cambiamos esta política te avisaremos en la propia aplicación antes de que sea efectiva.
      </p>
    </PaginaLegal>
  )
}
