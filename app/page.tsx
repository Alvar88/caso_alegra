import { supabase } from '@/lib/supabase'
import Link from 'next/link'

const icpColors: Record<string, string> = {
  HOT: 'var(--hot)', WARM: 'var(--warm)', COLD: 'var(--muted)',
}
const icpBg: Record<string, string> = {
  HOT: 'var(--hot-bg)', WARM: 'var(--warm-bg)', COLD: 'var(--cold-bg)',
}
const stageLabel: Record<string, string> = {
  discovery: 'Discovery', calificacion: 'Calificación', demo: 'Demo',
  trial: 'Trial', negociacion: 'Negociación', closed_won: 'Closed Won',
  closed_lost: 'Closed Lost', ramp: 'Ramp',
}

export const revalidate = 60

export default async function Dashboard() {
  const [dealsRes, repsRes, contactsRes, companiesRes] = await Promise.all([
    supabase.from('deals').select('*, contact:contacts(first_name, last_name)').order('updated_at', { ascending: false }),
    supabase.from('reps').select('*').order('capacity_score', { ascending: false }),
    supabase.from('contacts').select('id', { count: 'exact', head: true }),
    supabase.from('companies').select('id', { count: 'exact', head: true }),
  ])

  const deals = dealsRes.data ?? []
  const reps = repsRes.data ?? []
  const totalContacts = contactsRes.count ?? 0
  const totalCompanies = companiesRes.count ?? 0

  const activeDeals = deals.filter((d: any) => !['closed_won', 'closed_lost'].includes(d.stage))
  const wonDeals = deals.filter((d: any) => d.stage === 'closed_won')
  const lostDeals = deals.filter((d: any) => d.stage === 'closed_lost')
  const totalMrr = wonDeals.reduce((s: number, d: any) => s + Number(d.mrr), 0)
  const pipelineValue = activeDeals.reduce((s: number, d: any) => s + Number(d.mrr), 0)
  const hotDeals = activeDeals.filter((d: any) => d.icp_score === 'HOT').length
  const warmDeals = activeDeals.filter((d: any) => d.icp_score === 'WARM').length
  const coldDeals = activeDeals.filter((d: any) => d.icp_score === 'COLD').length
  const withTime = deals.filter((d: any) => d.response_time_min)
  const avgResponse = withTime.length
    ? Math.round(withTime.reduce((s: number, d: any) => s + d.response_time_min, 0) / withTime.length)
    : 0
  const closeRate = wonDeals.length + lostDeals.length > 0
    ? Math.round((wonDeals.length / (wonDeals.length + lostDeals.length)) * 100)
    : 0

  const recentDeals = deals.slice(0, 6)

  return (
    <div style={{ padding: '32px 36px', maxWidth: 1200 }}>
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>
          Alegra CRM · Demo en vivo · Supabase
        </div>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--foreground)', margin: 0 }}>
          Dashboard Comercial
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 6 }}>
          {deals.length} deals · {totalContacts} contactos · {totalCompanies} empresas · 2 segmentos · 4 países
        </p>
      </div>

      {/* KPIs fila 1 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 16 }}>
        {[
          { label: 'MRR Cerrado', value: `$${totalMrr.toLocaleString()}`, sub: 'USD/mes activo', color: 'var(--won)' },
          { label: 'Pipeline Value', value: `$${pipelineValue.toLocaleString()}`, sub: `${activeDeals.length} deals activos`, color: 'var(--accent)' },
          { label: 'Close Rate', value: `${closeRate}%`, sub: `${wonDeals.length} won · ${lostDeals.length} lost`, color: 'var(--warm)' },
          { label: 'Resp. Promedio', value: `${avgResponse} min`, sub: 'Objetivo: < 5 min', color: avgResponse > 60 ? 'var(--hot)' : 'var(--won)' },
        ].map(kpi => (
          <div key={kpi.label} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '20px 22px' }}>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.8 }}>{kpi.label}</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: kpi.color, lineHeight: 1.1 }}>{kpi.value}</div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 6 }}>{kpi.sub}</div>
          </div>
        ))}
      </div>

      {/* KPIs fila 2 — ICP */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
        {[
          { label: 'HOT Leads', value: hotDeals, sub: 'ICP confirmado', color: 'var(--hot)', bg: 'var(--hot-bg)' },
          { label: 'WARM Leads', value: warmDeals, sub: 'En evaluación', color: 'var(--warm)', bg: 'var(--warm-bg)' },
          { label: 'COLD Leads', value: coldDeals, sub: 'Bajo potencial', color: 'var(--muted)', bg: 'var(--surface)' },
          { label: 'Total Contactos', value: totalContacts, sub: `${totalCompanies} empresas`, color: 'var(--foreground)', bg: 'var(--surface)' },
        ].map(kpi => (
          <div key={kpi.label} style={{
            background: kpi.bg,
            border: `1px solid ${kpi.color === 'var(--hot)' || kpi.color === 'var(--warm)' ? kpi.color + '33' : 'var(--border)'}`,
            borderRadius: 12, padding: '16px 22px',
            display: 'flex', alignItems: 'center', gap: 16,
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: kpi.color + '22',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 20, fontWeight: 800, color: kpi.color,
            }}>{kpi.value}</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{kpi.label}</div>
              <div style={{ fontSize: 11, color: 'var(--muted)' }}>{kpi.sub}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Actividad reciente */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 600, fontSize: 14 }}>Actividad Reciente</span>
            <Link href="/pipeline" style={{ fontSize: 12, color: 'var(--accent)', textDecoration: 'none' }}>Ver pipeline →</Link>
          </div>
          {recentDeals.map((deal: any, i: number) => (
            <div key={deal.id} style={{
              padding: '14px 22px',
              borderBottom: i < recentDeals.length - 1 ? '1px solid var(--border)' : 'none',
              display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0, background: icpColors[deal.icp_score] }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {deal.contact?.first_name} {deal.contact?.last_name}
                </div>
                <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                  {stageLabel[deal.stage]} · {Number(deal.mrr) > 0 ? `$${deal.mrr}/mes` : deal.loss_reason ?? '—'}
                </div>
              </div>
              <div style={{
                fontSize: 11, padding: '3px 8px', borderRadius: 6, fontWeight: 600,
                color: icpColors[deal.icp_score], background: icpBg[deal.icp_score],
              }}>{deal.icp_score}</div>
            </div>
          ))}
        </div>

        {/* Equipo */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 600, fontSize: 14 }}>Equipo Comercial</span>
            <span style={{ fontSize: 11, color: 'var(--muted)' }}>Capacity Score</span>
          </div>
          {reps.map((rep: any, i: number) => (
            <div key={rep.id} style={{ padding: '16px 22px', borderBottom: i < reps.length - 1 ? '1px solid var(--border)' : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: '50%', background: 'var(--accent)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 700, color: '#fff', flexShrink: 0,
                }}>{rep.avatar}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{rep.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                    {rep.specialization === 'mixed' ? 'Contadores + PyMEs' : rep.specialization} · {rep.active_deals} deals
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{
                    fontSize: 16, fontWeight: 700,
                    color: rep.capacity_score >= 80 ? 'var(--hot)' : rep.capacity_score >= 60 ? 'var(--warm)' : 'var(--won)',
                  }}>{rep.capacity_score}%</div>
                  <div style={{ fontSize: 10, color: 'var(--muted)' }}>capacity</div>
                </div>
              </div>
              <div style={{ height: 4, borderRadius: 2, background: 'var(--border)', overflow: 'hidden' }}>
                <div style={{
                  height: '100%', width: `${rep.capacity_score}%`, borderRadius: 2,
                  background: rep.capacity_score >= 80 ? 'var(--hot)' : rep.capacity_score >= 60 ? 'var(--warm)' : 'var(--won)',
                }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Agente */}
      <div style={{
        marginTop: 28, padding: '24px 28px',
        background: 'var(--accent-glow)', border: '1px solid rgba(124,92,252,0.3)', borderRadius: 14,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>◆ Lead Intelligence Agent activo</div>
          <div style={{ fontSize: 13, color: 'var(--muted)' }}>
            Clasificación HOT/WARM/COLD · Routing automático · Primer mensaje generado por IA en tiempo real
          </div>
        </div>
        <Link href="/agente" style={{
          padding: '12px 24px', background: 'var(--accent)', color: '#fff',
          borderRadius: 10, textDecoration: 'none', fontSize: 13, fontWeight: 600,
          whiteSpace: 'nowrap', flexShrink: 0, marginLeft: 24,
        }}>Ver demo en vivo →</Link>
      </div>
    </div>
  )
}
