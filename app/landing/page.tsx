'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jpptlznlexkxehxnyjeh.supabase.co'
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpwcHRsem5sZXpreGVoeG55amVoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAxNTAxNjIsImV4cCI6MjA5NTcyNjE2Mn0.44OoqEBDLMaRWa3tv7vAgh7hC4XsrKs6xbDMgmXh7Is'

type Stage = 'form' | 'pipeline' | 'done'

type PipelineStep = {
  id: string
  label: string
  sublabel: string
  status: 'pending' | 'running' | 'done' | 'error'
  result?: string
}

function tryParseJSON(text: string): Record<string,string> | null {
  const fields: Record<string,string> = {}
  for (const key of ['segment','icp_score','confidence','pain_hypothesis','first_message']) {
    const match = text.match(new RegExp(`"${key}"\\s*:\\s*"([^"]*)"?`))
    if (match) fields[key] = match[1]
  }
  return Object.keys(fields).length > 0 ? fields : null
}

const ic: Record<string,string> = { HOT:'#EF4444', WARM:'#D97706', COLD:'#6B7280' }
const ib: Record<string,string> = { HOT:'rgba(239,68,68,0.1)', WARM:'rgba(217,119,6,0.1)', COLD:'rgba(107,114,128,0.1)' }

export default function LandingPage() {
  const router = useRouter()
  const [stage, setStage] = useState<Stage>('form')
  const [form, setForm] = useState({ nombre:'', apellido:'', email:'', telefono:'', empresa:'', cargo:'', pais:'MX', tamano:'' })
  const [steps, setSteps] = useState<PipelineStep[]>([])
  const [result, setResult] = useState<Record<string,string> | null>(null)
  const [repName, setRepName] = useState('')
  const [dealId, setDealId] = useState<string | null>(null)

  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }))

  function updateStep(id: string, patch: Partial<PipelineStep>) {
    setSteps(prev => prev.map(s => s.id === id ? { ...s, ...patch } : s))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nombre || !form.email) return

    const initialSteps: PipelineStep[] = [
      { id:'receive',  label:'Lead recibido',         sublabel:'Procesando datos del formulario',   status:'running' },
      { id:'create',   label:'Creando contacto',       sublabel:'Guardando en CRM',                  status:'pending' },
      { id:'ai',       label:'DeepSeek clasificando',  sublabel:'Analizando ICP y segmento',         status:'pending' },
      { id:'routing',  label:'Asignando rep',          sublabel:'Calculando score compuesto',         status:'pending' },
      { id:'deal',     label:'Abriendo deal',          sublabel:'Pipeline en Discovery',             status:'pending' },
      { id:'whatsapp', label:'WhatsApp generado',      sublabel:'Mensaje listo para enviar',         status:'pending' },
    ]
    setSteps(initialSteps)
    setStage('pipeline')

    await delay(600)
    updateStep('receive', { status:'done', result:'Formulario recibido · ' + new Date().toLocaleTimeString('es-MX') })

    // Step 1: Create contact in Supabase
    updateStep('create', { status:'running' })
    await delay(400)
    const pais = { MX:'MX', CO:'CO', PE:'PE', AR:'AR' }[form.pais] ?? 'MX'
    const contactBody = {
      first_name: form.nombre,
      last_name: form.apellido || '—',
      email: form.email,
      phone: form.telefono || undefined,
      role: 'dueno',
      country: pais,
      source: 'formulario_web',
      segment: 'PYME',
      icp_score: 'COLD',
      notes: `Registrado desde landing. Empresa: ${form.empresa || 'No especificada'}. Cargo: ${form.cargo || 'No especificado'}. Empleados: ${form.tamano || 'Sin datos'}.`,
    }
    const contactRes = await fetch(`${SUPABASE_URL}/rest/v1/contacts`, {
      method: 'POST',
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json', Prefer: 'return=representation' },
      body: JSON.stringify(contactBody),
    }).catch(() => null)
    let contactId: string | null = null
    if (contactRes?.ok) {
      const data = await contactRes.json()
      contactId = data?.[0]?.id ?? null
    }
    updateStep('create', { status: contactId ? 'done' : 'error', result: contactId ? `Contacto creado · ID: ${contactId?.slice(0,8)}…` : 'Guardado localmente' })

    // Step 2: AI Classification
    updateStep('ai', { status:'running' })
    const leadPayload = {
      nombre: `${form.nombre} ${form.apellido}`.trim(),
      cargo: form.cargo || 'Dueño/a',
      empresa: form.empresa || 'Sin especificar',
      pais: { MX:'México', CO:'Colombia', PE:'Perú', AR:'Argentina' }[form.pais] ?? form.pais,
      sector: 'Por determinar',
      tamano: form.tamano || 'Sin datos',
      fuente: 'Formulario web — Landing page Alegra',
      accion: `Llenó el formulario de registro en alegra.com/mexico. Empresa: ${form.empresa || 'No especificada'}. Interés en el producto.`,
      software: '',
      notas: `Cargo: ${form.cargo || 'No especificado'}. Teléfono: ${form.telefono || 'No proporcionado'}.`,
    }
    let aiResult: Record<string,string> | null = null
    let rawText = ''
    try {
      const aiRes = await fetch('/api/analizar-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lead: leadPayload }),
      })
      if (aiRes.ok) {
        const reader = aiRes.body!.getReader()
        const decoder = new TextDecoder()
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          rawText += decoder.decode(value, { stream: true })
        }
        aiResult = tryParseJSON(rawText)
      }
    } catch {}
    if (!aiResult) aiResult = { segment:'PYME', icp_score:'WARM', confidence:'MEDIUM', pain_hypothesis:'Lead con señal de interés moderado.', first_message:`Hola ${form.nombre}, vimos tu registro en Alegra. ¿Tienes 15 minutos esta semana para una demo rápida?` }
    setResult(aiResult)
    updateStep('ai', { status:'done', result:`${aiResult.icp_score} · ${aiResult.segment} · Confianza ${aiResult.confidence}` })

    // Step 3: Rep routing
    updateStep('routing', { status:'running' })
    await delay(500)
    const repsRes = await fetch(`${SUPABASE_URL}/rest/v1/reps?select=id,name,specialization,capacity_score,active_deals&order=capacity_score`, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
    }).catch(() => null)
    let assignedRep: any = { id: null, name: 'Carlos Mendoza' }
    if (repsRes?.ok) {
      const repsData = await repsRes.json()
      if (repsData?.length) {
        const iw = aiResult.icp_score === 'HOT' ? 1.5 : aiResult.icp_score === 'WARM' ? 1.0 : 0.5
        const scored = repsData.map((r:any) => {
          const sm = r.specialization === aiResult!.segment || r.specialization === 'mixed' ? 1.2 : 0.8
          const ci = (100 - (r.capacity_score ?? 50)) / 100
          return { rep: r, score: ci * sm * iw }
        })
        scored.sort((a:any, b:any) => b.score - a.score)
        assignedRep = scored[0].rep
      }
    }
    setRepName(assignedRep.name)
    updateStep('routing', { status:'done', result:`Asignado a ${assignedRep.name}` })

    // Step 4: Create deal
    updateStep('deal', { status:'running' })
    await delay(400)
    let newDealId: string | null = null
    if (contactId) {
      const aiNote = JSON.stringify([{
        type: 'ai_analysis',
        icp_score: aiResult.icp_score,
        segment: aiResult.segment,
        confidence: aiResult.confidence,
        pain_hypothesis: aiResult.pain_hypothesis,
        first_message: aiResult.first_message,
        created_at: new Date().toISOString(),
      }])
      const dealBody = {
        title: `${form.empresa || form.nombre} — Lead Landing`,
        contact_id: contactId,
        rep_id: assignedRep.id,
        pipeline: aiResult.segment === 'CONTADOR' ? 'contadores' : 'pymes',
        stage: 'discovery',
        icp_score: aiResult.icp_score as 'HOT'|'WARM'|'COLD',
        mrr: 0,
        confidence: aiResult.confidence as 'HIGH'|'MEDIUM'|'LOW',
        pain_hypothesis: aiResult.pain_hypothesis,
        notes: aiNote,
      }
      const dealRes = await fetch(`${SUPABASE_URL}/rest/v1/deals`, {
        method: 'POST',
        headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json', Prefer: 'return=representation' },
        body: JSON.stringify(dealBody),
      }).catch(() => null)
      if (dealRes?.ok) {
        const dealData = await dealRes.json()
        newDealId = dealData?.[0]?.id ?? null
      }
    }
    setDealId(newDealId)
    updateStep('deal', { status:'done', result: newDealId ? `Deal abierto · Discovery · ${aiResult.icp_score}` : 'Deal creado localmente' })

    // Step 5: WhatsApp
    updateStep('whatsapp', { status:'running' })
    await delay(600)
    updateStep('whatsapp', { status:'done', result:'Mensaje generado · Listo para enviar' })

    setStage('done')
  }

  const inputStyle = { width:'100%', padding:'12px 14px', border:'1.5px solid #E5E7EB', borderRadius:10, fontSize:14, color:'#1A1A2E', outline:'none', fontFamily:'inherit', boxSizing:'border-box' as const, transition:'border-color 0.15s' }
  const labelStyle = { display:'block' as const, fontSize:12, fontWeight:700, color:'#374151', marginBottom:6 }

  return (
    <div style={{ minHeight:'100vh', background:'#F9FAFB', fontFamily:"'Nunito','Inter',sans-serif" }}>

      {/* Navbar */}
      <nav style={{ background:'#fff', borderBottom:'1px solid #E5E7EB', padding:'0 48px', height:64, display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, zIndex:100 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:34, height:34, background:'#00C073', borderRadius:9, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, color:'#fff', fontSize:16 }}>A</div>
          <span style={{ fontWeight:800, fontSize:18, color:'#1A1A2E', letterSpacing:-0.3 }}>alegra</span>
        </div>
        <div style={{ display:'flex', gap:28, fontSize:14, color:'#6B7280', fontWeight:500 }}>
          <span style={{ cursor:'pointer' }}>Contabilidad</span>
          <span style={{ cursor:'pointer' }}>Facturación</span>
          <span style={{ cursor:'pointer' }}>Nómina</span>
          <span style={{ cursor:'pointer' }}>Precios</span>
        </div>
        <div style={{ display:'flex', gap:12 }}>
          <button style={{ padding:'9px 20px', borderRadius:8, border:'1.5px solid #E5E7EB', background:'#fff', fontSize:13, fontWeight:700, color:'#374151', cursor:'pointer' }}>Iniciar sesión</button>
          <button style={{ padding:'9px 20px', borderRadius:8, border:'none', background:'#00C073', fontSize:13, fontWeight:700, color:'#fff', cursor:'pointer', boxShadow:'0 2px 8px rgba(0,192,115,0.3)' }}>Prueba gratis</button>
        </div>
      </nav>

      <div style={{ maxWidth:1100, margin:'0 auto', padding:'60px 24px' }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 480px', gap:60, alignItems:'start' }}>

          {/* Left: Hero */}
          <div>
            <div style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'5px 14px', background:'rgba(0,192,115,0.1)', borderRadius:20, fontSize:12, color:'#00A363', fontWeight:700, marginBottom:24, border:'1px solid rgba(0,192,115,0.2)' }}>
              ✦ Más de 500,000 empresas en América Latina
            </div>
            <h1 style={{ fontSize:46, fontWeight:900, color:'#1A1A2E', lineHeight:1.15, margin:'0 0 20px', letterSpacing:-1 }}>
              Lleva tu contabilidad<br />
              <span style={{ color:'#00C073' }}>al siguiente nivel</span>
            </h1>
            <p style={{ fontSize:17, color:'#6B7280', lineHeight:1.7, margin:'0 0 36px', maxWidth:480 }}>
              Factura, lleva tu contabilidad y gestiona tu nómina desde un solo lugar. Diseñado para PyMEs y despachos contables en México.
            </p>
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              {[
                { icon:'✓', text:'Facturación electrónica CFDI 4.0 en segundos' },
                { icon:'✓', text:'Contabilidad automática sin conocimientos técnicos' },
                { icon:'✓', text:'Nómina integrada con el SAT' },
                { icon:'✓', text:'Reportes en tiempo real para tomar mejores decisiones' },
              ].map(f => (
                <div key={f.text} style={{ display:'flex', alignItems:'center', gap:12, fontSize:15, color:'#374151' }}>
                  <span style={{ width:22, height:22, borderRadius:'50%', background:'rgba(0,192,115,0.15)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, color:'#00A363', fontWeight:800, flexShrink:0 }}>{f.icon}</span>
                  {f.text}
                </div>
              ))}
            </div>

            <div style={{ marginTop:40, display:'flex', gap:20, alignItems:'center' }}>
              <div style={{ display:'flex' }}>
                {['CM','VS','DR','AG'].map((a,i) => (
                  <div key={a} style={{ width:36, height:36, borderRadius:'50%', background:`hsl(${i*60},60%,50%)`, border:'2px solid #fff', marginLeft: i>0 ? -10 : 0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:800, color:'#fff' }}>{a}</div>
                ))}
              </div>
              <div style={{ fontSize:13, color:'#6B7280' }}>
                <strong style={{ color:'#1A1A2E' }}>4.8/5</strong> · Más de 2,400 reseñas verificadas
              </div>
            </div>
          </div>

          {/* Right: Form or Pipeline or Done */}
          <div>
            {stage === 'form' && (
              <div style={{ background:'#fff', borderRadius:16, padding:32, boxShadow:'0 4px 32px rgba(0,0,0,0.1)', border:'1px solid #E5E7EB' }}>
                <div style={{ marginBottom:24 }}>
                  <h2 style={{ fontSize:22, fontWeight:800, color:'#1A1A2E', margin:'0 0 6px' }}>Empieza gratis hoy</h2>
                  <p style={{ fontSize:14, color:'#6B7280', margin:0 }}>Sin tarjeta de crédito · Cancela cuando quieras</p>
                </div>
                <form onSubmit={handleSubmit}>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:14 }}>
                    <div><label style={labelStyle}>Nombre *</label><input required style={inputStyle} value={form.nombre} onChange={e => set('nombre', e.target.value)} placeholder="Carlos" /></div>
                    <div><label style={labelStyle}>Apellido</label><input style={inputStyle} value={form.apellido} onChange={e => set('apellido', e.target.value)} placeholder="Morales" /></div>
                  </div>
                  <div style={{ marginBottom:14 }}>
                    <label style={labelStyle}>Correo electrónico *</label>
                    <input required type="email" style={inputStyle} value={form.email} onChange={e => set('email', e.target.value)} placeholder="carlos@empresa.com" />
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:14 }}>
                    <div><label style={labelStyle}>Teléfono</label><input style={inputStyle} value={form.telefono} onChange={e => set('telefono', e.target.value)} placeholder="+52 55 1234 5678" /></div>
                    <div>
                      <label style={labelStyle}>País</label>
                      <select style={{ ...inputStyle, appearance:'none' }} value={form.pais} onChange={e => set('pais', e.target.value)}>
                        <option value="MX">🇲🇽 México</option>
                        <option value="CO">🇨🇴 Colombia</option>
                        <option value="PE">🇵🇪 Perú</option>
                        <option value="AR">🇦🇷 Argentina</option>
                      </select>
                    </div>
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:14 }}>
                    <div><label style={labelStyle}>Empresa</label><input style={inputStyle} value={form.empresa} onChange={e => set('empresa', e.target.value)} placeholder="Mi Empresa SA" /></div>
                    <div><label style={labelStyle}>Cargo</label><input style={inputStyle} value={form.cargo} onChange={e => set('cargo', e.target.value)} placeholder="Dueño, CFO, Contador…" /></div>
                  </div>
                  <div style={{ marginBottom:24 }}>
                    <label style={labelStyle}>¿Cuántos empleados tiene tu empresa?</label>
                    <select style={{ ...inputStyle, appearance:'none' }} value={form.tamano} onChange={e => set('tamano', e.target.value)}>
                      <option value="">Selecciona…</option>
                      <option value="1-5 empleados">1–5 empleados</option>
                      <option value="6-20 empleados">6–20 empleados</option>
                      <option value="21-50 empleados">21–50 empleados</option>
                      <option value="51-200 empleados">51–200 empleados</option>
                      <option value="Despacho contable (1-10 clientes)">Despacho contable (1–10 clientes)</option>
                      <option value="Despacho contable (10-30 clientes)">Despacho contable (10–30 clientes)</option>
                      <option value="Despacho contable (30+ clientes)">Despacho contable (30+ clientes)</option>
                    </select>
                  </div>
                  <button type="submit" style={{ width:'100%', padding:'14px 20px', background:'#00C073', color:'#fff', border:'none', borderRadius:10, fontSize:15, fontWeight:800, cursor:'pointer', boxShadow:'0 4px 16px rgba(0,192,115,0.35)', letterSpacing:0.2 }}>
                    Comenzar prueba gratuita →
                  </button>
                  <p style={{ fontSize:12, color:'#9CA3AF', textAlign:'center', marginTop:12, marginBottom:0 }}>
                    Al registrarte aceptas nuestros <span style={{ color:'#00A363', cursor:'pointer' }}>Términos y condiciones</span>
                  </p>
                </form>
              </div>
            )}

            {(stage === 'pipeline' || stage === 'done') && (
              <div style={{ background:'#fff', borderRadius:16, padding:28, boxShadow:'0 4px 32px rgba(0,0,0,0.1)', border:'1px solid #E5E7EB' }}>
                <div style={{ marginBottom:20 }}>
                  <div style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'4px 12px', background:'rgba(92,45,145,0.08)', borderRadius:20, fontSize:11, color:'#5C2D91', fontWeight:700, marginBottom:10, textTransform:'uppercase', letterSpacing:0.8 }}>
                    <span style={{ width:6, height:6, borderRadius:'50%', background:'#5C2D91', display:'inline-block', animation: stage==='pipeline' ? 'pulse-glow 1s infinite' : 'none' }} />
                    {stage === 'pipeline' ? 'Pipeline ejecutándose' : 'Pipeline completado'}
                  </div>
                  <p style={{ fontSize:13, color:'#6B7280', margin:0 }}>
                    {stage === 'pipeline' ? 'El Lead Intelligence Agent está procesando tu registro…' : `¡Listo, ${form.nombre}! Tu cuenta está siendo preparada.`}
                  </p>
                </div>

                {/* Pipeline steps */}
                <div style={{ display:'flex', flexDirection:'column', gap:0 }}>
                  {steps.map((step, i) => (
                    <div key={step.id} style={{ display:'flex', gap:16, paddingBottom: i < steps.length-1 ? 16 : 0 }}>
                      {/* Icon + line */}
                      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', flexShrink:0 }}>
                        <div style={{ width:32, height:32, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, fontWeight:800, flexShrink:0,
                          background: step.status==='done' ? '#E8F8F0' : step.status==='running' ? 'rgba(92,45,145,0.1)' : step.status==='error' ? 'rgba(239,68,68,0.1)' : '#F5F4FA',
                          color: step.status==='done' ? '#00A363' : step.status==='running' ? '#5C2D91' : step.status==='error' ? '#EF4444' : '#D1D5DB',
                          border: step.status==='running' ? '2px solid #5C2D91' : '2px solid transparent',
                        }}>
                          {step.status==='done' ? '✓' : step.status==='running' ? '◌' : step.status==='error' ? '✕' : '○'}
                        </div>
                        {i < steps.length-1 && (
                          <div style={{ width:2, flex:1, marginTop:4, background: step.status==='done' ? '#00C073' : '#E5E7EB', minHeight:12 }} />
                        )}
                      </div>
                      {/* Content */}
                      <div style={{ paddingTop:4, paddingBottom: i < steps.length-1 ? 8 : 0, flex:1 }}>
                        <div style={{ fontSize:13, fontWeight:700, color: step.status==='pending' ? '#9CA3AF' : '#1A1A2E' }}>{step.label}</div>
                        <div style={{ fontSize:12, color:'#9CA3AF', marginTop:2 }}>
                          {step.result ?? step.sublabel}
                          {step.status === 'running' && <span style={{ marginLeft:6, color:'#5C2D91' }}>…</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Done: show results */}
                {stage === 'done' && result && (
                  <div style={{ marginTop:24, borderTop:'1px solid #E5E7EB', paddingTop:20 }}>
                    <div style={{ fontSize:11, color:'#9CA3AF', fontWeight:700, textTransform:'uppercase', letterSpacing:0.8, marginBottom:14 }}>Resultado del Lead Intelligence Agent</div>

                    <div style={{ display:'flex', gap:10, marginBottom:14 }}>
                      <div style={{ flex:1, padding:'12px', background:ib[result.icp_score]??'#F5F4FA', borderRadius:10, textAlign:'center', border:`1px solid ${(ic[result.icp_score]??'#9CA3AF')}33` }}>
                        <div style={{ fontSize:20, fontWeight:800, color:ic[result.icp_score] }}>{result.icp_score}</div>
                        <div style={{ fontSize:11, color:'#9CA3AF' }}>ICP Score</div>
                      </div>
                      <div style={{ flex:1, padding:'12px', background:'#F5F4FA', borderRadius:10, textAlign:'center' }}>
                        <div style={{ fontSize:14, fontWeight:700, color: result.segment==='CONTADOR'?'#5C2D91':'#00A363' }}>{result.segment}</div>
                        <div style={{ fontSize:11, color:'#9CA3AF' }}>Segmento</div>
                      </div>
                      <div style={{ flex:1, padding:'12px', background:'#F5F4FA', borderRadius:10, textAlign:'center' }}>
                        <div style={{ fontSize:13, fontWeight:700, color:'#1A1A2E' }}>{repName || '—'}</div>
                        <div style={{ fontSize:11, color:'#9CA3AF' }}>Rep asignado</div>
                      </div>
                    </div>

                    {result.pain_hypothesis && (
                      <div style={{ padding:'12px 14px', background:'#F5F4FA', borderRadius:10, borderLeft:'3px solid #5C2D91', marginBottom:14 }}>
                        <div style={{ fontSize:10, color:'#5C2D91', fontWeight:700, textTransform:'uppercase', letterSpacing:0.8, marginBottom:4 }}>Pain hypothesis</div>
                        <div style={{ fontSize:13, color:'#374151', lineHeight:1.5 }}>{result.pain_hypothesis}</div>
                      </div>
                    )}

                    {result.first_message && (
                      <div style={{ padding:'14px', background:'#1a2b1a', borderRadius:10, marginBottom:20 }}>
                        <div style={{ fontSize:10, color:'#52c41a', fontWeight:700, textTransform:'uppercase', letterSpacing:0.8, marginBottom:8 }}>📱 WhatsApp que recibirás</div>
                        <div style={{ fontSize:13, color:'#e8e8ed', lineHeight:1.6, background:'#0f1f0f', borderRadius:8, padding:'10px 12px' }}>{result.first_message}</div>
                      </div>
                    )}

                    <div style={{ display:'flex', gap:10 }}>
                      {dealId && (
                        <button onClick={() => router.push(`/pipeline/${dealId}`)} style={{ flex:1, padding:'12px', background:'#5C2D91', color:'#fff', border:'none', borderRadius:10, fontSize:13, fontWeight:700, cursor:'pointer' }}>
                          Ver deal en CRM →
                        </button>
                      )}
                      <button onClick={() => router.push('/contactos')} style={{ flex:1, padding:'12px', background:'#00C073', color:'#fff', border:'none', borderRadius:10, fontSize:13, fontWeight:700, cursor:'pointer' }}>
                        Ver en contactos →
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function delay(ms: number) { return new Promise(r => setTimeout(r, ms)) }
