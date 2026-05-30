'use client'
import { useEffect, useState } from 'react'

const countryFlag: Record<string, string> = { MX: '🇲🇽', CO: '🇨🇴', PE: '🇵🇪', AR: '🇦🇷' }
const sourceLabel: Record<string, string> = {
  webinar: 'Webinar', formulario_web: 'Formulario', referido: 'Referido',
  demo_solicitada: 'Demo solicitada', descarga_guia: 'Descarga guía',
  email_campaign: 'Email', google_ads: 'Google Ads',
}
const roleLabel: Record<string, string> = {
  dueno: 'Dueño/a', socio_director: 'Socio director', gerente_admin: 'Gerente admin',
  contador_externo: 'Contador externo', cfo: 'CFO', administradora: 'Administradora',
  fundador: 'Fundador/a', director_finanzas: 'Dir. Finanzas', socio: 'Socio',
}
const icpColor: Record<string, string> = { HOT: '#EF4444', WARM: '#B45309', COLD: '#9CA3AF' }
const icpBg: Record<string, string> = { HOT: 'rgba(239,68,68,0.08)', WARM: '#FFF8E7', COLD: '#F5F4FA' }

export default function ContactosPage() {
  const [contacts, setContacts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/db?type=contacts').then(r => r.json()).then(({ contacts }) => {
      setContacts(contacts ?? [])
      setLoading(false)
    })
  }, [])

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', flexDirection: 'column', gap: 12 }}>
      <div style={{ width: 32, height: 32, border: '3px solid #E5E7EB', borderTopColor: '#00C073', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <div style={{ color: '#9CA3AF', fontSize: 13 }}>Cargando contactos…</div>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )

  const withCompany = contacts.filter(c => c.company_id).length

  return (
    <div style={{ padding: '32px 36px' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: '#1A1A2E', margin: 0 }}>Contactos</h1>
        <p style={{ color: '#6B7280', fontSize: 13, marginTop: 6 }}>
          {contacts.length} contactos · {withCompany} con empresa · {contacts.length - withCompany} sin empresa
        </p>
      </div>
      <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,192,115,0.06)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1fr 1fr 1fr 1fr', padding: '12px 22px', borderBottom: '1px solid #E5E7EB', background: '#F5F4FA', fontSize: 11, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: 700 }}>
          <div>Contacto</div><div>Empresa</div><div>Segmento</div><div>ICP</div><div>Fuente</div><div>Deals</div>
        </div>
        {contacts.map((contact, i) => (
          <div key={contact.id} style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1fr 1fr 1fr 1fr', padding: '14px 22px', borderBottom: i < contacts.length - 1 ? '1px solid #E5E7EB' : 'none', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 34, height: 34, borderRadius: '50%', background: icpBg[contact.icp_score], border: `1px solid ${icpColor[contact.icp_score]}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: icpColor[contact.icp_score], flexShrink: 0 }}>
                {contact.first_name[0]}{contact.last_name[0]}
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#1A1A2E' }}>{contact.first_name} {contact.last_name}</div>
                <div style={{ fontSize: 11, color: '#9CA3AF' }}>{roleLabel[contact.role] ?? contact.role} · {countryFlag[contact.country]}</div>
              </div>
            </div>
            <div>
              {contact.company
                ? <div>
                    <div style={{ fontSize: 13, color: '#1A1A2E', fontWeight: 600 }}>{contact.company.name}</div>
                    <div style={{ fontSize: 11, color: '#9CA3AF' }}>{contact.company.clients ? `${contact.company.clients} clientes` : contact.company.employees ? `${contact.company.employees} empleados` : ''}</div>
                  </div>
                : <div style={{ fontSize: 12, color: '#9CA3AF', fontStyle: 'italic' }}>Sin empresa en CRM</div>
              }
            </div>
            <div>
              <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: contact.segment === 'CONTADOR' ? '#F0EDF8' : '#E8F8F0', color: contact.segment === 'CONTADOR' ? '#5C2D91' : '#00A363' }}>
                {contact.segment}
              </span>
            </div>
            <div>
              <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, color: icpColor[contact.icp_score], background: icpBg[contact.icp_score] }}>
                {contact.icp_score}
              </span>
            </div>
            <div style={{ fontSize: 12, color: '#6B7280' }}>{sourceLabel[contact.source] ?? contact.source}</div>
            <div style={{ display: 'flex', gap: 5 }}>
              {!contact.deals?.length
                ? <span style={{ fontSize: 11, color: '#E5E7EB' }}>—</span>
                : contact.deals.map((d: any, di: number) => (
                  <span key={di} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, fontWeight: 700, background: d.stage === 'closed_won' ? '#E8F8F0' : d.stage === 'closed_lost' ? 'rgba(239,68,68,0.08)' : '#F5F4FA', color: d.stage === 'closed_won' ? '#00A363' : d.stage === 'closed_lost' ? '#EF4444' : '#9CA3AF' }}>
                    {d.stage === 'closed_won' ? '✓' : d.stage === 'closed_lost' ? '✕' : '●'}
                  </span>
                ))
              }
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
