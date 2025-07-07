import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Providers } from './providers'
import { Toaster } from '@/components/ui/toaster'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'OrdinalsBot Dashboard',
  description: 'A comprehensive dashboard for Bitcoin Ordinals and BRC-20 tokens',
  keywords: ['Bitcoin', 'Ordinals', 'BRC-20', 'Inscriptions', 'OrdinalsBot'],
  authors: [{ name: 'OrdinalsBot Team' }],
  robots: 'index, follow',
  openGraph: {
    title: 'OrdinalsBot Dashboard',
    description: 'A comprehensive dashboard for Bitcoin Ordinals and BRC-20 tokens',
    type: 'website',
    siteName: 'OrdinalsBot Dashboard',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'OrdinalsBot Dashboard',
    description: 'A comprehensive dashboard for Bitcoin Ordinals and BRC-20 tokens',
  },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/ordinalsbot_logo.png" />
      </head>
      <body className={`${inter.className} min-h-screen bg-background text-foreground antialiased`}>
        <ErrorBoundary>
          <Providers>
            {children}
            <Toaster />
          </Providers>
        </ErrorBoundary>
      </body>
    </html>
  )
}