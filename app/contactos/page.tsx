import { contacts } from '@/data/contacts'
import { companies } from '@/data/companies'
import { deals } from '@/data/deals'

const countryFlag: Record<string, string> = { MX: '🇲🇽', CO: '🇨🇴', PE: '🇵🇪', AR: '🇦🇷' }
const sourceLabel: Record<string, string> = {
  webinar: 'Webinar',
  formulario_web: 'Formulario web',
  referido: 'Referido',
  demo_solicitada: 'Demo solicitada',
  descarga_guia: 'Descarga guía',
  email_campaign: 'Email campaign',
  google_ads: 'Google Ads',
}
const roleLabel: Record<string, string> = {
  dueno: 'Dueño/a',
  socio_director: 'Socio director',
  gerente_admin: 'Gerente admin',
  contador_externo: 'Contador externo',
  cfo: 'CFO',
  administradora: 'Administradora',
  fundador: 'Fundador/a',
}
const icpStyle: Record<string, { color: string; bg: string }> = {
  HOT: { color: 'var(--hot)', bg: 'var(--hot-bg)' },
  WARM: { color: 'var(--warm)', bg: 'var(--warm-bg)' },
  COLD: { color: 'var(--muted)', bg: 'var(--cold-bg)' },
}

export default function ContactosPage() {
  return (
    <div style={{ padding: '32px 36px' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Contactos</h1>
        <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 6 }}>
          {contacts.length} contactos · {contacts.filter(c => c.companyId).length} con empresa · {contacts.filter(c => !c.companyId).length} sin empresa
        </p>
      </div>

      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 12,
        overflow: 'hidden',
      }}>
        {/* Table header */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '2fr 2fr 1fr 1fr 1fr 1fr',
          padding: '12px 22px',
          borderBottom: '1px solid var(--border)',
          fontSize: 11,
          color: 'var(--muted)',
          textTransform: 'uppercase',
          letterSpacing: 0.8,
          fontWeight: 600,
        }}>
          <div>Contacto</div>
          <div>Empresa</div>
          <div>Segmento</div>
          <div>ICP</div>
          <div>Fuente</div>
          <div>Deals</div>
        </div>

        {contacts.map((contact, i) => {
          const company = contact.companyId ? companies.find(c => c.id === contact.companyId) : null
          const contactDeals = deals.filter(d => d.contactId === contact.id)
          const icp = icpStyle[contact.icpScore]

          return (
            <div key={contact.id} style={{
              display: 'grid',
              gridTemplateColumns: '2fr 2fr 1fr 1fr 1fr 1fr',
              padding: '14px 22px',
              borderBottom: i < contacts.length - 1 ? '1px solid var(--border)' : 'none',
              alignItems: 'center',
              transition: 'background 0.1s',
            }}>
              {/* Contact */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%',
                    background: contact.icpScore === 'HOT' ? 'var(--hot-bg)' : contact.icpScore === 'WARM' ? 'var(--warm-bg)' : 'var(--surface-2)',
                    border: `1px solid ${icp.color}33`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, fontWeight: 700, color: icp.color, flexShrink: 0,
                  }}>
                    {contact.firstName[0]}{contact.lastName[0]}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{contact.firstName} {contact.lastName}</div>
                    <div style={{ fontSize: 11, color: 'var(--muted)' }}>{roleLabel[contact.role]} · {countryFlag[contact.country]}</div>
                  </div>
                </div>
              </div>

              {/* Company */}
              <div>
                {company ? (
                  <div>
                    <div style={{ fontSize: 13, color: 'var(--foreground)' }}>{company.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                      {company.clients ? `${company.clients} clientes` : company.employees ? `${company.employees} empleados` : ''}
                    </div>
                  </div>
                ) : (
                  <div style={{ fontSize: 12, color: 'var(--border)', fontStyle: 'italic' }}>
                    Sin empresa en CRM
                  </div>
                )}
              </div>

              {/* Segment */}
              <div>
                <span style={{
                  fontSize: 11, fontWeight: 600,
                  padding: '3px 9px', borderRadius: 6,
                  background: contact.segment === 'CONTADOR' ? 'rgba(124,92,252,0.15)' : 'rgba(82,196,26,0.1)',
                  color: contact.segment === 'CONTADOR' ? 'var(--accent)' : 'var(--won)',
                }}>
                  {contact.segment}
                </span>
              </div>

              {/* ICP */}
              <div>
                <span style={{
                  fontSize: 11, fontWeight: 700,
                  padding: '3px 9px', borderRadius: 6,
                  color: icp.color, background: icp.bg,
                }}>{contact.icpScore}</span>
              </div>

              {/* Source */}
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                {sourceLabel[contact.source]}
              </div>

              {/* Deals */}
              <div style={{ display: 'flex', gap: 6 }}>
                {contactDeals.length === 0 ? (
                  <span style={{ fontSize: 11, color: 'var(--border)' }}>—</span>
                ) : (
                  contactDeals.map(d => (
                    <span key={d.id} style={{
                      fontSize: 10, padding: '2px 7px',
                      borderRadius: 5, fontWeight: 600,
                      background: d.stage === 'closed_won' ? 'var(--won-bg)' : d.stage === 'closed_lost' ? 'var(--hot-bg)' : 'var(--surface-2)',
                      color: d.stage === 'closed_won' ? 'var(--won)' : d.stage === 'closed_lost' ? 'var(--hot)' : 'var(--muted)',
                    }}>
                      {d.stage === 'closed_won' ? '✓' : d.stage === 'closed_lost' ? '✕' : '●'}
                    </span>
                  ))
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
