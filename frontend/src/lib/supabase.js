import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials not configured. Auth features will be disabled.');
}

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    })
  : null;

// Helper to check if Supabase is configured
export const isSupabaseConfigured = () => !!supabase;

// Profile types
export const CIVIL_STATUS = {
  CELIBATAIRE: 'celibataire',
  MARIE: 'marie',
  PACS: 'pacs',
  DIVORCE: 'divorce',
  VEUF: 'veuf',
};

export const EMPLOYMENT_TYPE = {
  SALARIE: 'salarie',
  INDEPENDANT: 'independant',
  RETRAITE: 'retraite',
  SANS_EMPLOI: 'sans_emploi',
  ETUDIANT: 'etudiant',
};

export const USER_ROLE = {
  USER: 'user',
  ADMIN: 'admin',
  SUPER_ADMIN: 'super_admin',
};

export const DECLARATION_STATUS = {
  DRAFT: 'draft',
  IN_PROGRESS: 'in_progress',
  SUBMITTED: 'submitted',
  UNDER_REVIEW: 'under_review',
  APPROVED: 'approved',
  REJECTED: 'rejected',
};

// Database queries
export const db = {
  // Profiles - Using native fetch to avoid Supabase client hanging issues
  async getProfile(userId) {
    if (!supabaseUrl || !supabaseAnonKey) {
      return { data: null, error: new Error('Supabase not configured') };
    }
    try {
      // Get access token from localStorage
      let accessToken = supabaseAnonKey;
      try {
        const storageKey = `sb-${supabaseUrl.split('//')[1].split('.')[0]}-auth-token`;
        const stored = localStorage.getItem(storageKey);
        if (stored) {
          const parsed = JSON.parse(stored);
          accessToken = parsed.access_token || supabaseAnonKey;
        }
      } catch (e) {
        // Fallback to anon key if storage access fails
      }
      
      const response = await fetch(
        `${supabaseUrl}/rest/v1/profiles?select=*&id=eq.${userId}`,
        {
          method: 'GET',
          headers: {
            'apikey': supabaseAnonKey,
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );
      
      const data = await response.json();
      
      if (!response.ok) {
        return { data: null, error: data };
      }
      
      return { data: data[0] || null, error: null };
    } catch (err) {
      console.error('Profile query error:', err);
      return { data: null, error: err };
    }
  },

  async updateProfile(userId, updates) {
    if (!supabase) return { data: null, error: new Error('Supabase not configured') };
    return supabase
      .from('profiles')
      .update({ ...updates, profile_updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select()
      .single();
  },

  async completeOnboarding(userId) {
    if (!supabase) return { data: null, error: new Error('Supabase not configured') };
    return supabase
      .from('profiles')
      .update({
        onboarding_completed_at: new Date().toISOString(),
        profile_completed: true,
        profile_updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single();
  },

  // Children
  async getChildren(profileId) {
    if (!supabase) return { data: null, error: new Error('Supabase not configured') };
    return supabase
      .from('children')
      .select('*')
      .eq('profile_id', profileId)
      .order('date_of_birth', { ascending: true });
  },

  async addChild(profileId, child) {
    if (!supabase) return { data: null, error: new Error('Supabase not configured') };
    return supabase
      .from('children')
      .insert({ ...child, profile_id: profileId })
      .select()
      .single();
  },

  async updateChild(childId, updates) {
    if (!supabase) return { data: null, error: new Error('Supabase not configured') };
    return supabase
      .from('children')
      .update(updates)
      .eq('id', childId)
      .select()
      .single();
  },

  async deleteChild(childId) {
    if (!supabase) return { data: null, error: new Error('Supabase not configured') };
    return supabase
      .from('children')
      .delete()
      .eq('id', childId);
  },

  // Declarations
  async getDeclarations(profileId, taxYear = null) {
    if (!supabase) return { data: null, error: new Error('Supabase not configured') };
    let query = supabase
      .from('declarations')
      .select('*')
      .eq('profile_id', profileId)
      .order('tax_year', { ascending: false });

    if (taxYear) {
      query = query.eq('tax_year', taxYear);
    }

    return query;
  },

  async getDeclaration(declarationId) {
    if (!supabase) return { data: null, error: new Error('Supabase not configured') };
    return supabase
      .from('declarations')
      .select('*')
      .eq('id', declarationId)
      .single();
  },

  async createDeclaration(profileId, taxYear, wizardProfile = null) {
    if (!supabase) return { data: null, error: new Error('Supabase not configured') };
    return supabase
      .from('declarations')
      .insert({
        profile_id: profileId,
        tax_year: taxYear,
        wizard_profile: wizardProfile,
        status: DECLARATION_STATUS.DRAFT,
      })
      .select()
      .single();
  },

  async updateDeclaration(declarationId, updates) {
    if (!supabase) return { data: null, error: new Error('Supabase not configured') };
    return supabase
      .from('declarations')
      .update({ ...updates, last_saved_at: new Date().toISOString() })
      .eq('id', declarationId)
      .select()
      .single();
  },

  async submitDeclaration(declarationId) {
    if (!supabase) return { data: null, error: new Error('Supabase not configured') };
    return supabase
      .from('declarations')
      .update({
        status: DECLARATION_STATUS.SUBMITTED,
        submitted_at: new Date().toISOString(),
      })
      .eq('id', declarationId)
      .select()
      .single();
  },

  // Documents
  async getDocuments(profileId, declarationId = null) {
    if (!supabase) return { data: null, error: new Error('Supabase not configured') };
    let query = supabase
      .from('documents')
      .select('*')
      .eq('profile_id', profileId)
      .order('created_at', { ascending: false });

    if (declarationId) {
      query = query.eq('declaration_id', declarationId);
    }

    return query;
  },

  async createDocument(document) {
    if (!supabase) return { data: null, error: new Error('Supabase not configured') };
    return supabase
      .from('documents')
      .insert(document)
      .select()
      .single();
  },

  async updateDocument(documentId, updates) {
    if (!supabase) return { data: null, error: new Error('Supabase not configured') };
    return supabase
      .from('documents')
      .update(updates)
      .eq('id', documentId)
      .select()
      .single();
  },

  async deleteDocument(documentId) {
    if (!supabase) return { data: null, error: new Error('Supabase not configured') };
    return supabase
      .from('documents')
      .delete()
      .eq('id', documentId);
  },

  // Chat conversations
  async getConversations(profileId) {
    if (!supabase) return { data: null, error: new Error('Supabase not configured') };
    return supabase
      .from('chat_conversations')
      .select('*')
      .eq('profile_id', profileId)
      .order('updated_at', { ascending: false });
  },

  async saveConversation(profileId, conversation) {
    if (!supabase) return { data: null, error: new Error('Supabase not configured') };
    if (conversation.id) {
      return supabase
        .from('chat_conversations')
        .update({
          title: conversation.title,
          messages: conversation.messages,
          updated_at: new Date().toISOString(),
        })
        .eq('id', conversation.id)
        .select()
        .single();
    } else {
      return supabase
        .from('chat_conversations')
        .insert({
          profile_id: profileId,
          title: conversation.title,
          messages: conversation.messages,
        })
        .select()
        .single();
    }
  },

  // Admin queries
  admin: {
    async getAllUsers(page = 1, limit = 50, search = '') {
      if (!supabase) return { data: null, error: new Error('Supabase not configured') };
      let query = supabase
        .from('profiles')
        .select('*, declarations(count)', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range((page - 1) * limit, page * limit - 1);

      if (search) {
        query = query.or(`email.ilike.%${search}%,first_name.ilike.%${search}%,last_name.ilike.%${search}%`);
      }

      return query;
    },

    async getAllDeclarations(page = 1, limit = 50, status = null, taxYear = null) {
      if (!supabase) return { data: null, error: new Error('Supabase not configured') };
      let query = supabase
        .from('declarations')
        .select('*, profiles(email, first_name, last_name)', { count: 'exact' })
        .order('submitted_at', { ascending: false, nullsFirst: false })
        .range((page - 1) * limit, page * limit - 1);

      if (status) {
        query = query.eq('status', status);
      }
      if (taxYear) {
        query = query.eq('tax_year', taxYear);
      }

      return query;
    },

    async getStats() {
      if (!supabase) return { data: null, error: new Error('Supabase not configured') };

      const [users, declarations, submitted, pending] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('declarations').select('id', { count: 'exact', head: true }),
        supabase.from('declarations').select('id', { count: 'exact', head: true }).eq('status', 'submitted'),
        supabase.from('declarations').select('id', { count: 'exact', head: true }).eq('status', 'under_review'),
      ]);

      return {
        data: {
          totalUsers: users.count || 0,
          totalDeclarations: declarations.count || 0,
          submittedDeclarations: submitted.count || 0,
          pendingReviews: pending.count || 0,
        },
        error: null,
      };
    },

    async reviewDeclaration(declarationId, status, reviewerId, notes = null, rejectionReason = null) {
      if (!supabase) return { data: null, error: new Error('Supabase not configured') };
      return supabase
        .from('declarations')
        .update({
          status,
          reviewed_at: new Date().toISOString(),
          reviewed_by: reviewerId,
          admin_notes: notes,
          rejection_reason: rejectionReason,
        })
        .eq('id', declarationId)
        .select()
        .single();
    },

    async updateUserRole(userId, role) {
      if (!supabase) return { data: null, error: new Error('Supabase not configured') };
      return supabase
        .from('profiles')
        .update({ role })
        .eq('id', userId)
        .select()
        .single();
    },
  },
};

// Storage helpers
export const storage = {
  async uploadDocument(userId, taxYear, file) {
    if (!supabase) return { data: null, error: new Error('Supabase not configured') };
    const filePath = `${userId}/${taxYear}/${Date.now()}-${file.name}`;
    return supabase.storage
      .from('documents')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });
  },

  async getDocumentUrl(path) {
    if (!supabase) return { data: null, error: new Error('Supabase not configured') };
    return supabase.storage
      .from('documents')
      .createSignedUrl(path, 3600); // 1 hour expiry
  },

  async deleteDocument(path) {
    if (!supabase) return { data: null, error: new Error('Supabase not configured') };
    return supabase.storage
      .from('documents')
      .remove([path]);
  },
};

export default supabase;
