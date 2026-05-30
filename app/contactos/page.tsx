'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { dbFetch } from '@/lib/db'
import CreateContactModal from '@/components/modals/CreateContactModal'

const flag: Record<string,string> = { MX:'🇲🇽', CO:'🇨🇴', PE:'🇵🇪', AR:'🇦🇷' }
const src: Record<string,string> = { webinar:'Webinar', formulario_web:'Formulario', referido:'Referido', demo_solicitada:'Demo solicitada', descarga_guia:'Descarga guía', email_campaign:'Email', google_ads:'Google Ads' }
const rol: Record<string,string> = { dueno:'Dueño/a', socio_director:'Socio director', gerente_admin:'Gerente admin', contador_externo:'Contador externo', cfo:'CFO', administradora:'Administradora', fundador:'Fundador/a', socio:'Socio' }
const ic: Record<string,string> = { HOT:'#EF4444', WARM:'#B45309', COLD:'#9CA3AF' }
const ib: Record<string,string> = { HOT:'rgba(239,68,68,0.08)', WARM:'#FFF8E7', COLD:'#F5F4FA' }

export default function ContactosPage() {
  const router = useRouter()
  const [rows, setRows] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [segmento, setSegmento] = useState('')
  const [icp, setIcp] = useState('')
  const [showCreate, setShowCreate] = useState(false)

  useEffect(() => {
    Promise.all([
      dbFetch('contacts', 'select=*&order=icp_score,created_at.desc'),
      dbFetch('companies', 'select=id,name,clients,employees'),
      dbFetch('deals', 'select=id,contact_id,stage'),
    ]).then(([contacts, companies, deals]) => {
      const cm: Record<string,any> = {}; companies.forEach((c:any) => cm[c.id] = c)
      const dm: Record<string,any[]> = {}
      deals.forEach((d:any) => { if (!dm[d.contact_id]) dm[d.contact_id] = []; dm[d.contact_id].push(d) })
      setRows(contacts.map((c:any) => ({ ...c, company: cm[c.company_id] ?? null, deals: dm[c.id] ?? [] })))
      setLoading(false)
    })
  }, [])

  const filtered = rows.filter(c => {
    if (segmento && c.segment !== segmento) return false
    if (icp && c.icp_score !== icp) return false
    if (search) {
      const q = search.toLowerCase()
      return (
        `${c.first_name} ${c.last_name}`.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.company?.name?.toLowerCase().includes(q)
      )
    }
    return true
  })

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', flexDirection:'column', gap:12 }}>
      <div style={{ width:32, height:32, border:'3px solid #E5E7EB', borderTopColor:'#00C073', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <span style={{ color:'#9CA3AF', fontSize:13 }}>Cargando contactos…</span>
    </div>
  )

  return (
    <div style={{ padding:'32px 36px', display:'flex', flexDirection:'column', height:'100vh' }}>
      {showCreate && <CreateContactModal onClose={() => setShowCreate(false)} onCreated={() => { setShowCreate(false); window.location.reload() }} />}

      {/* Header */}
      <div style={{ marginBottom:20, display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
        <div>
          <h1 style={{ fontSize:26, fontWeight:800, color:'#1A1A2E', margin:'0 0 4px' }}>Contactos</h1>
          <p style={{ color:'#6B7280', fontSize:13, margin:0 }}>
            {filtered.length} de {rows.length} contactos · {rows.filter(c=>c.company_id).length} con empresa · {rows.filter(c=>!c.company_id).length} sin empresa
          </p>
        </div>
        <button onClick={() => setShowCreate(true)} style={{ padding:'9px 18px', background:'#00C073', color:'#fff', border:'none', borderRadius:8, fontSize:13, fontWeight:700, cursor:'pointer', whiteSpace:'nowrap', boxShadow:'0 2px 8px rgba(0,192,115,0.3)' }}>
          + Nuevo contacto
        </button>
      </div>

      {/* Search + Filters */}
      <div style={{ display:'flex', gap:10, marginBottom:16, alignItems:'center', flexWrap:'wrap' }}>
        <div style={{ position:'relative', flex:'1 1 260px', maxWidth:360 }}>
          <span style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'#9CA3AF', fontSize:14, pointerEvents:'none' }}>🔍</span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nombre, empresa, email…"
            style={{
              width:'100%', padding:'9px 12px 9px 34px',
              border:'1px solid #E5E7EB', borderRadius:8,
              fontSize:13, color:'#1A1A2E', background:'#fff',
              outline:'none', boxShadow:'0 1px 4px rgba(0,0,0,0.04)',
            }}
          />
        </div>

        <select
          value={segmento}
          onChange={e => setSegmento(e.target.value)}
          style={{ padding:'9px 32px 9px 12px', border:'1px solid #E5E7EB', borderRadius:8, fontSize:13, color: segmento ? '#1A1A2E' : '#9CA3AF', background:'#fff', outline:'none', cursor:'pointer', appearance:'none', backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%239CA3AF' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`, backgroundRepeat:'no-repeat', backgroundPosition:'right 10px center', boxShadow:'0 1px 4px rgba(0,0,0,0.04)' }}
        >
          <option value=''>Segmento: Todos</option>
          <option value='CONTADOR'>Contador</option>
          <option value='PYME'>PyME</option>
        </select>

        <select
          value={icp}
          onChange={e => setIcp(e.target.value)}
          style={{ padding:'9px 32px 9px 12px', border:'1px solid #E5E7EB', borderRadius:8, fontSize:13, color: icp ? '#1A1A2E' : '#9CA3AF', background:'#fff', outline:'none', cursor:'pointer', appearance:'none', backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%239CA3AF' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`, backgroundRepeat:'no-repeat', backgroundPosition:'right 10px center', boxShadow:'0 1px 4px rgba(0,0,0,0.04)' }}
        >
          <option value=''>ICP: Todos</option>
          <option value='HOT'>HOT</option>
          <option value='WARM'>WARM</option>
          <option value='COLD'>COLD</option>
        </select>

        {(segmento || icp || search) && (
          <button
            onClick={() => { setSearch(''); setSegmento(''); setIcp('') }}
            style={{ padding:'9px 14px', border:'1px solid #E5E7EB', borderRadius:8, fontSize:12, color:'#6B7280', background:'#fff', cursor:'pointer', whiteSpace:'nowrap' }}
          >
            Limpiar filtros
          </button>
        )}
      </div>

      {/* Table */}
      <div style={{ background:'#fff', border:'1px solid #E5E7EB', borderRadius:12, overflow:'hidden', boxShadow:'0 2px 12px rgba(0,192,115,0.06)', flex:1, display:'flex', flexDirection:'column', minHeight:0 }}>
        {/* Sticky header */}
        <div style={{ display:'grid', gridTemplateColumns:'2fr 2fr 1fr 1fr 1fr 1fr', padding:'12px 22px', borderBottom:'1px solid #E5E7EB', background:'#F5F4FA', fontSize:11, color:'#9CA3AF', textTransform:'uppercase', letterSpacing:0.8, fontWeight:700, flexShrink:0 }}>
          <div>Contacto</div><div>Empresa</div><div>Segmento</div><div>ICP</div><div>Fuente</div><div>Deals</div>
        </div>

        {/* Scrollable body */}
        <div style={{ overflowY:'auto', flex:1 }}>
          {filtered.length === 0 ? (
            <div style={{ padding:'40px 22px', textAlign:'center', color:'#9CA3AF', fontSize:13 }}>
              No se encontraron contactos{search ? ` para "${search}"` : ''}
            </div>
          ) : filtered.map((c, i) => (
            <div key={c.id} onClick={() => router.push(`/contactos/${c.id}`)} style={{ display:'grid', gridTemplateColumns:'2fr 2fr 1fr 1fr 1fr 1fr', padding:'13px 22px', borderBottom: i < filtered.length-1 ? '1px solid #E5E7EB' : 'none', alignItems:'center', cursor:'pointer' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#F9FAFB')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <div style={{ width:34, height:34, borderRadius:'50%', background:ib[c.icp_score], border:`1px solid ${ic[c.icp_score]}33`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:800, color:ic[c.icp_score], flexShrink:0 }}>{c.first_name[0]}{c.last_name[0]}</div>
                <div>
                  <div style={{ fontSize:13, fontWeight:700, color:'#1A1A2E' }}>{c.first_name} {c.last_name}</div>
                  <div style={{ fontSize:11, color:'#9CA3AF' }}>{rol[c.role] ?? c.role} · {flag[c.country]}</div>
                </div>
              </div>
              <div>{c.company ? <div><div style={{ fontSize:13, fontWeight:600, color:'#1A1A2E' }}>{c.company.name}</div><div style={{ fontSize:11, color:'#9CA3AF' }}>{c.company.clients ? `${c.company.clients} clientes` : c.company.employees ? `${c.company.employees} empleados` : ''}</div></div> : <span style={{ fontSize:12, color:'#9CA3AF', fontStyle:'italic' }}>Sin empresa</span>}</div>
              <div><span style={{ fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:20, background: c.segment==='CONTADOR' ? '#F0EDF8' : '#E8F8F0', color: c.segment==='CONTADOR' ? '#5C2D91' : '#00A363' }}>{c.segment}</span></div>
              <div><span style={{ fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:20, color:ic[c.icp_score], background:ib[c.icp_score] }}>{c.icp_score}</span></div>
              <div style={{ fontSize:12, color:'#6B7280' }}>{src[c.source] ?? c.source}</div>
              <div style={{ display:'flex', gap:5 }}>
                {!c.deals.length ? <span style={{ color:'#E5E7EB', fontSize:11 }}>—</span> : c.deals.map((d:any, di:number) => (
                  <span key={di} style={{ fontSize:11, padding:'2px 8px', borderRadius:20, fontWeight:700, background: d.stage==='closed_won' ? '#E8F8F0' : d.stage==='closed_lost' ? 'rgba(239,68,68,0.08)' : '#F5F4FA', color: d.stage==='closed_won' ? '#00A363' : d.stage==='closed_lost' ? '#EF4444' : '#9CA3AF' }}>{d.stage==='closed_won' ? '✓' : d.stage==='closed_lost' ? '✕' : '●'}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
