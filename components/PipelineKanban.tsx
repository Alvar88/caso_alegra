'use client'
import { useState, useEffect } from 'react'
import { dbFetch } from '@/lib/db'

const stages = [
  { id:'discovery', label:'Discovery' }, { id:'calificacion', label:'Calificación' },
  { id:'demo', label:'Demo' }, { id:'trial', label:'Trial' },
  { id:'negociacion', label:'Negociación' }, { id:'closed_won', label:'Closed Won' },
  { id:'closed_lost', label:'Closed Lost' },
]
const ic: Record<string,string> = { HOT:'#EF4444', WARM:'#B45309', COLD:'#9CA3AF' }
const ib: Record<string,string> = { HOT:'rgba(239,68,68,0.08)', WARM:'#FFF8E7', COLD:'#F5F4FA' }
const flag: Record<string,string> = { MX:'🇲🇽', CO:'🇨🇴', PE:'🇵🇪', AR:'🇦🇷' }

export default function PipelineKanban() {
  const [tab, setTab] = useState<'contadores'|'pymes'>('contadores')
  const [deals, setDeals] = useState<any[]>([])
  const [cos, setCos] = useState<Record<string,string>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      dbFetch('deals', 'select=id,stage,pipeline,icp_score,mrr,loss_reason,response_time_min,contact_id,rep_id&order=updated_at.desc'),
      dbFetch('contacts', 'select=id,first_name,last_name,country,company_id'),
      dbFetch('companies', 'select=id,name'),
      dbFetch('reps', 'select=id,avatar'),
    ]).then(([deals, contacts, companies, reps]) => {
      const cm: Record<string,any> = {}; contacts.forEach((c:any) => cm[c.id] = c)
      const rm: Record<string,any> = {}; reps.forEach((r:any) => rm[r.id] = r)
      const com: Record<string,string> = {}; companies.forEach((c:any) => com[c.id] = c.name)
      setDeals(deals.map((d:any) => ({ ...d, contact: cm[d.contact_id] ?? null, rep: rm[d.rep_id] ?? null })))
      setCos(com)
      setLoading(false)
    })
  }, [])

  const filtered = deals.filter(d => d.pipeline === tab)
  const byStage = (id:string) => filtered.filter(d => d.stage === id)

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', flexDirection:'column', gap:12 }}>
      <div style={{ width:32, height:32, border:'3px solid #E5E7EB', borderTopColor:'#00C073', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <span style={{ color:'#9CA3AF', fontSize:13 }}>Cargando pipeline…</span>
    </div>
  )

  return (
    <div style={{ padding:'32px 36px' }}>
      <h1 style={{ fontSize:26, fontWeight:800, color:'#1A1A2E', margin:'0 0 6px' }}>Pipeline de Deals</h1>
      <p style={{ color:'#6B7280', fontSize:13, marginBottom:24 }}>{filtered.length} deals · Vista Kanban</p>
      <div style={{ display:'flex', gap:10, marginBottom:28 }}>
        {(['contadores','pymes'] as const).map(p => (
          <button key={p} onClick={() => setTab(p)} style={{ padding:'9px 22px', borderRadius:8, border:'1px solid', borderColor: tab===p ? '#00C073' : '#E5E7EB', background: tab===p ? '#00C073' : '#fff', color: tab===p ? '#fff' : '#6B7280', cursor:'pointer', fontSize:13, fontWeight: tab===p ? 700 : 500, boxShadow: tab===p ? '0 2px 8px rgba(0,192,115,0.25)' : 'none' }}>
            {p === 'contadores' ? '⊞ Contadores' : '◧ PyMEs'}
          </button>
        ))}
      </div>
      <div style={{ display:'flex', gap:14, overflowX:'auto', paddingBottom:24 }}>
        {stages.map(s => {
          const sd = byStage(s.id)
          const val = sd.reduce((a,d) => a + Number(d.mrr), 0)
          return (
            <div key={s.id} style={{ minWidth:220, maxWidth:240, flexShrink:0 }}>
              <div style={{ padding:'10px 14px', borderRadius:'10px 10px 0 0', background:'#F5F4FA', border:'1px solid #E5E7EB', borderBottom:'none' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <span style={{ fontSize:12, fontWeight:700, color:'#1A1A2E' }}>{s.label}</span>
                  <span style={{ fontSize:11, fontWeight:700, background:'#E5E7EB', borderRadius:10, padding:'1px 8px', color:'#6B7280' }}>{sd.length}</span>
                </div>
                {val > 0 && <div style={{ fontSize:11, color:'#5C2D91', fontWeight:600, marginTop:3 }}>${val.toLocaleString()}/mes</div>}
              </div>
              <div style={{ background:'#fff', border:'1px solid #E5E7EB', borderRadius:'0 0 10px 10px', minHeight:60, padding:10, display:'flex', flexDirection:'column', gap:8 }}>
                {sd.map(d => (
                  <div key={d.id} style={{ background:'#FAFAFA', border:'1px solid #E5E7EB', borderLeft:`3px solid ${ic[d.icp_score]}`, borderRadius:8, padding:'10px 12px' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:7 }}>
                      <span style={{ fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:20, color:ic[d.icp_score], background:ib[d.icp_score] }}>{d.icp_score}</span>
                      {Number(d.mrr) > 0 ? <span style={{ fontSize:11, fontWeight:700, color:'#1A1A2E' }}>${Number(d.mrr).toLocaleString()}/m</span> : d.loss_reason && <span style={{ fontSize:10, color:'#EF4444' }}>{d.loss_reason}</span>}
                    </div>
                    <div style={{ fontSize:12, fontWeight:700, color:'#1A1A2E', marginBottom:3 }}>{d.contact?.first_name} {d.contact?.last_name}</div>
                    {d.contact?.company_id && cos[d.contact.company_id]
                      ? <div style={{ fontSize:11, color:'#6B7280', marginBottom:4 }}>{cos[d.contact.company_id]}</div>
                      : <div style={{ fontSize:11, color:'#9CA3AF', marginBottom:4, fontStyle:'italic' }}>Sin empresa</div>}
                    <div style={{ display:'flex', justifyContent:'space-between' }}>
                      <span style={{ fontSize:11 }}>{flag[d.contact?.country]}</span>
                      <span style={{ fontSize:10, color:'#9CA3AF', background:'#F5F4FA', padding:'1px 7px', borderRadius:4, fontWeight:600 }}>{d.rep?.avatar}</span>
                    </div>
                    {d.response_time_min > 60 && <div style={{ marginTop:6, fontSize:10, color:'#EF4444', background:'rgba(239,68,68,0.08)', padding:'2px 7px', borderRadius:4 }}>⚠ {d.response_time_min} min</div>}
                  </div>
                ))}
                {sd.length === 0 && <div style={{ textAlign:'center', color:'#E5E7EB', fontSize:13, padding:'18px 0' }}>—</div>}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
