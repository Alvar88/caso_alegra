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
      <body style={{ margin: 0, display: 'flex', minHeight: '100vh', background: 'var(--background)' }}>
        <Sidebar />
        <main style={{ flex: 1, overflow: 'auto', minHeight: '100vh' }}>
          {children}
        </main>
      </body>
    </html>
  )
}
