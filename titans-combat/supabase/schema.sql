-- ============================================================
-- TITÃS COMBAT - Database Schema
-- Multi-tenant ready
-- ============================================================

-- TENANTS
CREATE TABLE IF NOT EXISTS tenants (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  slug       TEXT UNIQUE NOT NULL,
  settings   JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- PROFILES (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id  UUID REFERENCES tenants(id),
  role       TEXT NOT NULL DEFAULT 'admin', -- admin | recepcao | aluno
  name       TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- MODALITIES
CREATE TABLE IF NOT EXISTS modalities (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID REFERENCES tenants(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  description TEXT,
  color       TEXT DEFAULT '#dc2626',
  active      BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- TEACHERS
CREATE TABLE IF NOT EXISTS teachers (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID REFERENCES tenants(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  cpf         TEXT,
  phone       TEXT,
  email       TEXT,
  specialty   TEXT,
  active      BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- PLANS
CREATE TABLE IF NOT EXISTS plans (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      UUID REFERENCES tenants(id) ON DELETE CASCADE,
  name           TEXT NOT NULL,
  price          NUMERIC(10,2) NOT NULL,
  validity_days  INTEGER NOT NULL DEFAULT 30,
  class_limit    INTEGER,
  unlimited      BOOLEAN DEFAULT true,
  benefits       TEXT[],
  color          TEXT DEFAULT '#dc2626',
  active         BOOLEAN DEFAULT true,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- STUDENTS
CREATE TABLE IF NOT EXISTS students (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           UUID REFERENCES tenants(id) ON DELETE CASCADE,
  user_id             UUID REFERENCES auth.users(id),  -- for self check-in
  photo_url           TEXT,
  name                TEXT NOT NULL,
  cpf                 TEXT,
  birth_date          DATE,
  gender              TEXT CHECK (gender IN ('M', 'F', 'outro')),
  phone               TEXT,
  whatsapp            TEXT,
  email               TEXT,
  address             JSONB DEFAULT '{}',
  emergency_contact   TEXT,
  emergency_phone     TEXT,
  responsible_name    TEXT,
  responsible_cpf     TEXT,
  modality_id         UUID REFERENCES modalities(id),
  teacher_id          UUID REFERENCES teachers(id),
  plan_id             UUID REFERENCES plans(id),
  enrollment_date     DATE DEFAULT CURRENT_DATE,
  status              TEXT NOT NULL DEFAULT 'ativo'
                        CHECK (status IN ('ativo','experimental','afastado','inadimplente','cancelado')),
  notes               TEXT,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ENROLLMENTS
CREATE TABLE IF NOT EXISTS enrollments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id  UUID REFERENCES students(id) ON DELETE CASCADE,
  plan_id     UUID REFERENCES plans(id),
  start_date  DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date    DATE,
  status      TEXT NOT NULL DEFAULT 'active'
                CHECK (status IN ('active','expired','cancelled')),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- PAYMENTS
CREATE TABLE IF NOT EXISTS payments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID REFERENCES tenants(id) ON DELETE CASCADE,
  student_id      UUID REFERENCES students(id) ON DELETE CASCADE,
  enrollment_id   UUID REFERENCES enrollments(id),
  amount          NUMERIC(10,2) NOT NULL,
  due_date        DATE NOT NULL,
  paid_date       DATE,
  payment_method  TEXT CHECK (payment_method IN ('pix','dinheiro','cartao','transferencia')),
  status          TEXT NOT NULL DEFAULT 'pendente'
                    CHECK (status IN ('pendente','pago','atrasado','cancelado')),
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- CHECKINS
CREATE TABLE IF NOT EXISTS checkins (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id   UUID REFERENCES students(id) ON DELETE CASCADE,
  tenant_id    UUID REFERENCES tenants(id) ON DELETE CASCADE,
  checked_at   TIMESTAMPTZ DEFAULT NOW(),
  device_info  TEXT,
  browser_info TEXT,
  ip_address   TEXT
);

-- LEADS
CREATE TABLE IF NOT EXISTS leads (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           UUID REFERENCES tenants(id) ON DELETE CASCADE,
  name                TEXT NOT NULL,
  phone               TEXT,
  email               TEXT,
  modality_interest   UUID REFERENCES modalities(id),
  source              TEXT,
  status              TEXT NOT NULL DEFAULT 'novo'
                        CHECK (status IN ('novo','contatado','agendado','convertido','perdido')),
  notes               TEXT,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_students_tenant ON students(tenant_id);
CREATE INDEX IF NOT EXISTS idx_students_status ON students(status);
CREATE INDEX IF NOT EXISTS idx_checkins_tenant ON checkins(tenant_id);
CREATE INDEX IF NOT EXISTS idx_checkins_student ON checkins(student_id);
CREATE INDEX IF NOT EXISTS idx_checkins_date ON checkins(checked_at);
CREATE INDEX IF NOT EXISTS idx_payments_tenant ON payments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_payments_student ON payments(student_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_due ON payments(due_date);
CREATE INDEX IF NOT EXISTS idx_leads_tenant ON leads(tenant_id);

-- ============================================================
-- UPDATED_AT trigger
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER students_updated_at
  BEFORE UPDATE ON students
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-create profile after user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, role) VALUES (NEW.id, 'admin')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE tenants     ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles    ENABLE ROW LEVEL SECURITY;
ALTER TABLE modalities  ENABLE ROW LEVEL SECURITY;
ALTER TABLE teachers    ENABLE ROW LEVEL SECURITY;
ALTER TABLE plans       ENABLE ROW LEVEL SECURITY;
ALTER TABLE students    ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments    ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkins    ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads       ENABLE ROW LEVEL SECURITY;

-- Helper: get current user's tenant
CREATE OR REPLACE FUNCTION auth_tenant_id()
RETURNS UUID AS $$
  SELECT tenant_id FROM profiles WHERE id = auth.uid()
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Profiles
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT USING (id = auth.uid());
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (id = auth.uid());

-- Tenant-scoped tables helper macro
-- (apply per table)
CREATE POLICY "Tenant access modalities"
  ON modalities FOR ALL USING (tenant_id = auth_tenant_id());
CREATE POLICY "Tenant access teachers"
  ON teachers FOR ALL USING (tenant_id = auth_tenant_id());
CREATE POLICY "Tenant access plans"
  ON plans FOR ALL USING (tenant_id = auth_tenant_id());
CREATE POLICY "Tenant access students"
  ON students FOR ALL USING (tenant_id = auth_tenant_id());
CREATE POLICY "Tenant access enrollments"
  ON enrollments FOR ALL USING (
    student_id IN (SELECT id FROM students WHERE tenant_id = auth_tenant_id())
  );
CREATE POLICY "Tenant access payments"
  ON payments FOR ALL USING (tenant_id = auth_tenant_id());
CREATE POLICY "Tenant access checkins"
  ON checkins FOR ALL USING (tenant_id = auth_tenant_id());
CREATE POLICY "Tenant access leads"
  ON leads FOR ALL USING (tenant_id = auth_tenant_id());

-- Students can insert their own checkin
CREATE POLICY "Students can checkin"
  ON checkins FOR INSERT WITH CHECK (
    student_id IN (SELECT id FROM students WHERE user_id = auth.uid())
  );

-- ============================================================
-- SEED: Demo tenant + admin (edit before running)
-- ============================================================
-- INSERT INTO tenants (name, slug) VALUES ('Titãs Combat', 'titas-combat');
-- Then update auth user's profile with the tenant_id
