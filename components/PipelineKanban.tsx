'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

const stages = [
  { id: 'discovery', label: 'Discovery' },
  { id: 'calificacion', label: 'Calificación' },
  { id: 'demo', label: 'Demo' },
  { id: 'trial', label: 'Trial' },
  { id: 'negociacion', label: 'Negociación' },
  { id: 'closed_won', label: 'Closed Won' },
  { id: 'closed_lost', label: 'Closed Lost' },
]

const icpColor: Record<string, string> = { HOT: '#EF4444', WARM: '#B45309', COLD: '#9CA3AF' }
const icpBg: Record<string, string> = { HOT: 'rgba(239,68,68,0.08)', WARM: '#FFF8E7', COLD: '#F5F4FA' }
const icpBorder: Record<string, string> = { HOT: '#EF4444', WARM: '#B45309', COLD: '#E5E7EB' }
const countryFlag: Record<string, string> = { MX: '🇲🇽', CO: '🇨🇴', PE: '🇵🇪', AR: '🇦🇷' }

export default function PipelineKanban() {
  const [activePipeline, setActivePipeline] = useState<'contadores' | 'pymes'>('contadores')
  const [deals, setDeals] = useState<any[]>([])
  const [companies, setCompanies] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [d, c] = await Promise.all([
        supabase.from('deals').select('*, contact:contacts(first_name, last_name, country, company_id), rep:reps(avatar)').order('updated_at', { ascending: false }),
        supabase.from('companies').select('id, name'),
      ])
      setDeals(d.data ?? [])
      const map: Record<string, string> = {}
      ;(c.data ?? []).forEach((co: any) => { map[co.id] = co.name })
      setCompanies(map)
      setLoading(false)
    }
    load()
  }, [])

  const filtered = deals.filter(d => d.pipeline === activePipeline)
  const byStage = (id: string) => filtered.filter(d => d.stage === id)
  const stageValue = (id: string) => byStage(id).reduce((s, d) => s + Number(d.mrr), 0)

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: '#9CA3AF', fontSize: 14 }}>
      Cargando pipeline…
    </div>
  )

  return (
    <div style={{ padding: '32px 36px' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: '#1A1A2E', margin: 0 }}>Pipeline de Deals</h1>
        <p style={{ color: '#6B7280', fontSize: 13, marginTop: 6 }}>{filtered.length} deals · Vista Kanban</p>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 28 }}>
        {(['contadores', 'pymes'] as const).map(p => (
          <button key={p} onClick={() => setActivePipeline(p)} style={{
            padding: '9px 22px', borderRadius: 8, border: '1px solid',
            borderColor: activePipeline === p ? '#00C073' : '#E5E7EB',
            background: activePipeline === p ? '#00C073' : '#FFFFFF',
            color: activePipeline === p ? '#fff' : '#6B7280',
            cursor: 'pointer', fontSize: 13, fontWeight: activePipeline === p ? 700 : 500,
            transition: 'all 0.15s',
            boxShadow: activePipeline === p ? '0 2px 8px rgba(0,192,115,0.25)' : 'none',
          }}>
            {p === 'contadores' ? '⊞ Contadores' : '◧ PyMEs'}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 14, overflowX: 'auto', paddingBottom: 24 }}>
        {stages.map(stage => {
          const stageDeals = byStage(stage.id)
          const val = stageValue(stage.id)
          return (
            <div key={stage.id} style={{ minWidth: 220, maxWidth: 240, flexShrink: 0 }}>
              {/* Column header */}
              <div style={{
                padding: '10px 14px', borderRadius: '10px 10px 0 0',
                background: '#F5F4FA', border: '1px solid #E5E7EB', borderBottom: 'none',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#1A1A2E' }}>{stage.label}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, background: '#E5E7EB', borderRadius: 10, padding: '1px 8px', color: '#6B7280' }}>
                    {stageDeals.length}
                  </span>
                </div>
                {val > 0 && <div style={{ fontSize: 11, color: '#5C2D91', fontWeight: 600, marginTop: 3 }}>${val.toLocaleString()}/mes</div>}
              </div>

              {/* Cards */}
              <div style={{
                background: '#FFFFFF', border: '1px solid #E5E7EB',
                borderRadius: '0 0 10px 10px', minHeight: 60,
                padding: 10, display: 'flex', flexDirection: 'column', gap: 8,
              }}>
                {stageDeals.map(deal => {
                  const companyName = deal.contact?.company_id ? companies[deal.contact.company_id] : null
                  return (
                    <div key={deal.id} style={{
                      background: '#FAFAFA',
                      border: '1px solid #E5E7EB',
                      borderLeft: `3px solid ${icpBorder[deal.icp_score]}`,
                      borderRadius: 8, padding: '10px 12px',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 }}>
                        <span style={{
                          fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
                          color: icpColor[deal.icp_score], background: icpBg[deal.icp_score],
                        }}>{deal.icp_score}</span>
                        {Number(deal.mrr) > 0
                          ? <span style={{ fontSize: 11, fontWeight: 700, color: '#1A1A2E' }}>${deal.mrr}/m</span>
                          : deal.loss_reason && <span style={{ fontSize: 10, color: '#EF4444' }}>{deal.loss_reason}</span>
                        }
                      </div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#1A1A2E', marginBottom: 3 }}>
                        {deal.contact?.first_name} {deal.contact?.last_name}
                      </div>
                      {companyName
                        ? <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 5 }}>{companyName}</div>
                        : <div style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 5, fontStyle: 'italic' }}>Sin empresa</div>
                      }
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 11 }}>{deal.contact?.country ? countryFlag[deal.contact.country] : ''}</span>
                        <span style={{ fontSize: 10, color: '#9CA3AF', background: '#F5F4FA', padding: '1px 7px', borderRadius: 4, fontWeight: 600 }}>
                          {deal.rep?.avatar}
                        </span>
                      </div>
                      {deal.response_time_min > 60 && (
                        <div style={{ marginTop: 6, fontSize: 10, color: '#EF4444', background: 'rgba(239,68,68,0.08)', padding: '2px 7px', borderRadius: 4 }}>
                          ⚠ {deal.response_time_min} min
                        </div>
                      )}
                    </div>
                  )
                })}
                {stageDeals.length === 0 && (
                  <div style={{ textAlign: 'center', color: '#E5E7EB', fontSize: 13, padding: '18px 0' }}>—</div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
