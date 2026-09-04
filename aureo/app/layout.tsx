import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import Cookies from '@/components/Cookies'
import { LEGAL } from '@/lib/legal'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' })

export const metadata: Metadata = {
  metadataBase: new URL(LEGAL.url),
  // Cada pagina pone su titulo y aqui se le anade la marca
  title: {
    default: 'Aureo — Tu dinero, claro',
    template: '%s · Aureo',
  },
  description:
    'Patrimonio en vivo, gastos, suscripciones, deuda y objetivo en un solo sitio. Simula préstamos e hipotecas antes de firmar.',
  applicationName: 'Aureo',
  keywords: ['finanzas personales', 'patrimonio', 'presupuesto', 'simulador hipoteca', 'ahorro'],
  authors: [{ name: LEGAL.responsable }],
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    locale: 'es_ES',
    siteName: 'Aureo',
    title: 'Aureo — Tu dinero, claro',
    description: 'Todo tu dinero en un número que entiendes.',
    url: LEGAL.url,
    images: [{ url: '/icono-512.png', width: 512, height: 512, alt: 'Aureo' }],
  },
  twitter: {
    card: 'summary',
    title: 'Aureo — Tu dinero, claro',
    description: 'Todo tu dinero en un número que entiendes.',
    images: ['/icono-512.png'],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Aureo',
  },
  formatDetection: { telephone: false },
}

export const viewport: Viewport = {
  themeColor: '#6C2BD9',
  width: 'device-width',
  initialScale: 1,
  // Sin maximumScale: bloquear el zoom impide ampliar a quien lo necesita
  viewportFit: 'cover',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={inter.variable}>
      <body className="antialiased">
        {children}
        <Cookies />
      </body>
    </html>
  )
}
