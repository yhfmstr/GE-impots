/**
 * Declaration Service
 *
 * Handles all Supabase operations for tax declarations.
 * Single source of truth - no localStorage.
 */

import { supabase } from '@/lib/supabase';

// Status mapping between frontend and database
const STATUS_MAP = {
  // Frontend → Database
  toDb: {
    'not_started': 'draft',
    'in_progress': 'in_progress',
    'finalized': 'submitted'
  },
  // Database → Frontend
  fromDb: {
    'draft': 'not_started',
    'in_progress': 'in_progress',
    'submitted': 'finalized',
    'under_review': 'finalized',
    'approved': 'finalized',
    'rejected': 'in_progress' // Allow re-edit if rejected
  }
};

/**
 * Get available tax years (current year - 1 and previous 2 years)
 */
export function getAvailableTaxYears() {
  const currentYear = new Date().getFullYear();
  const declarationYear = currentYear - 1;
  return [declarationYear, declarationYear - 1, declarationYear - 2];
}

/**
 * Fetch all declarations for the authenticated user
 */
export async function fetchUserDeclarations() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('declarations')
    .select('*')
    .eq('profile_id', user.id)
    .order('tax_year', { ascending: false });

  if (error) throw error;

  // Transform to frontend format
  return (data || []).map(transformFromDb);
}

/**
 * Get or create a declaration for a specific year
 */
export async function getOrCreateDeclaration(taxYear) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Try to fetch existing
  const { data: existing, error: fetchError } = await supabase
    .from('declarations')
    .select('*')
    .eq('profile_id', user.id)
    .eq('tax_year', taxYear)
    .single();

  if (fetchError && fetchError.code !== 'PGRST116') {
    // PGRST116 = no rows returned, which is fine
    throw fetchError;
  }

  if (existing) {
    return transformFromDb(existing);
  }

  // Create new declaration
  const { data: created, error: createError } = await supabase
    .from('declarations')
    .insert({
      profile_id: user.id,
      tax_year: taxYear,
      status: 'draft',
      completion_percentage: 0,
      revenus: {},
      deductions: {},
      fortune: {},
      immobilier: {}
    })
    .select()
    .single();

  if (createError) throw createError;

  return transformFromDb(created);
}

/**
 * Start a declaration (set status to in_progress)
 */
export async function startDeclaration(taxYear) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Upsert to handle both new and existing declarations
  const { data, error } = await supabase
    .from('declarations')
    .upsert({
      profile_id: user.id,
      tax_year: taxYear,
      status: 'in_progress',
      started_at: new Date().toISOString(),
      last_saved_at: new Date().toISOString()
    }, {
      onConflict: 'profile_id,tax_year'
    })
    .select()
    .single();

  if (error) throw error;
  return transformFromDb(data);
}

/**
 * Update declaration progress
 */
export async function updateProgress(taxYear, completionPercent, data = {}) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const updatePayload = {
    completion_percentage: completionPercent,
    last_saved_at: new Date().toISOString()
  };

  // If progress > 0 and was draft, change to in_progress
  if (completionPercent > 0) {
    updatePayload.status = 'in_progress';
  }

  // Include any declaration data updates
  if (data.revenus) updatePayload.revenus = data.revenus;
  if (data.deductions) updatePayload.deductions = data.deductions;
  if (data.fortune) updatePayload.fortune = data.fortune;
  if (data.immobilier) updatePayload.immobilier = data.immobilier;

  const { data: updated, error } = await supabase
    .from('declarations')
    .update(updatePayload)
    .eq('profile_id', user.id)
    .eq('tax_year', taxYear)
    .select()
    .single();

  if (error) throw error;
  return transformFromDb(updated);
}

/**
 * Finalize (submit) a declaration
 */
export async function finalizeDeclaration(taxYear) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('declarations')
    .update({
      status: 'submitted',
      completion_percentage: 100,
      submitted_at: new Date().toISOString(),
      last_saved_at: new Date().toISOString()
    })
    .eq('profile_id', user.id)
    .eq('tax_year', taxYear)
    .select()
    .single();

  if (error) throw error;
  return transformFromDb(data);
}

/**
 * Reopen a finalized declaration for editing
 */
export async function reopenDeclaration(taxYear) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('declarations')
    .update({
      status: 'in_progress',
      submitted_at: null,
      last_saved_at: new Date().toISOString()
    })
    .eq('profile_id', user.id)
    .eq('tax_year', taxYear)
    .select()
    .single();

  if (error) throw error;
  return transformFromDb(data);
}

/**
 * Save full declaration data
 */
export async function saveDeclarationData(taxYear, declarationData) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('declarations')
    .update({
      revenus: declarationData.revenus || {},
      deductions: declarationData.deductions || {},
      fortune: declarationData.fortune || {},
      immobilier: declarationData.immobilier || {},
      last_saved_at: new Date().toISOString()
    })
    .eq('profile_id', user.id)
    .eq('tax_year', taxYear)
    .select()
    .single();

  if (error) throw error;
  return transformFromDb(data);
}

/**
 * Get declaration by ID
 */
export async function getDeclarationById(declarationId) {
  const { data, error } = await supabase
    .from('declarations')
    .select('*')
    .eq('id', declarationId)
    .single();

  if (error) throw error;
  return transformFromDb(data);
}

/**
 * Get declaration ID for a year (needed for document linking)
 */
export async function getDeclarationIdForYear(taxYear) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('declarations')
    .select('id')
    .eq('profile_id', user.id)
    .eq('tax_year', taxYear)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data?.id || null;
}

// ==========================================
// Transform helpers
// ==========================================

function transformFromDb(dbRecord) {
  if (!dbRecord) return null;

  return {
    id: dbRecord.id,
    year: dbRecord.tax_year,
    status: STATUS_MAP.fromDb[dbRecord.status] || 'not_started',
    completionPercent: dbRecord.completion_percentage || 0,
    startedAt: dbRecord.started_at,
    lastModifiedAt: dbRecord.last_saved_at || dbRecord.updated_at,
    finalizedAt: dbRecord.submitted_at,
    data: {
      revenus: dbRecord.revenus || {},
      deductions: dbRecord.deductions || {},
      fortune: dbRecord.fortune || {},
      immobilier: dbRecord.immobilier || {}
    },
    // Keep raw for debugging
    _raw: dbRecord
  };
}

export default {
  getAvailableTaxYears,
  fetchUserDeclarations,
  getOrCreateDeclaration,
  startDeclaration,
  updateProgress,
  finalizeDeclaration,
  reopenDeclaration,
  saveDeclarationData,
  getDeclarationById,
  getDeclarationIdForYear
};
