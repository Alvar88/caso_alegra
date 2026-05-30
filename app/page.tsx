'use client'
import { useEffect, useState } from 'react'
import { dbFetch } from '@/lib/db'
import Link from 'next/link'

const icpColors: Record<string, string> = { HOT: '#EF4444', WARM: '#B45309', COLD: '#9CA3AF' }
const icpBg: Record<string, string> = { HOT: 'rgba(239,68,68,0.08)', WARM: '#FFF8E7', COLD: '#F5F4FA' }
const stageLabel: Record<string, string> = {
  discovery: 'Discovery', calificacion: 'Calificación', demo: 'Demo',
  trial: 'Trial', negociacion: 'Negociación', closed_won: 'Closed Won',
  closed_lost: 'Closed Lost', ramp: 'Ramp',
}

export default function Dashboard() {
  const [deals, setDeals] = useState<any[]>([])
  const [reps, setReps] = useState<any[]>([])
  const [totalContacts, setTotalContacts] = useState(0)
  const [totalCompanies, setTotalCompanies] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      dbFetch('deals', 'select=id,title,stage,icp_score,mrr,loss_reason,response_time_min,contact_id,updated_at&order=updated_at.desc'),
      dbFetch('reps', 'select=*&order=capacity_score.desc'),
      dbFetch('contacts', 'select=id,first_name,last_name'),
      dbFetch('companies', 'select=id'),
    ]).then(([deals, reps, contacts, companies]) => {
      const cMap: Record<string, any> = {}
      contacts.forEach((c: any) => { cMap[c.id] = c })
      setDeals(deals.map((d: any) => ({ ...d, contact: cMap[d.contact_id] ?? null })))
      setReps(reps)
      setTotalContacts(contacts.length)
      setTotalCompanies(companies.length)
      setLoading(false)
    })
  }, [])

  const active = deals.filter(d => !['closed_won','closed_lost'].includes(d.stage))
  const won = deals.filter(d => d.stage === 'closed_won')
  const lost = deals.filter(d => d.stage === 'closed_lost')
  const totalMrr = won.reduce((s, d) => s + Number(d.mrr), 0)
  const pipeline = active.reduce((s, d) => s + Number(d.mrr), 0)
  const hot = active.filter(d => d.icp_score === 'HOT').length
  const warm = active.filter(d => d.icp_score === 'WARM').length
  const cold = active.filter(d => d.icp_score === 'COLD').length
  const withTime = deals.filter(d => d.response_time_min)
  const avgResp = withTime.length ? Math.round(withTime.reduce((s, d) => s + d.response_time_min, 0) / withTime.length) : 0
  const closeRate = won.length + lost.length > 0 ? Math.round(won.length / (won.length + lost.length) * 100) : 0

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', flexDirection:'column', gap:12 }}>
      <div style={{ width:32, height:32, border:'3px solid #E5E7EB', borderTopColor:'#00C073', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <span style={{ color:'#9CA3AF', fontSize:13 }}>Cargando datos…</span>
    </div>
  )

  return (
    <div style={{ padding:'32px 36px', maxWidth:1200 }}>
      <div style={{ marginBottom:32 }}>
        <div style={{ fontSize:11, color:'#9CA3AF', marginBottom:6, textTransform:'uppercase', letterSpacing:1 }}>Alegra CRM · Demo en vivo</div>
        <h1 style={{ fontSize:28, fontWeight:800, color:'#1A1A2E', margin:0 }}>Dashboard Comercial</h1>
        <p style={{ color:'#6B7280', fontSize:13, marginTop:6 }}>{deals.length} deals · {totalContacts} contactos · {totalCompanies} empresas · 4 países</p>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16, marginBottom:16 }}>
        {[
          { label:'MRR Cerrado', value:`$${totalMrr.toLocaleString()}`, sub:'USD/mes activo', color:'#00A363' },
          { label:'Pipeline Value', value:`$${pipeline.toLocaleString()}`, sub:`${active.length} deals activos`, color:'#5C2D91' },
          { label:'Close Rate', value:`${closeRate}%`, sub:`${won.length} won · ${lost.length} lost`, color:'#B45309' },
          { label:'Resp. Promedio', value:`${avgResp} min`, sub:'Objetivo: < 5 min', color: avgResp > 60 ? '#EF4444' : '#00A363' },
        ].map(k => (
          <div key={k.label} style={{ background:'#fff', border:'1px solid #E5E7EB', borderRadius:12, padding:'20px 22px', boxShadow:'0 2px 12px rgba(0,192,115,0.08)' }}>
            <div style={{ fontSize:11, color:'#9CA3AF', marginBottom:8, textTransform:'uppercase', letterSpacing:0.8 }}>{k.label}</div>
            <div style={{ fontSize:28, fontWeight:800, color:k.color, lineHeight:1.1 }}>{k.value}</div>
            <div style={{ fontSize:12, color:'#9CA3AF', marginTop:6 }}>{k.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16, marginBottom:32 }}>
        {[
          { label:'HOT Leads', value:hot, sub:'ICP confirmado', color:'#EF4444', bg:'rgba(239,68,68,0.08)', border:'rgba(239,68,68,0.2)' },
          { label:'WARM Leads', value:warm, sub:'En evaluación', color:'#B45309', bg:'#FFF8E7', border:'rgba(180,83,9,0.2)' },
          { label:'COLD Leads', value:cold, sub:'Bajo potencial', color:'#9CA3AF', bg:'#F5F4FA', border:'#E5E7EB' },
          { label:'Contactos', value:totalContacts, sub:`${totalCompanies} empresas`, color:'#1A1A2E', bg:'#fff', border:'#E5E7EB' },
        ].map(k => (
          <div key={k.label} style={{ background:k.bg, border:`1px solid ${k.border}`, borderRadius:12, padding:'16px 22px', display:'flex', alignItems:'center', gap:16 }}>
            <div style={{ width:44, height:44, borderRadius:12, background:k.color+'18', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, fontWeight:800, color:k.color }}>{k.value}</div>
            <div>
              <div style={{ fontSize:13, fontWeight:700, color:'#1A1A2E' }}>{k.label}</div>
              <div style={{ fontSize:11, color:'#9CA3AF' }}>{k.sub}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:24 }}>
        <div style={{ background:'#fff', border:'1px solid #E5E7EB', borderRadius:12, overflow:'hidden', boxShadow:'0 2px 12px rgba(0,192,115,0.06)' }}>
          <div style={{ padding:'18px 22px', borderBottom:'1px solid #E5E7EB', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span style={{ fontWeight:700, fontSize:14, color:'#1A1A2E' }}>Actividad Reciente</span>
            <Link href="/pipeline" style={{ fontSize:12, color:'#5C2D91', textDecoration:'none', fontWeight:600 }}>Ver pipeline →</Link>
          </div>
          {deals.slice(0,6).map((d, i) => (
            <div key={d.id} style={{ padding:'14px 22px', borderBottom: i < 5 ? '1px solid #E5E7EB' : 'none', display:'flex', alignItems:'center', gap:12 }}>
              <div style={{ width:8, height:8, borderRadius:'50%', background:icpColors[d.icp_score], flexShrink:0 }} />
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:13, fontWeight:600, color:'#1A1A2E', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{d.contact?.first_name} {d.contact?.last_name}</div>
                <div style={{ fontSize:11, color:'#9CA3AF' }}>{stageLabel[d.stage]} · {Number(d.mrr) > 0 ? `$${Number(d.mrr).toLocaleString()}/mes` : d.loss_reason ?? '—'}</div>
              </div>
              <span style={{ fontSize:11, padding:'3px 10px', borderRadius:20, fontWeight:700, color:icpColors[d.icp_score], background:icpBg[d.icp_score] }}>{d.icp_score}</span>
            </div>
          ))}
        </div>

        <div style={{ background:'#fff', border:'1px solid #E5E7EB', borderRadius:12, overflow:'hidden', boxShadow:'0 2px 12px rgba(0,192,115,0.06)' }}>
          <div style={{ padding:'18px 22px', borderBottom:'1px solid #E5E7EB', display:'flex', justifyContent:'space-between' }}>
            <span style={{ fontWeight:700, fontSize:14, color:'#1A1A2E' }}>Equipo Comercial</span>
            <span style={{ fontSize:11, color:'#9CA3AF' }}>Capacity Score</span>
          </div>
          {reps.map((r, i) => (
            <div key={r.id} style={{ padding:'16px 22px', borderBottom: i < reps.length-1 ? '1px solid #E5E7EB' : 'none' }}>
              <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:10 }}>
                <div style={{ width:38, height:38, borderRadius:'50%', background:'#00C073', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:800, color:'#fff', flexShrink:0 }}>{r.avatar}</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:'#1A1A2E' }}>{r.name}</div>
                  <div style={{ fontSize:11, color:'#9CA3AF' }}>{r.specialization === 'mixed' ? 'Contadores + PyMEs' : r.specialization} · {r.active_deals} deals</div>
                </div>
                <div style={{ textAlign:'right' }}>
                  <div style={{ fontSize:18, fontWeight:800, color: r.capacity_score >= 80 ? '#EF4444' : r.capacity_score >= 60 ? '#B45309' : '#00A363' }}>{r.capacity_score}%</div>
                  <div style={{ fontSize:10, color:'#9CA3AF' }}>capacity</div>
                </div>
              </div>
              <div style={{ height:5, borderRadius:3, background:'#F5F4FA', overflow:'hidden' }}>
                <div style={{ height:'100%', width:`${r.capacity_score}%`, borderRadius:3, background: r.capacity_score >= 80 ? '#EF4444' : r.capacity_score >= 60 ? '#F59E0B' : '#00C073' }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginTop:28, padding:'24px 28px', background:'#E8F8F0', border:'1px solid #A7F3D0', borderRadius:14, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div>
          <div style={{ fontWeight:800, fontSize:16, color:'#1A1A2E', marginBottom:4 }}>◆ Lead Intelligence Agent activo</div>
          <div style={{ fontSize:13, color:'#6B7280' }}>Clasificación HOT/WARM/COLD · Routing automático · Primer mensaje generado por IA en tiempo real</div>
        </div>
        <Link href="/agente" style={{ padding:'12px 24px', background:'#00C073', color:'#fff', borderRadius:8, textDecoration:'none', fontSize:13, fontWeight:700, whiteSpace:'nowrap', flexShrink:0, marginLeft:24, boxShadow:'0 2px 8px rgba(0,192,115,0.3)' }}>
          Ver demo en vivo →
        </Link>
      </div>
    </div>
  )
}
