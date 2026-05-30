'use client'
import { useState } from 'react'
import Modal from './Modal'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jpptlznlexkxehxnyjeh.supabase.co'
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpwcHRsem5sZXpreGVoeG55amVoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAxNTAxNjIsImV4cCI6MjA5NTcyNjE2Mn0.44OoqEBDLMaRWa3tv7vAgh7hC4XsrKs6xbDMgmXh7Is'

interface Props { onClose: () => void; onCreated: () => void }

const fieldStyle = { width:'100%', padding:'9px 12px', border:'1px solid #E5E7EB', borderRadius:8, fontSize:13, color:'#1A1A2E', outline:'none', fontFamily:'inherit', background:'#FAFAFA', boxSizing:'border-box' as const }
const labelStyle = { display:'block' as const, fontSize:11, color:'#9CA3AF', fontWeight:700, textTransform:'uppercase' as const, letterSpacing:0.8, marginBottom:5 }
const rowStyle = { display:'grid' as const, gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:14 }

export default function CreateEmpresaModal({ onClose, onCreated }: Props) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    name: '', segment: 'PYME', country: 'MX', industry: '',
    employees: '', clients: '', current_software: '', website: '',
  })

  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }))
  const isCont = form.segment === 'CONTADOR'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim() || !form.industry.trim()) { setError('Nombre e industria son obligatorios.'); return }
    setSaving(true)
    const body: any = {
      name: form.name.trim(),
      segment: form.segment,
      country: form.country,
      industry: form.industry.trim(),
    }
    if (isCont && form.clients) body.clients = parseInt(form.clients)
    if (!isCont && form.employees) body.employees = parseInt(form.employees)
    if (form.current_software.trim()) body.current_software = form.current_software.trim()
    if (form.website.trim()) body.website = form.website.trim()

    const res = await fetch(`${SUPABASE_URL}/rest/v1/companies`, {
      method: 'POST',
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify(body),
    })
    setSaving(false)
    if (!res.ok) { setError('Error al guardar. Intenta nuevamente.'); return }
    onCreated()
    onClose()
  }

  return (
    <Modal title="Nueva empresa" onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom:14 }}>
          <label style={labelStyle}>Nombre de la empresa *</label>
          <input style={fieldStyle} value={form.name} onChange={e => set('name', e.target.value)} placeholder="Despacho Morales & Asociados" />
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
            <label style={labelStyle}>Industria *</label>
            <input style={fieldStyle} value={form.industry} onChange={e => set('industry', e.target.value)} placeholder={isCont ? 'Servicios contables' : 'Construcción'} />
          </div>
          <div>
            <label style={labelStyle}>{isCont ? 'Clientes' : 'Empleados'}</label>
            <input style={fieldStyle} type="number" min="0" value={isCont ? form.clients : form.employees} onChange={e => set(isCont ? 'clients' : 'employees', e.target.value)} placeholder={isCont ? '25' : '15'} />
          </div>
        </div>
        <div style={rowStyle}>
          <div>
            <label style={labelStyle}>Software actual</label>
            <input style={fieldStyle} value={form.current_software} onChange={e => set('current_software', e.target.value)} placeholder="Excel, CONTAPAQi…" />
          </div>
          <div>
            <label style={labelStyle}>Sitio web</label>
            <input style={fieldStyle} value={form.website} onChange={e => set('website', e.target.value)} placeholder="empresa.com" />
          </div>
        </div>

        {error && <div style={{ marginBottom:14, padding:'10px 14px', background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:8, fontSize:13, color:'#EF4444' }}>{error}</div>}

        <div style={{ display:'flex', justifyContent:'flex-end', gap:10, marginTop:6 }}>
          <button type="button" onClick={onClose} style={{ padding:'9px 18px', border:'1px solid #E5E7EB', borderRadius:8, fontSize:13, background:'#fff', color:'#6B7280', cursor:'pointer' }}>Cancelar</button>
          <button type="submit" disabled={saving} style={{ padding:'9px 20px', background: saving ? '#9CA3AF' : '#00C073', color:'#fff', border:'none', borderRadius:8, fontSize:13, fontWeight:700, cursor: saving ? 'default' : 'pointer' }}>
            {saving ? 'Guardando…' : 'Crear empresa'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
