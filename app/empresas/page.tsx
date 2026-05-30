'use client'
import { useEffect, useState } from 'react'
import { dbFetch } from '@/lib/db'

const flag: Record<string,string> = { MX:'🇲🇽', CO:'🇨🇴', PE:'🇵🇪', AR:'🇦🇷' }
const ic: Record<string,string> = { HOT:'#EF4444', WARM:'#B45309', COLD:'#9CA3AF' }

export default function EmpresasPage() {
  const [companies, setCompanies] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      dbFetch('companies', 'select=*&order=segment,name'),
      dbFetch('contacts', 'select=id,first_name,last_name,icp_score,company_id'),
      dbFetch('deals', 'select=id,contact_id,stage,mrr'),
    ]).then(([companies, contacts, deals]) => {
      const dm: Record<string,any[]> = {}
      deals.forEach((d:any) => { if (!dm[d.contact_id]) dm[d.contact_id] = []; dm[d.contact_id].push(d) })
      const cm: Record<string,any[]> = {}
      contacts.forEach((c:any) => { if (!c.company_id) return; if (!cm[c.company_id]) cm[c.company_id] = []; cm[c.company_id].push({ ...c, deals: dm[c.id] ?? [] }) })
      setCompanies(companies.map((co:any) => ({ ...co, contacts: cm[co.id] ?? [] })))
      setLoading(false)
    })
  }, [])

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', flexDirection:'column', gap:12 }}>
      <div style={{ width:32, height:32, border:'3px solid #E5E7EB', borderTopColor:'#00C073', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <span style={{ color:'#9CA3AF', fontSize:13 }}>Cargando empresas…</span>
    </div>
  )

  return (
    <div style={{ padding:'32px 36px' }}>
      <h1 style={{ fontSize:26, fontWeight:800, color:'#1A1A2E', margin:'0 0 6px' }}>Empresas</h1>
      <p style={{ color:'#6B7280', fontSize:13, marginBottom:24 }}>{companies.length} empresas · {companies.filter(c=>c.segment==='CONTADOR').length} despachos · {companies.filter(c=>c.segment==='PYME').length} PyMEs</p>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(340px,1fr))', gap:16 }}>
        {companies.map(co => {
          const allDeals = co.contacts.flatMap((c:any) => c.deals ?? [])
          const won = allDeals.filter((d:any) => d.stage==='closed_won')
          const active = allDeals.filter((d:any) => !['closed_won','closed_lost'].includes(d.stage))
          const mrr = won.reduce((s:number,d:any) => s + Number(d.mrr), 0)
          const isCont = co.segment === 'CONTADOR'
          return (
            <div key={co.id} style={{ background:'#fff', border:'1px solid #E5E7EB', borderRadius:12, padding:'20px 22px', boxShadow:'0 2px 12px rgba(0,192,115,0.06)', borderTop:`3px solid ${isCont ? '#5C2D91' : '#00C073'}` }}>
              <div style={{ display:'flex', alignItems:'flex-start', gap:12, marginBottom:16 }}>
                <div style={{ width:42, height:42, borderRadius:10, flexShrink:0, background: isCont ? '#F0EDF8' : '#E8F8F0', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>{isCont ? '⊞' : '◧'}</div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontWeight:800, fontSize:14, color:'#1A1A2E', marginBottom:3 }}>{co.name}</div>
                  <div style={{ fontSize:12, color:'#6B7280' }}>{flag[co.country]} {co.industry}</div>
                </div>
                <span style={{ fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:20, flexShrink:0, background: isCont ? '#F0EDF8' : '#E8F8F0', color: isCont ? '#5C2D91' : '#00A363' }}>{co.segment}</span>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10, marginBottom:14 }}>
                {[{ label: isCont ? 'Clientes' : 'Empleados', value: co.clients ?? co.employees ?? '—' }, { label:'Deals activos', value: active.length }, { label:'MRR activo', value: mrr > 0 ? `$${mrr}` : '—' }].map(s => (
                  <div key={s.label} style={{ background:'#F5F4FA', borderRadius:8, padding:'10px 12px' }}>
                    <div style={{ fontSize:17, fontWeight:800, color:'#1A1A2E' }}>{s.value}</div>
                    <div style={{ fontSize:10, color:'#9CA3AF', marginTop:2 }}>{s.label}</div>
                  </div>
                ))}
              </div>
              {co.current_software && <div style={{ fontSize:12, color:'#6B7280', padding:'7px 12px', background:'#F5F4FA', borderRadius:8, marginBottom:12 }}><span style={{ color:'#9CA3AF' }}>Software: </span>{co.current_software}</div>}
              <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                {co.contacts.map((ct:any) => (
                  <div key={ct.id} style={{ display:'flex', alignItems:'center', gap:5, padding:'3px 10px', background:'#F5F4FA', border:'1px solid #E5E7EB', borderRadius:20, fontSize:11 }}>
                    <div style={{ width:16, height:16, borderRadius:'50%', background:ic[ct.icp_score], display:'flex', alignItems:'center', justifyContent:'center', fontSize:8, fontWeight:800, color:'#fff' }}>{ct.first_name[0]}</div>
                    <span style={{ color:'#1A1A2E', fontWeight:600 }}>{ct.first_name} {ct.last_name}</span>
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
