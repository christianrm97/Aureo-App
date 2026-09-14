# Aureo

**Tu dinero, claro.** Una app web para ver tu situación financiera entera en un solo sitio —patrimonio, gastos, recibos, suscripciones, deudas, proyectos y el objetivo que persigues— y saber, con cada gasto, cuánto te acerca o te aleja de él.

🔗 **[aureo-app-blush.vercel.app](https://aureo-app-blush.vercel.app)** · [Preguntas frecuentes](https://aureo-app-blush.vercel.app/faq)

---

## Qué hace

- **Patrimonio y objetivo en tiempo real.** Cada gasto recalcula la proyección y te dice si llegas a tu meta y cuándo.
- **Vigilante de gastos.** Sube el CSV de tu banco o tarjeta y detecta cargos recurrentes, suscripciones olvidadas, subidas de precio, cargos duplicados y todo lo que se sale de tu patrón. Calcula cuánto ahorrarías al año y compara cada extracto con el de la semana anterior. Exporta el informe como `vigilante-gastos.md`.
- **Fijos.** Suscripciones con los logos oficiales de cada plataforma y recibos domiciliados (luz, agua, internet, IBI…), con su periodicidad.
- **Deuda y simulador.** Préstamos, hipotecas, tarjetas y aplazados. Simulador de sistema francés con TAE, cuadro de amortización y comparativa de amortizar reduciendo plazo o reduciendo cuota.
- **Proyectos.** Presupuesto con tope mensual, inversión e ingresos por proyecto con su ROI y cuenta atrás a un checkpoint.
- **Mercados y noticias.** Índices, cripto, divisas y materias primas, y titulares de medios financieros españoles, con refresco automático.
- **iPhone.** Instalable en la pantalla de inicio y con un Atajo para registrar un gasto en dos toques sin abrir la app.
- **Tus datos son tuyos.** Descárgalos en JSON o elimina la cuenta con todo lo que contiene, desde la propia app.

## Privacidad

- **Sin conexión bancaria.** Aureo nunca pide las credenciales de tu banco.
- **El extracto no sale de tu dispositivo.** El CSV se analiza en el navegador; solo se guarda el informe resultante, y solo si lo pides.
- **Aislamiento por usuario en la base de datos.** Todas las tablas tienen Row Level Security: Postgres impide leer las filas de otro usuario aunque hubiera un fallo en el código de la app.
- **Sin publicidad** y sin ceder ni vender datos.

## Stack

Next.js 14 (App Router) · Supabase (Postgres, Auth con Google, RLS) · Tailwind CSS · Framer Motion · Recharts · Vercel

## Puesta en marcha

La aplicación vive en `aureo/`.

```bash
cd aureo
npm install
npm run dev
```

**Variables de entorno** (`aureo/.env.local`):

| Variable | Para qué |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto de Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clave pública; la seguridad la pone RLS |
| `SUPABASE_SERVICE_ROLE_KEY` | Solo en servidor: Atajo de iPhone y borrado de cuenta. **Nunca** con prefijo `NEXT_PUBLIC_` |
| `NEXT_PUBLIC_SITIO` | Opcional. Dominio público para el sitemap, canónicos y Open Graph |
| `NEXT_PUBLIC_LEGAL_RESPONSABLE` | Titular del servicio, para la política de privacidad y los términos |
| `NEXT_PUBLIC_LEGAL_NIF` | NIF o CIF del titular |
| `NEXT_PUBLIC_LEGAL_DIRECCION` | Domicilio a efectos de notificaciones |
| `NEXT_PUBLIC_LEGAL_EMAIL` | Opcional. Correo de contacto y de ejercicio de derechos |

**Base de datos.** En el SQL Editor de Supabase, en este orden:

1. `supabase-schema.sql`
2. `supabase-auth.sql`
3. `supabase-proyectos.sql`
4. `supabase-vigilante.sql`
5. `supabase-perfil-plan.sql`

Después, activa el proveedor **Google** en Authentication y añade `https://<tu-dominio>/auth/callback` a las Redirect URLs.

## Comprobaciones

La lógica de dinero tiene autocomprobaciones sin dependencias:

```bash
cd aureo
node --experimental-strip-types lib/finanzas.check.ts
node --experimental-strip-types lib/simulador.check.ts
node --experimental-strip-types lib/vigilante.check.ts
node --experimental-strip-types lib/perfil.check.ts
node --experimental-strip-types lib/mercados.check.ts
```

## Seguridad

¿Has encontrado una vulnerabilidad? Lee [SECURITY.md](SECURITY.md) y **no la publiques en un issue**.

## Licencia

[MIT](LICENSE).

## Aviso

Aureo es una herramienta de cálculo y seguimiento. No es asesoramiento financiero: los consejos y simulaciones son orientativos y las decisiones sobre tu dinero son siempre tuyas.
