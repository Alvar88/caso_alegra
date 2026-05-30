'use client'
import { useState } from 'react'

const stages = [
  { id: 'discovery', label: 'Discovery' },
  { id: 'calificacion', label: 'Calificación' },
  { id: 'demo', label: 'Demo' },
  { id: 'trial', label: 'Trial' },
  { id: 'negociacion', label: 'Negociación' },
  { id: 'closed_won', label: 'Closed Won' },
  { id: 'closed_lost', label: 'Closed Lost' },
]

const icpStyle: Record<string, { color: string; bg: string }> = {
  HOT: { color: 'var(--hot)', bg: 'var(--hot-bg)' },
  WARM: { color: 'var(--warm)', bg: 'var(--warm-bg)' },
  COLD: { color: 'var(--muted)', bg: 'var(--cold-bg)' },
}
const countryFlag: Record<string, string> = { MX: '🇲🇽', CO: '🇨🇴', PE: '🇵🇪', AR: '🇦🇷' }

export default function PipelineKanban({ deals, companies }: { deals: any[]; companies: any[] }) {
  const [activePipeline, setActivePipeline] = useState<'contadores' | 'pymes'>('contadores')

  const filtered = deals.filter(d => d.pipeline === activePipeline)
  const byStage = (id: string) => filtered.filter(d => d.stage === id)
  const stageValue = (id: string) => byStage(id).reduce((s, d) => s + Number(d.mrr), 0)

  const companyMap = Object.fromEntries(companies.map((c: any) => [c.id, c.name]))

  return (
    <div style={{ padding: '32px 36px' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Pipeline de Deals</h1>
        <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 6 }}>
          {filtered.length} deals · Vista Kanban
        </p>
      </div>

      {/* Selector */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 28 }}>
        {(['contadores', 'pymes'] as const).map(p => (
          <button key={p} onClick={() => setActivePipeline(p)} style={{
            padding: '8px 20px', borderRadius: 8, border: '1px solid',
            borderColor: activePipeline === p ? 'var(--accent)' : 'var(--border)',
            background: activePipeline === p ? 'var(--accent)' : 'var(--surface)',
            color: activePipeline === p ? '#fff' : 'var(--muted)',
            cursor: 'pointer', fontSize: 13, fontWeight: activePipeline === p ? 600 : 400,
            transition: 'all 0.15s',
          }}>
            {p === 'contadores' ? '⊞ Contadores' : '◧ PyMEs'}
          </button>
        ))}
      </div>

      {/* Kanban */}
      <div style={{ display: 'flex', gap: 14, overflowX: 'auto', paddingBottom: 20 }}>
        {stages.map(stage => {
          const stageDeals = byStage(stage.id)
          const val = stageValue(stage.id)
          return (
            <div key={stage.id} style={{ minWidth: 220, maxWidth: 240, flexShrink: 0 }}>
              <div style={{
                padding: '10px 14px',
                borderRadius: '10px 10px 0 0',
                background: 'var(--surface-2)',
                border: '1px solid var(--border)', borderBottom: 'none',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 12, fontWeight: 600 }}>{stage.label}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, background: 'var(--border)', borderRadius: 10, padding: '1px 7px', color: 'var(--muted)' }}>
                    {stageDeals.length}
                  </span>
                </div>
                {val > 0 && <div style={{ fontSize: 11, color: 'var(--accent)', marginTop: 3 }}>${val.toLocaleString()}/mes</div>}
              </div>

              <div style={{
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: '0 0 10px 10px', minHeight: 60,
                padding: 10, display: 'flex', flexDirection: 'column', gap: 8,
              }}>
                {stageDeals.map(deal => {
                  const icp = icpStyle[deal.icp_score]
                  const companyName = deal.contact?.company_id ? companyMap[deal.contact.company_id] : null
                  return (
                    <div key={deal.id} style={{
                      background: 'var(--surface-2)',
                      border: '1px solid var(--border)',
                      borderLeft: `3px solid ${icp.color}`,
                      borderRadius: 8, padding: '10px 12px',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 }}>
                        <span style={{ fontSize: 10, fontWeight: 700, color: icp.color, background: icp.bg, padding: '2px 7px', borderRadius: 5 }}>
                          {deal.icp_score}
                        </span>
                        {Number(deal.mrr) > 0
                          ? <span style={{ fontSize: 11, fontWeight: 600 }}>${deal.mrr}/m</span>
                          : deal.loss_reason && <span style={{ fontSize: 10, color: 'var(--hot)' }}>{deal.loss_reason}</span>
                        }
                      </div>
                      <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 3, lineHeight: 1.3 }}>
                        {deal.contact?.first_name} {deal.contact?.last_name}
                      </div>
                      {companyName
                        ? <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 5 }}>{companyName}</div>
                        : <div style={{ fontSize: 11, color: 'var(--border)', marginBottom: 5, fontStyle: 'italic' }}>Sin empresa</div>
                      }
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 10, color: 'var(--muted)' }}>
                          {deal.contact?.country ? countryFlag[deal.contact.country] : ''}
                        </span>
                        <span style={{ fontSize: 10, color: 'var(--muted)', background: 'var(--border)', padding: '1px 6px', borderRadius: 4 }}>
                          {deal.rep?.avatar}
                        </span>
                      </div>
                      {deal.response_time_min > 60 && (
                        <div style={{ marginTop: 6, fontSize: 10, color: 'var(--hot)', background: 'var(--hot-bg)', padding: '2px 6px', borderRadius: 4 }}>
                          ⚠ {deal.response_time_min} min respuesta
                        </div>
                      )}
                    </div>
                  )
                })}
                {stageDeals.length === 0 && (
                  <div style={{ textAlign: 'center', color: 'var(--border)', fontSize: 12, padding: '16px 0' }}>—</div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
