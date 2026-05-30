'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { dbFetch } from '@/lib/db'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jpptlznlexkxehxnyjeh.supabase.co'
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpwcHRsem5sZXpreGVoeG55amVoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAxNTAxNjIsImV4cCI6MjA5NTcyNjE2Mn0.44OoqEBDLMaRWa3tv7vAgh7hC4XsrKs6xbDMgmXh7Is'

const ic: Record<string,string> = { HOT:'#EF4444', WARM:'#B45309', COLD:'#9CA3AF' }
const ib: Record<string,string> = { HOT:'rgba(239,68,68,0.08)', WARM:'#FFF8E7', COLD:'#F5F4FA' }
const flag: Record<string,string> = { MX:'🇲🇽', CO:'🇨🇴', PE:'🇵🇪', AR:'🇦🇷' }
const rol: Record<string,string> = { dueno:'Dueño/a', socio_director:'Socio director', gerente_admin:'Gerente admin', contador_externo:'Contador externo', cfo:'CFO', administradora:'Administradora', fundador:'Fundador/a', socio:'Socio' }
const stageLabel: Record<string,string> = { discovery:'Discovery', calificacion:'Calificación', demo:'Demo', trial:'Trial', negociacion:'Negociación', closed_won:'Closed Won', closed_lost:'Closed Lost', ramp:'Ramp' }
const stageColor: Record<string,string> = { closed_won:'#00A363', closed_lost:'#EF4444', ramp:'#5C2D91', negociacion:'#B45309', demo:'#3B82F6', trial:'#8B5CF6' }
const lossLabel: Record<string,string> = { precio:'Precio', timing:'Timing', competencia:'Competencia', no_califica:'No califica', no_responde:'No responde', proyecto_cancelado:'Proyecto cancelado' }
const painLabel: Record<string,string> = { cierres_manuales:'Cierres manuales', errores_declaraciones:'Errores en declaraciones', tiempo_conciliaciones:'Tiempo conciliaciones', reportes:'Reportes', facturacion:'Facturación', nomina:'Nómina' }

type NoteEntry = { text?: string; type?: string; created_at: string; icp_score?: string; segment?: string; confidence?: string; pain_hypothesis?: string; first_message?: string; routing_reason?: string }

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

export default function DealDetalle() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const [deal, setDeal] = useState<any>(null)
  const [contact, setContact] = useState<any>(null)
  const [company, setCompany] = useState<any>(null)
  const [rep, setRep] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [noteHistory, setNoteHistory] = useState<NoteEntry[]>([])
  const [newNote, setNewNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [activeTab, setActiveTab] = useState<'notas'|'ai'>('notas')

  useEffect(() => {
    dbFetch('deals', `select=*&id=eq.${id}`).then(async ([d]) => {
      if (!d) { setLoading(false); return }
      setDeal(d)
      setNoteHistory(parseNotes(d.notes ?? null))

      const [contacts, reps] = await Promise.all([
        dbFetch('contacts', `select=*&id=eq.${d.contact_id}`),
        dbFetch('reps', `select=*&id=eq.${d.rep_id}`),
      ])
      const c = contacts[0] ?? null
      setContact(c)
      setRep(reps[0] ?? null)

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
    await fetch(`${SUPABASE_URL}/rest/v1/deals?id=eq.${id}`, {
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

  if (!deal) return <div style={{ padding:'40px', color:'#9CA3AF' }}>Deal no encontrado.</div>

  const stageCol = stageColor[deal.stage] ?? '#6B7280'

  return (
    <div style={{ padding:'28px 32px', height:'100vh', display:'flex', flexDirection:'column', overflow:'hidden' }}>
      <button onClick={() => router.push('/pipeline')} style={{ display:'inline-flex', alignItems:'center', gap:6, fontSize:13, color:'#6B7280', background:'none', border:'none', cursor:'pointer', padding:'0 0 18px', fontFamily:'inherit' }}>
        ← Volver a Deals
      </button>

      <div style={{ display:'grid', gridTemplateColumns:'260px 1fr 220px', gap:20, flex:1, minHeight:0 }}>

        {/* ── LEFT ── */}
        <div style={{ overflowY:'auto', display:'flex', flexDirection:'column', gap:14 }}>
          {/* Title card */}
          <div style={{ background:'#fff', border:'1px solid #E5E7EB', borderRadius:12, padding:'20px', boxShadow:'0 2px 8px rgba(0,0,0,0.04)', borderTop:`3px solid ${stageCol}` }}>
            <div style={{ fontSize:15, fontWeight:800, color:'#1A1A2E', marginBottom:12, lineHeight:1.3 }}>{deal.title}</div>
            <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:12 }}>
              <span style={{ fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:20, color:ic[deal.icp_score], background:ib[deal.icp_score] }}>{deal.icp_score}</span>
              <span style={{ fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:20, background: stageCol+'18', color: stageCol }}>{stageLabel[deal.stage] ?? deal.stage}</span>
              <span style={{ fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:20, background: deal.pipeline==='contadores' ? '#F0EDF8' : '#E8F8F0', color: deal.pipeline==='contadores' ? '#5C2D91' : '#00A363' }}>
                {deal.pipeline === 'contadores' ? 'Contadores' : 'PyMEs'}
              </span>
            </div>
            {Number(deal.mrr) > 0 && (
              <div style={{ fontSize:22, fontWeight:800, color:'#1A1A2E' }}>${Number(deal.mrr).toLocaleString()}<span style={{ fontSize:13, color:'#9CA3AF', fontWeight:500 }}>/mes</span></div>
            )}
          </div>

          {/* Properties */}
          <div style={{ background:'#fff', border:'1px solid #E5E7EB', borderRadius:12, padding:'18px 20px', boxShadow:'0 2px 8px rgba(0,0,0,0.04)' }}>
            <div style={{ fontSize:11, color:'#9CA3AF', fontWeight:700, textTransform:'uppercase', letterSpacing:0.8, marginBottom:14 }}>Propiedades</div>
            <Prop label="Confianza" value={deal.confidence} />
            <Prop label="Fecha de cierre" value={deal.close_date ? new Date(deal.close_date).toLocaleDateString('es-MX', { year:'numeric', month:'short', day:'numeric' }) : null} />
            <Prop label="Tiempo de respuesta" value={deal.response_time_min != null ? `${deal.response_time_min} min` : null} />
            <Prop label="Software actual" value={deal.current_software} />
            <Prop label="Pain category" value={deal.pain_category ? (painLabel[deal.pain_category] ?? deal.pain_category) : null} />
            <Prop label="Descuento" value={deal.discount_pct != null ? `${deal.discount_pct}%` : null} />
            <Prop label="Facturas en trial" value={deal.trial_facturas != null ? `${deal.trial_facturas}` : null} />
            <Prop label="Nivel de interés" value={deal.interest_level != null ? `${deal.interest_level}/5` : null} />
            {deal.loss_reason && (
              <div style={{ marginTop:4, padding:'8px 12px', background:'rgba(239,68,68,0.06)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:8 }}>
                <div style={{ fontSize:10, color:'#EF4444', fontWeight:700, textTransform:'uppercase', letterSpacing:0.8, marginBottom:2 }}>Motivo de pérdida</div>
                <div style={{ fontSize:13, color:'#EF4444', fontWeight:600 }}>{lossLabel[deal.loss_reason] ?? deal.loss_reason}</div>
              </div>
            )}
            {deal.pain_hypothesis && (
              <div style={{ marginTop:12, padding:'10px 12px', background:'#F5F4FA', borderRadius:8, borderLeft:'3px solid #5C2D91' }}>
                <div style={{ fontSize:10, color:'#5C2D91', fontWeight:700, textTransform:'uppercase', letterSpacing:0.8, marginBottom:4 }}>Pain hypothesis</div>
                <div style={{ fontSize:12, color:'#374151', lineHeight:1.5 }}>{deal.pain_hypothesis}</div>
              </div>
            )}
          </div>
        </div>

        {/* ── CENTER ── */}
        <div style={{ overflowY:'auto', display:'flex', flexDirection:'column', gap:16 }}>

          {/* Contacto asociado */}
          <div style={{ background:'#fff', border:'1px solid #E5E7EB', borderRadius:12, overflow:'hidden', boxShadow:'0 2px 8px rgba(0,0,0,0.04)' }}>
            <div style={{ padding:'16px 20px', borderBottom:'1px solid #E5E7EB' }}>
              <span style={{ fontSize:13, fontWeight:700, color:'#1A1A2E' }}>Contacto asociado</span>
            </div>
            {contact ? (
              <div onClick={() => router.push(`/contactos/${contact.id}`)} style={{ padding:'14px 20px', display:'flex', alignItems:'center', gap:12, cursor:'pointer' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#F9FAFB')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <div style={{ width:38, height:38, borderRadius:'50%', background:ib[contact.icp_score], border:`2px solid ${ic[contact.icp_score]}33`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:800, color:ic[contact.icp_score], flexShrink:0 }}>
                  {contact.first_name?.[0]}{contact.last_name?.[0]}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:'#1A1A2E' }}>{contact.first_name} {contact.last_name}</div>
                  <div style={{ fontSize:11, color:'#9CA3AF' }}>{rol[contact.role] ?? contact.role} · {flag[contact.country]}</div>
                </div>
                <div style={{ display:'flex', gap:6 }}>
                  <span style={{ fontSize:11, fontWeight:700, padding:'2px 8px', borderRadius:20, color:ic[contact.icp_score], background:ib[contact.icp_score] }}>{contact.icp_score}</span>
                  <span style={{ fontSize:11, fontWeight:700, padding:'2px 8px', borderRadius:20, background: contact.segment==='CONTADOR' ? '#F0EDF8' : '#E8F8F0', color: contact.segment==='CONTADOR' ? '#5C2D91' : '#00A363' }}>{contact.segment}</span>
                </div>
              </div>
            ) : (
              <div style={{ padding:'24px 20px', textAlign:'center', color:'#9CA3AF', fontSize:13 }}>Sin contacto asociado</div>
            )}
          </div>

          {/* Empresa asociada */}
          <div style={{ background:'#fff', border:'1px solid #E5E7EB', borderRadius:12, overflow:'hidden', boxShadow:'0 2px 8px rgba(0,0,0,0.04)' }}>
            <div style={{ padding:'16px 20px', borderBottom:'1px solid #E5E7EB' }}>
              <span style={{ fontSize:13, fontWeight:700, color:'#1A1A2E' }}>Empresa asociada</span>
            </div>
            {company ? (
              <div onClick={() => router.push(`/empresas/${company.id}`)} style={{ padding:'14px 20px', display:'flex', alignItems:'center', gap:12, cursor:'pointer' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#F9FAFB')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <div style={{ width:38, height:38, borderRadius:9, background: company.segment==='CONTADOR' ? '#F0EDF8' : '#E8F8F0', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 }}>
                  {company.segment === 'CONTADOR' ? '⊞' : '◧'}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:'#1A1A2E' }}>{company.name}</div>
                  <div style={{ fontSize:11, color:'#9CA3AF' }}>{company.industry} · {flag[company.country]}</div>
                </div>
                <span style={{ fontSize:11, fontWeight:700, padding:'2px 8px', borderRadius:20, background: company.segment==='CONTADOR' ? '#F0EDF8' : '#E8F8F0', color: company.segment==='CONTADOR' ? '#5C2D91' : '#00A363' }}>
                  {company.segment === 'CONTADOR' ? 'Contador' : 'PyME'}
                </span>
              </div>
            ) : (
              <div style={{ padding:'24px 20px', textAlign:'center', color:'#9CA3AF', fontSize:13 }}>Sin empresa asociada</div>
            )}
          </div>

          {/* Notas + Análisis IA tabs */}
          <div style={{ background:'#fff', border:'1px solid #E5E7EB', borderRadius:12, overflow:'hidden', boxShadow:'0 2px 8px rgba(0,0,0,0.04)' }}>
            {/* Tab header */}
            <div style={{ padding:'0 20px', borderBottom:'1px solid #E5E7EB', display:'flex', gap:0 }}>
              {([
                { id:'notas', label:'Notas' },
                { id:'ai', label:'◆ Análisis IA', hasData: noteHistory.some(n => n.type === 'ai_analysis') },
              ] as const).map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ padding:'14px 16px', fontSize:13, fontWeight: activeTab===tab.id ? 700 : 500, color: activeTab===tab.id ? (tab.id==='ai' ? '#5C2D91' : '#1A1A2E') : '#9CA3AF', background:'none', border:'none', borderBottom: activeTab===tab.id ? `2px solid ${tab.id==='ai' ? '#5C2D91' : '#1A1A2E'}` : '2px solid transparent', cursor:'pointer', marginBottom:-1, transition:'all 0.15s', display:'flex', alignItems:'center', gap:6 }}>
                  {tab.label}
                  {tab.id === 'ai' && (tab as any).hasData && <span style={{ width:6, height:6, borderRadius:'50%', background:'#5C2D91', display:'inline-block' }} />}
                </button>
              ))}
            </div>
            {/* TAB: Notas */}
            {activeTab === 'notas' && <>
              <div style={{ padding:'16px 20px', borderBottom: noteHistory.filter(n=>!n.type).length > 0 ? '1px solid #E5E7EB' : 'none' }}>
                <textarea value={newNote} onChange={e => setNewNote(e.target.value)} placeholder="Escribe una nota sobre este deal…" rows={3}
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
                      <div style={{ width:28, height:28, borderRadius:'50%', background:'rgba(0,192,115,0.1)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:800, color:'#00A363', flexShrink:0, marginTop:1 }}>◈</div>
                      <div style={{ flex:1 }}>
                        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                          <span style={{ fontSize:12, fontWeight:700, color:'#1A1A2E' }}>Nota del deal</span>
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

            {/* TAB: Análisis IA */}
            {activeTab === 'ai' && (() => {
              const aiEntries = noteHistory.filter(n => n.type === 'ai_analysis')
              if (aiEntries.length === 0) return (
                <div style={{ padding:'32px 20px', textAlign:'center' }}>
                  <div style={{ fontSize:24, marginBottom:10 }}>◆</div>
                  <div style={{ fontSize:13, color:'#9CA3AF' }}>Este deal aún no tiene análisis de IA.<br />Usa el Lead Intelligence Agent para clasificarlo.</div>
                </div>
              )
              return (
                <div style={{ padding:'20px', display:'flex', flexDirection:'column', gap:16 }}>
                  {aiEntries.map((entry, i) => (
                    <div key={i}>
                      {/* Header badge */}
                      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:8, padding:'5px 12px', background:'rgba(92,45,145,0.08)', borderRadius:20, border:'1px solid rgba(92,45,145,0.2)' }}>
                          <span style={{ width:7, height:7, borderRadius:'50%', background:'#5C2D91', display:'inline-block' }} />
                          <span style={{ fontSize:11, fontWeight:700, color:'#5C2D91', textTransform:'uppercase', letterSpacing:0.8 }}>DeepSeek Analysis</span>
                        </div>
                        <span style={{ fontSize:11, color:'#9CA3AF' }}>{new Date(entry.created_at).toLocaleDateString('es-MX', { day:'numeric', month:'short', year:'numeric' })} · {new Date(entry.created_at).toLocaleTimeString('es-MX', { hour:'2-digit', minute:'2-digit' })}</span>
                      </div>

                      {/* Scores row */}
                      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10, marginBottom:14 }}>
                        {entry.icp_score && (
                          <div style={{ padding:'12px', background:ib[entry.icp_score]??'#F5F4FA', borderRadius:10, textAlign:'center', border:`1px solid ${(ic[entry.icp_score]??'#9CA3AF')}33` }}>
                            <div style={{ fontSize:18, fontWeight:800, color:ic[entry.icp_score] }}>{entry.icp_score}</div>
                            <div style={{ fontSize:10, color:'#9CA3AF', marginTop:2 }}>ICP Score</div>
                          </div>
                        )}
                        {entry.segment && (
                          <div style={{ padding:'12px', background:'#F5F4FA', borderRadius:10, textAlign:'center' }}>
                            <div style={{ fontSize:13, fontWeight:700, color: entry.segment==='CONTADOR'?'#5C2D91':'#00A363' }}>{entry.segment}</div>
                            <div style={{ fontSize:10, color:'#9CA3AF', marginTop:2 }}>Segmento</div>
                          </div>
                        )}
                        {entry.confidence && (
                          <div style={{ padding:'12px', background:'#F5F4FA', borderRadius:10, textAlign:'center' }}>
                            <div style={{ fontSize:13, fontWeight:700, color:'#6B7280' }}>{entry.confidence}</div>
                            <div style={{ fontSize:10, color:'#9CA3AF', marginTop:2 }}>Confianza</div>
                          </div>
                        )}
                      </div>

                      {/* Pain hypothesis */}
                      {entry.pain_hypothesis && (
                        <div style={{ padding:'12px 14px', background:'#F5F4FA', borderRadius:10, borderLeft:'3px solid #5C2D91', marginBottom:14 }}>
                          <div style={{ fontSize:10, color:'#5C2D91', fontWeight:700, textTransform:'uppercase', letterSpacing:0.8, marginBottom:5 }}>Pain hypothesis</div>
                          <div style={{ fontSize:13, color:'#374151', lineHeight:1.5 }}>{entry.pain_hypothesis}</div>
                        </div>
                      )}

                      {/* WhatsApp message */}
                      {entry.first_message && (
                        <div style={{ padding:'14px', background:'#1a2b1a', borderRadius:10, marginBottom: entry.routing_reason ? 14 : 0 }}>
                          <div style={{ fontSize:10, color:'#52c41a', fontWeight:700, textTransform:'uppercase', letterSpacing:0.8, marginBottom:8 }}>📱 Primer mensaje WhatsApp</div>
                          <div style={{ fontSize:13, color:'#e8e8ed', lineHeight:1.6, background:'#0f1f0f', borderRadius:8, padding:'10px 12px' }}>{entry.first_message}</div>
                        </div>
                      )}

                      {/* Routing reason */}
                      {entry.routing_reason && (
                        <div style={{ padding:'10px 14px', background:'rgba(0,192,115,0.06)', borderRadius:8, border:'1px solid rgba(0,192,115,0.15)' }}>
                          <div style={{ fontSize:10, color:'#00A363', fontWeight:700, textTransform:'uppercase', letterSpacing:0.8, marginBottom:3 }}>Routing</div>
                          <div style={{ fontSize:12, color:'#374151' }}>{entry.routing_reason}</div>
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
          {/* Rep */}
          {rep && (
            <div style={{ background:'#fff', border:'1px solid #E5E7EB', borderRadius:12, padding:'18px', boxShadow:'0 2px 8px rgba(0,0,0,0.04)' }}>
              <div style={{ fontSize:11, color:'#9CA3AF', fontWeight:700, textTransform:'uppercase', letterSpacing:0.8, marginBottom:14 }}>Rep asignado</div>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
                <div style={{ width:38, height:38, borderRadius:'50%', background:'#00C073', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:800, color:'#fff', flexShrink:0 }}>
                  {rep.avatar}
                </div>
                <div>
                  <div style={{ fontSize:13, fontWeight:700, color:'#1A1A2E' }}>{rep.name}</div>
                  <div style={{ fontSize:11, color:'#9CA3AF' }}>{rep.specialization === 'mixed' ? 'Contadores + PyMEs' : rep.specialization}</div>
                </div>
              </div>
              <div style={{ marginBottom:6, display:'flex', justifyContent:'space-between' }}>
                <span style={{ fontSize:12, color:'#6B7280' }}>Capacity</span>
                <span style={{ fontSize:12, fontWeight:700, color: rep.capacity_score >= 80 ? '#EF4444' : rep.capacity_score >= 60 ? '#B45309' : '#00A363' }}>{rep.capacity_score}%</span>
              </div>
              <div style={{ height:5, borderRadius:3, background:'#F5F4FA', overflow:'hidden' }}>
                <div style={{ height:'100%', width:`${rep.capacity_score}%`, borderRadius:3, background: rep.capacity_score >= 80 ? '#EF4444' : rep.capacity_score >= 60 ? '#F59E0B' : '#00C073' }} />
              </div>
            </div>
          )}

          {/* Stats */}
          <div style={{ background:'#fff', border:'1px solid #E5E7EB', borderRadius:12, padding:'18px', boxShadow:'0 2px 8px rgba(0,0,0,0.04)' }}>
            <div style={{ fontSize:11, color:'#9CA3AF', fontWeight:700, textTransform:'uppercase', letterSpacing:0.8, marginBottom:14 }}>Resumen</div>
            {[
              { label:'MRR', value: Number(deal.mrr) > 0 ? `$${Number(deal.mrr).toLocaleString()}` : '—' },
              { label:'Pipeline', value: deal.pipeline === 'contadores' ? 'Contadores' : 'PyMEs' },
              { label:'Etapa', value: stageLabel[deal.stage] ?? deal.stage },
              { label:'Resp. tiempo', value: deal.response_time_min != null ? `${deal.response_time_min} min` : '—' },
              { label:'Actualizado', value: deal.updated_at ? new Date(deal.updated_at).toLocaleDateString('es-MX', { day:'numeric', month:'short' }) : '—' },
            ].map(s => (
              <div key={s.label} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
                <span style={{ fontSize:12, color:'#6B7280' }}>{s.label}</span>
                <span style={{ fontSize:13, fontWeight:700, color:'#1A1A2E' }}>{s.value}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
