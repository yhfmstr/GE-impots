# GE-Impots Deployment & Integration Plan

## Executive Summary

Transform the current client-side tax declaration app into a production-ready SaaS platform with:
- **Vercel** for hosting (frontend + serverless API)
- **Supabase** for database, authentication, and file storage
- **User onboarding** with profile freshness checks
- **Admin dashboard** for user and declaration management

---

## Current State Analysis

| Component | Current | Target |
|-----------|---------|--------|
| Frontend | React 19 + Vite | Same (deployed to Vercel) |
| Backend | Express.js (port 3002) | Vercel Serverless Functions |
| Database | localStorage (client) | Supabase PostgreSQL |
| Auth | None | Supabase Auth (email/password) |
| Files | Temp uploads (1hr cleanup) | Supabase Storage |
| Admin | None | New admin dashboard |

---

## Phase 1: Supabase Setup & Schema Design

### 1.1 Database Schema

```sql
-- ==========================================
-- USERS & PROFILES
-- ==========================================

-- Extends Supabase auth.users
CREATE TABLE public.profiles (
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

CREATE TABLE public.children (
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

CREATE TABLE public.declarations (
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

CREATE TABLE public.documents (
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

CREATE TABLE public.chat_conversations (
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

CREATE TABLE public.audit_log (
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

CREATE INDEX idx_profiles_email ON public.profiles(email);
CREATE INDEX idx_profiles_role ON public.profiles(role);
CREATE INDEX idx_declarations_profile ON public.declarations(profile_id);
CREATE INDEX idx_declarations_year ON public.declarations(tax_year);
CREATE INDEX idx_declarations_status ON public.declarations(status);
CREATE INDEX idx_documents_profile ON public.documents(profile_id);
CREATE INDEX idx_documents_declaration ON public.documents(declaration_id);
CREATE INDEX idx_audit_profile ON public.audit_log(profile_id);
CREATE INDEX idx_audit_action ON public.audit_log(action);

-- ==========================================
-- ROW LEVEL SECURITY (RLS)
-- ==========================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.children ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.declarations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Users can only see their own data
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view own children" ON public.children
  FOR ALL USING (auth.uid() = profile_id);

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

CREATE TRIGGER update_profiles_timestamp
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_declarations_timestamp
  BEFORE UPDATE ON public.declarations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
```

### 1.2 Supabase Storage Buckets

```
Buckets:
├── documents/          # User-uploaded tax documents (private)
│   └── {user_id}/
│       └── {year}/
│           └── {file_name}
└── avatars/            # User profile pictures (public)
```

---

## Phase 2: Authentication & Onboarding

### 2.1 Auth Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           USER FLOW                                      │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────┐    ┌─────────────┐    ┌──────────────────────────────┐   │
│  │  Landing │───▶│  Sign Up /  │───▶│  Email Verification          │   │
│  │   Page   │    │   Login     │    │  (Supabase Magic Link)       │   │
│  └──────────┘    └─────────────┘    └───────────────┬──────────────┘   │
│                                                      │                   │
│                                                      ▼                   │
│                         ┌────────────────────────────────────────────┐  │
│                         │          CHECK ONBOARDING STATUS           │  │
│                         │  profile.onboarding_completed_at != null?  │  │
│                         └───────────────┬───────────────┬────────────┘  │
│                                         │               │               │
│                          NO (First Login)│               │ YES           │
│                                         ▼               ▼               │
│    ┌────────────────────────────────────────┐   ┌──────────────────┐   │
│    │         ONBOARDING WIZARD              │   │  CHECK FRESHNESS │   │
│    │  Step 1: Personal Info                 │   │                  │   │
│    │  Step 2: Civil Status & Family         │   │  profile_updated │   │
│    │  Step 3: Professional Situation        │   │  > 60 days ago   │   │
│    │  Step 4: Financial Overview            │   │  OR new year?    │   │
│    │  Step 5: Review & Confirm              │   └────────┬─────────┘   │
│    └────────────────┬───────────────────────┘            │              │
│                     │                                    │              │
│                     ▼                                    ▼              │
│    ┌────────────────────────────────────────────────────────────────┐  │
│    │                         DASHBOARD                               │  │
│    │  ┌───────────┐ ┌──────────────┐ ┌────────────┐ ┌────────────┐  │  │
│    │  │ My Profile│ │ Declaration  │ │ Documents  │ │ AI Chat    │  │  │
│    │  └───────────┘ └──────────────┘ └────────────┘ └────────────┘  │  │
│    └────────────────────────────────────────────────────────────────┘  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Profile Freshness Logic

```typescript
// lib/profileFreshness.ts

interface ProfileFreshnessCheck {
  needsUpdate: boolean;
  reason: 'expired' | 'new_year' | 'incomplete' | null;
  daysSinceUpdate: number;
  lastUpdateDate: Date | null;
}

const FRESHNESS_THRESHOLD_DAYS = 60;

export function checkProfileFreshness(profile: Profile): ProfileFreshnessCheck {
  const now = new Date();
  const currentYear = now.getFullYear();

  // Check if onboarding completed
  if (!profile.onboarding_completed_at) {
    return {
      needsUpdate: true,
      reason: 'incomplete',
      daysSinceUpdate: -1,
      lastUpdateDate: null,
    };
  }

  const lastUpdate = new Date(profile.profile_updated_at);
  const daysSinceUpdate = Math.floor(
    (now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24)
  );

  // Check if new tax year (profile last updated in previous year)
  if (lastUpdate.getFullYear() < currentYear) {
    return {
      needsUpdate: true,
      reason: 'new_year',
      daysSinceUpdate,
      lastUpdateDate: lastUpdate,
    };
  }

  // Check if profile is stale (> 60 days)
  if (daysSinceUpdate > FRESHNESS_THRESHOLD_DAYS) {
    return {
      needsUpdate: true,
      reason: 'expired',
      daysSinceUpdate,
      lastUpdateDate: lastUpdate,
    };
  }

  return {
    needsUpdate: false,
    reason: null,
    daysSinceUpdate,
    lastUpdateDate: lastUpdate,
  };
}
```

### 2.3 Onboarding Steps

```
STEP 1: Personal Information
├── First Name *
├── Last Name *
├── Date of Birth *
├── Phone
└── Address (Street, Postal Code, City)

STEP 2: Civil Status & Family
├── Civil Status * (Single, Married, PACS, Divorced, Widowed)
├── IF married/PACS:
│   ├── Spouse First Name
│   ├── Spouse Last Name
│   └── Spouse Date of Birth
└── Children (add multiple)
    ├── First Name
    ├── Date of Birth
    ├── In Formation?
    └── Shared Custody?

STEP 3: Professional Situation
├── Employment Type * (Employee, Self-employed, Retired, Unemployed, Student)
├── Profession
└── Employer (if applicable)

STEP 4: Financial Overview
├── Do you own real estate? (Yes/No)
├── Do you have investments/securities? (Yes/No)
├── Do you have a 3rd pillar A? (Yes/No)
└── Did you make LPP buyback contributions? (Yes/No)

STEP 5: Review & Confirm
├── Summary of all entered information
├── Edit buttons for each section
└── Confirm & Start Declaration
```

---

## Phase 3: Vercel Deployment Architecture

### 3.1 Project Structure (After Refactoring)

```
ge-impots/
├── frontend/                    # React SPA
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── lib/
│   │   │   ├── supabase.ts      # NEW: Supabase client
│   │   │   ├── auth.tsx         # NEW: Auth context
│   │   │   └── ...
│   │   └── ...
│   ├── public/
│   └── package.json
│
├── api/                         # Vercel Serverless Functions
│   ├── chat.ts                  # /api/chat
│   ├── documents/
│   │   ├── extract.ts           # /api/documents/extract
│   │   ├── detect.ts            # /api/documents/detect
│   │   └── types.ts             # /api/documents/types
│   ├── declaration/
│   │   └── [...].ts             # /api/declaration/*
│   └── admin/                   # NEW: Admin endpoints
│       ├── users.ts             # /api/admin/users
│       ├── declarations.ts      # /api/admin/declarations
│       └── stats.ts             # /api/admin/stats
│
├── vercel.json                  # Vercel configuration
├── package.json                 # Root package.json
└── supabase/
    └── migrations/              # Database migrations
        └── 001_initial_schema.sql
```

### 3.2 Vercel Configuration

```json
// vercel.json
{
  "version": 2,
  "buildCommand": "cd frontend && npm run build",
  "outputDirectory": "frontend/dist",
  "installCommand": "npm install && cd frontend && npm install",
  "framework": "vite",
  "functions": {
    "api/**/*.ts": {
      "memory": 1024,
      "maxDuration": 30
    }
  },
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/api/$1"
    },
    {
      "src": "/(.*)",
      "dest": "/frontend/dist/$1"
    }
  ],
  "env": {
    "ANTHROPIC_API_KEY": "@anthropic-api-key",
    "SUPABASE_URL": "@supabase-url",
    "SUPABASE_ANON_KEY": "@supabase-anon-key",
    "SUPABASE_SERVICE_ROLE_KEY": "@supabase-service-role-key"
  }
}
```

### 3.3 Environment Variables (Vercel)

```
# Supabase
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ... (for admin operations)

# Anthropic
ANTHROPIC_API_KEY=sk-ant-...
CLAUDE_MODEL=claude-opus-4-5-20251101

# App
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_TAX_YEAR=2024
```

---

## Phase 4: Admin Dashboard

### 4.1 Admin Features

```
/admin (protected - role: admin, super_admin)
│
├── /admin/dashboard
│   ├── Total Users (count)
│   ├── Active Declarations (by status)
│   ├── Submissions This Month
│   ├── Pending Reviews
│   └── Quick Actions
│
├── /admin/users
│   ├── User List (paginated)
│   │   ├── Search by name/email
│   │   ├── Filter by status
│   │   └── Sort by date
│   ├── User Detail View
│   │   ├── Profile Information
│   │   ├── Login History
│   │   ├── Declarations
│   │   └── Documents
│   └── Actions
│       ├── Reset Password
│       ├── Change Role
│       └── Deactivate Account
│
├── /admin/declarations
│   ├── Declaration List
│   │   ├── Filter by year
│   │   ├── Filter by status
│   │   └── Search by user
│   ├── Declaration Review
│   │   ├── View All Data
│   │   ├── View Documents
│   │   ├── Compare to Previous Year
│   │   └── Calculation Breakdown
│   └── Actions
│       ├── Approve
│       ├── Reject (with reason)
│       ├── Request Changes
│       └── Add Notes
│
└── /admin/settings (super_admin only)
    ├── Tax Year Configuration
    ├── Rate Limit Settings
    └── Feature Flags
```

### 4.2 Admin Dashboard Wireframe

```
┌─────────────────────────────────────────────────────────────────────────┐
│  🏛️ GE-Impots Admin                      👤 Admin Name  │ Logout      │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                         OVERVIEW                                  │   │
│  │  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐    │   │
│  │  │   245      │ │    52      │ │    18      │ │    7       │    │   │
│  │  │  Total     │ │  Active    │ │ Submitted  │ │  Pending   │    │   │
│  │  │  Users     │ │Declarations│ │ This Month │ │  Review    │    │   │
│  │  └────────────┘ └────────────┘ └────────────┘ └────────────┘    │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  ┌───────────────────────────┐  ┌───────────────────────────────────┐   │
│  │  RECENT SUBMISSIONS       │  │  PENDING REVIEWS                   │   │
│  │  ────────────────────────│  │  ─────────────────────────────────│   │
│  │  👤 Jean Dupont    12/20 │  │  📋 Marie Martin      Submitted    │   │
│  │  👤 Marie Martin   12/19 │  │  📋 Pierre Bernard    Submitted    │   │
│  │  👤 Pierre Bernard 12/18 │  │  📋 Sophie Müller     Under Review │   │
│  │  👤 Sophie Müller  12/17 │  │                                     │   │
│  │  [View All →]            │  │  [Review All →]                     │   │
│  └───────────────────────────┘  └───────────────────────────────────┘   │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  DECLARATIONS BY STATUS                                           │   │
│  │  ███████████████████████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │   │
│  │  Draft (120) │ In Progress (52) │ Submitted (18) │ Approved (55) │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Phase 5: Implementation Roadmap

### 5.1 Phase Breakdown

```
PHASE 1: Foundation (Week 1-2)
├── Set up Supabase project
├── Create database schema
├── Configure authentication
├── Set up Supabase Storage
└── Create migration scripts

PHASE 2: Auth Integration (Week 2-3)
├── Add @supabase/supabase-js to frontend
├── Create AuthContext provider
├── Build Login/Signup pages
├── Implement email verification
├── Add protected route wrapper
└── Test auth flow end-to-end

PHASE 3: Onboarding (Week 3-4)
├── Build OnboardingWizard component
├── Implement 5-step flow
├── Add profile freshness check
├── Create profile update modal
├── Migrate storage.js to Supabase
└── Test first-login experience

PHASE 4: Data Migration (Week 4-5)
├── Migrate localStorage → Supabase
├── Update all data fetch/save calls
├── Add real-time sync (optional)
├── Update document upload to Supabase Storage
├── Maintain backwards compatibility
└── Add offline support (optional)

PHASE 5: Admin Dashboard (Week 5-6)
├── Create /admin route structure
├── Build admin layout
├── Implement user management
├── Implement declaration review
├── Add audit logging
└── Test admin permissions

PHASE 6: Vercel Deployment (Week 6-7)
├── Restructure for Vercel
├── Convert Express routes to serverless
├── Configure vercel.json
├── Set up environment variables
├── Deploy to staging
├── Test all functionality
└── Deploy to production

PHASE 7: Polish & Launch (Week 7-8)
├── Performance optimization
├── Error handling improvements
├── Add monitoring (Sentry, etc.)
├── Documentation
├── User acceptance testing
└── Production launch
```

### 5.2 File Changes Summary

```
FILES TO CREATE:
├── frontend/src/lib/supabase.ts              # Supabase client init
├── frontend/src/lib/auth.tsx                 # Auth context + hooks
├── frontend/src/pages/auth/
│   ├── LoginPage.tsx                         # Login form
│   ├── SignupPage.tsx                        # Registration form
│   ├── ForgotPasswordPage.tsx                # Password reset
│   └── VerifyEmailPage.tsx                   # Email verification
├── frontend/src/pages/onboarding/
│   ├── OnboardingPage.tsx                    # Onboarding wizard
│   └── ProfileUpdateModal.tsx                # Update prompt
├── frontend/src/pages/admin/
│   ├── AdminLayout.tsx                       # Admin shell
│   ├── DashboardPage.tsx                     # Overview
│   ├── UsersPage.tsx                         # User management
│   ├── UserDetailPage.tsx                    # Single user view
│   ├── DeclarationsPage.tsx                  # All declarations
│   └── DeclarationReviewPage.tsx             # Review interface
├── frontend/src/components/auth/
│   ├── ProtectedRoute.tsx                    # Auth guard
│   ├── AdminRoute.tsx                        # Admin guard
│   └── ProfileFreshnessGuard.tsx             # Update reminder
├── api/                                       # Vercel functions
│   ├── chat.ts
│   ├── documents/extract.ts
│   ├── admin/users.ts
│   └── admin/declarations.ts
├── vercel.json
└── supabase/migrations/001_initial_schema.sql

FILES TO MODIFY:
├── frontend/src/App.jsx                      # Add auth provider + routes
├── frontend/src/lib/storage.js               # Add Supabase methods
├── frontend/src/lib/api.js                   # Add auth headers
├── frontend/src/components/Layout.jsx        # Add user menu
├── frontend/package.json                     # Add @supabase/supabase-js
└── frontend/vite.config.js                   # Update for Vercel
```

---

## Phase 6: Key Code Snippets

### 6.1 Supabase Client Setup

```typescript
// frontend/src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

// Types
export interface Profile {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  // ... other fields
  onboarding_completed_at: string | null;
  profile_updated_at: string;
  role: 'user' | 'admin' | 'super_admin';
}

export interface Declaration {
  id: string;
  profile_id: string;
  tax_year: number;
  status: 'draft' | 'in_progress' | 'submitted' | 'under_review' | 'approved' | 'rejected';
  // ... other fields
}
```

### 6.2 Auth Context

```tsx
// frontend/src/lib/auth.tsx
import { createContext, useContext, useEffect, useState } from 'react';
import { supabase, Profile } from './supabase';
import { checkProfileFreshness } from './profileFreshness';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  needsOnboarding: boolean;
  needsProfileUpdate: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          await fetchProfile(session.user.id);
        } else {
          setProfile(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (!error && data) {
      setProfile(data);
    }
    setLoading(false);
  };

  const needsOnboarding = !profile?.onboarding_completed_at;
  const freshness = profile ? checkProfileFreshness(profile) : { needsUpdate: false };
  const needsProfileUpdate = !needsOnboarding && freshness.needsUpdate;

  // ... signIn, signUp, signOut implementations

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      loading,
      needsOnboarding,
      needsProfileUpdate,
      signIn,
      signUp,
      signOut,
      refreshProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
```

### 6.3 Protected Route

```tsx
// frontend/src/components/auth/ProtectedRoute.tsx
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/auth';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, needsOnboarding, needsProfileUpdate } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="flex items-center justify-center h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Redirect to onboarding if not completed
  if (needsOnboarding && !location.pathname.startsWith('/onboarding')) {
    return <Navigate to="/onboarding" replace />;
  }

  // Show profile update modal if needed (but don't block)
  // This is handled in the Layout component

  return <>{children}</>;
}
```

---

## Security Considerations

### Authentication Security
- [x] Email verification required
- [x] Password strength requirements (Supabase default: 6+ chars)
- [x] Rate limiting on auth endpoints
- [x] Session management (auto-refresh, secure cookies)

### Data Security
- [x] Row Level Security (RLS) on all tables
- [x] Users can only access their own data
- [x] Admin permissions strictly controlled
- [x] Sensitive data encrypted at rest (Supabase default)

### API Security
- [x] JWT validation on all protected endpoints
- [x] Service role key only used server-side
- [x] Input validation with Zod
- [x] Rate limiting per user/IP

### File Security
- [x] Private bucket for documents
- [x] Signed URLs for access (time-limited)
- [x] File type validation
- [x] Size limits enforced

---

## Cost Estimation (Supabase + Vercel)

### Supabase (Free Tier → Pro)
```
Free Tier (sufficient for MVP):
- 500 MB database
- 1 GB file storage
- 2 GB bandwidth
- 50,000 monthly active users
- Unlimited API requests

Pro Tier ($25/month when needed):
- 8 GB database
- 100 GB file storage
- 250 GB bandwidth
- Unlimited MAU
```

### Vercel (Free Tier → Pro)
```
Free Tier (Hobby):
- 100 GB bandwidth
- Serverless functions included
- Edge functions included
- Preview deployments

Pro Tier ($20/month when needed):
- 1 TB bandwidth
- Team collaboration
- Advanced analytics
```

**Estimated Monthly Cost at Launch: $0 - $45**

---

## Next Steps

1. **Approve this plan** - Review and confirm the approach
2. **Create Supabase project** - Set up the cloud instance
3. **Run database migrations** - Apply the schema
4. **Start Phase 2** - Begin auth integration

Ready to proceed when you approve!
