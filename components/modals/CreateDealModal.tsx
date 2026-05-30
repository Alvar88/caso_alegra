'use client'
import { useEffect, useState } from 'react'
import Modal from './Modal'
import { dbFetch } from '@/lib/db'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jpptlznlexkxehxnyjeh.supabase.co'
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpwcHRsem5sZXpreGVoeG55amVoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAxNTAxNjIsImV4cCI6MjA5NTcyNjE2Mn0.44OoqEBDLMaRWa3tv7vAgh7hC4XsrKs6xbDMgmXh7Is'

interface Props {
  onClose: () => void
  onCreated: () => void
  preselectedContactId?: string
}

const fieldStyle = { width:'100%', padding:'9px 12px', border:'1px solid #E5E7EB', borderRadius:8, fontSize:13, color:'#1A1A2E', outline:'none', fontFamily:'inherit', background:'#FAFAFA', boxSizing:'border-box' as const }
const labelStyle = { display:'block' as const, fontSize:11, color:'#9CA3AF', fontWeight:700, textTransform:'uppercase' as const, letterSpacing:0.8, marginBottom:5 }
const rowStyle = { display:'grid' as const, gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:14 }

export default function CreateDealModal({ onClose, onCreated, preselectedContactId }: Props) {
  const [contacts, setContacts] = useState<any[]>([])
  const [reps, setReps] = useState<any[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    title: '', contact_id: preselectedContactId ?? '', rep_id: '',
    pipeline: 'contadores', stage: 'discovery', icp_score: 'WARM',
    mrr: '', close_date: '', confidence: 'MEDIUM', current_software: '',
  })

  useEffect(() => {
    Promise.all([
      dbFetch('contacts', 'select=id,first_name,last_name,segment&order=first_name'),
      dbFetch('reps', 'select=id,name,specialization&order=name'),
    ]).then(([c, r]) => { setContacts(c); setReps(r); if (r[0]) setForm(p => ({ ...p, rep_id: r[0].id })) })
  }, [])

  // Auto-set pipeline from contact segment
  useEffect(() => {
    if (!form.contact_id) return
    const c = contacts.find(c => c.id === form.contact_id)
    if (c) setForm(p => ({ ...p, pipeline: c.segment === 'CONTADOR' ? 'contadores' : 'pymes' }))
  }, [form.contact_id, contacts])

  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim() || !form.contact_id || !form.rep_id) {
      setError('Título, contacto y rep son obligatorios.')
      return
    }
    setSaving(true)
    const body: any = {
      title: form.title.trim(),
      contact_id: form.contact_id,
      rep_id: form.rep_id,
      pipeline: form.pipeline,
      stage: form.stage,
      icp_score: form.icp_score,
      mrr: form.mrr ? parseFloat(form.mrr) : 0,
      confidence: form.confidence,
    }
    if (form.close_date) body.close_date = form.close_date
    if (form.current_software.trim()) body.current_software = form.current_software.trim()

    const res = await fetch(`${SUPABASE_URL}/rest/v1/deals`, {
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
    <Modal title="Nuevo deal" onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom:14 }}>
          <label style={labelStyle}>Título del deal *</label>
          <input style={fieldStyle} value={form.title} onChange={e => set('title', e.target.value)} placeholder="Empresa X — Plan Contadores" />
        </div>

        <div style={{ marginBottom:14 }}>
          <label style={labelStyle}>Contacto asociado *</label>
          <select style={fieldStyle} value={form.contact_id} onChange={e => set('contact_id', e.target.value)}>
            <option value="">— Selecciona un contacto —</option>
            {contacts.map(c => <option key={c.id} value={c.id}>{c.first_name} {c.last_name} · {c.segment}</option>)}
          </select>
        </div>

        <div style={{ marginBottom:14 }}>
          <label style={labelStyle}>Rep asignado *</label>
          <select style={fieldStyle} value={form.rep_id} onChange={e => set('rep_id', e.target.value)}>
            <option value="">— Selecciona un rep —</option>
            {reps.map(r => <option key={r.id} value={r.id}>{r.name} · {r.specialization}</option>)}
          </select>
        </div>

        <div style={rowStyle}>
          <div>
            <label style={labelStyle}>Pipeline</label>
            <select style={fieldStyle} value={form.pipeline} onChange={e => set('pipeline', e.target.value)}>
              <option value="contadores">Contadores</option>
              <option value="pymes">PyMEs</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Etapa</label>
            <select style={fieldStyle} value={form.stage} onChange={e => set('stage', e.target.value)}>
              <option value="discovery">Discovery</option>
              <option value="calificacion">Calificación</option>
              <option value="demo">Demo</option>
              <option value="trial">Trial</option>
              <option value="negociacion">Negociación</option>
              <option value="closed_won">Closed Won</option>
              <option value="closed_lost">Closed Lost</option>
            </select>
          </div>
        </div>

        <div style={rowStyle}>
          <div>
            <label style={labelStyle}>ICP Score</label>
            <select style={fieldStyle} value={form.icp_score} onChange={e => set('icp_score', e.target.value)}>
              <option value="HOT">HOT</option>
              <option value="WARM">WARM</option>
              <option value="COLD">COLD</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Confianza</label>
            <select style={fieldStyle} value={form.confidence} onChange={e => set('confidence', e.target.value)}>
              <option value="HIGH">HIGH</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="LOW">LOW</option>
            </select>
          </div>
        </div>

        <div style={rowStyle}>
          <div>
            <label style={labelStyle}>MRR (USD)</label>
            <input style={fieldStyle} type="number" min="0" value={form.mrr} onChange={e => set('mrr', e.target.value)} placeholder="500" />
          </div>
          <div>
            <label style={labelStyle}>Fecha de cierre</label>
            <input style={fieldStyle} type="date" value={form.close_date} onChange={e => set('close_date', e.target.value)} />
          </div>
        </div>

        <div style={{ marginBottom:20 }}>
          <label style={labelStyle}>Software actual</label>
          <input style={fieldStyle} value={form.current_software} onChange={e => set('current_software', e.target.value)} placeholder="Excel, Siigo…" />
        </div>

        {error && <div style={{ marginBottom:14, padding:'10px 14px', background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:8, fontSize:13, color:'#EF4444' }}>{error}</div>}

        <div style={{ display:'flex', justifyContent:'flex-end', gap:10 }}>
          <button type="button" onClick={onClose} style={{ padding:'9px 18px', border:'1px solid #E5E7EB', borderRadius:8, fontSize:13, background:'#fff', color:'#6B7280', cursor:'pointer' }}>Cancelar</button>
          <button type="submit" disabled={saving} style={{ padding:'9px 20px', background: saving ? '#9CA3AF' : '#5C2D91', color:'#fff', border:'none', borderRadius:8, fontSize:13, fontWeight:700, cursor: saving ? 'default' : 'pointer' }}>
            {saving ? 'Guardando…' : 'Crear deal'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
