'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { dbFetch } from '@/lib/db'
import CreateEmpresaModal from '@/components/modals/CreateEmpresaModal'

const flag: Record<string,string> = { MX:'🇲🇽', CO:'🇨🇴', PE:'🇵🇪', AR:'🇦🇷' }

export default function EmpresasPage() {
  const router = useRouter()
  const [rows, setRows] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [segmento, setSegmento] = useState('')

  useEffect(() => {
    Promise.all([
      dbFetch('companies', 'select=*&order=segment,name'),
      dbFetch('contacts', 'select=id,company_id'),
      dbFetch('deals', 'select=id,contact_id,stage'),
    ]).then(([companies, contacts, deals]) => {
      const dm: Record<string,any[]> = {}
      deals.forEach((d:any) => { if (!dm[d.contact_id]) dm[d.contact_id] = []; dm[d.contact_id].push(d) })
      const contactsByCompany: Record<string,any[]> = {}
      contacts.forEach((c:any) => {
        if (!c.company_id) return
        if (!contactsByCompany[c.company_id]) contactsByCompany[c.company_id] = []
        contactsByCompany[c.company_id].push({ ...c, deals: dm[c.id] ?? [] })
      })
      setRows(companies.map((co:any) => {
        const compContacts = contactsByCompany[co.id] ?? []
        const allDeals = compContacts.flatMap((c:any) => c.deals)
        const activeDeals = allDeals.filter((d:any) => !['closed_won','closed_lost'].includes(d.stage)).length
        return { ...co, activeDeals }
      }))
      setLoading(false)
    })
  }, [])

  const filtered = rows.filter(co => {
    if (segmento && co.segment !== segmento) return false
    if (search) {
      const q = search.toLowerCase()
      return co.name?.toLowerCase().includes(q) || co.industry?.toLowerCase().includes(q)
    }
    return true
  })

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', flexDirection:'column', gap:12 }}>
      <div style={{ width:32, height:32, border:'3px solid #E5E7EB', borderTopColor:'#00C073', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <span style={{ color:'#9CA3AF', fontSize:13 }}>Cargando empresas…</span>
    </div>
  )

  return (
    <div style={{ padding:'32px 36px', display:'flex', flexDirection:'column', height:'100vh' }}>
      {showCreate && <CreateEmpresaModal onClose={() => setShowCreate(false)} onCreated={() => { setShowCreate(false); window.location.reload() }} />}

      {/* Header */}
      <div style={{ marginBottom:20, display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
        <div>
          <h1 style={{ fontSize:26, fontWeight:800, color:'#1A1A2E', margin:'0 0 4px' }}>Empresas</h1>
          <p style={{ color:'#6B7280', fontSize:13, margin:0 }}>
            {filtered.length} de {rows.length} empresas · {rows.filter(c=>c.segment==='CONTADOR').length} despachos · {rows.filter(c=>c.segment==='PYME').length} PyMEs
          </p>
        </div>
        <button onClick={() => setShowCreate(true)} style={{ padding:'9px 18px', background:'#00C073', color:'#fff', border:'none', borderRadius:8, fontSize:13, fontWeight:700, cursor:'pointer', whiteSpace:'nowrap', boxShadow:'0 2px 8px rgba(0,192,115,0.3)' }}>
          + Nueva empresa
        </button>
      </div>

      {/* Search + Filters */}
      <div style={{ display:'flex', gap:10, marginBottom:16, alignItems:'center', flexWrap:'wrap' }}>
        <div style={{ position:'relative', flex:'1 1 260px', maxWidth:360 }}>
          <span style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'#9CA3AF', fontSize:14, pointerEvents:'none' }}>🔍</span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nombre o industria…"
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

        {(segmento || search) && (
          <button
            onClick={() => { setSearch(''); setSegmento('') }}
            style={{ padding:'9px 14px', border:'1px solid #E5E7EB', borderRadius:8, fontSize:12, color:'#6B7280', background:'#fff', cursor:'pointer', whiteSpace:'nowrap' }}
          >
            Limpiar filtros
          </button>
        )}
      </div>

      {/* Table */}
      <div style={{ background:'#fff', border:'1px solid #E5E7EB', borderRadius:12, overflow:'hidden', boxShadow:'0 2px 12px rgba(0,192,115,0.06)', flex:1, display:'flex', flexDirection:'column', minHeight:0 }}>
        {/* Header */}
        <div style={{ display:'grid', gridTemplateColumns:'2.5fr 1fr 1fr 1fr 1fr', padding:'12px 22px', borderBottom:'1px solid #E5E7EB', background:'#F5F4FA', fontSize:11, color:'#9CA3AF', textTransform:'uppercase', letterSpacing:0.8, fontWeight:700, flexShrink:0 }}>
          <div>Empresa</div><div>Tipo</div><div>Clientes / Emp.</div><div>Deals activos</div><div>País</div>
        </div>

        {/* Scrollable body */}
        <div style={{ overflowY:'auto', flex:1 }}>
          {filtered.length === 0 ? (
            <div style={{ padding:'40px 22px', textAlign:'center', color:'#9CA3AF', fontSize:13 }}>
              No se encontraron empresas{search ? ` para "${search}"` : ''}
            </div>
          ) : filtered.map((co, i) => {
            const isCont = co.segment === 'CONTADOR'
            return (
              <div key={co.id} onClick={() => router.push(`/empresas/${co.id}`)} style={{ display:'grid', gridTemplateColumns:'2.5fr 1fr 1fr 1fr 1fr', padding:'14px 22px', borderBottom: i < filtered.length-1 ? '1px solid #E5E7EB' : 'none', alignItems:'center', cursor:'pointer' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#F9FAFB')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                {/* Empresa */}
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <div style={{ width:36, height:36, borderRadius:9, flexShrink:0, background: isCont ? '#F0EDF8' : '#E8F8F0', display:'flex', alignItems:'center', justifyContent:'center', fontSize:15, borderLeft:`3px solid ${isCont ? '#5C2D91' : '#00C073'}` }}>
                    {isCont ? '⊞' : '◧'}
                  </div>
                  <div>
                    <div style={{ fontSize:13, fontWeight:700, color:'#1A1A2E' }}>{co.name}</div>
                    <div style={{ fontSize:11, color:'#9CA3AF' }}>{co.industry}</div>
                  </div>
                </div>

                {/* Tipo */}
                <div>
                  <span style={{ fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:20, background: isCont ? '#F0EDF8' : '#E8F8F0', color: isCont ? '#5C2D91' : '#00A363' }}>
                    {isCont ? 'Contador' : 'PyME'}
                  </span>
                </div>

                {/* Clientes / Empleados */}
                <div style={{ fontSize:13, fontWeight:600, color:'#1A1A2E' }}>
                  {co.clients != null ? `${co.clients} clientes` : co.employees != null ? `${co.employees} emp.` : '—'}
                </div>

                {/* Deals activos */}
                <div>
                  <span style={{ fontSize:13, fontWeight:700, color: co.activeDeals > 0 ? '#5C2D91' : '#9CA3AF' }}>
                    {co.activeDeals}
                  </span>
                  {co.activeDeals > 0 && <span style={{ fontSize:11, color:'#9CA3AF', marginLeft:4 }}>activos</span>}
                </div>

                {/* País */}
                <div style={{ fontSize:13 }}>{flag[co.country]} {co.country}</div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
