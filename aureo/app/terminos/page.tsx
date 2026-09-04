import type { Metadata } from 'next'
import { PaginaLegal, Dato } from '@/components/Legal'
import { LEGAL } from '@/lib/legal'

export const metadata: Metadata = {
  title: 'Términos y condiciones',
  description: 'Condiciones de uso de Aureo: qué es, qué no es y qué responsabilidad asume cada parte.',
  alternates: { canonical: '/terminos' },
}

export default function Terminos() {
  return (
    <PaginaLegal titulo="Términos y condiciones"
      subtitulo="Las reglas del servicio, en un idioma que se entiende.">

      <h2>1. Quién presta el servicio</h2>
      <p>
        {LEGAL.servicio} es un servicio prestado por <strong>{LEGAL.responsable}</strong>,
        NIF <Dato valor={LEGAL.nif} />, domicilio en <Dato valor={LEGAL.direccion} />,
        contacto <a href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a>.
      </p>

      <h2>2. Qué es Aureo</h2>
      <p>
        Una herramienta para llevar tus finanzas personales: registras tus cuentas, gastos,
        ingresos y deudas, y la aplicación calcula tu patrimonio, tu proyección y el avance
        hacia tu objetivo.
      </p>

      <h2>3. Qué no es Aureo</h2>
      <p>
        <strong>No es asesoramiento financiero, fiscal ni de inversión.</strong> Los cálculos,
        simulaciones y sugerencias son informativos y se basan en los datos que introduces tú y
        en supuestos simplificados. Las cotizaciones proceden de terceros, pueden llegar con
        retardo y no sirven para operar. Antes de tomar una decisión con tu dinero —pedir un
        préstamo, firmar una hipoteca o invertir— consulta con un profesional.
      </p>
      <p>
        Aureo tampoco es una entidad de pago ni un agregador bancario: no se conecta a tu banco
        ni mueve dinero.
      </p>

      <h2>4. Tu cuenta</h2>
      <ul>
        <li>Necesitas una cuenta de Google para entrar. Eres responsable de mantenerla segura.</li>
        <li>Debes ser mayor de edad.</li>
        <li>Los datos que introduces son tuyos y tú respondes de su exactitud.</li>
        <li>El token del Atajo de iPhone es personal: quien lo tenga puede registrar gastos en tu cuenta. Si lo compartes por error, genéralo de nuevo desde Ajustes.</li>
      </ul>

      <h2>5. Uso aceptable</h2>
      <p>
        No puedes intentar acceder a datos de otras cuentas, hacer ingeniería inversa del servicio,
        automatizar peticiones masivas ni usar Aureo para nada ilícito. Podemos limitar o cerrar
        cuentas que lo incumplan.
      </p>

      <h2>6. Disponibilidad</h2>
      <p>
        Hacemos lo razonable por mantener el servicio en pie, pero se ofrece «tal cual», sin
        garantía de disponibilidad ininterrumpida. Puede haber cortes por mantenimiento o por
        fallos de los proveedores de los que dependemos.
      </p>

      <h2>7. Responsabilidad</h2>
      <p>
        En la medida que permite la ley, no respondemos de decisiones económicas que tomes a
        partir de la información de la aplicación, ni de pérdidas derivadas de datos que hayas
        introducido con error. Nada de esto limita los derechos que te reconoce la normativa de
        consumo.
      </p>

      <h2>8. Cancelación</h2>
      <p>
        Puedes dejar de usar Aureo cuando quieras y pedir la eliminación de tu cuenta y tus datos
        escribiendo a <a href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a>.
      </p>

      <h2>9. Ley aplicable</h2>
      <p>
        Se aplica la legislación española. Si eres consumidor, podrás acudir a los juzgados de tu
        domicilio.
      </p>
    </PaginaLegal>
  )
}
