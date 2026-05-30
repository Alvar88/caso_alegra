export type Segment = 'CONTADOR' | 'PYME'
export type IcpScore = 'HOT' | 'WARM' | 'COLD'
export type Pipeline = 'contadores' | 'pymes'
export type DealStage =
  | 'discovery'
  | 'calificacion'
  | 'demo'
  | 'trial'
  | 'negociacion'
  | 'closed_won'
  | 'closed_lost'
  | 'ramp'
export type LossReason =
  | 'precio'
  | 'timing'
  | 'competencia'
  | 'no_califica'
  | 'no_responde'
  | 'proyecto_cancelado'
export type Country = 'MX' | 'CO' | 'PE' | 'AR'
export type LeadSource =
  | 'webinar'
  | 'formulario_web'
  | 'referido'
  | 'demo_solicitada'
  | 'descarga_guia'
  | 'email_campaign'
  | 'google_ads'
export type ContactRole =
  | 'dueno'
  | 'socio_director'
  | 'gerente_admin'
  | 'contador_externo'
  | 'cfo'
  | 'administradora'
  | 'fundador'

export interface Company {
  id: string
  name: string
  segment: Segment
  country: Country
  industry: string
  employees?: number
  clients?: number
  currentSoftware?: string
  website?: string
}

export interface Contact {
  id: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  role: ContactRole
  companyId?: string
  country: Country
  source: LeadSource
  segment: Segment
  icpScore: IcpScore
  createdAt: string
  notes?: string
}

export interface Rep {
  id: string
  name: string
  avatar: string
  specialization: Segment | 'mixed'
  country: Country
  activeDeals: number
  quotaGap: number
  capacityScore: number
  mrr: number
  closedThisMonth: number
}

export interface Deal {
  id: string
  title: string
  contactId: string
  repId: string
  pipeline: Pipeline
  stage: DealStage
  icpScore: IcpScore
  mrr: number
  createdAt: string
  updatedAt: string
  closeDate?: string
  lossReason?: LossReason
  painHypothesis?: string
  confidence?: 'HIGH' | 'MEDIUM' | 'LOW'
  responseTimeMin?: number
  interestLevel?: number
  currentSoftware?: string
  painCategory?: string
  trialFacturas?: number
  discountPct?: number
}
