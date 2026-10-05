import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { AuthProvider } from '@/lib/auth'
import './globals.css'

export const metadata: Metadata = {
  title: 'LocTis · Gestão inteligente para locadores',
  description: 'Painel de gestão inteligente para propriedades, clientes, contratos e serviços.',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-dark-32x32.png',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  colorScheme: 'dark',
  themeColor: '#060817',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">
        <AuthProvider>{children}</AuthProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
