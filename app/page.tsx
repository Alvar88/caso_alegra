import { deals } from '@/data/deals'
import { contacts } from '@/data/contacts'
import { companies } from '@/data/companies'
import { reps } from '@/data/reps'
import Link from 'next/link'

function calcMetrics() {
  const activeDeals = deals.filter(d => !['closed_won', 'closed_lost'].includes(d.stage))
  const wonDeals = deals.filter(d => d.stage === 'closed_won')
  const lostDeals = deals.filter(d => d.stage === 'closed_lost')
  const totalMrr = wonDeals.reduce((s, d) => s + d.mrr, 0)
  const pipelineValue = activeDeals.reduce((s, d) => s + d.mrr, 0)
  const hotDeals = activeDeals.filter(d => d.icpScore === 'HOT')
  const warmDeals = activeDeals.filter(d => d.icpScore === 'WARM')
  const coldDeals = activeDeals.filter(d => d.icpScore === 'COLD')
  const avgResponseTime = Math.round(
    deals.filter(d => d.responseTimeMin).reduce((s, d) => s + (d.responseTimeMin ?? 0), 0) /
    deals.filter(d => d.responseTimeMin).length
  )
  const closeRate = Math.round((wonDeals.length / (wonDeals.length + lostDeals.length)) * 100)

  return {
    totalDeals: deals.length,
    activeDeals: activeDeals.length,
    wonDeals: wonDeals.length,
    lostDeals: lostDeals.length,
    totalMrr,
    pipelineValue,
    hotDeals: hotDeals.length,
    warmDeals: warmDeals.length,
    coldDeals: coldDeals.length,
    avgResponseTime,
    closeRate,
    totalContacts: contacts.length,
    totalCompanies: companies.length,
  }
}

const stageLabel: Record<string, string> = {
  discovery: 'Discovery',
  calificacion: 'Calificación',
  demo: 'Demo',
  trial: 'Trial',
  negociacion: 'Negociación',
  closed_won: 'Closed Won',
  closed_lost: 'Closed Lost',
  ramp: 'Ramp',
}

const icpColors: Record<string, string> = {
  HOT: 'var(--hot)',
  WARM: 'var(--warm)',
  COLD: 'var(--muted)',
}

export default function Dashboard() {
  const m = calcMetrics()

  const recentDeals = [...deals]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 6)

  return (
    <div style={{ padding: '32px 36px', maxWidth: 1200 }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>
          Alegra CRM · Demo
        </div>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--foreground)', margin: 0 }}>
          Dashboard Comercial
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 6 }}>
          Pipeline activo · 20 deals · 2 segmentos · 4 países
        </p>
      </div>

      {/* KPI cards row 1 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 16 }}>
        {[
          { label: 'MRR Cerrado', value: `$${m.totalMrr.toLocaleString()}`, sub: 'USD/mes activo', color: 'var(--won)' },
          { label: 'Pipeline Value', value: `$${m.pipelineValue.toLocaleString()}`, sub: `${m.activeDeals} deals activos`, color: 'var(--accent)' },
          { label: 'Close Rate', value: `${m.closeRate}%`, sub: `${m.wonDeals} won · ${m.lostDeals} lost`, color: 'var(--warm)' },
          { label: 'Resp. Promedio', value: `${m.avgResponseTime} min`, sub: 'Objetivo: < 5 min', color: m.avgResponseTime > 60 ? 'var(--hot)' : 'var(--won)' },
        ].map(kpi => (
          <div key={kpi.label} style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 12,
            padding: '20px 22px',
          }}>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.8 }}>{kpi.label}</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: kpi.color, lineHeight: 1.1 }}>{kpi.value}</div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 6 }}>{kpi.sub}</div>
          </div>
        ))}
      </div>

      {/* KPI cards row 2 — ICP breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
        {[
          { label: 'HOT Leads', value: m.hotDeals, sub: 'ICP confirmado', color: 'var(--hot)', bg: 'var(--hot-bg)' },
          { label: 'WARM Leads', value: m.warmDeals, sub: 'En evaluación', color: 'var(--warm)', bg: 'var(--warm-bg)' },
          { label: 'COLD Leads', value: m.coldDeals, sub: 'Bajo potencial', color: 'var(--muted)', bg: 'transparent' },
          { label: 'Total Contactos', value: m.totalContacts, sub: `${m.totalCompanies} empresas`, color: 'var(--foreground)', bg: 'transparent' },
        ].map(kpi => (
          <div key={kpi.label} style={{
            background: kpi.bg || 'var(--surface)',
            border: `1px solid ${kpi.bg !== 'transparent' ? kpi.color + '33' : 'var(--border)'}`,
            borderRadius: 12,
            padding: '16px 22px',
            display: 'flex', alignItems: 'center', gap: 16,
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: kpi.color + '22',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 20, fontWeight: 800, color: kpi.color,
            }}>{kpi.value}</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--foreground)' }}>{kpi.label}</div>
              <div style={{ fontSize: 11, color: 'var(--muted)' }}>{kpi.sub}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Recent deals */}
        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 12,
          overflow: 'hidden',
        }}>
          <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 600, fontSize: 14 }}>Actividad Reciente</span>
            <Link href="/pipeline" style={{ fontSize: 12, color: 'var(--accent)', textDecoration: 'none' }}>Ver pipeline →</Link>
          </div>
          <div>
            {recentDeals.map((deal, i) => {
              const contact = contacts.find(c => c.id === deal.contactId)
              const rep = reps.find(r => r.id === deal.repId)
              return (
                <div key={deal.id} style={{
                  padding: '14px 22px',
                  borderBottom: i < recentDeals.length - 1 ? '1px solid var(--border)' : 'none',
                  display: 'flex', alignItems: 'center', gap: 12,
                }}>
                  <div style={{
                    width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                    background: icpColors[deal.icpScore],
                  }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--foreground)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {contact?.firstName} {contact?.lastName}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                      {stageLabel[deal.stage]} · {deal.mrr > 0 ? `$${deal.mrr}/mes` : deal.lossReason}
                    </div>
                  </div>
                  <div style={{
                    fontSize: 11,
                    padding: '3px 8px',
                    borderRadius: 6,
                    fontWeight: 600,
                    color: icpColors[deal.icpScore],
                    background: deal.icpScore === 'HOT' ? 'var(--hot-bg)' : deal.icpScore === 'WARM' ? 'var(--warm-bg)' : 'var(--cold-bg)',
                  }}>{deal.icpScore}</div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Reps */}
        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 12,
          overflow: 'hidden',
        }}>
          <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 600, fontSize: 14 }}>Equipo Comercial</span>
            <span style={{ fontSize: 11, color: 'var(--muted)' }}>Capacity Score</span>
          </div>
          <div>
            {reps.map((rep, i) => (
              <div key={rep.id} style={{
                padding: '16px 22px',
                borderBottom: i < reps.length - 1 ? '1px solid var(--border)' : 'none',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%',
                    background: 'var(--accent)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, fontWeight: 700, color: '#fff', flexShrink: 0,
                  }}>{rep.avatar}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{rep.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                      {rep.specialization === 'mixed' ? 'Contadores + PyMEs' : rep.specialization} · {rep.activeDeals} deals activos
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{
                      fontSize: 16, fontWeight: 700,
                      color: rep.capacityScore >= 80 ? 'var(--hot)' : rep.capacityScore >= 60 ? 'var(--warm)' : 'var(--won)',
                    }}>{rep.capacityScore}%</div>
                    <div style={{ fontSize: 10, color: 'var(--muted)' }}>capacity</div>
                  </div>
                </div>
                <div style={{
                  height: 4, borderRadius: 2,
                  background: 'var(--border)',
                  overflow: 'hidden',
                }}>
                  <div style={{
                    height: '100%',
                    width: `${rep.capacityScore}%`,
                    borderRadius: 2,
                    background: rep.capacityScore >= 80 ? 'var(--hot)' : rep.capacityScore >= 60 ? 'var(--warm)' : 'var(--won)',
                    transition: 'width 0.6s ease',
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA to agent */}
      <div style={{
        marginTop: 28,
        padding: '24px 28px',
        background: 'var(--accent-glow)',
        border: '1px solid rgba(124,92,252,0.3)',
        borderRadius: 14,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--foreground)', marginBottom: 4 }}>
            ◆ Lead Intelligence Agent activo
          </div>
          <div style={{ fontSize: 13, color: 'var(--muted)' }}>
            Clasificación HOT/WARM/COLD · Routing automático · Primer mensaje generado por IA en tiempo real
          </div>
        </div>
        <Link href="/agente" style={{
          padding: '12px 24px',
          background: 'var(--accent)',
          color: '#fff',
          borderRadius: 10,
          textDecoration: 'none',
          fontSize: 13,
          fontWeight: 600,
          whiteSpace: 'nowrap',
          flexShrink: 0,
          marginLeft: 24,
        }}>
          Ver demo en vivo →
        </Link>
      </div>
    </div>
  )
}
