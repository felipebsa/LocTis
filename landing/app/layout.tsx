import type { Metadata, Viewport } from 'next'
import './globals.css'

// Endereço público da landing (usado nas pré-visualizações de link). Em produção, defina NEXT_PUBLIC_SITE_URL.
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3001'
const TITLE = 'LocTis — Gestão inteligente para quem administra imóveis'
const DESCRIPTION = 'Organize imóveis, clientes, contratos, serviços e finanças em um único lugar.'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: TITLE,
  description: DESCRIPTION,
  icons: { icon: '/icon.svg', apple: '/apple-icon.png' },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    siteName: 'LocTis',
    locale: 'pt_BR',
    type: 'website',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: 'LocTis' }],
  },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION, images: ['/og-image.jpg'] },
}

export const viewport: Viewport = { themeColor: '#080a18', colorScheme: 'dark' }

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pt-BR"><body>{children}</body></html>
}
