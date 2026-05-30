'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const nav = [
  { href: '/', label: 'Dashboard', icon: '⬛' },
  { href: '/pipeline', label: 'Pipeline', icon: '◈' },
  { href: '/contactos', label: 'Contactos', icon: '◉' },
  { href: '/empresas', label: 'Empresas', icon: '▣' },
  { href: '/agente', label: 'Lead Agent IA', icon: '◆', highlight: true },
  { href: '/arquitectura', label: 'Arquitectura', icon: '⬡' },
]

export default function Sidebar() {
  const path = usePathname()

  return (
    <aside style={{
      width: 220,
      minHeight: '100vh',
      background: 'var(--surface)',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
    }}>
      {/* Logo */}
      <div style={{
        padding: '24px 20px 20px',
        borderBottom: '1px solid var(--border)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32,
            background: 'var(--accent)',
            borderRadius: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14, fontWeight: 700, color: '#fff',
          }}>A</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--foreground)' }}>Alegra CRM</div>
            <div style={{ fontSize: 11, color: 'var(--muted)' }}>Demo IA</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '12px 10px' }}>
        {nav.map(item => {
          const active = path === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '9px 12px',
                borderRadius: 8,
                marginBottom: 2,
                textDecoration: 'none',
                fontSize: 13.5,
                fontWeight: active ? 600 : 400,
                color: active ? '#fff' : item.highlight ? 'var(--accent)' : 'var(--muted)',
                background: active ? 'var(--accent)' : item.highlight && !active ? 'var(--accent-glow)' : 'transparent',
                transition: 'all 0.15s',
                border: item.highlight && !active ? '1px solid rgba(124,92,252,0.3)' : '1px solid transparent',
              }}
            >
              <span style={{ fontSize: 12 }}>{item.icon}</span>
              {item.label}
              {item.highlight && !active && (
                <span style={{
                  marginLeft: 'auto',
                  fontSize: 10,
                  background: 'var(--accent)',
                  color: '#fff',
                  borderRadius: 4,
                  padding: '1px 6px',
                  fontWeight: 700,
                }}>LIVE</span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div style={{
        padding: '16px 20px',
        borderTop: '1px solid var(--border)',
        fontSize: 11,
        color: 'var(--muted)',
      }}>
        <div>Powered by DeepSeek</div>
        <div style={{ marginTop: 2, color: 'var(--accent)', opacity: 0.8 }}>+ n8n · HubSpot · WhatsApp</div>
      </div>
    </aside>
  )
}
