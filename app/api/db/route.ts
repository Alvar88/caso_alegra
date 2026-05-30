import { NextRequest, NextResponse } from 'next/server'

const BASE = 'https://jpptlznlexkxehxnyjeh.supabase.co/rest/v1'
const KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpwcHRsem5sZXpreGVoeG55amVoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAxNTAxNjIsImV4cCI6MjA5NTcyNjE2Mn0.44OoqEBDLMaRWa3tv7vAgh7hC4XsrKs6xbDMgmXh7Is'
const H = {
  'apikey': KEY,
  'Authorization': `Bearer ${KEY}`,
  'Accept': 'application/json',
  'Content-Type': 'application/json',
}

async function get(table: string, params = '') {
  const url = `${BASE}/${table}${params ? '?' + params : ''}`
  const r = await fetch(url, { headers: H, cache: 'no-store' })
  const text = await r.text()
  if (!r.ok) {
    console.error(`Supabase error [${r.status}] ${table}:`, text)
    return []
  }
  try { return JSON.parse(text) } catch { return [] }
}

export async function GET(req: NextRequest) {
  const type = req.nextUrl.searchParams.get('type')

  // Debug endpoint: test raw connection
  if (type === 'test') {
    const url = `${BASE}/reps?select=id,name&limit=3`
    const r = await fetch(url, { headers: H, cache: 'no-store' })
    const text = await r.text()
    return NextResponse.json({ status: r.status, ok: r.ok, body: text, url })
  }

  if (type === 'dashboard') {
    const [deals, reps, contacts, companies] = await Promise.all([
      get('deals', 'select=id,title,stage,icp_score,mrr,loss_reason,response_time_min,contact_id,updated_at&order=updated_at.desc'),
      get('reps', 'select=*&order=capacity_score.desc'),
      get('contacts', 'select=id,first_name,last_name'),
      get('companies', 'select=id'),
    ])
    const cMap: Record<string, any> = {}
    contacts.forEach((c: any) => { cMap[c.id] = c })
    return NextResponse.json({
      deals: deals.map((d: any) => ({ ...d, contact: cMap[d.contact_id] ?? null })),
      reps,
      totalContacts: contacts.length,
      totalCompanies: companies.length,
    })
  }

  if (type === 'pipeline') {
    const [deals, contacts, companies, reps] = await Promise.all([
      get('deals', 'select=id,stage,pipeline,icp_score,mrr,loss_reason,response_time_min,contact_id,rep_id&order=updated_at.desc'),
      get('contacts', 'select=id,first_name,last_name,country,company_id'),
      get('companies', 'select=id,name'),
      get('reps', 'select=id,avatar'),
    ])
    const cMap: Record<string, any> = {}
    contacts.forEach((c: any) => { cMap[c.id] = c })
    const rMap: Record<string, any> = {}
    reps.forEach((r: any) => { rMap[r.id] = r })
    return NextResponse.json({
      deals: deals.map((d: any) => ({ ...d, contact: cMap[d.contact_id] ?? null, rep: rMap[d.rep_id] ?? null })),
      companies,
    })
  }

  if (type === 'contacts') {
    const [contacts, companies, deals] = await Promise.all([
      get('contacts', 'select=*&order=icp_score,created_at.desc'),
      get('companies', 'select=id,name,clients,employees'),
      get('deals', 'select=id,contact_id,stage'),
    ])
    const coMap: Record<string, any> = {}
    companies.forEach((c: any) => { coMap[c.id] = c })
    const dMap: Record<string, any[]> = {}
    deals.forEach((d: any) => { if (!dMap[d.contact_id]) dMap[d.contact_id] = []; dMap[d.contact_id].push(d) })
    return NextResponse.json({
      contacts: contacts.map((c: any) => ({ ...c, company: coMap[c.company_id] ?? null, deals: dMap[c.id] ?? [] })),
    })
  }

  if (type === 'companies') {
    const [companies, contacts, deals] = await Promise.all([
      get('companies', 'select=*&order=segment,name'),
      get('contacts', 'select=id,first_name,last_name,icp_score,company_id'),
      get('deals', 'select=id,contact_id,stage,mrr'),
    ])
    const dMap: Record<string, any[]> = {}
    deals.forEach((d: any) => { if (!dMap[d.contact_id]) dMap[d.contact_id] = []; dMap[d.contact_id].push(d) })
    const cMap: Record<string, any[]> = {}
    contacts.forEach((c: any) => {
      if (!c.company_id) return
      if (!cMap[c.company_id]) cMap[c.company_id] = []
      cMap[c.company_id].push({ ...c, deals: dMap[c.id] ?? [] })
    })
    return NextResponse.json({
      companies: companies.map((co: any) => ({ ...co, contacts: cMap[co.id] ?? [] })),
    })
  }

  return NextResponse.json({ error: 'type required. Options: test, dashboard, pipeline, contacts, companies' }, { status: 400 })
}
