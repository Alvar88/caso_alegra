'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { dbFetch } from '@/lib/db'
import CreateContactModal from '@/components/modals/CreateContactModal'
import CreateDealModal from '@/components/modals/CreateDealModal'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jpptlznlexkxehxnyjeh.supabase.co'
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpwcHRsem5sZXpreGVoeG55amVoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAxNTAxNjIsImV4cCI6MjA5NTcyNjE2Mn0.44OoqEBDLMaRWa3tv7vAgh7hC4XsrKs6xbDMgmXh7Is'

const ic: Record<string,string> = { HOT:'#EF4444', WARM:'#B45309', COLD:'#9CA3AF' }
const ib: Record<string,string> = { HOT:'rgba(239,68,68,0.08)', WARM:'#FFF8E7', COLD:'#F5F4FA' }
const flag: Record<string,string> = { MX:'🇲🇽', CO:'🇨🇴', PE:'🇵🇪', AR:'🇦🇷' }
const rol: Record<string,string> = { dueno:'Dueño/a', socio_director:'Socio director', gerente_admin:'Gerente admin', contador_externo:'Contador externo', cfo:'CFO', administradora:'Administradora', fundador:'Fundador/a', socio:'Socio' }
const stageLabel: Record<string,string> = { discovery:'Discovery', calificacion:'Calificación', demo:'Demo', trial:'Trial', negociacion:'Negociación', closed_won:'Closed Won', closed_lost:'Closed Lost', ramp:'Ramp' }
const stageColor: Record<string,string> = { closed_won:'#00A363', closed_lost:'#EF4444', ramp:'#5C2D91' }

type NoteEntry = { text: string; created_at: string }

function parseNotes(raw: string | null): NoteEntry[] {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) return parsed
    return [{ text: raw, created_at: new Date().toISOString() }]
  } catch {
    return raw.trim() ? [{ text: raw, created_at: new Date().toISOString() }] : []
  }
}

function Prop({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 10, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: 700, marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 13, color: '#1A1A2E', fontWeight: 500 }}>{value}</div>
    </div>
  )
}

export default function EmpresaDetalle() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const [company, setCompany] = useState<any>(null)
  const [contacts, setContacts] = useState<any[]>([])
  const [deals, setDeals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [noteHistory, setNoteHistory] = useState<NoteEntry[]>([])
  const [newNote, setNewNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [showCreateContact, setShowCreateContact] = useState(false)
  const [showCreateDeal, setShowCreateDeal] = useState(false)

  useEffect(() => {
    Promise.all([
      dbFetch('companies', `select=*&id=eq.${id}`),
      dbFetch('contacts', `select=*&company_id=eq.${id}&order=icp_score`),
    ]).then(async ([cos, contactsData]) => {
      const co = cos[0] ?? null
      setCompany(co)
      setNoteHistory(parseNotes(co?.notes ?? null))
      setContacts(contactsData)

      if (contactsData.length > 0) {
        const contactIds = contactsData.map((c: any) => c.id).join(',')
        const dealsData = await dbFetch('deals', `select=*&contact_id=in.(${contactIds})&order=updated_at.desc`)
        setDeals(dealsData)
      }
      setLoading(false)
    })
  }, [id])

  async function addNote() {
    if (!newNote.trim()) return
    setSaving(true)
    const entry: NoteEntry = { text: newNote.trim(), created_at: new Date().toISOString() }
    const updated = [entry, ...noteHistory]
    await fetch(`${SUPABASE_URL}/rest/v1/companies?id=eq.${id}`, {
      method: 'PATCH',
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({ notes: JSON.stringify(updated) }),
    }).catch(() => {})
    setNoteHistory(updated)
    setNewNote('')
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', flexDirection:'column', gap:12 }}>
      <div style={{ width:32, height:32, border:'3px solid #E5E7EB', borderTopColor:'#00C073', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  if (!company) return (
    <div style={{ padding:'40px', color:'#9CA3AF' }}>Empresa no encontrada.</div>
  )

  const isCont = company.segment === 'CONTADOR'
  const activeDeals = deals.filter(d => !['closed_won','closed_lost'].includes(d.stage))
  const wonDeals = deals.filter(d => d.stage === 'closed_won')
  const totalMrr = wonDeals.reduce((s,d) => s + Number(d.mrr), 0)

  return (
    <div style={{ padding:'28px 32px', height:'100vh', display:'flex', flexDirection:'column', overflow:'hidden' }}>
      {showCreateContact && <CreateContactModal preselectedCompanyId={id} onClose={() => setShowCreateContact(false)} onCreated={() => { setShowCreateContact(false); window.location.reload() }} />}
      {showCreateDeal && <CreateDealModal onClose={() => setShowCreateDeal(false)} onCreated={() => { setShowCreateDeal(false); window.location.reload() }} />}

      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', paddingBottom:18 }}>
        <button onClick={() => router.push('/empresas')} style={{ display:'inline-flex', alignItems:'center', gap:6, fontSize:13, color:'#6B7280', background:'none', border:'none', cursor:'pointer', padding:0, fontFamily:'inherit' }}>
          ← Volver a Empresas
        </button>
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={() => setShowCreateContact(true)} style={{ padding:'8px 16px', background:'#00C073', color:'#fff', border:'none', borderRadius:8, fontSize:12, fontWeight:700, cursor:'pointer', boxShadow:'0 2px 8px rgba(0,192,115,0.25)' }}>
            + Nuevo contacto
          </button>
          <button onClick={() => setShowCreateDeal(true)} style={{ padding:'8px 16px', background:'#5C2D91', color:'#fff', border:'none', borderRadius:8, fontSize:12, fontWeight:700, cursor:'pointer', boxShadow:'0 2px 8px rgba(92,45,145,0.25)' }}>
            + Nuevo deal
          </button>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'260px 1fr 220px', gap:20, flex:1, minHeight:0 }}>

        {/* ── LEFT ── */}
        <div style={{ overflowY:'auto', display:'flex', flexDirection:'column', gap:14 }}>
          {/* Name card */}
          <div style={{ background:'#fff', border:'1px solid #E5E7EB', borderRadius:12, padding:'22px 20px', textAlign:'center', boxShadow:'0 2px 8px rgba(0,0,0,0.04)', borderTop:`3px solid ${isCont ? '#5C2D91' : '#00C073'}` }}>
            <div style={{ width:52, height:52, borderRadius:12, background: isCont ? '#F0EDF8' : '#E8F8F0', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, margin:'0 auto 14px' }}>
              {isCont ? '⊞' : '◧'}
            </div>
            <div style={{ fontSize:16, fontWeight:800, color:'#1A1A2E', marginBottom:6 }}>{company.name}</div>
            <div style={{ fontSize:12, color:'#6B7280', marginBottom:12 }}>{company.industry} · {flag[company.country]}</div>
            <span style={{ fontSize:11, fontWeight:700, padding:'3px 12px', borderRadius:20, background: isCont ? '#F0EDF8' : '#E8F8F0', color: isCont ? '#5C2D91' : '#00A363' }}>
              {isCont ? 'Contador' : 'PyME'}
            </span>
          </div>

          {/* Properties */}
          <div style={{ background:'#fff', border:'1px solid #E5E7EB', borderRadius:12, padding:'18px 20px', boxShadow:'0 2px 8px rgba(0,0,0,0.04)' }}>
            <div style={{ fontSize:11, color:'#9CA3AF', fontWeight:700, textTransform:'uppercase', letterSpacing:0.8, marginBottom:14 }}>Propiedades</div>
            <Prop label="País" value={`${flag[company.country]} ${company.country}`} />
            <Prop label={isCont ? 'Clientes' : 'Empleados'} value={company.clients != null ? `${company.clients}` : company.employees != null ? `${company.employees}` : null} />
            <Prop label="Software actual" value={company.current_software} />
            <Prop label="Sitio web" value={company.website} />
            <Prop label="Creado" value={company.created_at ? new Date(company.created_at).toLocaleDateString('es-MX', { year:'numeric', month:'short', day:'numeric' }) : null} />
          </div>
        </div>

        {/* ── CENTER ── */}
        <div style={{ overflowY:'auto', display:'flex', flexDirection:'column', gap:16 }}>

          {/* Contactos asociados */}
          <div style={{ background:'#fff', border:'1px solid #E5E7EB', borderRadius:12, overflow:'hidden', boxShadow:'0 2px 8px rgba(0,0,0,0.04)' }}>
            <div style={{ padding:'16px 20px', borderBottom:'1px solid #E5E7EB', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <span style={{ fontSize:13, fontWeight:700, color:'#1A1A2E' }}>Contactos asociados</span>
              <span style={{ fontSize:12, color:'#9CA3AF' }}>{contacts.length} contacto{contacts.length !== 1 ? 's' : ''}</span>
            </div>
            {contacts.length === 0 ? (
              <div style={{ padding:'24px 20px', textAlign:'center', color:'#9CA3AF', fontSize:13 }}>Sin contactos asociados</div>
            ) : (
              <>
                <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr', padding:'10px 20px', background:'#F5F4FA', fontSize:11, color:'#9CA3AF', textTransform:'uppercase', letterSpacing:0.8, fontWeight:700 }}>
                  <div>Nombre</div><div>Rol</div><div>ICP</div><div>País</div>
                </div>
                {contacts.map((c, i) => (
                  <div key={c.id} onClick={() => router.push(`/contactos/${c.id}`)} style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr', padding:'12px 20px', borderBottom: i < contacts.length-1 ? '1px solid #E5E7EB' : 'none', alignItems:'center', cursor:'pointer' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#F9FAFB')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <div style={{ width:28, height:28, borderRadius:'50%', background:ib[c.icp_score], display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:800, color:ic[c.icp_score], flexShrink:0 }}>
                        {c.first_name?.[0]}{c.last_name?.[0]}
                      </div>
                      <span style={{ fontSize:13, fontWeight:600, color:'#1A1A2E' }}>{c.first_name} {c.last_name}</span>
                    </div>
                    <div style={{ fontSize:12, color:'#6B7280' }}>{rol[c.role] ?? c.role}</div>
                    <div><span style={{ fontSize:11, fontWeight:700, padding:'2px 8px', borderRadius:20, color:ic[c.icp_score], background:ib[c.icp_score] }}>{c.icp_score}</span></div>
                    <div style={{ fontSize:13 }}>{flag[c.country]}</div>
                  </div>
                ))}
              </>
            )}
          </div>

          {/* Deals asociados */}
          <div style={{ background:'#fff', border:'1px solid #E5E7EB', borderRadius:12, overflow:'hidden', boxShadow:'0 2px 8px rgba(0,0,0,0.04)' }}>
            <div style={{ padding:'16px 20px', borderBottom:'1px solid #E5E7EB', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <span style={{ fontSize:13, fontWeight:700, color:'#1A1A2E' }}>Deals asociados</span>
              <span style={{ fontSize:12, color:'#9CA3AF' }}>{deals.length} deal{deals.length !== 1 ? 's' : ''}</span>
            </div>
            {deals.length === 0 ? (
              <div style={{ padding:'24px 20px', textAlign:'center', color:'#9CA3AF', fontSize:13 }}>Sin deals asociados</div>
            ) : (
              <>
                <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr', padding:'10px 20px', background:'#F5F4FA', fontSize:11, color:'#9CA3AF', textTransform:'uppercase', letterSpacing:0.8, fontWeight:700 }}>
                  <div>Título</div><div>Etapa</div><div>ICP</div><div>MRR</div>
                </div>
                {deals.map((d, i) => (
                  <div key={d.id} onClick={() => router.push(`/pipeline/${d.id}`)} style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr', padding:'12px 20px', borderBottom: i < deals.length-1 ? '1px solid #E5E7EB' : 'none', alignItems:'center', cursor:'pointer' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#F9FAFB')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <div style={{ fontSize:13, fontWeight:600, color:'#1A1A2E' }}>{d.title}</div>
                    <div><span style={{ fontSize:11, fontWeight:700, padding:'2px 8px', borderRadius:20, background: stageColor[d.stage] ? stageColor[d.stage]+'18' : '#F5F4FA', color: stageColor[d.stage] ?? '#6B7280' }}>{stageLabel[d.stage] ?? d.stage}</span></div>
                    <div><span style={{ fontSize:11, fontWeight:700, padding:'2px 8px', borderRadius:20, color:ic[d.icp_score], background:ib[d.icp_score] }}>{d.icp_score}</span></div>
                    <div style={{ fontSize:13, fontWeight:700, color: d.stage==='closed_won' ? '#00A363' : '#1A1A2E' }}>{Number(d.mrr) > 0 ? `$${Number(d.mrr).toLocaleString()}/m` : '—'}</div>
                  </div>
                ))}
              </>
            )}
          </div>

          {/* Notas */}
          <div style={{ background:'#fff', border:'1px solid #E5E7EB', borderRadius:12, overflow:'hidden', boxShadow:'0 2px 8px rgba(0,0,0,0.04)' }}>
            <div style={{ padding:'16px 20px', borderBottom:'1px solid #E5E7EB' }}>
              <span style={{ fontSize:13, fontWeight:700, color:'#1A1A2E' }}>Notas</span>
            </div>
            <div style={{ padding:'16px 20px', borderBottom: noteHistory.length > 0 ? '1px solid #E5E7EB' : 'none' }}>
              <textarea
                value={newNote}
                onChange={e => setNewNote(e.target.value)}
                placeholder="Escribe una nota…"
                rows={3}
                style={{ width:'100%', padding:'10px 12px', border:'1px solid #E5E7EB', borderRadius:8, fontSize:13, color:'#1A1A2E', resize:'none', outline:'none', fontFamily:'inherit', background:'#FAFAFA', boxSizing:'border-box' }}
                onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) addNote() }}
              />
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:10 }}>
                <span style={{ fontSize:11, color:'#9CA3AF' }}>⌘ + Enter para guardar</span>
                <button
                  onClick={addNote}
                  disabled={saving || !newNote.trim()}
                  style={{ padding:'8px 18px', background: saved ? '#00A363' : !newNote.trim() ? '#E5E7EB' : '#00C073', color: !newNote.trim() ? '#9CA3AF' : '#fff', border:'none', borderRadius:8, fontSize:13, fontWeight:700, cursor: newNote.trim() ? 'pointer' : 'default', transition:'background 0.2s' }}
                >
                  {saved ? '✓ Guardado' : saving ? 'Guardando…' : 'Agregar nota'}
                </button>
              </div>
            </div>
            {noteHistory.length > 0 ? (
              <div style={{ padding:'4px 0' }}>
                {noteHistory.map((n, i) => (
                  <div key={i} style={{ padding:'14px 20px', borderBottom: i < noteHistory.length-1 ? '1px solid #F5F4FA' : 'none', display:'flex', gap:12 }}>
                    <div style={{ width:28, height:28, borderRadius:'50%', background: isCont ? '#F0EDF8' : '#E8F8F0', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:800, color: isCont ? '#5C2D91' : '#00A363', flexShrink:0, marginTop:1 }}>
                      {company.name?.[0]}
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                        <span style={{ fontSize:12, fontWeight:700, color:'#1A1A2E' }}>{company.name}</span>
                        <span style={{ fontSize:11, color:'#9CA3AF' }}>
                          {new Date(n.created_at).toLocaleDateString('es-MX', { day:'numeric', month:'short', year:'numeric' })}
                          {' · '}
                          {new Date(n.created_at).toLocaleTimeString('es-MX', { hour:'2-digit', minute:'2-digit' })}
                        </span>
                      </div>
                      <div style={{ fontSize:13, color:'#374151', lineHeight:1.5 }}>{n.text}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding:'20px', textAlign:'center', color:'#9CA3AF', fontSize:12 }}>Sin notas aún</div>
            )}
          </div>
        </div>

        {/* ── RIGHT ── */}
        <div style={{ overflowY:'auto', display:'flex', flexDirection:'column', gap:14 }}>
          <div style={{ background:'#fff', border:'1px solid #E5E7EB', borderRadius:12, padding:'18px', boxShadow:'0 2px 8px rgba(0,0,0,0.04)' }}>
            <div style={{ fontSize:11, color:'#9CA3AF', fontWeight:700, textTransform:'uppercase', letterSpacing:0.8, marginBottom:14 }}>Resumen</div>
            {[
              { label:'Contactos', value: contacts.length },
              { label:'Deals totales', value: deals.length },
              { label:'Deals activos', value: activeDeals.length },
              { label:'Deals won', value: wonDeals.length },
              { label:'MRR cerrado', value: `$${totalMrr.toLocaleString()}` },
            ].map(s => (
              <div key={s.label} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
                <span style={{ fontSize:12, color:'#6B7280' }}>{s.label}</span>
                <span style={{ fontSize:13, fontWeight:700, color:'#1A1A2E' }}>{s.value}</span>
              </div>
            ))}
          </div>

          {contacts.length > 0 && (
            <div style={{ background:'#fff', border:'1px solid #E5E7EB', borderRadius:12, padding:'18px', boxShadow:'0 2px 8px rgba(0,0,0,0.04)' }}>
              <div style={{ fontSize:11, color:'#9CA3AF', fontWeight:700, textTransform:'uppercase', letterSpacing:0.8, marginBottom:12 }}>ICP Mix</div>
              {(['HOT','WARM','COLD'] as const).map(score => {
                const count = contacts.filter((c:any) => c.icp_score === score).length
                const pct = contacts.length ? Math.round(count / contacts.length * 100) : 0
                return (
                  <div key={score} style={{ marginBottom:10 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                      <span style={{ fontSize:11, fontWeight:700, color:ic[score] }}>{score}</span>
                      <span style={{ fontSize:11, color:'#9CA3AF' }}>{count} ({pct}%)</span>
                    </div>
                    <div style={{ height:5, borderRadius:3, background:'#F5F4FA', overflow:'hidden' }}>
                      <div style={{ height:'100%', width:`${pct}%`, borderRadius:3, background:ic[score], transition:'width 0.3s' }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
