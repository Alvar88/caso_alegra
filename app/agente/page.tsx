'use client'
import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { dbFetch } from '@/lib/db'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jpptlznlexkxehxnyjeh.supabase.co'
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpwcHRsem5sZXpreGVoeG55amVoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAxNTAxNjIsImV4cCI6MjA5NTcyNjE2Mn0.44OoqEBDLMaRWa3tv7vAgh7hC4XsrKs6xbDMgmXh7Is'

const rolLabel: Record<string,string> = { dueno:'Dueño/a', socio_director:'Socio director', gerente_admin:'Gerente admin', contador_externo:'Contador externo', cfo:'CFO', administradora:'Administradora', fundador:'Fundador/a' }
const srcLabel: Record<string,string> = { webinar:'Webinar', formulario_web:'Formulario web', referido:'Referido', demo_solicitada:'Demo solicitada', descarga_guia:'Descarga de guía', email_campaign:'Email campaign', google_ads:'Google Ads' }
const flag: Record<string,string> = { MX:'🇲🇽 México', CO:'🇨🇴 Colombia', PE:'🇵🇪 Perú', AR:'🇦🇷 Argentina' }
const ic: Record<string,string> = { HOT:'#EF4444', WARM:'#B45309', COLD:'#9CA3AF' }
const ib: Record<string,string> = { HOT:'rgba(239,68,68,0.08)', WARM:'#FFF8E7', COLD:'#F5F4FA' }

const presets = [
  { label:'🔥 Contador HOT — Despacho grande', lead:{ nombre:'Armando Fuentes', cargo:'Dueño del despacho', empresa:'Fuentes & Asociados Contadores', pais:'México', sector:'Servicios contables', tamano:'38 clientes activos', fuente:'Descarga de guía de cierres contables', accion:'Descargó la guía + abrió 4 emails de la secuencia + visitó la página de precios 2 veces', software:'CONTAPAQi + hojas de cálculo', notas:'Es decisor único. Pierde 4 días al mes en cierres manuales.' }},
  { label:'🟡 PyME WARM — Empresa mediana evaluando', lead:{ nombre:'Marcela Ríos', cargo:'Gerente Administrativa', empresa:'Distribuidora Ríos Hermanos', pais:'Colombia', sector:'Distribución y logística', tamano:'22 empleados', fuente:'Formulario web', accion:'Llenó formulario pidiendo más información. No ha agendado demo.', software:'Excel', notas:'No confirmó si es decisora. "Lo tiene que revisar con el dueño".' }},
  { label:'❄️ Lead COLD — Datos incompletos', lead:{ nombre:'José M.', cargo:'Desconocido', empresa:'', pais:'Argentina', sector:'Sin especificar', tamano:'1-2 empleados (estimado)', fuente:'Google Ads', accion:'Clic en anuncio, rebotó en 40 segundos sin interacción', software:'', notas:'Solo dejó email de gmail. Sin teléfono.' }},
  { label:'🔥 Contador HOT — Migración urgente', lead:{ nombre:'Patricia Solano', cargo:'Socia directora', empresa:'Solano Consultores Fiscales', pais:'Perú', sector:'Consultoría fiscal y tributaria', tamano:'27 clientes activos', fuente:'Demo solicitada directamente', accion:'Solicitó demo esta semana. Su software tuvo error en SUNAT y perdió un cliente.', software:'Sistema local desactualizado', notas:'Urgencia real. Busca migrar en menos de 30 días.' }},
]

type LeadForm = typeof presets[0]['lead']
type Mode = 'preset' | 'crm' | 'custom'

function tryParsePartialJSON(text: string): Record<string,string> | null {
  const fields: Record<string,string> = {}
  for (const key of ['segment','icp_score','confidence','pain_hypothesis','first_message','routing_reason']) {
    const match = text.match(new RegExp(`"${key}"\\s*:\\s*"([^"]*)"?`))
    if (match) fields[key] = match[1]
  }
  return Object.keys(fields).length > 0 ? fields : null
}

export default function AgentePage() {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>('preset')
  const [selectedPreset, setSelectedPreset] = useState<number | null>(null)
  const [form, setForm] = useState<LeadForm>(presets[0].lead)
  const [loading, setLoading] = useState(false)
  const [rawStream, setRawStream] = useState('')
  const [parsed, setParsed] = useState<Record<string,string> | null>(null)
  const [phase, setPhase] = useState<'idle'|'connecting'|'streaming'|'done'>('idle')
  const [assignedRep, setAssignedRep] = useState<any>(null)
  const rawRef = useRef('')

  // CRM mode state
  const [crmContacts, setCrmContacts] = useState<any[]>([])
  const [crmCompanies, setCrmCompanies] = useState<Record<string,any>>({})
  const [crmReps, setCrmReps] = useState<any[]>([])
  const [selectedContact, setSelectedContact] = useState<any>(null)
  const [contactSearch, setContactSearch] = useState('')
  const [applying, setApplying] = useState(false)
  const [applied, setApplied] = useState<{ dealId?: string } | null>(null)

  useEffect(() => {
    Promise.all([
      dbFetch('contacts', 'select=*&order=first_name'),
      dbFetch('companies', 'select=id,name,industry,clients,employees,current_software,segment'),
      dbFetch('reps', 'select=id,name,avatar,specialization,capacity_score,active_deals'),
    ]).then(([contacts, companies, reps]) => {
      setCrmContacts(contacts)
      const cm: Record<string,any> = {}
      companies.forEach((c:any) => cm[c.id] = c)
      setCrmCompanies(cm)
      setCrmReps(reps)
    })
  }, [])

  function selectCrmContact(contact: any) {
    setSelectedContact(contact)
    const co = contact.company_id ? crmCompanies[contact.company_id] : null
    setForm({
      nombre: `${contact.first_name} ${contact.last_name}`,
      cargo: rolLabel[contact.role] ?? contact.role,
      empresa: co?.name ?? '',
      pais: flag[contact.country] ?? contact.country,
      sector: co?.industry ?? (contact.segment === 'CONTADOR' ? 'Servicios contables' : 'Empresa'),
      tamano: co?.clients != null ? `${co.clients} clientes activos` : co?.employees != null ? `${co.employees} empleados` : 'Sin datos',
      fuente: srcLabel[contact.source] ?? contact.source,
      accion: contact.notes ?? 'Sin acciones registradas',
      software: co?.current_software ?? '',
      notas: `Segmento: ${contact.segment}. País: ${contact.country}.`,
    })
    resetState()
  }

  function selectRepForLead(segment: string, icpScore: string) {
    if (crmReps.length === 0) return null
    const iw = icpScore === 'HOT' ? 1.5 : icpScore === 'WARM' ? 1.0 : 0.5
    const scored = crmReps.map((r:any) => {
      const sm = r.specialization === segment || r.specialization === 'mixed' ? 1.2 : 0.8
      const ci = (100 - (r.capacity_score ?? 50)) / 100
      return { rep: r, score: ci * sm * iw }
    })
    scored.sort((a,b) => b.score - a.score)
    return scored[0].rep
  }

  function resetState() {
    setRawStream(''); setParsed(null); setPhase('idle')
    setAssignedRep(null); setApplied(null)
    rawRef.current = ''
  }

  async function handleAnalizar() {
    resetState()
    setLoading(true)
    setPhase('connecting')
    try {
      const res = await fetch('/api/analizar-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lead: form }),
      })
      if (!res.ok) {
        const err = await res.json()
        setRawStream(`Error: ${err.error ?? 'No se pudo conectar con DeepSeek'}`)
        setPhase('done'); setLoading(false); return
      }
      setPhase('streaming')
      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        rawRef.current += chunk
        setRawStream(rawRef.current)
        const partial = tryParsePartialJSON(rawRef.current)
        if (partial) {
          setParsed(partial)
          if (partial.segment && partial.icp_score && !assignedRep) {
            setAssignedRep(selectRepForLead(partial.segment, partial.icp_score))
          }
        }
      }
      setPhase('done')
      const final = tryParsePartialJSON(rawRef.current)
      if (final) {
        setParsed(final)
        const rep = selectRepForLead(final.segment, final.icp_score)
        setAssignedRep(rep)
      }
    } catch (e) {
      setRawStream(`Error de conexión: ${e}`)
      setPhase('done')
    }
    setLoading(false)
  }

  async function aplicarAlCRM() {
    if (!selectedContact || !parsed || !assignedRep) return
    setApplying(true)

    const icp = parsed.icp_score as 'HOT'|'WARM'|'COLD'
    const segment = parsed.segment

    const aiEntry = {
      type: 'ai_analysis',
      icp_score: icp,
      segment: parsed.segment,
      confidence: parsed.confidence ?? 'MEDIUM',
      pain_hypothesis: parsed.pain_hypothesis ?? '',
      first_message: parsed.first_message ?? '',
      routing_reason: parsed.routing_reason ?? '',
      created_at: new Date().toISOString(),
    }

    // 1. Update contact: icp_score + save AI analysis in notes
    const existingNotes = (() => { try { const p = JSON.parse(selectedContact.notes ?? '[]'); return Array.isArray(p) ? p : [] } catch { return [] } })()
    const updatedContactNotes = JSON.stringify([aiEntry, ...existingNotes])
    await fetch(`${SUPABASE_URL}/rest/v1/contacts?id=eq.${selectedContact.id}`, {
      method: 'PATCH',
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify({ icp_score: icp, notes: updatedContactNotes }),
    }).catch(() => {})

    // 2. Create deal
    const co = selectedContact.company_id ? crmCompanies[selectedContact.company_id] : null
    const dealTitle = co ? `${co.name} — ${segment === 'CONTADOR' ? 'Plan Despacho' : 'Plan PyME'}` : `${selectedContact.first_name} ${selectedContact.last_name} — Nuevo lead`
    const aiNote = JSON.stringify([aiEntry])
    const dealBody = {
      title: dealTitle,
      contact_id: selectedContact.id,
      rep_id: assignedRep.id,
      pipeline: segment === 'CONTADOR' ? 'contadores' : 'pymes',
      stage: 'discovery',
      icp_score: icp,
      mrr: 0,
      confidence: parsed.confidence ?? 'MEDIUM',
      pain_hypothesis: parsed.pain_hypothesis ?? '',
      notes: aiNote,
    }
    const dealRes = await fetch(`${SUPABASE_URL}/rest/v1/deals`, {
      method: 'POST',
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json', Prefer: 'return=representation' },
      body: JSON.stringify(dealBody),
    }).catch(() => null)

    let dealId: string | undefined
    if (dealRes?.ok) {
      const deals = await dealRes.json()
      dealId = deals?.[0]?.id
    }

    setApplied({ dealId })
    setApplying(false)
  }

  const filteredContacts = crmContacts.filter(c => {
    if (!contactSearch) return true
    const q = contactSearch.toLowerCase()
    return `${c.first_name} ${c.last_name}`.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      crmCompanies[c.company_id]?.name?.toLowerCase().includes(q)
  })

  const tabStyle = (active: boolean) => ({
    padding: '8px 16px', borderRadius: 8, border: '1px solid',
    borderColor: active ? 'var(--accent)' : 'var(--border)',
    background: active ? 'var(--accent-glow)' : 'transparent',
    color: active ? 'var(--foreground)' : 'var(--muted)',
    cursor: 'pointer', fontSize: 13, fontWeight: active ? 700 : 500,
    transition: 'all 0.15s',
  })

  return (
    <div style={{ padding:'32px 36px', maxWidth:1200 }}>
      {/* Header */}
      <div style={{ marginBottom:28 }}>
        <div style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'4px 12px', background:'var(--accent-glow)', border:'1px solid rgba(124,92,252,0.3)', borderRadius:20, fontSize:11, color:'var(--accent)', fontWeight:600, marginBottom:12, textTransform:'uppercase', letterSpacing:0.8 }}>
          <span style={{ width:6, height:6, borderRadius:'50%', background:'var(--accent)', display:'inline-block' }} />
          LIVE · Conectado a DeepSeek API
        </div>
        <h1 style={{ fontSize:26, fontWeight:700, margin:'0 0 8px' }}>Lead Intelligence Agent</h1>
        <p style={{ color:'var(--muted)', fontSize:13, margin:0 }}>Clasificación ICP · Routing automático · Primer mensaje WhatsApp — en tiempo real</p>
      </div>

      {/* Mode selector */}
      <div style={{ display:'flex', gap:8, marginBottom:28 }}>
        <button style={tabStyle(mode==='crm')} onClick={() => { setMode('crm'); resetState() }}>
          🗂 Desde CRM
        </button>
        <button style={tabStyle(mode==='preset')} onClick={() => { setMode('preset'); resetState() }}>
          ⚡ Escenarios demo
        </button>
        <button style={tabStyle(mode==='custom')} onClick={() => { setMode('custom'); resetState() }}>
          ✏️ Lead personalizado
        </button>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:28 }}>
        {/* ── LEFT: Input ── */}
        <div>

          {/* CRM MODE */}
          {mode === 'crm' && (
            <div>
              <div style={{ fontSize:12, color:'var(--muted)', marginBottom:10, fontWeight:600, textTransform:'uppercase', letterSpacing:0.8 }}>
                Selecciona un contacto del CRM
              </div>

              {/* Search */}
              <div style={{ position:'relative', marginBottom:12 }}>
                <span style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'#9CA3AF', fontSize:13 }}>🔍</span>
                <input
                  value={contactSearch}
                  onChange={e => setContactSearch(e.target.value)}
                  placeholder="Buscar por nombre, email o empresa…"
                  style={{ width:'100%', padding:'9px 12px 9px 32px', border:'1px solid var(--border)', borderRadius:8, fontSize:13, outline:'none', background:'var(--surface)', boxSizing:'border-box' }}
                />
              </div>

              {/* Contact list */}
              <div style={{ border:'1px solid var(--border)', borderRadius:10, overflow:'hidden', maxHeight:320, overflowY:'auto', marginBottom:16 }}>
                {filteredContacts.length === 0 ? (
                  <div style={{ padding:'24px', textAlign:'center', color:'var(--muted)', fontSize:13 }}>Cargando contactos…</div>
                ) : filteredContacts.map((c, i) => {
                  const co = c.company_id ? crmCompanies[c.company_id] : null
                  const isSelected = selectedContact?.id === c.id
                  return (
                    <div key={c.id} onClick={() => selectCrmContact(c)} style={{ padding:'12px 16px', borderBottom: i < filteredContacts.length-1 ? '1px solid var(--border)' : 'none', cursor:'pointer', background: isSelected ? 'var(--accent-glow)' : 'transparent', display:'flex', alignItems:'center', gap:12, transition:'background 0.1s' }}
                      onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'var(--surface-2)' }}
                      onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent' }}
                    >
                      <div style={{ width:34, height:34, borderRadius:'50%', background:ib[c.icp_score]??'#F5F4FA', border:`1px solid ${ic[c.icp_score]??'#E5E7EB'}33`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:800, color:ic[c.icp_score]??'#9CA3AF', flexShrink:0 }}>
                        {c.first_name?.[0]}{c.last_name?.[0]}
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:13, fontWeight:700, color:'var(--foreground)' }}>{c.first_name} {c.last_name}</div>
                        <div style={{ fontSize:11, color:'var(--muted)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                          {rolLabel[c.role] ?? c.role} {co ? `· ${co.name}` : ''}
                        </div>
                      </div>
                      <div style={{ display:'flex', gap:4, flexShrink:0 }}>
                        <span style={{ fontSize:10, fontWeight:700, padding:'2px 7px', borderRadius:20, background: c.segment==='CONTADOR'?'#F0EDF8':'#E8F8F0', color: c.segment==='CONTADOR'?'#5C2D91':'#00A363' }}>{c.segment}</span>
                        {isSelected && <span style={{ fontSize:10, fontWeight:700, padding:'2px 7px', borderRadius:20, background:'var(--accent-glow)', color:'var(--accent)' }}>✓</span>}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Selected contact preview */}
              {selectedContact && (
                <div style={{ background:'var(--surface)', border:'1px solid var(--accent)', borderRadius:10, padding:'14px 16px', marginBottom:16 }}>
                  <div style={{ fontSize:11, color:'var(--accent)', fontWeight:700, textTransform:'uppercase', letterSpacing:0.8, marginBottom:10 }}>Datos que se analizarán</div>
                  {[
                    { label:'Nombre', value: form.nombre },
                    { label:'Cargo', value: form.cargo },
                    { label:'Empresa', value: form.empresa || '—' },
                    { label:'Sector', value: form.sector },
                    { label:'Tamaño', value: form.tamano },
                    { label:'Fuente', value: form.fuente },
                    { label:'Señales', value: form.accion },
                  ].map(f => (
                    <div key={f.label} style={{ display:'flex', gap:8, marginBottom:5, fontSize:12 }}>
                      <span style={{ color:'var(--muted)', minWidth:60, flexShrink:0 }}>{f.label}</span>
                      <span style={{ color:'var(--foreground)', flex:1 }}>{f.value}</span>
                    </div>
                  ))}
                </div>
              )}

              {selectedContact && (
                <button onClick={handleAnalizar} disabled={loading} style={{ width:'100%', padding:'14px 20px', background: loading ? 'var(--border)' : 'var(--accent)', border:'none', borderRadius:10, color:'#fff', fontSize:14, fontWeight:700, cursor: loading ? 'not-allowed' : 'pointer' }}>
                  {loading ? '◌ Analizando con IA…' : '◆ Analizar con Lead Intelligence Agent'}
                </button>
              )}
            </div>
          )}

          {/* PRESET MODE */}
          {mode === 'preset' && (
            <div>
              <div style={{ fontSize:12, color:'var(--muted)', marginBottom:10, fontWeight:600, textTransform:'uppercase', letterSpacing:0.8 }}>Escenarios de ejemplo</div>
              <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:20 }}>
                {presets.map((p,i) => (
                  <button key={i} onClick={() => { setSelectedPreset(i); setForm(presets[i].lead); resetState() }} style={{ padding:'10px 14px', textAlign:'left', borderRadius:8, border:'1px solid', borderColor: selectedPreset===i ? 'var(--accent)' : 'var(--border)', background: selectedPreset===i ? 'var(--accent-glow)' : 'var(--surface)', color: selectedPreset===i ? 'var(--foreground)' : 'var(--muted)', cursor:'pointer', fontSize:13 }}>
                    {p.label}
                  </button>
                ))}
              </div>
              {selectedPreset !== null && (
                <button onClick={handleAnalizar} disabled={loading} style={{ width:'100%', padding:'14px 20px', background: loading ? 'var(--border)' : 'var(--accent)', border:'none', borderRadius:10, color:'#fff', fontSize:14, fontWeight:700, cursor: loading ? 'not-allowed' : 'pointer' }}>
                  {loading ? '◌ Analizando con IA…' : '◆ Analizar con Lead Intelligence Agent'}
                </button>
              )}
            </div>
          )}

          {/* CUSTOM MODE */}
          {mode === 'custom' && (
            <div>
              <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, padding:20, marginBottom:16 }}>
                <div style={{ fontSize:12, color:'var(--muted)', marginBottom:14, fontWeight:600, textTransform:'uppercase', letterSpacing:0.8 }}>Datos del lead</div>
                {[
                  { key:'nombre', label:'Nombre' }, { key:'cargo', label:'Cargo' },
                  { key:'empresa', label:'Empresa (opcional)' }, { key:'pais', label:'País' },
                  { key:'sector', label:'Sector' }, { key:'tamano', label:'Empleados / Clientes' },
                  { key:'fuente', label:'Fuente del lead' }, { key:'accion', label:'Acción / señal detectada' },
                  { key:'software', label:'Software actual' }, { key:'notas', label:'Notas adicionales' },
                ].map(field => (
                  <div key={field.key} style={{ marginBottom:12 }}>
                    <label style={{ display:'block', fontSize:11, color:'var(--muted)', marginBottom:4 }}>{field.label}</label>
                    {field.key === 'accion' || field.key === 'notas' ? (
                      <textarea value={(form as any)[field.key]??''} onChange={e => setForm(p=>({...p,[field.key]:e.target.value}))} rows={2} style={{ width:'100%', background:'var(--surface-2)', border:'1px solid var(--border)', borderRadius:6, padding:'8px 10px', color:'var(--foreground)', fontSize:12, resize:'none', outline:'none', fontFamily:'inherit' }} />
                    ) : (
                      <input value={(form as any)[field.key]??''} onChange={e => setForm(p=>({...p,[field.key]:e.target.value}))} style={{ width:'100%', background:'var(--surface-2)', border:'1px solid var(--border)', borderRadius:6, padding:'8px 10px', color:'var(--foreground)', fontSize:12, outline:'none', fontFamily:'inherit' }} />
                    )}
                  </div>
                ))}
              </div>
              <button onClick={handleAnalizar} disabled={loading} style={{ width:'100%', padding:'14px 20px', background: loading ? 'var(--border)' : 'var(--accent)', border:'none', borderRadius:10, color:'#fff', fontSize:14, fontWeight:700, cursor: loading ? 'not-allowed' : 'pointer' }}>
                {loading ? '◌ Analizando con IA…' : '◆ Analizar con Lead Intelligence Agent'}
              </button>
            </div>
          )}
        </div>

        {/* ── RIGHT: Output ── */}
        <div>
          {phase === 'idle' && (
            <div style={{ height:'100%', minHeight:400, display:'flex', alignItems:'center', justifyContent:'center', border:'1px dashed var(--border)', borderRadius:12, color:'var(--muted)', fontSize:14, textAlign:'center', padding:40 }}>
              <div>
                <div style={{ fontSize:32, marginBottom:12 }}>◆</div>
                <div>{mode === 'crm' ? 'Selecciona un contacto del CRM\ny haz clic en Analizar' : 'Selecciona un escenario y haz clic en Analizar'}</div>
              </div>
            </div>
          )}

          {phase === 'connecting' && (
            <div style={{ background:'var(--surface)', border:'1px solid var(--accent)', borderRadius:12, padding:24, display:'flex', alignItems:'center', gap:14 }}>
              <div style={{ width:10, height:10, borderRadius:'50%', background:'var(--accent)' }} />
              <span style={{ fontSize:13, color:'var(--muted)' }}>Conectando con DeepSeek API…</span>
            </div>
          )}

          {(phase === 'streaming' || phase === 'done') && (
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              {parsed && (
                <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, overflow:'hidden' }}>
                  <div style={{ padding:'14px 18px', borderBottom:'1px solid var(--border)', background: phase==='streaming' ? 'var(--accent-glow)' : 'transparent' }}>
                    <span style={{ fontSize:11, fontWeight:700, color:'var(--accent)', textTransform:'uppercase', letterSpacing:0.8 }}>
                      {phase === 'streaming' ? '⟳ Clasificando…' : '✓ Clasificación completada'}
                    </span>
                  </div>
                  <div style={{ padding:18, display:'flex', flexDirection:'column', gap:14 }}>
                    {/* ICP + Segment + Confidence */}
                    <div style={{ display:'flex', gap:10 }}>
                      {parsed.icp_score && (
                        <div style={{ flex:1, padding:'14px 16px', background:ib[parsed.icp_score]??'var(--surface-2)', border:`1px solid ${(ic[parsed.icp_score]??'#9CA3AF')}44`, borderRadius:10, textAlign:'center' }}>
                          <div style={{ fontSize:24, fontWeight:800, color:ic[parsed.icp_score] }}>{parsed.icp_score}</div>
                          <div style={{ fontSize:11, color:'var(--muted)', marginTop:4 }}>ICP Score</div>
                        </div>
                      )}
                      {parsed.segment && (
                        <div style={{ flex:1, padding:'14px 16px', background:'var(--surface-2)', border:'1px solid var(--border)', borderRadius:10, textAlign:'center' }}>
                          <div style={{ fontSize:16, fontWeight:700, color: parsed.segment==='CONTADOR' ? 'var(--accent)' : 'var(--won)' }}>{parsed.segment}</div>
                          <div style={{ fontSize:11, color:'var(--muted)', marginTop:4 }}>Segmento</div>
                        </div>
                      )}
                      {parsed.confidence && (
                        <div style={{ flex:1, padding:'14px 16px', background:'var(--surface-2)', border:'1px solid var(--border)', borderRadius:10, textAlign:'center' }}>
                          <div style={{ fontSize:16, fontWeight:700, color:'var(--muted)' }}>{parsed.confidence}</div>
                          <div style={{ fontSize:11, color:'var(--muted)', marginTop:4 }}>Confianza</div>
                        </div>
                      )}
                    </div>

                    {/* Pain hypothesis */}
                    {parsed.pain_hypothesis && (
                      <div style={{ padding:'12px 16px', background:'var(--surface-2)', borderRadius:10, borderLeft:'3px solid var(--accent)' }}>
                        <div style={{ fontSize:10, color:'var(--accent)', fontWeight:700, textTransform:'uppercase', letterSpacing:0.8, marginBottom:6 }}>Pain hypothesis</div>
                        <div style={{ fontSize:13, color:'var(--foreground)', lineHeight:1.5 }}>{parsed.pain_hypothesis}{phase==='streaming' && !parsed.routing_reason && <span className="cursor-blink" />}</div>
                      </div>
                    )}

                    {/* Rep asignado */}
                    {assignedRep && (
                      <div style={{ padding:'12px 16px', background:'var(--surface-2)', borderRadius:10, display:'flex', alignItems:'center', gap:12 }}>
                        <div style={{ width:38, height:38, borderRadius:'50%', background:'var(--primary)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:700, color:'#fff', flexShrink:0 }}>{assignedRep.avatar}</div>
                        <div style={{ flex:1 }}>
                          <div style={{ fontSize:11, color:'var(--primary)', fontWeight:700, textTransform:'uppercase', letterSpacing:0.8, marginBottom:2 }}>Asignado a</div>
                          <div style={{ fontSize:13, fontWeight:600 }}>{assignedRep.name}</div>
                          <div style={{ fontSize:11, color:'var(--muted)' }}>
                            Capacity {assignedRep.capacity_score ?? assignedRep.capacityScore}% · {assignedRep.active_deals ?? assignedRep.activeDeals} deals activos
                          </div>
                        </div>
                        <div style={{ fontSize:10, padding:'4px 10px', borderRadius:6, background:'var(--won-bg)', color:'var(--won)', fontWeight:600 }}>ASIGNADO</div>
                      </div>
                    )}

                    {/* WhatsApp message */}
                    {parsed.first_message && (
                      <div style={{ padding:'14px 16px', background:'#1a2b1a', border:'1px solid #2a4a2a', borderRadius:10 }}>
                        <div style={{ fontSize:10, color:'#52c41a', fontWeight:700, textTransform:'uppercase', letterSpacing:0.8, marginBottom:8 }}>📱 Primer mensaje WhatsApp</div>
                        <div style={{ fontSize:13, color:'#e8e8ed', lineHeight:1.6, background:'#0f1f0f', borderRadius:8, padding:'10px 14px' }}>
                          {parsed.first_message}{phase==='streaming' && <span className="cursor-blink" />}
                        </div>
                      </div>
                    )}

                    {/* CRM: Apply button */}
                    {mode === 'crm' && selectedContact && phase === 'done' && parsed && (
                      <div>
                        {applied ? (
                          <div style={{ padding:'14px 16px', background:'var(--won-bg)', border:'1px solid var(--won)', borderRadius:10, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                            <div>
                              <div style={{ fontSize:13, fontWeight:700, color:'var(--won)' }}>✓ Aplicado al CRM</div>
                              <div style={{ fontSize:12, color:'var(--muted)', marginTop:2 }}>
                                Contacto clasificado como <strong>{parsed.icp_score}</strong> · Deal creado en Discovery
                              </div>
                            </div>
                            {applied.dealId && (
                              <button onClick={() => router.push(`/pipeline/${applied.dealId}`)} style={{ padding:'8px 14px', background:'var(--won)', color:'#fff', border:'none', borderRadius:8, fontSize:12, fontWeight:700, cursor:'pointer', whiteSpace:'nowrap', marginLeft:12 }}>
                                Ver deal →
                              </button>
                            )}
                          </div>
                        ) : (
                          <button onClick={aplicarAlCRM} disabled={applying} style={{ width:'100%', padding:'13px 20px', background: applying ? 'var(--border)' : '#1A1A2E', border:'none', borderRadius:10, color:'#fff', fontSize:13, fontWeight:700, cursor: applying ? 'not-allowed' : 'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:10 }}>
                            {applying ? '◌ Aplicando…' : (
                              <>
                                <span>⚡ Aplicar al CRM</span>
                                <span style={{ fontSize:11, fontWeight:400, opacity:0.7 }}>Actualiza ICP · Crea deal · Asigna rep</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Raw stream */}
              <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:10, overflow:'hidden' }}>
                <div style={{ padding:'10px 16px', borderBottom:'1px solid var(--border)', fontSize:11, color:'var(--muted)', fontWeight:600, textTransform:'uppercase', letterSpacing:0.8, display:'flex', alignItems:'center', gap:8 }}>
                  <span style={{ width:6, height:6, borderRadius:'50%', background: phase==='streaming' ? 'var(--accent)' : 'var(--border)', display:'inline-block' }} />
                  Respuesta raw de DeepSeek API
                </div>
                <pre style={{ margin:0, padding:'14px 16px', fontSize:11, lineHeight:1.6, color:'var(--accent)', fontFamily:'monospace', overflowX:'auto', maxHeight:200, overflowY:'auto', whiteSpace:'pre-wrap', wordBreak:'break-word' }}>
                  {rawStream || ''}{phase==='streaming' && <span className="cursor-blink" />}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
