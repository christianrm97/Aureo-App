import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'Aureo — Tu patrimonio en vivo',
  description: 'Banco, inversión y gastos en un número que respira',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Aureo',
  },
}

export const viewport: Viewport = {
  themeColor: '#0a0a0f',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={inter.variable}>
      <body className="bg-aureo-bg text-aureo-text antialiased">
        {children}
      </body>
    </html>
  )
}
