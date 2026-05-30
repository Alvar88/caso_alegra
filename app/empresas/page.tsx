import { supabase } from '@/lib/supabase'

const countryFlag: Record<string, string> = { MX: '🇲🇽', CO: '🇨🇴', PE: '🇵🇪', AR: '🇦🇷' }
const icpStyle: Record<string, { color: string; bg: string }> = {
  HOT: { color: 'var(--hot)', bg: 'var(--hot-bg)' },
  WARM: { color: 'var(--warm)', bg: 'var(--warm-bg)' },
  COLD: { color: 'var(--muted)', bg: 'var(--cold-bg)' },
}

export const revalidate = 60

export default async function EmpresasPage() {
  const { data: companies } = await supabase
    .from('companies')
    .select('*, contacts(id, first_name, last_name, icp_score, deals(stage, mrr))')
    .order('segment')
    .order('name')

  const all = companies ?? []

  return (
    <div style={{ padding: '32px 36px' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Empresas</h1>
        <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 6 }}>
          {all.length} empresas · {all.filter((c: any) => c.segment === 'CONTADOR').length} despachos · {all.filter((c: any) => c.segment === 'PYME').length} PyMEs
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
        {all.map((company: any) => {
          const contacts = company.contacts ?? []
          const allDeals = contacts.flatMap((c: any) => c.deals ?? [])
          const wonDeals = allDeals.filter((d: any) => d.stage === 'closed_won')
          const activeDeals = allDeals.filter((d: any) => !['closed_won', 'closed_lost'].includes(d.stage))
          const activeMrr = wonDeals.reduce((s: number, d: any) => s + Number(d.mrr), 0)

          return (
            <div key={company.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '20px 22px' }}>
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 16 }}>
                <div style={{
                  width: 42, height: 42, borderRadius: 10, flexShrink: 0,
                  background: company.segment === 'CONTADOR' ? 'rgba(124,92,252,0.15)' : 'rgba(82,196,26,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
                }}>
                  {company.segment === 'CONTADOR' ? '⊞' : '◧'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 3 }}>{company.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                    {countryFlag[company.country]} {company.industry}
                  </div>
                </div>
                <span style={{
                  fontSize: 11, fontWeight: 600, flexShrink: 0, padding: '3px 9px', borderRadius: 6,
                  background: company.segment === 'CONTADOR' ? 'rgba(124,92,252,0.15)' : 'rgba(82,196,26,0.1)',
                  color: company.segment === 'CONTADOR' ? 'var(--accent)' : 'var(--won)',
                }}>{company.segment}</span>
              </div>

              {/* Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 14 }}>
                {[
                  { label: company.segment === 'CONTADOR' ? 'Clientes' : 'Empleados', value: company.clients ?? company.employees ?? '—' },
                  { label: 'Deals activos', value: activeDeals.length },
                  { label: 'MRR activo', value: activeMrr > 0 ? `$${activeMrr}` : '—' },
                ].map(stat => (
                  <div key={stat.label} style={{ background: 'var(--surface-2)', borderRadius: 8, padding: '10px 12px' }}>
                    <div style={{ fontSize: 16, fontWeight: 700 }}>{stat.value}</div>
                    <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 2 }}>{stat.label}</div>
                  </div>
                ))}
              </div>

              {/* Software */}
              {company.current_software && (
                <div style={{ fontSize: 12, color: 'var(--muted)', padding: '8px 12px', background: 'var(--surface-2)', borderRadius: 8, marginBottom: 12 }}>
                  <span style={{ color: 'var(--border)' }}>Software: </span>{company.current_software}
                </div>
              )}

              {/* Contactos */}
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {contacts.map((ct: any) => {
                  const icp = icpStyle[ct.icp_score]
                  return (
                    <div key={ct.id} style={{
                      display: 'flex', alignItems: 'center', gap: 5,
                      padding: '3px 9px', background: 'var(--surface-2)',
                      border: '1px solid var(--border)', borderRadius: 20, fontSize: 11,
                    }}>
                      <div style={{
                        width: 16, height: 16, borderRadius: '50%',
                        background: icp.color, display: 'flex', alignItems: 'center',
                        justifyContent: 'center', fontSize: 8, fontWeight: 700, color: '#000',
                      }}>{ct.first_name[0]}</div>
                      <span>{ct.first_name} {ct.last_name}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
