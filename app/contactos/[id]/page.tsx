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
const src: Record<string,string> = { webinar:'Webinar', formulario_web:'Formulario web', referido:'Referido', demo_solicitada:'Demo solicitada', descarga_guia:'Descarga guía', email_campaign:'Email campaign', google_ads:'Google Ads' }
const stageLabel: Record<string,string> = { discovery:'Discovery', calificacion:'Calificación', demo:'Demo', trial:'Trial', negociacion:'Negociación', closed_won:'Closed Won', closed_lost:'Closed Lost', ramp:'Ramp' }
const stageColor: Record<string,string> = { closed_won:'#00A363', closed_lost:'#EF4444', ramp:'#5C2D91' }

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
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    Promise.all([
      dbFetch('contacts', `select=*&id=eq.${id}`),
      dbFetch('deals', `select=*&contact_id=eq.${id}&order=updated_at.desc`),
    ]).then(async ([contacts, dealsData]) => {
      const c = contacts[0] ?? null
      setContact(c)
      setNotes(c?.notes ?? '')
      setDeals(dealsData)

      if (c?.company_id) {
        const cos = await dbFetch('companies', `select=*&id=eq.${c.company_id}`)
        setCompany(cos[0] ?? null)
      }
      setLoading(false)
    })
  }, [id])

  async function saveNotes() {
    setSaving(true)
    await fetch(`${SUPABASE_URL}/rest/v1/contacts?id=eq.${id}`, {
      method: 'PATCH',
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({ notes }),
    }).catch(() => {})
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
      {/* Back */}
      <button onClick={() => router.push('/contactos')} style={{ display:'inline-flex', alignItems:'center', gap:6, fontSize:13, color:'#6B7280', background:'none', border:'none', cursor:'pointer', padding:'0 0 18px', fontFamily:'inherit' }}>
        ← Volver a Contactos
      </button>

      {/* 3-column layout */}
      <div style={{ display:'grid', gridTemplateColumns:'260px 1fr 220px', gap:20, flex:1, minHeight:0 }}>

        {/* ── LEFT: Info del contacto ── */}
        <div style={{ overflowY:'auto', display:'flex', flexDirection:'column', gap:14 }}>
          {/* Name card */}
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

          {/* Properties */}
          <div style={{ background:'#fff', border:'1px solid #E5E7EB', borderRadius:12, padding:'18px 20px', boxShadow:'0 2px 8px rgba(0,0,0,0.04)' }}>
            <div style={{ fontSize:11, color:'#9CA3AF', fontWeight:700, textTransform:'uppercase', letterSpacing:0.8, marginBottom:14 }}>Propiedades</div>
            <Prop label="Email" value={contact.email} />
            <Prop label="Teléfono" value={contact.phone} />
            <Prop label="País" value={`${flag[contact.country]} ${contact.country}`} />
            <Prop label="Fuente" value={src[contact.source] ?? contact.source} />
            <Prop label="Creado" value={contact.created_at ? new Date(contact.created_at).toLocaleDateString('es-MX', { year:'numeric', month:'short', day:'numeric' }) : null} />
          </div>
        </div>

        {/* ── CENTER: Notas + Deals ── */}
        <div style={{ overflowY:'auto', display:'flex', flexDirection:'column', gap:16 }}>
          {/* Notes */}
          <div style={{ background:'#fff', border:'1px solid #E5E7EB', borderRadius:12, padding:'20px', boxShadow:'0 2px 8px rgba(0,0,0,0.04)' }}>
            <div style={{ fontSize:13, fontWeight:700, color:'#1A1A2E', marginBottom:12 }}>Notas</div>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Agrega notas sobre este contacto…"
              rows={5}
              style={{ width:'100%', padding:'10px 12px', border:'1px solid #E5E7EB', borderRadius:8, fontSize:13, color:'#1A1A2E', resize:'vertical', outline:'none', fontFamily:'inherit', background:'#FAFAFA', boxSizing:'border-box' }}
            />
            <div style={{ display:'flex', justifyContent:'flex-end', marginTop:10 }}>
              <button
                onClick={saveNotes}
                disabled={saving}
                style={{ padding:'8px 20px', background: saved ? '#00A363' : '#00C073', color:'#fff', border:'none', borderRadius:8, fontSize:13, fontWeight:700, cursor:'pointer', transition:'background 0.2s' }}
              >
                {saved ? '✓ Guardado' : saving ? 'Guardando…' : 'Guardar notas'}
              </button>
            </div>
          </div>

          {/* Deals asociados */}
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
                    <div>
                      <span style={{ fontSize:11, fontWeight:700, padding:'2px 8px', borderRadius:20, background: stageColor[d.stage] ? stageColor[d.stage]+'18' : '#F5F4FA', color: stageColor[d.stage] ?? '#6B7280' }}>
                        {stageLabel[d.stage] ?? d.stage}
                      </span>
                    </div>
                    <div><span style={{ fontSize:11, fontWeight:700, padding:'2px 8px', borderRadius:20, color:ic[d.icp_score], background:ib[d.icp_score] }}>{d.icp_score}</span></div>
                    <div style={{ fontSize:13, fontWeight:700, color: d.stage==='closed_won' ? '#00A363' : '#1A1A2E' }}>
                      {Number(d.mrr) > 0 ? `$${Number(d.mrr).toLocaleString()}/m` : '—'}
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>

        {/* ── RIGHT: Empresa asociada ── */}
        <div style={{ overflowY:'auto', display:'flex', flexDirection:'column', gap:14 }}>
          <div style={{ background:'#fff', border:'1px solid #E5E7EB', borderRadius:12, padding:'18px', boxShadow:'0 2px 8px rgba(0,0,0,0.04)' }}>
            <div style={{ fontSize:11, color:'#9CA3AF', fontWeight:700, textTransform:'uppercase', letterSpacing:0.8, marginBottom:14 }}>Empresa asociada</div>
            {company ? (
              <>
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
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

          {/* Deal summary */}
          {deals.length > 0 && (
            <div style={{ background:'#fff', border:'1px solid #E5E7EB', borderRadius:12, padding:'18px', boxShadow:'0 2px 8px rgba(0,0,0,0.04)' }}>
              <div style={{ fontSize:11, color:'#9CA3AF', fontWeight:700, textTransform:'uppercase', letterSpacing:0.8, marginBottom:14 }}>Resumen de deals</div>
              {[
                { label:'Total deals', value: deals.length },
                { label:'Won', value: deals.filter(d=>d.stage==='closed_won').length },
                { label:'Activos', value: deals.filter(d=>!['closed_won','closed_lost'].includes(d.stage)).length },
                { label:'MRR total', value: `$${deals.filter(d=>d.stage==='closed_won').reduce((s,d)=>s+Number(d.mrr),0).toLocaleString()}` },
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
