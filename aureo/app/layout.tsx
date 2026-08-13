import type { Viewport } from 'next'

export const metadata: Metadata = {
  title: 'Aureo — Tu patrimonio en vivo',
  description: 'Banco, inversión y gastos en un número que respira',
  manifest: '/manifest.json',
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
},
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Aureo',
  },
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
