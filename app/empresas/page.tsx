import { companies } from '@/data/companies'
import { contacts } from '@/data/contacts'
import { deals } from '@/data/deals'

const countryFlag: Record<string, string> = { MX: '🇲🇽', CO: '🇨🇴', PE: '🇵🇪', AR: '🇦🇷' }

export default function EmpresasPage() {
  return (
    <div style={{ padding: '32px 36px' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Empresas</h1>
        <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 6 }}>
          {companies.length} empresas · {companies.filter(c => c.segment === 'CONTADOR').length} despachos · {companies.filter(c => c.segment === 'PYME').length} PyMEs
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
        {companies.map(company => {
          const companyContacts = contacts.filter(c => c.companyId === company.id)
          const companyDeals = deals.filter(d =>
            companyContacts.some(ct => ct.id === d.contactId)
          )
          const wonDeals = companyDeals.filter(d => d.stage === 'closed_won')
          const activeMrr = wonDeals.reduce((s, d) => s + d.mrr, 0)
          const activeDeals = companyDeals.filter(d => !['closed_won', 'closed_lost'].includes(d.stage))

          return (
            <div key={company.id} style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 12,
              padding: '20px 22px',
            }}>
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 16 }}>
                <div style={{
                  width: 42, height: 42, borderRadius: 10, flexShrink: 0,
                  background: company.segment === 'CONTADOR' ? 'rgba(124,92,252,0.15)' : 'rgba(82,196,26,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 18,
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
                  fontSize: 11, fontWeight: 600, flexShrink: 0,
                  padding: '3px 9px', borderRadius: 6,
                  background: company.segment === 'CONTADOR' ? 'rgba(124,92,252,0.15)' : 'rgba(82,196,26,0.1)',
                  color: company.segment === 'CONTADOR' ? 'var(--accent)' : 'var(--won)',
                }}>
                  {company.segment}
                </span>
              </div>

              {/* Stats grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
                {[
                  {
                    label: company.segment === 'CONTADOR' ? 'Clientes' : 'Empleados',
                    value: company.clients ?? company.employees ?? '—',
                  },
                  { label: 'Deals activos', value: activeDeals.length },
                  { label: 'MRR activo', value: activeMrr > 0 ? `$${activeMrr}` : '—' },
                ].map(stat => (
                  <div key={stat.label} style={{
                    background: 'var(--surface-2)',
                    borderRadius: 8, padding: '10px 12px',
                  }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--foreground)' }}>{stat.value}</div>
                    <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 2 }}>{stat.label}</div>
                  </div>
                ))}
              </div>

              {/* Software actual */}
              {company.currentSoftware && (
                <div style={{
                  fontSize: 12, color: 'var(--muted)',
                  padding: '8px 12px',
                  background: 'var(--surface-2)',
                  borderRadius: 8,
                  marginBottom: 12,
                }}>
                  <span style={{ color: 'var(--border)' }}>Software actual: </span>
                  {company.currentSoftware}
                </div>
              )}

              {/* Contacts */}
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {companyContacts.map(ct => (
                  <div key={ct.id} style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '4px 10px',
                    background: 'var(--surface-2)',
                    border: '1px solid var(--border)',
                    borderRadius: 20,
                    fontSize: 11,
                  }}>
                    <div style={{
                      width: 18, height: 18, borderRadius: '50%',
                      background: ct.icpScore === 'HOT' ? 'var(--hot)' : ct.icpScore === 'WARM' ? 'var(--warm)' : 'var(--border)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 9, fontWeight: 700, color: '#000',
                    }}>
                      {ct.firstName[0]}
                    </div>
                    <span style={{ color: 'var(--foreground)' }}>{ct.firstName} {ct.lastName}</span>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
