-- ============================================================
-- ALEGRA CRM DEMO — Schema
-- Ejecutar en: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- Enums
CREATE TYPE segment_type AS ENUM ('CONTADOR', 'PYME');
CREATE TYPE icp_score_type AS ENUM ('HOT', 'WARM', 'COLD');
CREATE TYPE country_type AS ENUM ('MX', 'CO', 'PE', 'AR');
CREATE TYPE pipeline_type AS ENUM ('contadores', 'pymes');
CREATE TYPE stage_type AS ENUM ('discovery', 'calificacion', 'demo', 'trial', 'negociacion', 'closed_won', 'closed_lost', 'ramp');
CREATE TYPE loss_reason_type AS ENUM ('precio', 'timing', 'competencia', 'no_califica', 'no_responde', 'proyecto_cancelado');
CREATE TYPE confidence_type AS ENUM ('HIGH', 'MEDIUM', 'LOW');
CREATE TYPE source_type AS ENUM ('webinar', 'formulario_web', 'referido', 'demo_solicitada', 'descarga_guia', 'email_campaign', 'google_ads');
CREATE TYPE role_type AS ENUM ('dueno', 'socio_director', 'gerente_admin', 'contador_externo', 'cfo', 'administradora', 'fundador', 'director_finanzas', 'socio');
CREATE TYPE specialization_type AS ENUM ('CONTADOR', 'PYME', 'mixed');

-- ============================================================
-- TABLA: reps
-- ============================================================
CREATE TABLE reps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  avatar TEXT NOT NULL,
  specialization specialization_type NOT NULL DEFAULT 'mixed',
  country country_type NOT NULL,
  active_deals INT NOT NULL DEFAULT 0,
  quota_gap NUMERIC(10,2) NOT NULL DEFAULT 0,
  capacity_score INT NOT NULL DEFAULT 50 CHECK (capacity_score >= 0 AND capacity_score <= 100),
  mrr NUMERIC(10,2) NOT NULL DEFAULT 0,
  closed_this_month INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLA: companies
-- ============================================================
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  segment segment_type NOT NULL,
  country country_type NOT NULL,
  industry TEXT NOT NULL,
  employees INT,
  clients INT,
  current_software TEXT,
  website TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLA: contacts
-- ============================================================
CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  role role_type NOT NULL,
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  country country_type NOT NULL,
  source source_type NOT NULL,
  segment segment_type NOT NULL,
  icp_score icp_score_type NOT NULL DEFAULT 'COLD',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLA: deals
-- ============================================================
CREATE TABLE deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  rep_id UUID NOT NULL REFERENCES reps(id),
  pipeline pipeline_type NOT NULL,
  stage stage_type NOT NULL DEFAULT 'discovery',
  icp_score icp_score_type NOT NULL DEFAULT 'COLD',
  mrr NUMERIC(10,2) NOT NULL DEFAULT 0,
  close_date DATE,
  loss_reason loss_reason_type,
  pain_hypothesis TEXT,
  confidence confidence_type,
  response_time_min INT,
  interest_level INT CHECK (interest_level >= 1 AND interest_level <= 5),
  current_software TEXT,
  pain_category TEXT,
  trial_facturas INT,
  discount_pct NUMERIC(5,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER deals_updated_at
  BEFORE UPDATE ON deals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- ÍNDICES
-- ============================================================
CREATE INDEX idx_contacts_company_id ON contacts(company_id);
CREATE INDEX idx_contacts_segment ON contacts(segment);
CREATE INDEX idx_contacts_icp_score ON contacts(icp_score);
CREATE INDEX idx_deals_contact_id ON deals(contact_id);
CREATE INDEX idx_deals_rep_id ON deals(rep_id);
CREATE INDEX idx_deals_pipeline ON deals(pipeline);
CREATE INDEX idx_deals_stage ON deals(stage);
CREATE INDEX idx_deals_icp_score ON deals(icp_score);

-- ============================================================
-- ROW LEVEL SECURITY (lectura pública para el demo)
-- ============================================================
ALTER TABLE reps ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read reps" ON reps FOR SELECT USING (true);
CREATE POLICY "Public read companies" ON companies FOR SELECT USING (true);
CREATE POLICY "Public read contacts" ON contacts FOR SELECT USING (true);
CREATE POLICY "Public read deals" ON deals FOR SELECT USING (true);
