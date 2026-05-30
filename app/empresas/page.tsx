'use client'
import { useEffect, useState } from 'react'

const countryFlag: Record<string, string> = { MX: '🇲🇽', CO: '🇨🇴', PE: '🇵🇪', AR: '🇦🇷' }
const icpColor: Record<string, string> = { HOT: '#EF4444', WARM: '#B45309', COLD: '#9CA3AF' }

export default function EmpresasPage() {
  const [companies, setCompanies] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/db?type=companies').then(r => r.json()).then(({ companies }) => {
      setCompanies(companies ?? [])
      setLoading(false)
    })
  }, [])

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', flexDirection: 'column', gap: 12 }}>
      <div style={{ width: 32, height: 32, border: '3px solid #E5E7EB', borderTopColor: '#00C073', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <div style={{ color: '#9CA3AF', fontSize: 13 }}>Cargando empresas…</div>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )

  return (
    <div style={{ padding: '32px 36px' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: '#1A1A2E', margin: 0 }}>Empresas</h1>
        <p style={{ color: '#6B7280', fontSize: 13, marginTop: 6 }}>
          {companies.length} empresas · {companies.filter(c => c.segment === 'CONTADOR').length} despachos · {companies.filter(c => c.segment === 'PYME').length} PyMEs
        </p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
        {companies.map(company => {
          const contacts = company.contacts ?? []
          const allDeals = contacts.flatMap((c: any) => c.deals ?? [])
          const wonDeals = allDeals.filter((d: any) => d.stage === 'closed_won')
          const activeDeals = allDeals.filter((d: any) => !['closed_won', 'closed_lost'].includes(d.stage))
          const activeMrr = wonDeals.reduce((s: number, d: any) => s + Number(d.mrr), 0)
          const isContador = company.segment === 'CONTADOR'

          return (
            <div key={company.id} style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: '20px 22px', boxShadow: '0 2px 12px rgba(0,192,115,0.06)', borderTop: `3px solid ${isContador ? '#5C2D91' : '#00C073'}` }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 16 }}>
                <div style={{ width: 42, height: 42, borderRadius: 10, flexShrink: 0, background: isContador ? '#F0EDF8' : '#E8F8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
                  {isContador ? '⊞' : '◧'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 800, fontSize: 14, color: '#1A1A2E', marginBottom: 3 }}>{company.name}</div>
                  <div style={{ fontSize: 12, color: '#6B7280' }}>{countryFlag[company.country]} {company.industry}</div>
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, flexShrink: 0, background: isContador ? '#F0EDF8' : '#E8F8F0', color: isContador ? '#5C2D91' : '#00A363' }}>
                  {company.segment}
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 14 }}>
                {[
                  { label: isContador ? 'Clientes' : 'Empleados', value: company.clients ?? company.employees ?? '—' },
                  { label: 'Deals activos', value: activeDeals.length },
                  { label: 'MRR activo', value: activeMrr > 0 ? `$${activeMrr}` : '—' },
                ].map(stat => (
                  <div key={stat.label} style={{ background: '#F5F4FA', borderRadius: 8, padding: '10px 12px' }}>
                    <div style={{ fontSize: 17, fontWeight: 800, color: '#1A1A2E' }}>{stat.value}</div>
                    <div style={{ fontSize: 10, color: '#9CA3AF', marginTop: 2 }}>{stat.label}</div>
                  </div>
                ))}
              </div>
              {company.current_software && (
                <div style={{ fontSize: 12, color: '#6B7280', padding: '7px 12px', background: '#F5F4FA', borderRadius: 8, marginBottom: 12 }}>
                  <span style={{ color: '#9CA3AF' }}>Software actual: </span>{company.current_software}
                </div>
              )}
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {contacts.map((ct: any) => (
                  <div key={ct.id} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '3px 10px', background: '#F5F4FA', border: '1px solid #E5E7EB', borderRadius: 20, fontSize: 11 }}>
                    <div style={{ width: 16, height: 16, borderRadius: '50%', background: icpColor[ct.icp_score], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 800, color: '#fff' }}>{ct.first_name[0]}</div>
                    <span style={{ color: '#1A1A2E', fontWeight: 600 }}>{ct.first_name} {ct.last_name}</span>
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
