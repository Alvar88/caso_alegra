'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'

const icpColors: Record<string, string> = { HOT: '#EF4444', WARM: '#B45309', COLD: '#9CA3AF' }
const icpBg: Record<string, string> = { HOT: 'rgba(239,68,68,0.08)', WARM: '#FFF8E7', COLD: '#F5F4FA' }
const stageLabel: Record<string, string> = {
  discovery: 'Discovery', calificacion: 'Calificación', demo: 'Demo',
  trial: 'Trial', negociacion: 'Negociación', closed_won: 'Closed Won',
  closed_lost: 'Closed Lost', ramp: 'Ramp',
}

export default function Dashboard() {
  const [data, setData] = useState<any>(null)

  useEffect(() => {
    fetch('/api/db?type=dashboard').then(r => r.json()).then(setData)
  }, [])

  if (!data) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', flexDirection: 'column', gap: 12 }}>
      <div style={{ width: 32, height: 32, border: '3px solid #E5E7EB', borderTopColor: '#00C073', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <div style={{ color: '#9CA3AF', fontSize: 13 }}>Cargando datos…</div>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )

  const { deals = [], reps = [], totalContacts = 0, totalCompanies = 0 } = data
  const activeDeals = deals.filter((d: any) => !['closed_won', 'closed_lost'].includes(d.stage))
  const wonDeals = deals.filter((d: any) => d.stage === 'closed_won')
  const lostDeals = deals.filter((d: any) => d.stage === 'closed_lost')
  const totalMrr = wonDeals.reduce((s: number, d: any) => s + Number(d.mrr), 0)
  const pipelineValue = activeDeals.reduce((s: number, d: any) => s + Number(d.mrr), 0)
  const hotDeals = activeDeals.filter((d: any) => d.icp_score === 'HOT').length
  const warmDeals = activeDeals.filter((d: any) => d.icp_score === 'WARM').length
  const coldDeals = activeDeals.filter((d: any) => d.icp_score === 'COLD').length
  const withTime = deals.filter((d: any) => d.response_time_min)
  const avgResponse = withTime.length ? Math.round(withTime.reduce((s: number, d: any) => s + d.response_time_min, 0) / withTime.length) : 0
  const closeRate = wonDeals.length + lostDeals.length > 0 ? Math.round((wonDeals.length / (wonDeals.length + lostDeals.length)) * 100) : 0

  return (
    <div style={{ padding: '32px 36px', maxWidth: 1200 }}>
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>Alegra CRM · Demo en vivo</div>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: '#1A1A2E', margin: 0 }}>Dashboard Comercial</h1>
        <p style={{ color: '#6B7280', fontSize: 13, marginTop: 6 }}>
          {deals.length} deals · {totalContacts} contactos · {totalCompanies} empresas · 2 segmentos · 4 países
        </p>
      </div>

      {/* KPIs fila 1 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 16 }}>
        {[
          { label: 'MRR Cerrado', value: `$${totalMrr.toLocaleString()}`, sub: 'USD/mes activo', color: '#00A363' },
          { label: 'Pipeline Value', value: `$${pipelineValue.toLocaleString()}`, sub: `${activeDeals.length} deals activos`, color: '#5C2D91' },
          { label: 'Close Rate', value: `${closeRate}%`, sub: `${wonDeals.length} won · ${lostDeals.length} lost`, color: '#B45309' },
          { label: 'Resp. Promedio', value: `${avgResponse} min`, sub: 'Objetivo: < 5 min', color: avgResponse > 60 ? '#EF4444' : '#00A363' },
        ].map(kpi => (
          <div key={kpi.label} style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: '20px 22px', boxShadow: '0 2px 12px rgba(0,192,115,0.08)' }}>
            <div style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.8 }}>{kpi.label}</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: kpi.color, lineHeight: 1.1 }}>{kpi.value}</div>
            <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 6 }}>{kpi.sub}</div>
          </div>
        ))}
      </div>

      {/* KPIs fila 2 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
        {[
          { label: 'HOT Leads', value: hotDeals, sub: 'ICP confirmado', color: '#EF4444', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.2)' },
          { label: 'WARM Leads', value: warmDeals, sub: 'En evaluación', color: '#B45309', bg: '#FFF8E7', border: 'rgba(180,83,9,0.2)' },
          { label: 'COLD Leads', value: coldDeals, sub: 'Bajo potencial', color: '#9CA3AF', bg: '#F5F4FA', border: '#E5E7EB' },
          { label: 'Total Contactos', value: totalContacts, sub: `${totalCompanies} empresas`, color: '#1A1A2E', bg: '#fff', border: '#E5E7EB' },
        ].map(kpi => (
          <div key={kpi.label} style={{ background: kpi.bg, border: `1px solid ${kpi.border}`, borderRadius: 12, padding: '16px 22px', display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: kpi.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 800, color: kpi.color }}>{kpi.value}</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#1A1A2E' }}>{kpi.label}</div>
              <div style={{ fontSize: 11, color: '#9CA3AF' }}>{kpi.sub}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Actividad reciente */}
        <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,192,115,0.06)' }}>
          <div style={{ padding: '18px 22px', borderBottom: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 700, fontSize: 14, color: '#1A1A2E' }}>Actividad Reciente</span>
            <Link href="/pipeline" style={{ fontSize: 12, color: '#5C2D91', textDecoration: 'none', fontWeight: 600 }}>Ver pipeline →</Link>
          </div>
          {deals.slice(0, 6).map((deal: any, i: number) => (
            <div key={deal.id} style={{ padding: '14px 22px', borderBottom: i < 5 ? '1px solid #E5E7EB' : 'none', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0, background: icpColors[deal.icp_score] }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#1A1A2E', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {deal.contact?.first_name} {deal.contact?.last_name}
                </div>
                <div style={{ fontSize: 11, color: '#9CA3AF' }}>{stageLabel[deal.stage]} · {Number(deal.mrr) > 0 ? `$${Number(deal.mrr).toLocaleString()}/mes` : deal.loss_reason ?? '—'}</div>
              </div>
              <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, fontWeight: 700, color: icpColors[deal.icp_score], background: icpBg[deal.icp_score] }}>{deal.icp_score}</span>
            </div>
          ))}
        </div>

        {/* Equipo */}
        <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,192,115,0.06)' }}>
          <div style={{ padding: '18px 22px', borderBottom: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 700, fontSize: 14, color: '#1A1A2E' }}>Equipo Comercial</span>
            <span style={{ fontSize: 11, color: '#9CA3AF' }}>Capacity Score</span>
          </div>
          {reps.map((rep: any, i: number) => (
            <div key={rep.id} style={{ padding: '16px 22px', borderBottom: i < reps.length - 1 ? '1px solid #E5E7EB' : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                <div style={{ width: 38, height: 38, borderRadius: '50%', background: '#00C073', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: '#fff', flexShrink: 0 }}>{rep.avatar}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#1A1A2E' }}>{rep.name}</div>
                  <div style={{ fontSize: 11, color: '#9CA3AF' }}>{rep.specialization === 'mixed' ? 'Contadores + PyMEs' : rep.specialization} · {rep.active_deals} deals</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: rep.capacity_score >= 80 ? '#EF4444' : rep.capacity_score >= 60 ? '#B45309' : '#00A363' }}>{rep.capacity_score}%</div>
                  <div style={{ fontSize: 10, color: '#9CA3AF' }}>capacity</div>
                </div>
              </div>
              <div style={{ height: 5, borderRadius: 3, background: '#F5F4FA', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${rep.capacity_score}%`, borderRadius: 3, background: rep.capacity_score >= 80 ? '#EF4444' : rep.capacity_score >= 60 ? '#F59E0B' : '#00C073' }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginTop: 28, padding: '24px 28px', background: '#E8F8F0', border: '1px solid #A7F3D0', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontWeight: 800, fontSize: 16, color: '#1A1A2E', marginBottom: 4 }}>◆ Lead Intelligence Agent activo</div>
          <div style={{ fontSize: 13, color: '#6B7280' }}>Clasificación HOT/WARM/COLD · Routing automático · Primer mensaje generado por IA en tiempo real</div>
        </div>
        <Link href="/agente" style={{ padding: '12px 24px', background: '#00C073', color: '#fff', borderRadius: 8, textDecoration: 'none', fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap', flexShrink: 0, marginLeft: 24, boxShadow: '0 2px 8px rgba(0,192,115,0.3)' }}>
          Ver demo en vivo →
        </Link>
      </div>
    </div>
  )
}
