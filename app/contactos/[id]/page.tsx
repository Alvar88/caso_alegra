'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { dbFetch } from '@/lib/db'
import CreateDealModal from '@/components/modals/CreateDealModal'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jpptlznlexkxehxnyjeh.supabase.co'
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpwcHRsem5sZXpreGVoeG55amVoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAxNTAxNjIsImV4cCI6MjA5NTcyNjE2Mn0.44OoqEBDLMaRWa3tv7vAgh7hC4XsrKs6xbDMgmXh7Is'

const ic: Record<string,string> = { HOT:'#EF4444', WARM:'#B45309', COLD:'#9CA3AF' }
const ib: Record<string,string> = { HOT:'rgba(239,68,68,0.08)', WARM:'#FFF8E7', COLD:'#F5F4FA' }
const flag: Record<string,string> = { MX:'🇲🇽', CO:'🇨🇴', PE:'🇵🇪', AR:'🇦🇷' }
const rol: Record<string,string> = { dueno:'Dueño/a', socio_director:'Socio director', gerente_admin:'Gerente admin', contador_externo:'Contador externo', cfo:'CFO', administradora:'Administradora', fundador:'Fundador/a', socio:'Socio' }
const src: Record<string,string> = { webinar:'Webinar', formulario_web:'Formulario web', referido:'Referido', demo_solicitada:'Demo solicitada', descarga_guia:'Descarga guía', email_campaign:'Email campaign', google_ads:'Google Ads' }
const stageLabel: Record<string,string> = { discovery:'Discovery', calificacion:'Calificación', demo:'Demo', trial:'Trial', negociacion:'Negociación', closed_won:'Closed Won', closed_lost:'Closed Lost', ramp:'Ramp' }
const stageColor: Record<string,string> = { closed_won:'#00A363', closed_lost:'#EF4444', ramp:'#5C2D91' }

type NoteEntry = { text?: string; type?: string; created_at: string; icp_score?: string; segment?: string; confidence?: string; pain_hypothesis?: string; first_message?: string; routing_reason?: string }

function parseNotes(raw: string | null): NoteEntry[] {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) return parsed
    // Plain text legacy → wrap as single entry
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

export default function ContactoDetalle() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const [contact, setContact] = useState<any>(null)
  const [company, setCompany] = useState<any>(null)
  const [deals, setDeals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [noteHistory, setNoteHistory] = useState<NoteEntry[]>([])
  const [newNote, setNewNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [showCreateDeal, setShowCreateDeal] = useState(false)
  const [activeTab, setActiveTab] = useState<'notas'|'ai'>('notas')

  useEffect(() => {
    Promise.all([
      dbFetch('contacts', `select=*&id=eq.${id}`),
      dbFetch('deals', `select=*&contact_id=eq.${id}&order=updated_at.desc`),
    ]).then(async ([contacts, dealsData]) => {
      const c = contacts[0] ?? null
      setContact(c)
      setNoteHistory(parseNotes(c?.notes ?? null))
      setDeals(dealsData)
      if (c?.company_id) {
        const cos = await dbFetch('companies', `select=*&id=eq.${c.company_id}`)
        setCompany(cos[0] ?? null)
      }
      setLoading(false)
    })
  }, [id])

  async function addNote() {
    if (!newNote.trim()) return
    setSaving(true)
    const entry: NoteEntry = { text: newNote.trim(), created_at: new Date().toISOString() }
    const updated = [entry, ...noteHistory]
    await fetch(`${SUPABASE_URL}/rest/v1/contacts?id=eq.${id}`, {
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

  if (!contact) return (
    <div style={{ padding:'40px', color:'#9CA3AF' }}>Contacto no encontrado.</div>
  )

  const initials = `${contact.first_name?.[0] ?? ''}${contact.last_name?.[0] ?? ''}`

  return (
    <div style={{ padding:'28px 32px', height:'100vh', display:'flex', flexDirection:'column', overflow:'hidden' }}>
      {showCreateDeal && <CreateDealModal preselectedContactId={id} onClose={() => setShowCreateDeal(false)} onCreated={() => { setShowCreateDeal(false); window.location.reload() }} />}

      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', paddingBottom:18 }}>
        <button onClick={() => router.push('/contactos')} style={{ display:'inline-flex', alignItems:'center', gap:6, fontSize:13, color:'#6B7280', background:'none', border:'none', cursor:'pointer', padding:0, fontFamily:'inherit' }}>
          ← Volver a Contactos
        </button>
        <button onClick={() => setShowCreateDeal(true)} style={{ padding:'8px 16px', background:'#5C2D91', color:'#fff', border:'none', borderRadius:8, fontSize:12, fontWeight:700, cursor:'pointer', boxShadow:'0 2px 8px rgba(92,45,145,0.25)' }}>
          + Nuevo deal
        </button>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'260px 1fr 220px', gap:20, flex:1, minHeight:0 }}>

        {/* ── LEFT ── */}
        <div style={{ overflowY:'auto', display:'flex', flexDirection:'column', gap:14 }}>
          <div style={{ background:'#fff', border:'1px solid #E5E7EB', borderRadius:12, padding:'22px 20px', textAlign:'center', boxShadow:'0 2px 8px rgba(0,0,0,0.04)' }}>
            <div style={{ width:56, height:56, borderRadius:'50%', background:ib[contact.icp_score], border:`2px solid ${ic[contact.icp_score]}44`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, fontWeight:800, color:ic[contact.icp_score], margin:'0 auto 12px' }}>
              {initials}
            </div>
            <div style={{ fontSize:16, fontWeight:800, color:'#1A1A2E', marginBottom:6 }}>{contact.first_name} {contact.last_name}</div>
            <div style={{ fontSize:12, color:'#6B7280', marginBottom:12 }}>{rol[contact.role] ?? contact.role} · {flag[contact.country]}</div>
            <div style={{ display:'flex', gap:6, justifyContent:'center', flexWrap:'wrap' }}>
              <span style={{ fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:20, color:ic[contact.icp_score], background:ib[contact.icp_score] }}>{contact.icp_score}</span>
              <span style={{ fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:20, background: contact.segment==='CONTADOR' ? '#F0EDF8' : '#E8F8F0', color: contact.segment==='CONTADOR' ? '#5C2D91' : '#00A363' }}>{contact.segment}</span>
            </div>
          </div>

          <div style={{ background:'#fff', border:'1px solid #E5E7EB', borderRadius:12, padding:'18px 20px', boxShadow:'0 2px 8px rgba(0,0,0,0.04)' }}>
            <div style={{ fontSize:11, color:'#9CA3AF', fontWeight:700, textTransform:'uppercase', letterSpacing:0.8, marginBottom:14 }}>Propiedades</div>
            <Prop label="Email" value={contact.email} />
            <Prop label="Teléfono" value={contact.phone} />
            <Prop label="País" value={`${flag[contact.country]} ${contact.country}`} />
            <Prop label="Fuente" value={src[contact.source] ?? contact.source} />
            <Prop label="Creado" value={contact.created_at ? new Date(contact.created_at).toLocaleDateString('es-MX', { year:'numeric', month:'short', day:'numeric' }) : null} />
          </div>
        </div>

        {/* ── CENTER ── */}
        <div style={{ overflowY:'auto', display:'flex', flexDirection:'column', gap:16 }}>
          {/* Deals */}
          <div style={{ background:'#fff', border:'1px solid #E5E7EB', borderRadius:12, overflow:'hidden', boxShadow:'0 2px 8px rgba(0,0,0,0.04)' }}>
            <div style={{ padding:'16px 20px', borderBottom:'1px solid #E5E7EB', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <span style={{ fontSize:13, fontWeight:700, color:'#1A1A2E' }}>Deals asociados</span>
              <span style={{ fontSize:12, color:'#9CA3AF' }}>{deals.length} deal{deals.length !== 1 ? 's' : ''}</span>
            </div>
            {deals.length === 0 ? (
              <div style={{ padding:'28px 20px', textAlign:'center', color:'#9CA3AF', fontSize:13 }}>Sin deals asociados</div>
            ) : (
              <>
                <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr', padding:'10px 20px', background:'#F5F4FA', fontSize:11, color:'#9CA3AF', textTransform:'uppercase', letterSpacing:0.8, fontWeight:700 }}>
                  <div>Título</div><div>Etapa</div><div>ICP</div><div>MRR</div>
                </div>
                {deals.map((d, i) => (
                  <div key={d.id} style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr', padding:'13px 20px', borderBottom: i < deals.length-1 ? '1px solid #E5E7EB' : 'none', alignItems:'center' }}>
                    <div style={{ fontSize:13, fontWeight:600, color:'#1A1A2E' }}>{d.title}</div>
                    <div><span style={{ fontSize:11, fontWeight:700, padding:'2px 8px', borderRadius:20, background: stageColor[d.stage] ? stageColor[d.stage]+'18' : '#F5F4FA', color: stageColor[d.stage] ?? '#6B7280' }}>{stageLabel[d.stage] ?? d.stage}</span></div>
                    <div><span style={{ fontSize:11, fontWeight:700, padding:'2px 8px', borderRadius:20, color:ic[d.icp_score], background:ib[d.icp_score] }}>{d.icp_score}</span></div>
                    <div style={{ fontSize:13, fontWeight:700, color: d.stage==='closed_won' ? '#00A363' : '#1A1A2E' }}>{Number(d.mrr) > 0 ? `$${Number(d.mrr).toLocaleString()}/m` : '—'}</div>
                  </div>
                ))}
              </>
            )}
          </div>

          {/* Notes + AI tab */}
          <div style={{ background:'#fff', border:'1px solid #E5E7EB', borderRadius:12, overflow:'hidden', boxShadow:'0 2px 8px rgba(0,0,0,0.04)' }}>
            {/* Tab header */}
            <div style={{ padding:'0 20px', borderBottom:'1px solid #E5E7EB', display:'flex' }}>
              {([
                { id:'notas' as const, label:'Notas' },
                { id:'ai' as const, label:'◆ Análisis IA' },
              ]).map(tab => {
                const hasAI = noteHistory.some(n => n.type === 'ai_analysis')
                return (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ padding:'14px 16px', fontSize:13, fontWeight: activeTab===tab.id ? 700 : 500, color: activeTab===tab.id ? (tab.id==='ai' ? '#5C2D91' : '#1A1A2E') : '#9CA3AF', background:'none', border:'none', borderBottom: activeTab===tab.id ? `2px solid ${tab.id==='ai' ? '#5C2D91' : '#1A1A2E'}` : '2px solid transparent', cursor:'pointer', marginBottom:-1, display:'flex', alignItems:'center', gap:6 }}>
                    {tab.label}
                    {tab.id === 'ai' && hasAI && <span style={{ width:6, height:6, borderRadius:'50%', background:'#5C2D91', display:'inline-block' }} />}
                  </button>
                )
              })}
            </div>

            {/* Tab: Notas */}
            {activeTab === 'notas' && <>
              <div style={{ padding:'16px 20px', borderBottom: noteHistory.filter(n=>!n.type).length > 0 ? '1px solid #E5E7EB' : 'none' }}>
                <textarea value={newNote} onChange={e => setNewNote(e.target.value)} placeholder="Escribe una nota…" rows={3}
                  style={{ width:'100%', padding:'10px 12px', border:'1px solid #E5E7EB', borderRadius:8, fontSize:13, color:'#1A1A2E', resize:'none', outline:'none', fontFamily:'inherit', background:'#FAFAFA', boxSizing:'border-box' }}
                  onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) addNote() }}
                />
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:10 }}>
                  <span style={{ fontSize:11, color:'#9CA3AF' }}>⌘ + Enter para guardar</span>
                  <button onClick={addNote} disabled={saving || !newNote.trim()}
                    style={{ padding:'8px 18px', background: saved ? '#00A363' : !newNote.trim() ? '#E5E7EB' : '#00C073', color: !newNote.trim() ? '#9CA3AF' : '#fff', border:'none', borderRadius:8, fontSize:13, fontWeight:700, cursor: newNote.trim() ? 'pointer' : 'default' }}>
                    {saved ? '✓ Guardado' : saving ? 'Guardando…' : 'Agregar nota'}
                  </button>
                </div>
              </div>
              {noteHistory.filter(n => !n.type).length > 0 ? (
                <div style={{ padding:'4px 0' }}>
                  {noteHistory.filter(n => !n.type).map((n, i, arr) => (
                    <div key={i} style={{ padding:'14px 20px', borderBottom: i < arr.length-1 ? '1px solid #F5F4FA' : 'none', display:'flex', gap:12 }}>
                      <div style={{ width:28, height:28, borderRadius:'50%', background:'#F0EDF8', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:800, color:'#5C2D91', flexShrink:0, marginTop:1 }}>{contact.first_name?.[0]}</div>
                      <div style={{ flex:1 }}>
                        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                          <span style={{ fontSize:12, fontWeight:700, color:'#1A1A2E' }}>{contact.first_name} {contact.last_name}</span>
                          <span style={{ fontSize:11, color:'#9CA3AF' }}>{new Date(n.created_at).toLocaleDateString('es-MX', { day:'numeric', month:'short' })} · {new Date(n.created_at).toLocaleTimeString('es-MX', { hour:'2-digit', minute:'2-digit' })}</span>
                        </div>
                        <div style={{ fontSize:13, color:'#374151', lineHeight:1.5 }}>{n.text}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding:'20px', textAlign:'center', color:'#9CA3AF', fontSize:12 }}>Sin notas aún</div>
              )}
            </>}

            {/* Tab: Análisis IA */}
            {activeTab === 'ai' && (() => {
              const aiEntries = noteHistory.filter(n => n.type === 'ai_analysis')
              if (aiEntries.length === 0) return (
                <div style={{ padding:'32px 20px', textAlign:'center' }}>
                  <div style={{ fontSize:24, marginBottom:10 }}>◆</div>
                  <div style={{ fontSize:13, color:'#9CA3AF' }}>Sin análisis de IA aún.<br />Usa el Lead Intelligence Agent para clasificar este contacto.</div>
                </div>
              )
              return (
                <div style={{ padding:'20px', display:'flex', flexDirection:'column', gap:16 }}>
                  {aiEntries.map((entry, i) => (
                    <div key={i}>
                      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:8, padding:'5px 12px', background:'rgba(92,45,145,0.08)', borderRadius:20, border:'1px solid rgba(92,45,145,0.2)' }}>
                          <span style={{ width:7, height:7, borderRadius:'50%', background:'#5C2D91', display:'inline-block' }} />
                          <span style={{ fontSize:11, fontWeight:700, color:'#5C2D91', textTransform:'uppercase', letterSpacing:0.8 }}>DeepSeek Analysis</span>
                        </div>
                        <span style={{ fontSize:11, color:'#9CA3AF' }}>{new Date(entry.created_at).toLocaleDateString('es-MX', { day:'numeric', month:'short' })} · {new Date(entry.created_at).toLocaleTimeString('es-MX', { hour:'2-digit', minute:'2-digit' })}</span>
                      </div>
                      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10, marginBottom:14 }}>
                        {entry.icp_score && <div style={{ padding:'12px', background:ib[entry.icp_score]??'#F5F4FA', borderRadius:10, textAlign:'center', border:`1px solid ${(ic[entry.icp_score]??'#9CA3AF')}33` }}><div style={{ fontSize:18, fontWeight:800, color:ic[entry.icp_score] }}>{entry.icp_score}</div><div style={{ fontSize:10, color:'#9CA3AF', marginTop:2 }}>ICP Score</div></div>}
                        {entry.segment && <div style={{ padding:'12px', background:'#F5F4FA', borderRadius:10, textAlign:'center' }}><div style={{ fontSize:13, fontWeight:700, color: entry.segment==='CONTADOR'?'#5C2D91':'#00A363' }}>{entry.segment}</div><div style={{ fontSize:10, color:'#9CA3AF', marginTop:2 }}>Segmento</div></div>}
                        {entry.confidence && <div style={{ padding:'12px', background:'#F5F4FA', borderRadius:10, textAlign:'center' }}><div style={{ fontSize:13, fontWeight:700, color:'#6B7280' }}>{entry.confidence}</div><div style={{ fontSize:10, color:'#9CA3AF', marginTop:2 }}>Confianza</div></div>}
                      </div>
                      {entry.pain_hypothesis && (
                        <div style={{ padding:'12px 14px', background:'#F5F4FA', borderRadius:10, borderLeft:'3px solid #5C2D91', marginBottom:14 }}>
                          <div style={{ fontSize:10, color:'#5C2D91', fontWeight:700, textTransform:'uppercase', letterSpacing:0.8, marginBottom:5 }}>Pain hypothesis</div>
                          <div style={{ fontSize:13, color:'#374151', lineHeight:1.5 }}>{entry.pain_hypothesis}</div>
                        </div>
                      )}
                      {entry.first_message && (
                        <div style={{ padding:'14px', background:'#1a2b1a', borderRadius:10 }}>
                          <div style={{ fontSize:10, color:'#52c41a', fontWeight:700, textTransform:'uppercase', letterSpacing:0.8, marginBottom:8 }}>📱 Primer mensaje WhatsApp</div>
                          <div style={{ fontSize:13, color:'#e8e8ed', lineHeight:1.6, background:'#0f1f0f', borderRadius:8, padding:'10px 12px' }}>{entry.first_message}</div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )
            })()}
          </div>
        </div>

        {/* ── RIGHT ── */}
        <div style={{ overflowY:'auto', display:'flex', flexDirection:'column', gap:14 }}>
          <div style={{ background:'#fff', border:'1px solid #E5E7EB', borderRadius:12, padding:'18px', boxShadow:'0 2px 8px rgba(0,0,0,0.04)' }}>
            <div style={{ fontSize:11, color:'#9CA3AF', fontWeight:700, textTransform:'uppercase', letterSpacing:0.8, marginBottom:14 }}>Empresa asociada</div>
            {company ? (
              <>
                <div onClick={() => router.push(`/empresas/${company.id}`)} style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14, cursor:'pointer', borderRadius:8, padding:'6px', margin:'-6px -6px 8px' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#F9FAFB')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <div style={{ width:36, height:36, borderRadius:9, background: company.segment==='CONTADOR' ? '#F0EDF8' : '#E8F8F0', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, flexShrink:0 }}>
                    {company.segment === 'CONTADOR' ? '⊞' : '◧'}
                  </div>
                  <div>
                    <div style={{ fontSize:13, fontWeight:700, color:'#1A1A2E' }}>{company.name}</div>
                    <div style={{ fontSize:11, color:'#9CA3AF' }}>{company.industry}</div>
                  </div>
                </div>
                <Prop label="Segmento" value={company.segment === 'CONTADOR' ? 'Contador' : 'PyME'} />
                <Prop label={company.clients != null ? 'Clientes' : 'Empleados'} value={company.clients != null ? `${company.clients}` : company.employees != null ? `${company.employees}` : null} />
                <Prop label="País" value={`${flag[company.country]} ${company.country}`} />
                <Prop label="Software actual" value={company.current_software} />
              </>
            ) : (
              <div style={{ fontSize:13, color:'#9CA3AF', fontStyle:'italic' }}>Sin empresa asociada</div>
            )}
          </div>

          {deals.length > 0 && (
            <div style={{ background:'#fff', border:'1px solid #E5E7EB', borderRadius:12, padding:'18px', boxShadow:'0 2px 8px rgba(0,0,0,0.04)' }}>
              <div style={{ fontSize:11, color:'#9CA3AF', fontWeight:700, textTransform:'uppercase', letterSpacing:0.8, marginBottom:14 }}>Resumen deals</div>
              {[
                { label:'Total', value: deals.length },
                { label:'Won', value: deals.filter(d=>d.stage==='closed_won').length },
                { label:'Activos', value: deals.filter(d=>!['closed_won','closed_lost'].includes(d.stage)).length },
                { label:'MRR', value: `$${deals.filter(d=>d.stage==='closed_won').reduce((s,d)=>s+Number(d.mrr),0).toLocaleString()}` },
              ].map(s => (
                <div key={s.label} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
                  <span style={{ fontSize:12, color:'#6B7280' }}>{s.label}</span>
                  <span style={{ fontSize:13, fontWeight:700, color:'#1A1A2E' }}>{s.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
