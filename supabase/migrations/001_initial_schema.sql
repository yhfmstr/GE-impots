-- ==========================================
-- GE-Impots Database Schema
-- Migration: 001_initial_schema
-- ==========================================

-- ==========================================
-- USERS & PROFILES
-- ==========================================

-- Extends Supabase auth.users
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,

  -- Address
  street TEXT,
  postal_code TEXT,
  city TEXT DEFAULT 'Genève',
  canton TEXT DEFAULT 'GE',

  -- Civil status
  date_of_birth DATE,
  civil_status TEXT CHECK (civil_status IN ('celibataire', 'marie', 'pacs', 'divorce', 'veuf')),
  spouse_first_name TEXT,
  spouse_last_name TEXT,
  spouse_date_of_birth DATE,

  -- Professional
  profession TEXT,
  employer TEXT,
  employment_type TEXT CHECK (employment_type IN ('salarie', 'independant', 'retraite', 'sans_emploi', 'etudiant')),

  -- Family
  number_of_children INTEGER DEFAULT 0,

  -- Financial overview (for wizard routing)
  has_real_estate BOOLEAN DEFAULT FALSE,
  has_investments BOOLEAN DEFAULT FALSE,
  has_3a BOOLEAN DEFAULT FALSE,
  has_lpp_rachat BOOLEAN DEFAULT FALSE,

  -- Metadata
  profile_completed BOOLEAN DEFAULT FALSE,
  profile_updated_at TIMESTAMPTZ DEFAULT NOW(),
  onboarding_completed_at TIMESTAMPTZ,

  -- Admin
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'super_admin')),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- CHILDREN (for family deductions)
-- ==========================================

CREATE TABLE IF NOT EXISTS public.children (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  date_of_birth DATE NOT NULL,
  in_formation BOOLEAN DEFAULT FALSE, -- studying (extends deduction age)
  garde_partagee BOOLEAN DEFAULT FALSE, -- shared custody
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- TAX DECLARATIONS
-- ==========================================

CREATE TABLE IF NOT EXISTS public.declarations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  tax_year INTEGER NOT NULL DEFAULT 2024,

  -- Status tracking
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'in_progress', 'submitted', 'under_review', 'approved', 'rejected')),
  wizard_profile TEXT, -- 'salarie_simple', 'proprietaire', 'famille', 'retraite', 'complet'
  completion_percentage INTEGER DEFAULT 0,

  -- Main declaration data (JSONB for flexibility)
  revenus JSONB DEFAULT '{}',
  deductions JSONB DEFAULT '{}',
  fortune JSONB DEFAULT '{}',
  immobilier JSONB DEFAULT '{}',

  -- Calculated results
  revenu_imposable NUMERIC(12,2),
  fortune_imposable NUMERIC(12,2),
  impot_icc NUMERIC(10,2),
  impot_ifd NUMERIC(10,2),
  impot_total NUMERIC(10,2),

  -- Annexes (GeTax rubrique codes)
  annexes JSONB DEFAULT '{}',

  -- Timestamps
  started_at TIMESTAMPTZ DEFAULT NOW(),
  last_saved_at TIMESTAMPTZ DEFAULT NOW(),
  submitted_at TIMESTAMPTZ,
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES public.profiles(id),

  -- Admin notes
  admin_notes TEXT,
  rejection_reason TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(profile_id, tax_year)
);

-- ==========================================
-- DOCUMENTS
-- ==========================================

CREATE TABLE IF NOT EXISTS public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  declaration_id UUID REFERENCES public.declarations(id) ON DELETE SET NULL,

  -- File info
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL, -- 'certificat-salaire', 'attestation-3a', etc.
  file_size INTEGER,
  storage_path TEXT NOT NULL, -- Supabase storage path

  -- Extraction results
  extracted_data JSONB,
  extraction_confidence NUMERIC(3,2), -- 0.00 to 1.00
  extraction_status TEXT DEFAULT 'pending' CHECK (extraction_status IN ('pending', 'processing', 'completed', 'failed')),

  -- Verification
  verified BOOLEAN DEFAULT FALSE,
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES public.profiles(id),

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- CHAT HISTORY (optional, for context)
-- ==========================================

CREATE TABLE IF NOT EXISTS public.chat_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT,
  messages JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- AUDIT LOG (for admin)
-- ==========================================

CREATE TABLE IF NOT EXISTS public.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES public.profiles(id),
  action TEXT NOT NULL, -- 'login', 'declaration_submit', 'profile_update', etc.
  entity_type TEXT, -- 'declaration', 'document', 'profile'
  entity_id UUID,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- INDEXES
-- ==========================================

CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_declarations_profile ON public.declarations(profile_id);
CREATE INDEX IF NOT EXISTS idx_declarations_year ON public.declarations(tax_year);
CREATE INDEX IF NOT EXISTS idx_declarations_status ON public.declarations(status);
CREATE INDEX IF NOT EXISTS idx_documents_profile ON public.documents(profile_id);
CREATE INDEX IF NOT EXISTS idx_documents_declaration ON public.documents(declaration_id);
CREATE INDEX IF NOT EXISTS idx_audit_profile ON public.audit_log(profile_id);
CREATE INDEX IF NOT EXISTS idx_audit_action ON public.audit_log(action);
CREATE INDEX IF NOT EXISTS idx_children_profile ON public.children(profile_id);

-- ==========================================
-- ROW LEVEL SECURITY (RLS)
-- ==========================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.children ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.declarations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own children" ON public.children;
DROP POLICY IF EXISTS "Users can insert own children" ON public.children;
DROP POLICY IF EXISTS "Users can update own children" ON public.children;
DROP POLICY IF EXISTS "Users can delete own children" ON public.children;
DROP POLICY IF EXISTS "Users can manage own declarations" ON public.declarations;
DROP POLICY IF EXISTS "Users can manage own documents" ON public.documents;
DROP POLICY IF EXISTS "Users can manage own chats" ON public.chat_conversations;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all declarations" ON public.declarations;
DROP POLICY IF EXISTS "Admins can update declarations" ON public.declarations;
DROP POLICY IF EXISTS "Admins can view all documents" ON public.documents;
DROP POLICY IF EXISTS "Admins can view audit log" ON public.audit_log;

-- Users can only see their own data
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view own children" ON public.children
  FOR SELECT USING (auth.uid() = profile_id);

CREATE POLICY "Users can insert own children" ON public.children
  FOR INSERT WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "Users can update own children" ON public.children
  FOR UPDATE USING (auth.uid() = profile_id);

CREATE POLICY "Users can delete own children" ON public.children
  FOR DELETE USING (auth.uid() = profile_id);

CREATE POLICY "Users can manage own declarations" ON public.declarations
  FOR ALL USING (auth.uid() = profile_id);

CREATE POLICY "Users can manage own documents" ON public.documents
  FOR ALL USING (auth.uid() = profile_id);

CREATE POLICY "Users can manage own chats" ON public.chat_conversations
  FOR ALL USING (auth.uid() = profile_id);

-- Admins can see everything
CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

CREATE POLICY "Admins can view all declarations" ON public.declarations
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

CREATE POLICY "Admins can update declarations" ON public.declarations
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

CREATE POLICY "Admins can view all documents" ON public.documents
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

CREATE POLICY "Admins can view audit log" ON public.audit_log
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

-- ==========================================
-- TRIGGERS
-- ==========================================

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists, then create
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_profiles_timestamp ON public.profiles;
CREATE TRIGGER update_profiles_timestamp
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS update_declarations_timestamp ON public.declarations;
CREATE TRIGGER update_declarations_timestamp
  BEFORE UPDATE ON public.declarations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS update_chat_conversations_timestamp ON public.chat_conversations;
CREATE TRIGGER update_chat_conversations_timestamp
  BEFORE UPDATE ON public.chat_conversations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ==========================================
-- STORAGE BUCKETS (run in Supabase Dashboard)
-- ==========================================
-- Note: Storage buckets must be created via Supabase Dashboard or CLI
--
-- 1. Create 'documents' bucket (private)
--    - Enable RLS
--    - Policy: Users can only access their own folder (user_id/*)
--
-- 2. Create 'avatars' bucket (public)
--    - For profile pictures

-- ==========================================
-- INITIAL DATA (optional)
-- ==========================================

-- You can add initial admin user here after creating account:
-- UPDATE public.profiles SET role = 'super_admin' WHERE email = 'admin@example.com';
