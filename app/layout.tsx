import type { Metadata } from 'next'
import './globals.css'
import Sidebar from '@/components/Sidebar'

export const metadata: Metadata = {
  title: 'Alegra CRM — Demo Lead Intelligence Agent',
  description: 'Demo del sistema comercial IA para Alegra',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body style={{ margin: 0, display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--bg-page)' }}>
        <Sidebar />
        <main style={{ flex: 1, overflow: 'auto', height: '100vh' }}>
          {children}
        </main>
      </body>
    </html>
  )
}
