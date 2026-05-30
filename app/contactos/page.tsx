import { supabase } from '@/lib/supabase'

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
const icpStyle: Record<string, { color: string; bg: string }> = {
  HOT: { color: 'var(--hot)', bg: 'var(--hot-bg)' },
  WARM: { color: 'var(--warm)', bg: 'var(--warm-bg)' },
  COLD: { color: 'var(--muted)', bg: 'var(--cold-bg)' },
}

export const revalidate = 60

export default async function ContactosPage() {
  const { data: contacts } = await supabase
    .from('contacts')
    .select('*, company:companies(name), deals(stage)')
    .order('icp_score')
    .order('created_at', { ascending: false })

  const all = contacts ?? []
  const withCompany = all.filter((c: any) => c.company_id).length
  const withoutCompany = all.length - withCompany

  return (
    <div style={{ padding: '32px 36px' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Contactos</h1>
        <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 6 }}>
          {all.length} contactos · {withCompany} con empresa · {withoutCompany} sin empresa
        </p>
      </div>

      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
        {/* Header */}
        <div style={{
          display: 'grid', gridTemplateColumns: '2fr 2fr 1fr 1fr 1fr 1fr',
          padding: '12px 22px', borderBottom: '1px solid var(--border)',
          fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: 600,
        }}>
          <div>Contacto</div><div>Empresa</div><div>Segmento</div><div>ICP</div><div>Fuente</div><div>Deals</div>
        </div>

        {all.map((contact: any, i: number) => {
          const icp = icpStyle[contact.icp_score]
          return (
            <div key={contact.id} style={{
              display: 'grid', gridTemplateColumns: '2fr 2fr 1fr 1fr 1fr 1fr',
              padding: '14px 22px',
              borderBottom: i < all.length - 1 ? '1px solid var(--border)' : 'none',
              alignItems: 'center',
            }}>
              {/* Contacto */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: icp.bg, border: `1px solid ${icp.color}33`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 700, color: icp.color, flexShrink: 0,
                }}>
                  {contact.first_name[0]}{contact.last_name[0]}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{contact.first_name} {contact.last_name}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)' }}>{roleLabel[contact.role] ?? contact.role} · {countryFlag[contact.country]}</div>
                </div>
              </div>

              {/* Empresa */}
              <div>
                {contact.company
                  ? <div style={{ fontSize: 13 }}>{contact.company.name}</div>
                  : <div style={{ fontSize: 12, color: 'var(--border)', fontStyle: 'italic' }}>Sin empresa en CRM</div>
                }
              </div>

              {/* Segmento */}
              <div>
                <span style={{
                  fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 6,
                  background: contact.segment === 'CONTADOR' ? 'rgba(124,92,252,0.15)' : 'rgba(82,196,26,0.1)',
                  color: contact.segment === 'CONTADOR' ? 'var(--accent)' : 'var(--won)',
                }}>{contact.segment}</span>
              </div>

              {/* ICP */}
              <div>
                <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 6, color: icp.color, background: icp.bg }}>
                  {contact.icp_score}
                </span>
              </div>

              {/* Fuente */}
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                {sourceLabel[contact.source] ?? contact.source}
              </div>

              {/* Deals */}
              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                {!contact.deals?.length
                  ? <span style={{ fontSize: 11, color: 'var(--border)' }}>—</span>
                  : contact.deals.map((d: any, di: number) => (
                    <span key={di} style={{
                      fontSize: 10, padding: '2px 7px', borderRadius: 5, fontWeight: 600,
                      background: d.stage === 'closed_won' ? 'var(--won-bg)' : d.stage === 'closed_lost' ? 'var(--hot-bg)' : 'var(--surface-2)',
                      color: d.stage === 'closed_won' ? 'var(--won)' : d.stage === 'closed_lost' ? 'var(--hot)' : 'var(--muted)',
                    }}>
                      {d.stage === 'closed_won' ? '✓' : d.stage === 'closed_lost' ? '✕' : '●'}
                    </span>
                  ))
                }
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
