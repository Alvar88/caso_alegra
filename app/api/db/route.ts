import { NextRequest, NextResponse } from 'next/server'

const SUPABASE_URL = 'https://jpptlznlexkxehxnyjeh.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpwcHRsem5sZXpreGVoeG55amVoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAxNTAxNjIsImV4cCI6MjA5NTcyNjE2Mn0.44OoqEBDLMaRWa3tv7vAgh7hC4XsrKs6xbDMgmXh7Is'

const headers = {
  'apikey': SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
  'Prefer': 'return=representation',
}

async function sb(path: string) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { headers, cache: 'no-store' })
  if (!res.ok) return []
  return res.json()
}

export async function GET(req: NextRequest) {
  const type = req.nextUrl.searchParams.get('type')

  if (type === 'dashboard') {
    const [deals, reps] = await Promise.all([
      sb('deals?select=*,contact:contacts(first_name,last_name)&order=updated_at.desc'),
      sb('reps?select=*&order=capacity_score.desc'),
    ])
    const [{ count: totalContacts }, { count: totalCompanies }] = await Promise.all([
      fetch(`${SUPABASE_URL}/rest/v1/contacts?select=id`, { headers: { ...headers, 'Prefer': 'count=exact', 'Range-Unit': 'items', 'Range': '0-0' }, cache: 'no-store' })
        .then(r => ({ count: Number(r.headers.get('content-range')?.split('/')[1] ?? 0) })),
      fetch(`${SUPABASE_URL}/rest/v1/companies?select=id`, { headers: { ...headers, 'Prefer': 'count=exact', 'Range-Unit': 'items', 'Range': '0-0' }, cache: 'no-store' })
        .then(r => ({ count: Number(r.headers.get('content-range')?.split('/')[1] ?? 0) })),
    ])
    return NextResponse.json({ deals, reps, totalContacts, totalCompanies })
  }

  if (type === 'pipeline') {
    const [deals, companies] = await Promise.all([
      sb('deals?select=*,contact:contacts(first_name,last_name,country,company_id),rep:reps(avatar)&order=updated_at.desc'),
      sb('companies?select=id,name'),
    ])
    return NextResponse.json({ deals, companies })
  }

  if (type === 'contacts') {
    const contacts = await sb('contacts?select=*,company:companies(name,clients,employees),deals(stage)&order=icp_score,created_at.desc')
    return NextResponse.json({ contacts })
  }

  if (type === 'companies') {
    const companies = await sb('companies?select=*,contacts(id,first_name,last_name,icp_score,deals(stage,mrr))&order=segment,name')
    return NextResponse.json({ companies })
  }

  return NextResponse.json({ error: 'type param required' }, { status: 400 })
}
