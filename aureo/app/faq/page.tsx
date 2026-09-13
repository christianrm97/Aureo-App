import type { Metadata } from 'next'
import Link from 'next/link'
import { PaginaLegal } from '@/components/Legal'
import { LEGAL } from '@/lib/legal'

export const metadata: Metadata = {
  title: 'Preguntas frecuentes',
  description: 'Todo lo que conviene saber antes de usar Aureo: privacidad, bancos, extractos CSV, iPhone, exportar y borrar tus datos.',
  alternates: { canonical: '/faq' },
}

/**
 * Las respuestas viven en un array para pintar la pagina y el JSON-LD de
 * FAQPage desde la misma fuente: si divergen, Google lo penaliza.
 */
const PREGUNTAS: { p: string; r: string }[] = [
  {
    p: '¿Qué es Aureo?',
    r: 'Una app para ver tu dinero entero en un sitio: patrimonio, gastos, recibos, suscripciones, deudas y el objetivo que persigues. Cada gasto que apuntas recalcula en el momento cuánto te acerca o te aleja de tu meta.',
  },
  {
    p: '¿Cuánto cuesta?',
    r: 'Nada. Aureo no tiene planes de pago ni publicidad.',
  },
  {
    p: '¿Aureo se conecta a mi banco?',
    r: 'No. Nunca te pediremos las claves de tu banco. Tus saldos y movimientos los introduces tú, o los importas desde el CSV que exporta tu banco.',
  },
  {
    p: '¿Mis extractos bancarios se suben a algún servidor?',
    r: 'No. El Vigilante de gastos lee el CSV directamente en tu navegador. Lo único que se guarda en tu cuenta es el informe resultante (comercios, importes y conclusiones), para poder compararlo con el de la semana siguiente.',
  },
  {
    p: '¿Qué hace el Vigilante de gastos?',
    r: 'Con cada extracto lista tus cargos recurrentes, marca las suscripciones que parecen olvidadas, detecta subidas de precio, señala cargos duplicados o fuera de lo habitual y calcula cuánto ahorrarías al año si quitas lo que sobra.',
  },
  {
    p: '¿Qué bancos son compatibles?',
    r: 'Cualquiera que exporte los movimientos en CSV, que son casi todos. Aureo detecta solo el separador y las columnas de fecha, concepto e importe, incluidos los formatos con debe y haber en columnas separadas.',
  },
  {
    p: '¿Quién puede ver mis datos?',
    r: 'Solo tú. Cada fila de la base de datos está ligada a tu usuario y la propia base de datos impide que otra cuenta la lea, aunque hubiera un fallo en el código de la app.',
  },
  {
    p: '¿Usáis mis datos para entrenar IA o para publicidad?',
    r: 'No. Tus datos se usan únicamente para darte el servicio. No se venden, no se ceden y no se usan para entrenar modelos.',
  },
  {
    p: '¿Puedo descargar o borrar mis datos?',
    r: 'Sí, cuando quieras y sin escribir a nadie. En Ajustes puedes descargar todos tus datos en un archivo JSON y eliminar tu cuenta con todo lo que contiene. El borrado es definitivo.',
  },
  {
    p: '¿Funciona en iPhone?',
    r: 'Sí. Desde Safari, pulsa Compartir y luego "Añadir a pantalla de inicio" y se abrirá a pantalla completa, como una app. Además puedes montar un Atajo para registrar un gasto en dos toques sin abrir Aureo: la guía está en Ajustes.',
  },
  {
    p: '¿Qué pasa si pierdo el móvil?',
    r: 'Nada se pierde. Tus datos no viven en el teléfono sino en tu cuenta: entra con Google desde cualquier dispositivo y lo tendrás todo. Si usabas el Atajo de iPhone, genera un token nuevo en Ajustes para invalidar el anterior.',
  },
  {
    p: '¿Aureo me da asesoramiento financiero?',
    r: 'No. Es una herramienta de cálculo y seguimiento. Los consejos y simulaciones son orientativos; las decisiones sobre tu dinero son siempre tuyas.',
  },
]

export default function Faq() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: PREGUNTAS.map(({ p, r }) => ({
      '@type': 'Question',
      name: p,
      acceptedAnswer: { '@type': 'Answer', text: r },
    })),
  }

  return (
    <PaginaLegal titulo="Preguntas frecuentes" subtitulo="Lo que conviene saber antes de empezar.">
      {/* Texto fijo del codigo, nunca del usuario. Aun asi se escapa '<': JSON.stringify
          no lo hace, y un '</script>' en una respuesta cerraria la etiqueta. */}
      <script type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />

      {PREGUNTAS.map(({ p, r }) => (
        <section key={p}>
          <h2>{p}</h2>
          <p>{r}</p>
        </section>
      ))}

      <h2>¿No encuentras tu pregunta?</h2>
      <p>
        Escríbenos a <a href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a> o consulta la{' '}
        <Link href="/privacidad">política de privacidad</Link>.
      </p>
    </PaginaLegal>
  )
}
