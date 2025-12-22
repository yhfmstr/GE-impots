/**
 * Tax-related type definitions for the GE-impots application
 */

/** Field in a GeTax annexe */
export interface TaxField {
  /** GeTax rubrique code (e.g., "11.10") */
  code: string;
  /** French field name */
  name: string;
  /** Source document or formula description */
  source?: string;
  /** Key in user data object */
  dataKey?: string;
  /** Whether this field is auto-calculated */
  calculated?: boolean;
  /** Formula description for calculated fields */
  formula?: string;
  /** Maximum deductible amount in CHF */
  limit?: number;
}

/** GeTax annexe (page) definition */
export interface TaxAnnexe {
  /** Unique ID (e.g., "annexe-a") */
  id: string;
  /** Display name (e.g., "Annexe A - Activité dépendante") */
  name: string;
  /** Short description */
  description: string;
  /** Associated document types */
  documentTypes?: string[];
  /** Fields/rubriques in this annexe */
  fields: TaxField[];
}

/** User's tax data from documents */
export interface TaxData {
  /** Tax year */
  year?: number;

  // Income fields
  grossSalary?: number;
  bonus?: number;
  boardFees?: number;
  stockOptions?: number;
  unemploymentBenefits?: number;
  benefitsInKind?: number;
  capitalBenefits?: number;
  representationFees?: number;
  carAllowance?: number;
  otherAllowances?: number;

  // Social contributions
  avsContributions?: number;
  lppContributions?: number;
  lppBuyback?: number;
  pilier3a?: number;

  // Professional expenses
  mealExpenses?: number;
  travelExpensesICC?: number;
  travelExpensesIFD?: number;
  otherProfExpenses?: number;

  // Insurance & deductions
  healthInsurance?: number;
  accidentInsurance?: number;
  lifeInsurance3b?: number;
  childcareICC?: number;
  childcareIFD?: number;
  continuingEducation?: number;
  disabilityCosts?: number;
  donations?: number;
  medicalExpenses?: number;

  // Alimony
  alimonyReceived?: number;
  alimonyPaid?: number;

  // Real estate
  rentalValue?: number;
  rentalIncome?: number;
  propertyValue?: number;
  mortgageDebt?: number;
  mortgageInterest?: number;
  maintenanceActual?: number;

  // Wealth
  bankAccounts?: number;
  foreignBankAccounts?: number;
  securities?: number;
  unlistedSecurities?: number;
  vehicleValue?: number;
  lifeInsuranceValue?: number;
  crypto?: number;
  otherAssets?: number;

  // Debts
  personalLoans?: number;
  loanInterest?: number;
  otherInterest?: number;

  // Legacy nested structure support
  income?: {
    primary?: number;
    secondary?: number;
  };
  deductions?: Record<string, number>;
  wealth?: Record<string, number>;
  personal?: Record<string, string | number>;
}

/** Document extraction result */
export interface ExtractionResult {
  /** Whether extraction succeeded */
  success: boolean;
  /** Human-readable document name */
  documentName?: string;
  /** Detected document type */
  documentType?: string;
  /** Extracted data fields */
  data?: Partial<TaxData>;
  /** Fields mapped to GeTax rubriques */
  fields?: Array<{
    code: string;
    name: string;
    value: number | string | null;
  }>;
  /** Information notes */
  notes?: string[];
  /** Warnings */
  warnings?: string[];
  /** Error message if failed */
  error?: string;
}

/** Stored document extraction */
export interface StoredExtraction extends ExtractionResult {
  /** Unique ID */
  id: number;
  /** Original filename */
  fileName: string;
  /** ISO timestamp */
  timestamp: string;
}

/** Storage keys enum */
export type StorageKey = 'taxDeclarationData' | 'documentExtractions' | 'taxDeclarationArchives' | 'userSettings';

/** Chat message */
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

/** API response for chat */
export interface ChatResponse {
  content: string;
  usage?: {
    input_tokens: number;
    output_tokens: number;
  };
}
