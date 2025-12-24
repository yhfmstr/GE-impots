-- ==========================================
-- GE-Impots Database Schema
-- Migration: 004_tax_history_bordereaux
-- Description: Historical tax declarations and bordereaux (assessment notices)
-- ==========================================

-- ==========================================
-- TAX DECLARATIONS HISTORY
-- Stores extracted data from previous year declarations
-- Used for: prefilling, year-over-year comparison
-- ==========================================

CREATE TABLE IF NOT EXISTS public.tax_declarations_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  tax_year INTEGER NOT NULL,

  -- Personal snapshot at time of declaration
  personal_info JSONB DEFAULT '{}',
  -- {
  --   name, address, dob, civil_status, profession, employer,
  --   numero_contribuable, phone, commune_code
  -- }

  -- Declared summary amounts (ICC)
  revenu_brut_icc NUMERIC(12,2),
  revenu_net_icc NUMERIC(12,2),
  fortune_brute_icc NUMERIC(12,2),
  fortune_nette_icc NUMERIC(12,2),

  -- Declared summary amounts (IFD)
  revenu_brut_ifd NUMERIC(12,2),
  revenu_net_ifd NUMERIC(12,2),

  -- Detailed breakdown by GeTax code
  revenus JSONB DEFAULT '{}',
  -- {
  --   "11.00": { "label": "Revenu activité dépendante", "icc": 192581, "ifd": 192581 },
  --   "14.00": { "label": "Revenu mobilier", "icc": 551, "ifd": 551 },
  --   ...
  -- }

  deductions JSONB DEFAULT '{}',
  -- {
  --   "31.00": { "label": "Déductions activité dépendante", "icc": 29308, "ifd": 30911 },
  --   "31.10": { "label": "AVS/AI", "amount": 13014 },
  --   "31.12": { "label": "LPP", "amount": 4441 },
  --   "31.40": { "label": "Pilier 3a", "amount": 7056 },
  --   "52.00": { "label": "Primes assurances", "icc": 8239, "ifd": 1800 },
  --   ...
  -- }

  fortune_detail JSONB DEFAULT '{}',
  -- {
  --   "14.00": { "label": "Fortune mobilière", "amount": 132622 },
  --   "16.00": { "label": "Autres éléments", "amount": 55806 },
  --   "16.70": { "label": "Assurance-vie rachat", "amount": 10506 },
  --   "55.00": { "label": "Dettes", "amount": 15727 },
  --   ...
  -- }

  -- Employer details (for prefill)
  employeurs JSONB DEFAULT '[]',
  -- [
  --   { "name": "Swisscom Digital Technology SA", "address": "...", "salary": 167999, "bonus": 24582 }
  -- ]

  -- Bank accounts (for prefill)
  comptes_bancaires JSONB DEFAULT '[]',
  -- [
  --   { "iban": "CH85...", "bank": "Credit Suisse", "balance": 11249 },
  --   ...
  -- ]

  -- Insurance policies (for prefill)
  assurances JSONB DEFAULT '[]',
  -- [
  --   { "type": "3a", "provider": "...", "amount": 7056 },
  --   { "type": "vie", "provider": "PAX", "valeur_rachat": 10506, "prime": 1800 }
  -- ]

  -- Debts (for prefill)
  dettes JSONB DEFAULT '[]',
  -- [
  --   { "creditor": "Cembra", "type": "credit_consommation", "amount": 15727, "interest": 777 }
  -- ]

  -- Securities/investments
  titres JSONB DEFAULT '[]',
  -- [
  --   { "type": "DEV", "name": "BTC", "quantity": 1, "value": 17770 },
  --   ...
  -- ]

  -- Filing metadata
  filing_date TIMESTAMPTZ,
  filing_reference TEXT, -- e.g., "AFL-AA1DX7VNS"
  numero_contribuable TEXT, -- e.g., "478.89.2490"

  -- Source document link
  source_document_id UUID REFERENCES public.documents(id) ON DELETE SET NULL,

  -- Extraction metadata
  extracted_at TIMESTAMPTZ DEFAULT NOW(),
  extraction_confidence NUMERIC(3,2), -- 0.00 to 1.00
  extraction_warnings JSONB DEFAULT '[]',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(profile_id, tax_year)
);

-- ==========================================
-- BORDEREAUX (Tax Assessment Notices)
-- Final tax amounts determined by administration
-- ==========================================

CREATE TABLE IF NOT EXISTS public.bordereaux (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  tax_year INTEGER NOT NULL,

  -- Type of bordereau
  type TEXT NOT NULL CHECK (type IN ('icc', 'ifd')),
  -- icc = Impôts Cantonaux et Communaux
  -- ifd = Impôt Fédéral Direct

  -- Reference info
  reference_number TEXT, -- e.g., "R26.641.833"
  numero_contribuable TEXT,
  notification_date DATE,

  -- Assessed amounts (what administration determined)
  revenu_imposable NUMERIC(12,2),
  fortune_imposable NUMERIC(12,2), -- ICC only
  taux_revenu NUMERIC(12,2), -- Rate basis
  taux_fortune NUMERIC(12,2), -- Rate basis (ICC only)

  -- Barème applied
  bareme TEXT, -- e.g., "art. 41, alinéa 1 LIPP" or "art. 36, alinéa 1 LIFD"

  -- Tax breakdown (detailed)
  tax_breakdown JSONB DEFAULT '{}',
  -- For ICC:
  -- {
  --   "cantonal": {
  --     "impot_base_revenu": 20309.35,
  --     "centimes_additionnels_revenu": 9646.95,
  --     "reduction_12pct": -3594.75,
  --     "aide_domicile_revenu": 203.10,
  --     "impot_base_fortune": 174.65,
  --     "centimes_additionnels_fortune": 82.95,
  --     "aide_domicile_fortune": 1.75
  --   },
  --   "communal": {
  --     "commune": "Hermance",
  --     "part_privilegiee_revenu": 3753.15,
  --     "centimes_additionnels_revenu": 5172.90,
  --     "part_privilegiee_fortune": 32.30,
  --     "centimes_additionnels_fortune": 41.10
  --   },
  --   "autres": {
  --     "taxe_personnelle": 25.00
  --   },
  --   "imputations": {
  --     "impot_anticipe": 0,
  --     "retenue_supplementaire": 0,
  --     "imputation_etrangers": 0
  --   },
  --   "frais": 20.00
  -- }
  -- For IFD:
  -- {
  --   "impot_base_revenu": 7956.75
  -- }

  -- Total tax due
  total_tax NUMERIC(10,2) NOT NULL,

  -- Previous provisional (for IFD showing adjustment)
  previous_provisional NUMERIC(10,2),
  adjustment_amount NUMERIC(10,2), -- positive = owe more, negative = refund

  -- Comparison with declaration
  declared_revenu_icc NUMERIC(12,2),
  declared_revenu_ifd NUMERIC(12,2),
  declared_fortune NUMERIC(12,2),
  delta_revenu NUMERIC(12,2), -- assessed - declared
  delta_fortune NUMERIC(12,2),

  -- Payment info
  payment_deadline DATE,
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'partial', 'overdue')),
  paid_at TIMESTAMPTZ,
  paid_amount NUMERIC(10,2),

  -- Source document link
  source_document_id UUID REFERENCES public.documents(id) ON DELETE SET NULL,

  -- Extraction metadata
  extracted_at TIMESTAMPTZ DEFAULT NOW(),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(profile_id, tax_year, type)
);

-- ==========================================
-- INDEXES
-- ==========================================

CREATE INDEX IF NOT EXISTS idx_tax_history_profile ON public.tax_declarations_history(profile_id);
CREATE INDEX IF NOT EXISTS idx_tax_history_year ON public.tax_declarations_history(tax_year);
CREATE INDEX IF NOT EXISTS idx_tax_history_profile_year ON public.tax_declarations_history(profile_id, tax_year);

CREATE INDEX IF NOT EXISTS idx_bordereaux_profile ON public.bordereaux(profile_id);
CREATE INDEX IF NOT EXISTS idx_bordereaux_year ON public.bordereaux(tax_year);
CREATE INDEX IF NOT EXISTS idx_bordereaux_type ON public.bordereaux(type);
CREATE INDEX IF NOT EXISTS idx_bordereaux_profile_year ON public.bordereaux(profile_id, tax_year);

-- ==========================================
-- ROW LEVEL SECURITY (RLS)
-- ==========================================

ALTER TABLE public.tax_declarations_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bordereaux ENABLE ROW LEVEL SECURITY;

-- Users can only see their own data
CREATE POLICY "Users can view own tax history" ON public.tax_declarations_history
  FOR SELECT USING (auth.uid() = profile_id);

CREATE POLICY "Users can insert own tax history" ON public.tax_declarations_history
  FOR INSERT WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "Users can update own tax history" ON public.tax_declarations_history
  FOR UPDATE USING (auth.uid() = profile_id);

CREATE POLICY "Users can delete own tax history" ON public.tax_declarations_history
  FOR DELETE USING (auth.uid() = profile_id);

CREATE POLICY "Users can view own bordereaux" ON public.bordereaux
  FOR SELECT USING (auth.uid() = profile_id);

CREATE POLICY "Users can insert own bordereaux" ON public.bordereaux
  FOR INSERT WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "Users can update own bordereaux" ON public.bordereaux
  FOR UPDATE USING (auth.uid() = profile_id);

CREATE POLICY "Users can delete own bordereaux" ON public.bordereaux
  FOR DELETE USING (auth.uid() = profile_id);

-- Admins can see everything
CREATE POLICY "Admins can view all tax history" ON public.tax_declarations_history
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

CREATE POLICY "Admins can view all bordereaux" ON public.bordereaux
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

-- ==========================================
-- TRIGGERS
-- ==========================================

DROP TRIGGER IF EXISTS update_tax_history_timestamp ON public.tax_declarations_history;
CREATE TRIGGER update_tax_history_timestamp
  BEFORE UPDATE ON public.tax_declarations_history
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS update_bordereaux_timestamp ON public.bordereaux;
CREATE TRIGGER update_bordereaux_timestamp
  BEFORE UPDATE ON public.bordereaux
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ==========================================
-- HELPER FUNCTIONS
-- ==========================================

-- Function to get tax summary for a profile
CREATE OR REPLACE FUNCTION public.get_tax_summary(p_profile_id UUID, p_tax_year INTEGER DEFAULT NULL)
RETURNS TABLE (
  tax_year INTEGER,
  revenu_declare_icc NUMERIC,
  revenu_declare_ifd NUMERIC,
  fortune_declaree NUMERIC,
  revenu_final_icc NUMERIC,
  revenu_final_ifd NUMERIC,
  fortune_finale NUMERIC,
  impot_icc NUMERIC,
  impot_ifd NUMERIC,
  impot_total NUMERIC,
  delta_revenu_icc NUMERIC,
  delta_revenu_ifd NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    h.tax_year,
    h.revenu_net_icc as revenu_declare_icc,
    h.revenu_net_ifd as revenu_declare_ifd,
    h.fortune_nette_icc as fortune_declaree,
    b_icc.revenu_imposable as revenu_final_icc,
    b_ifd.revenu_imposable as revenu_final_ifd,
    b_icc.fortune_imposable as fortune_finale,
    b_icc.total_tax as impot_icc,
    b_ifd.total_tax as impot_ifd,
    COALESCE(b_icc.total_tax, 0) + COALESCE(b_ifd.total_tax, 0) as impot_total,
    b_icc.revenu_imposable - h.revenu_net_icc as delta_revenu_icc,
    b_ifd.revenu_imposable - h.revenu_net_ifd as delta_revenu_ifd
  FROM public.tax_declarations_history h
  LEFT JOIN public.bordereaux b_icc ON b_icc.profile_id = h.profile_id
    AND b_icc.tax_year = h.tax_year AND b_icc.type = 'icc'
  LEFT JOIN public.bordereaux b_ifd ON b_ifd.profile_id = h.profile_id
    AND b_ifd.tax_year = h.tax_year AND b_ifd.type = 'ifd'
  WHERE h.profile_id = p_profile_id
    AND (p_tax_year IS NULL OR h.tax_year = p_tax_year)
  ORDER BY h.tax_year DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get prefill data from most recent declaration
CREATE OR REPLACE FUNCTION public.get_prefill_data(p_profile_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'tax_year', h.tax_year,
    'personal_info', h.personal_info,
    'employeurs', h.employeurs,
    'comptes_bancaires', h.comptes_bancaires,
    'assurances', h.assurances,
    'dettes', h.dettes,
    'titres', h.titres,
    'revenus', h.revenus,
    'deductions', h.deductions
  ) INTO v_result
  FROM public.tax_declarations_history h
  WHERE h.profile_id = p_profile_id
  ORDER BY h.tax_year DESC
  LIMIT 1;

  RETURN COALESCE(v_result, '{}'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- COMMENTS
-- ==========================================

COMMENT ON TABLE public.tax_declarations_history IS 'Historical tax declarations extracted from uploaded PDFs. Used for prefilling and year-over-year comparison.';
COMMENT ON TABLE public.bordereaux IS 'Tax assessment notices (bordereaux) from Geneva tax administration. Contains final assessed amounts and tax due.';
COMMENT ON COLUMN public.bordereaux.type IS 'icc = Impôts Cantonaux et Communaux, ifd = Impôt Fédéral Direct';
COMMENT ON COLUMN public.bordereaux.delta_revenu IS 'Difference between assessed and declared income. Positive means administration increased the taxable amount.';
