import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { CombinedProvider } from '@/contexts/CombinedProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Voto na Hora - Sistema de Gestão Eleitoral',
  description: 'Sistema completo para gestão de eleições em tempo real',
  keywords: ['eleições', 'gestão', 'votos', 'portugal', 'sistema eleitoral'],
  authors: [{ name: 'Voto na Hora Team' }],
  viewport: 'width=device-width, initial-scale=1',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt" suppressHydrationWarning>
      <body className={inter.className}>
        <CombinedProvider>
          {children}
        </CombinedProvider>
      </body>
    </html>
  )
}