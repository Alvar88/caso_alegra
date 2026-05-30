import { NextRequest, NextResponse } from 'next/server'

const URL = 'https://jpptlznlexkxehxnyjeh.supabase.co/rest/v1'
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpwcHRsem5sZXpreGVoeG55amVoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAxNTAxNjIsImV4cCI6MjA5NTcyNjE2Mn0.44OoqEBDLMaRWa3tv7vAgh7hC4XsrKs6xbDMgmXh7Is'
const H = { apikey: KEY, Authorization: `Bearer ${KEY}` }

async function get(table: string, params = '') {
  try {
    const r = await fetch(`${URL}/${table}?${params}`, { headers: H, cache: 'no-store' })
    if (!r.ok) return []
    return r.json()
  } catch { return [] }
}

export async function GET(req: NextRequest) {
  const type = req.nextUrl.searchParams.get('type')

  if (type === 'dashboard') {
    const [deals, reps, contacts, companies] = await Promise.all([
      get('deals', 'select=id,title,stage,icp_score,mrr,loss_reason,response_time_min,contact_id,updated_at&order=updated_at.desc'),
      get('reps', 'select=*&order=capacity_score.desc'),
      get('contacts', 'select=id,first_name,last_name'),
      get('companies', 'select=id'),
    ])
    const contactMap: Record<string, any> = {}
    contacts.forEach((c: any) => { contactMap[c.id] = c })
    const dealsWithContact = deals.map((d: any) => ({ ...d, contact: contactMap[d.contact_id] ?? null }))
    return NextResponse.json({ deals: dealsWithContact, reps, totalContacts: contacts.length, totalCompanies: companies.length })
  }

  if (type === 'pipeline') {
    const [deals, contacts, companies, reps] = await Promise.all([
      get('deals', 'select=id,title,stage,pipeline,icp_score,mrr,loss_reason,response_time_min,contact_id,rep_id&order=updated_at.desc'),
      get('contacts', 'select=id,first_name,last_name,country,company_id'),
      get('companies', 'select=id,name'),
      get('reps', 'select=id,avatar'),
    ])
    const contactMap: Record<string, any> = {}
    contacts.forEach((c: any) => { contactMap[c.id] = c })
    const repMap: Record<string, any> = {}
    reps.forEach((r: any) => { repMap[r.id] = r })
    const dealsJoined = deals.map((d: any) => ({
      ...d,
      contact: contactMap[d.contact_id] ?? null,
      rep: repMap[d.rep_id] ?? null,
    }))
    return NextResponse.json({ deals: dealsJoined, companies })
  }

  if (type === 'contacts') {
    const [contacts, companies, deals] = await Promise.all([
      get('contacts', 'select=*&order=icp_score,created_at.desc'),
      get('companies', 'select=id,name,clients,employees'),
      get('deals', 'select=id,contact_id,stage'),
    ])
    const companyMap: Record<string, any> = {}
    companies.forEach((c: any) => { companyMap[c.id] = c })
    const dealsByContact: Record<string, any[]> = {}
    deals.forEach((d: any) => {
      if (!dealsByContact[d.contact_id]) dealsByContact[d.contact_id] = []
      dealsByContact[d.contact_id].push(d)
    })
    const result = contacts.map((c: any) => ({
      ...c,
      company: c.company_id ? companyMap[c.company_id] ?? null : null,
      deals: dealsByContact[c.id] ?? [],
    }))
    return NextResponse.json({ contacts: result })
  }

  if (type === 'companies') {
    const [companies, contacts, deals] = await Promise.all([
      get('companies', 'select=*&order=segment,name'),
      get('contacts', 'select=id,first_name,last_name,icp_score,company_id'),
      get('deals', 'select=id,contact_id,stage,mrr'),
    ])
    const dealsByContact: Record<string, any[]> = {}
    deals.forEach((d: any) => {
      if (!dealsByContact[d.contact_id]) dealsByContact[d.contact_id] = []
      dealsByContact[d.contact_id].push(d)
    })
    const contactsByCompany: Record<string, any[]> = {}
    contacts.forEach((c: any) => {
      if (!c.company_id) return
      if (!contactsByCompany[c.company_id]) contactsByCompany[c.company_id] = []
      contactsByCompany[c.company_id].push({ ...c, deals: dealsByContact[c.id] ?? [] })
    })
    const result = companies.map((co: any) => ({ ...co, contacts: contactsByCompany[co.id] ?? [] }))
    return NextResponse.json({ companies: result })
  }

  return NextResponse.json({ error: 'type required' }, { status: 400 })
}
