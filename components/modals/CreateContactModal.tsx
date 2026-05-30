'use client'
import { useEffect, useState } from 'react'
import Modal from './Modal'
import { dbFetch } from '@/lib/db'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jpptlznlexkxehxnyjeh.supabase.co'
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpwcHRsem5sZXpreGVoeG55amVoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAxNTAxNjIsImV4cCI6MjA5NTcyNjE2Mn0.44OoqEBDLMaRWa3tv7vAgh7hC4XsrKs6xbDMgmXh7Is'

interface Props {
  onClose: () => void
  onCreated: () => void
  preselectedCompanyId?: string
}

const fieldStyle = { width:'100%', padding:'9px 12px', border:'1px solid #E5E7EB', borderRadius:8, fontSize:13, color:'#1A1A2E', outline:'none', fontFamily:'inherit', background:'#FAFAFA', boxSizing:'border-box' as const }
const labelStyle = { display:'block' as const, fontSize:11, color:'#9CA3AF', fontWeight:700, textTransform:'uppercase' as const, letterSpacing:0.8, marginBottom:5 }
const rowStyle = { display:'grid' as const, gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:14 }

export default function CreateContactModal({ onClose, onCreated, preselectedCompanyId }: Props) {
  const [companies, setCompanies] = useState<any[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    first_name: '', last_name: '', email: '', phone: '',
    role: 'dueno', country: 'MX', source: 'formulario_web',
    segment: 'PYME', icp_score: 'WARM', company_id: preselectedCompanyId ?? '',
  })

  useEffect(() => {
    dbFetch('companies', 'select=id,name,segment&order=name').then(setCompanies)
  }, [])

  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.first_name.trim() || !form.last_name.trim() || !form.email.trim()) {
      setError('Nombre, apellido y email son obligatorios.')
      return
    }
    setSaving(true)
    const body: any = {
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      email: form.email.trim(),
      role: form.role,
      country: form.country,
      source: form.source,
      segment: form.segment,
      icp_score: form.icp_score,
    }
    if (form.phone.trim()) body.phone = form.phone.trim()
    if (form.company_id) body.company_id = form.company_id

    const res = await fetch(`${SUPABASE_URL}/rest/v1/contacts`, {
      method: 'POST',
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify(body),
    })
    setSaving(false)
    if (!res.ok) { setError('Error al guardar. Verifica que el email no esté duplicado.'); return }
    onCreated()
    onClose()
  }

  return (
    <Modal title="Nuevo contacto" onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div style={rowStyle}>
          <div><label style={labelStyle}>Nombre *</label><input style={fieldStyle} value={form.first_name} onChange={e => set('first_name', e.target.value)} placeholder="Carlos" /></div>
          <div><label style={labelStyle}>Apellido *</label><input style={fieldStyle} value={form.last_name} onChange={e => set('last_name', e.target.value)} placeholder="Morales" /></div>
        </div>
        <div style={{ marginBottom:14 }}>
          <label style={labelStyle}>Email *</label>
          <input style={fieldStyle} type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="carlos@empresa.com" />
        </div>
        <div style={rowStyle}>
          <div><label style={labelStyle}>Teléfono</label><input style={fieldStyle} value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+52 55 1234 5678" /></div>
          <div>
            <label style={labelStyle}>País</label>
            <select style={fieldStyle} value={form.country} onChange={e => set('country', e.target.value)}>
              <option value="MX">🇲🇽 México</option>
              <option value="CO">🇨🇴 Colombia</option>
              <option value="PE">🇵🇪 Perú</option>
              <option value="AR">🇦🇷 Argentina</option>
            </select>
          </div>
        </div>
        <div style={rowStyle}>
          <div>
            <label style={labelStyle}>Rol</label>
            <select style={fieldStyle} value={form.role} onChange={e => set('role', e.target.value)}>
              <option value="dueno">Dueño/a</option>
              <option value="socio_director">Socio director</option>
              <option value="gerente_admin">Gerente admin</option>
              <option value="contador_externo">Contador externo</option>
              <option value="cfo">CFO</option>
              <option value="administradora">Administradora</option>
              <option value="fundador">Fundador/a</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Fuente</label>
            <select style={fieldStyle} value={form.source} onChange={e => set('source', e.target.value)}>
              <option value="formulario_web">Formulario web</option>
              <option value="webinar">Webinar</option>
              <option value="referido">Referido</option>
              <option value="demo_solicitada">Demo solicitada</option>
              <option value="descarga_guia">Descarga guía</option>
              <option value="email_campaign">Email campaign</option>
              <option value="google_ads">Google Ads</option>
            </select>
          </div>
        </div>
        <div style={rowStyle}>
          <div>
            <label style={labelStyle}>Segmento</label>
            <select style={fieldStyle} value={form.segment} onChange={e => set('segment', e.target.value)}>
              <option value="PYME">PyME</option>
              <option value="CONTADOR">Contador</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>ICP Score</label>
            <select style={fieldStyle} value={form.icp_score} onChange={e => set('icp_score', e.target.value)}>
              <option value="HOT">HOT</option>
              <option value="WARM">WARM</option>
              <option value="COLD">COLD</option>
            </select>
          </div>
        </div>
        <div style={{ marginBottom:20 }}>
          <label style={labelStyle}>Empresa asociada</label>
          <select style={fieldStyle} value={form.company_id} onChange={e => set('company_id', e.target.value)}>
            <option value="">— Sin empresa —</option>
            {companies.map(c => <option key={c.id} value={c.id}>{c.name} ({c.segment})</option>)}
          </select>
        </div>

        {error && <div style={{ marginBottom:14, padding:'10px 14px', background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:8, fontSize:13, color:'#EF4444' }}>{error}</div>}

        <div style={{ display:'flex', justifyContent:'flex-end', gap:10 }}>
          <button type="button" onClick={onClose} style={{ padding:'9px 18px', border:'1px solid #E5E7EB', borderRadius:8, fontSize:13, background:'#fff', color:'#6B7280', cursor:'pointer' }}>Cancelar</button>
          <button type="submit" disabled={saving} style={{ padding:'9px 20px', background: saving ? '#9CA3AF' : '#00C073', color:'#fff', border:'none', borderRadius:8, fontSize:13, fontWeight:700, cursor: saving ? 'default' : 'pointer' }}>
            {saving ? 'Guardando…' : 'Crear contacto'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
