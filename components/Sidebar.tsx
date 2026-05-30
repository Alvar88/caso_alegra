'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const nav = [
  { href: '/',             label: 'Dashboard',    icon: '▦' },
  { href: '/contactos',    label: 'Contactos',    icon: '◉' },
  { href: '/empresas',     label: 'Empresas',     icon: '▣' },
  { href: '/pipeline',     label: 'Deals',        icon: '◈' },
  { href: '/agente',       label: 'Lead Agent IA', icon: '◆', highlight: true },
  { href: '/arquitectura', label: 'Arquitectura', icon: '⬡' },
]

export default function Sidebar() {
  const path = usePathname()

  return (
    <aside style={{
      width: 228,
      minHeight: '100vh',
      background: '#FFFFFF',
      borderRight: '1px solid #E5E7EB',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
    }}>
      {/* Logo */}
      <div style={{ padding: '22px 20px 18px', borderBottom: '1px solid #E5E7EB' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 34, height: 34, background: '#00C073', borderRadius: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16, fontWeight: 800, color: '#fff',
            boxShadow: '0 2px 8px rgba(0,192,115,0.3)',
          }}>A</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 14, color: '#1A1A2E', letterSpacing: -0.3 }}>Alegra CRM</div>
            <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 1 }}>Demo IA · Live</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '14px 10px' }}>
        <div style={{ fontSize: 10, color: '#9CA3AF', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, padding: '0 10px', marginBottom: 8 }}>
          Menú
        </div>
        {nav.map(item => {
          const active = path === item.href
          return (
            <Link key={item.href} href={item.href} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '9px 12px', borderRadius: 8, marginBottom: 2,
              textDecoration: 'none', fontSize: 13.5,
              fontWeight: active ? 700 : 500,
              color: active ? '#FFFFFF' : item.highlight ? '#5C2D91' : '#6B7280',
              background: active ? '#00C073' : item.highlight && !active ? '#F0EDF8' : 'transparent',
              border: item.highlight && !active ? '1px solid #E0D4F5' : '1px solid transparent',
              transition: 'all 0.15s',
              boxShadow: active ? '0 2px 8px rgba(0,192,115,0.25)' : 'none',
            }}>
              <span style={{ fontSize: 12 }}>{item.icon}</span>
              {item.label}
              {item.highlight && !active && (
                <span style={{
                  marginLeft: 'auto', fontSize: 10,
                  background: '#00C073', color: '#fff',
                  borderRadius: 20, padding: '1px 7px', fontWeight: 700,
                }}>LIVE</span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div style={{ padding: '14px 20px', borderTop: '1px solid #E5E7EB' }}>
        <div style={{ background: '#E8F8F0', borderRadius: 8, padding: '10px 12px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#00A363', marginBottom: 3 }}>◆ DeepSeek API</div>
          <div style={{ fontSize: 10, color: '#6B7280', lineHeight: 1.4 }}>
            Conectado · n8n · Supabase<br />WhatsApp Business API
          </div>
        </div>
      </div>
    </aside>
  )
}
