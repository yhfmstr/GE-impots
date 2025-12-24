/**
 * Domain Validation Schemas (Zod)
 *
 * Type-safe validation schemas for all domain models.
 * Use these schemas to validate data at runtime.
 */

import { z } from 'zod';

/**
 * Common validators
 */
const positiveNumber = z.number().min(0).default(0);
const positiveInt = z.number().int().min(0).default(0);
const optionalString = z.string().optional().default('');
const isoDate = z.string().datetime().optional();

/**
 * Personal Information Schema
 */
export const personalInfoSchema = z.object({
  name: z.string().min(1, 'Le nom est requis').max(100),
  firstName: z.string().min(1, 'Le prénom est requis').max(100),
  birthDate: z.string().optional(),
  maritalStatus: z.enum(['single', 'married', 'divorced', 'widowed', 'separated', 'pacs']).default('single'),
  children: positiveInt,
  spouseName: optionalString,
  spouseFirstName: optionalString,
  spouseBirthDate: z.string().optional()
});

/**
 * Income Schema
 */
export const incomeSchema = z.object({
  grossSalary: positiveNumber,
  netSalary: positiveNumber,
  avsContributions: positiveNumber,
  lppContributions: positiveNumber,
  bonus: positiveNumber,
  otherIncome: positiveNumber,
  selfEmploymentIncome: positiveNumber.optional(),
  rentalIncome: positiveNumber.optional(),
  dividends: positiveNumber.optional(),
  interestIncome: positiveNumber.optional()
});

/**
 * Deductions Schema
 */
export const deductionsSchema = z.object({
  pilier3a: z.number().min(0).max(7056, 'Maximum CHF 7\'056 pour 2024').default(0),
  pilier3b: positiveNumber,
  rachatLPP: positiveNumber,
  healthInsurance: positiveNumber,
  childcareCosts: z.number().min(0).max(25000, 'Maximum CHF 25\'000 par enfant').default(0),
  trainingCosts: z.number().min(0).max(12000, 'Maximum CHF 12\'000').default(0),
  professionalExpenses: positiveNumber,
  donationsAndGifts: positiveNumber,
  alimony: positiveNumber,
  medicalExpenses: positiveNumber.optional(),
  otherDeductions: positiveNumber
});

/**
 * Real Estate Property Schema
 */
export const propertySchema = z.object({
  id: z.string().uuid().optional(),
  type: z.enum(['apartment', 'house', 'land', 'commercial', 'other']).default('apartment'),
  address: z.string().min(1, 'L\'adresse est requise'),
  purchaseDate: z.string().optional(),
  purchasePrice: positiveNumber,
  currentValue: positiveNumber,
  taxableValue: positiveNumber,
  rentalIncome: positiveNumber,
  mortgageAmount: positiveNumber,
  mortgageInterest: positiveNumber,
  maintenanceCosts: positiveNumber,
  isMainResidence: z.boolean().default(false)
});

/**
 * Wealth Schema
 */
export const wealthSchema = z.object({
  bankAccounts: positiveNumber,
  securities: positiveNumber,
  realEstate: z.array(propertySchema).default([]),
  vehicles: positiveNumber,
  jewelry: positiveNumber.optional(),
  art: positiveNumber.optional(),
  otherAssets: positiveNumber,
  mortgages: positiveNumber,
  loans: positiveNumber,
  otherDebts: positiveNumber
});

/**
 * Complete Tax Declaration Schema
 */
export const taxDeclarationSchema = z.object({
  id: z.string().uuid().optional(),
  year: z.number().int().min(2020).max(2030).default(new Date().getFullYear()),
  status: z.enum(['draft', 'in_progress', 'submitted', 'approved', 'rejected']).default('draft'),
  personal: personalInfoSchema.optional().default({}),
  income: incomeSchema.optional().default({}),
  deductions: deductionsSchema.optional().default({}),
  wealth: wealthSchema.optional().default({}),
  createdAt: isoDate,
  updatedAt: isoDate,
  submittedAt: isoDate
});

/**
 * Document Extraction Schema
 */
export const documentExtractionSchema = z.object({
  id: z.string().uuid(),
  documentId: z.string().uuid(),
  documentType: z.string(),
  filename: z.string(),
  extractedAt: z.string().datetime(),
  confidence: z.number().min(0).max(1),
  data: z.record(z.unknown()),
  fieldMappings: z.record(z.string()).optional()
});

/**
 * Chat Message Schema
 */
export const chatMessageSchema = z.object({
  id: z.string().uuid(),
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string().min(1),
  timestamp: z.string().datetime(),
  metadata: z.object({
    agentId: z.string().optional(),
    usage: z.object({
      inputTokens: z.number().optional(),
      outputTokens: z.number().optional()
    }).optional()
  }).optional()
});

/**
 * Validation helper functions
 */
export function validateTaxDeclaration(data) {
  return taxDeclarationSchema.safeParse(data);
}

export function validateIncome(data) {
  return incomeSchema.safeParse(data);
}

export function validateDeductions(data) {
  return deductionsSchema.safeParse(data);
}

export function validateWealth(data) {
  return wealthSchema.safeParse(data);
}

export function validateProperty(data) {
  return propertySchema.safeParse(data);
}

/**
 * Type inference exports (for TypeScript users)
 */
export const TaxDeclaration = taxDeclarationSchema;
export const Income = incomeSchema;
export const Deductions = deductionsSchema;
export const Wealth = wealthSchema;
export const Property = propertySchema;
export const PersonalInfo = personalInfoSchema;
export const DocumentExtraction = documentExtractionSchema;
export const ChatMessage = chatMessageSchema;
