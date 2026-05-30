'use client'
import { useState } from 'react'
import { deals } from '@/data/deals'
import { contacts } from '@/data/contacts'
import { companies } from '@/data/companies'
import { reps } from '@/data/reps'
import type { Pipeline } from '@/lib/types'

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

export default function PipelinePage() {
  const [activePipeline, setActivePipeline] = useState<Pipeline>('contadores')

  const filtered = deals.filter(d => d.pipeline === activePipeline)

  const byStage = (stageId: string) =>
    filtered.filter(d => d.stage === stageId)

  const stageValue = (stageId: string) =>
    byStage(stageId).reduce((s, d) => s + d.mrr, 0)

  return (
    <div style={{ padding: '32px 36px' }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Pipeline de Deals</h1>
        <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 6 }}>
          Vista Kanban · {filtered.length} deals · Arrastre simulado
        </p>
      </div>

      {/* Pipeline selector */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 28 }}>
        {(['contadores', 'pymes'] as Pipeline[]).map(p => (
          <button
            key={p}
            onClick={() => setActivePipeline(p)}
            style={{
              padding: '8px 20px',
              borderRadius: 8,
              border: '1px solid',
              borderColor: activePipeline === p ? 'var(--accent)' : 'var(--border)',
              background: activePipeline === p ? 'var(--accent)' : 'var(--surface)',
              color: activePipeline === p ? '#fff' : 'var(--muted)',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: activePipeline === p ? 600 : 400,
              transition: 'all 0.15s',
            }}
          >
            {p === 'contadores' ? '⊞ Contadores' : '◧ PyMEs'}
          </button>
        ))}
      </div>

      {/* Kanban */}
      <div style={{
        display: 'flex',
        gap: 14,
        overflowX: 'auto',
        paddingBottom: 20,
      }}>
        {stages.map(stage => {
          const stageDeals = byStage(stage.id)
          const val = stageValue(stage.id)

          return (
            <div key={stage.id} style={{
              minWidth: 220,
              maxWidth: 240,
              flexShrink: 0,
            }}>
              {/* Column header */}
              <div style={{
                padding: '10px 14px',
                borderRadius: '10px 10px 0 0',
                background: 'var(--surface-2)',
                border: '1px solid var(--border)',
                borderBottom: 'none',
                marginBottom: 0,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--foreground)' }}>{stage.label}</span>
                  <span style={{
                    fontSize: 11, fontWeight: 700,
                    background: 'var(--border)',
                    borderRadius: 10, padding: '1px 7px',
                    color: 'var(--muted)',
                  }}>{stageDeals.length}</span>
                </div>
                {val > 0 && (
                  <div style={{ fontSize: 11, color: 'var(--accent)', marginTop: 3 }}>
                    ${val.toLocaleString()}/mes
                  </div>
                )}
              </div>

              {/* Cards */}
              <div style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: '0 0 10px 10px',
                minHeight: 60,
                padding: 10,
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}>
                {stageDeals.map(deal => {
                  const contact = contacts.find(c => c.id === deal.contactId)
                  const company = contact?.companyId ? companies.find(co => co.id === contact.companyId) : null
                  const rep = reps.find(r => r.id === deal.repId)
                  const icp = icpStyle[deal.icpScore]

                  return (
                    <div key={deal.id} style={{
                      background: 'var(--surface-2)',
                      border: '1px solid var(--border)',
                      borderLeft: `3px solid ${icp.color}`,
                      borderRadius: 8,
                      padding: '10px 12px',
                      cursor: 'default',
                    }}>
                      {/* ICP badge + MRR */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 }}>
                        <span style={{
                          fontSize: 10, fontWeight: 700,
                          color: icp.color, background: icp.bg,
                          padding: '2px 7px', borderRadius: 5,
                        }}>{deal.icpScore}</span>
                        {deal.mrr > 0 && (
                          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--foreground)' }}>
                            ${deal.mrr}/m
                          </span>
                        )}
                        {deal.lossReason && (
                          <span style={{ fontSize: 10, color: 'var(--hot)' }}>{deal.lossReason}</span>
                        )}
                      </div>

                      {/* Contact */}
                      <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 3, lineHeight: 1.3 }}>
                        {contact?.firstName} {contact?.lastName}
                      </div>

                      {/* Company or standalone */}
                      {company ? (
                        <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 5 }}>
                          {company.name}
                        </div>
                      ) : (
                        <div style={{ fontSize: 11, color: 'var(--border)', marginBottom: 5, fontStyle: 'italic' }}>
                          Sin empresa confirmada
                        </div>
                      )}

                      {/* Footer */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 10, color: 'var(--muted)' }}>
                          {contact && countryFlag[contact.country]}
                        </span>
                        <span style={{
                          fontSize: 10, color: 'var(--muted)',
                          background: 'var(--border)',
                          padding: '1px 6px', borderRadius: 4,
                        }}>{rep?.avatar}</span>
                      </div>

                      {/* Response time warning */}
                      {deal.responseTimeMin && deal.responseTimeMin > 60 && (
                        <div style={{
                          marginTop: 6,
                          fontSize: 10,
                          color: 'var(--hot)',
                          background: 'var(--hot-bg)',
                          padding: '2px 6px',
                          borderRadius: 4,
                        }}>
                          ⚠ {deal.responseTimeMin} min respuesta
                        </div>
                      )}
                    </div>
                  )
                })}

                {stageDeals.length === 0 && (
                  <div style={{ textAlign: 'center', color: 'var(--border)', fontSize: 12, padding: '16px 0' }}>
                    —
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
