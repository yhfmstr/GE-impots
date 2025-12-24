/**
 * Pre-login profiler survey configuration
 * Collects basic info to:
 * 1. Provide instant tax estimate
 * 2. Determine wizard profile
 * 3. Generate document checklist
 */

export const PROFILER_QUESTIONS = [
  {
    id: 'civilStatus',
    question: 'Quelle est votre situation familiale?',
    type: 'single',
    options: [
      { value: 'single', label: 'Célibataire', icon: 'User' },
      { value: 'married', label: 'Marié(e) / Partenariat enregistré', icon: 'Users' },
      { value: 'separated', label: 'Séparé(e) / Divorcé(e)', icon: 'UserMinus' },
      { value: 'widowed', label: 'Veuf / Veuve', icon: 'Heart' },
    ],
    required: true,
  },
  {
    id: 'children',
    question: 'Avez-vous des enfants à charge?',
    type: 'single',
    options: [
      { value: '0', label: 'Non', icon: 'X' },
      { value: '1', label: '1 enfant', icon: 'Baby' },
      { value: '2', label: '2 enfants', icon: 'Users' },
      { value: '3+', label: '3 ou plus', icon: 'Users' },
    ],
    required: true,
  },
  {
    id: 'employment',
    question: 'Quelle est votre situation professionnelle?',
    type: 'single',
    options: [
      { value: 'employed', label: 'Salarié(e)', icon: 'Briefcase' },
      { value: 'selfEmployed', label: 'Indépendant(e)', icon: 'Building' },
      { value: 'retired', label: 'Retraité(e)', icon: 'Coffee' },
      { value: 'unemployed', label: 'Sans emploi / Chômage', icon: 'Clock' },
      { value: 'student', label: 'Étudiant(e)', icon: 'GraduationCap' },
    ],
    required: true,
  },
  {
    id: 'grossIncome',
    question: 'Quel est votre revenu brut annuel approximatif?',
    subtitle: 'Incluez le revenu de votre conjoint(e) si marié(e)',
    type: 'single',
    options: [
      { value: '0-50000', label: 'Moins de 50\'000 CHF', range: [0, 50000] },
      { value: '50000-80000', label: '50\'000 - 80\'000 CHF', range: [50000, 80000] },
      { value: '80000-120000', label: '80\'000 - 120\'000 CHF', range: [80000, 120000] },
      { value: '120000-200000', label: '120\'000 - 200\'000 CHF', range: [120000, 200000] },
      { value: '200000+', label: 'Plus de 200\'000 CHF', range: [200000, 300000] },
    ],
    required: true,
    showIf: (answers) => answers.employment !== 'student',
  },
  {
    id: 'property',
    question: 'Êtes-vous propriétaire immobilier?',
    type: 'single',
    options: [
      { value: 'none', label: 'Non, locataire', icon: 'Home' },
      { value: 'principal', label: 'Oui, résidence principale', icon: 'Building2' },
      { value: 'multiple', label: 'Oui, plusieurs biens', icon: 'Landmark' },
    ],
    required: true,
  },
  {
    id: 'additionalIncome',
    question: 'Avez-vous d\'autres sources de revenus ou déductions?',
    subtitle: 'Sélectionnez tout ce qui s\'applique',
    type: 'multi',
    options: [
      { value: 'pillar3a', label: '3e pilier (prévoyance)', icon: 'PiggyBank' },
      { value: 'securities', label: 'Titres / Actions', icon: 'TrendingUp' },
      { value: 'rental', label: 'Revenus locatifs', icon: 'Key' },
      { value: 'childcare', label: 'Frais de garde d\'enfants', icon: 'Baby' },
      { value: 'alimony', label: 'Pension alimentaire', icon: 'HandCoins' },
      { value: 'foreign', label: 'Revenus étrangers', icon: 'Globe' },
    ],
    required: false,
  },
];

/**
 * Wizard profile mapping based on profiler answers
 */
export const PROFILE_MAPPING = {
  // Simple employed person
  salarie_simple: {
    name: 'Salarié simple',
    description: 'Déclaration standard pour salarié',
    conditions: (a) =>
      a.employment === 'employed' &&
      a.property === 'none' &&
      (!a.additionalIncome || a.additionalIncome.length <= 1),
    estimatedTime: 15,
    sections: [0, 1, 3, 5, 6, 8],
  },

  // Property owner
  proprietaire: {
    name: 'Propriétaire',
    description: 'Déclaration avec bien immobilier',
    conditions: (a) =>
      a.property !== 'none',
    estimatedTime: 25,
    sections: [0, 1, 3, 5, 6, 7, 8],
  },

  // Family with children
  famille: {
    name: 'Famille',
    description: 'Déclaration familiale avec enfants',
    conditions: (a) =>
      a.children !== '0' &&
      a.property === 'none',
    estimatedTime: 20,
    sections: [0, 1, 2, 3, 5, 6, 8],
  },

  // Family with property
  famille_proprietaire: {
    name: 'Famille propriétaire',
    description: 'Famille avec bien immobilier',
    conditions: (a) =>
      a.children !== '0' &&
      a.property !== 'none',
    estimatedTime: 30,
    sections: [0, 1, 2, 3, 5, 6, 7, 8],
  },

  // Self-employed
  independant: {
    name: 'Indépendant',
    description: 'Activité indépendante',
    conditions: (a) =>
      a.employment === 'selfEmployed',
    estimatedTime: 35,
    sections: [0, 1, 2, 3, 4, 5, 6, 7, 8],
  },

  // Retired
  retraite: {
    name: 'Retraité',
    description: 'Déclaration pour retraité',
    conditions: (a) =>
      a.employment === 'retired',
    estimatedTime: 20,
    sections: [0, 1, 3, 5, 6, 8],
  },

  // Default complete
  complet: {
    name: 'Complet',
    description: 'Déclaration complète',
    conditions: () => true, // Fallback
    estimatedTime: 35,
    sections: [0, 1, 2, 3, 4, 5, 6, 7, 8],
  },
};

/**
 * Document checklist based on profile
 */
export const DOCUMENT_CHECKLIST = {
  base: [
    { id: 'certificatSalaire', label: 'Certificat de salaire', icon: 'FileText' },
    { id: 'attestationAVS', label: 'Attestation AVS', icon: 'FileCheck' },
  ],
  property: [
    { id: 'valeurLocative', label: 'Valeur locative', icon: 'Home' },
    { id: 'interetsHypotheque', label: 'Intérêts hypothécaires', icon: 'Percent' },
    { id: 'chargesImmeuble', label: 'Charges d\'immeuble', icon: 'Receipt' },
  ],
  children: [
    { id: 'attestationGarde', label: 'Attestation frais de garde', icon: 'Baby' },
    { id: 'fraisFormation', label: 'Frais de formation', icon: 'GraduationCap' },
  ],
  pillar3a: [
    { id: 'attestation3a', label: 'Attestation 3e pilier', icon: 'PiggyBank' },
  ],
  securities: [
    { id: 'releveTitres', label: 'Relevé de titres', icon: 'TrendingUp' },
    { id: 'releveBancaire', label: 'Relevés bancaires 31.12', icon: 'Landmark' },
  ],
  selfEmployed: [
    { id: 'bilanComptable', label: 'Bilan comptable', icon: 'Calculator' },
    { id: 'comptePP', label: 'Compte de pertes et profits', icon: 'FileSpreadsheet' },
  ],
  retired: [
    { id: 'attestationRente', label: 'Attestation de rente AVS/AI', icon: 'FileCheck' },
    { id: 'attestationLPP', label: 'Attestation caisse de pension', icon: 'Building' },
  ],
};

/**
 * Get wizard profile from answers
 */
export function getProfileFromAnswers(answers) {
  const profiles = Object.entries(PROFILE_MAPPING);

  // Check conditions in order (most specific first)
  for (const [key, profile] of profiles) {
    if (key !== 'complet' && profile.conditions(answers)) {
      return { key, ...profile };
    }
  }

  // Fallback to complete
  return { key: 'complet', ...PROFILE_MAPPING.complet };
}

/**
 * Get document checklist from answers
 */
export function getDocumentChecklist(answers) {
  const docs = [...DOCUMENT_CHECKLIST.base];

  if (answers.property !== 'none') {
    docs.push(...DOCUMENT_CHECKLIST.property);
  }

  if (answers.children !== '0') {
    docs.push(...DOCUMENT_CHECKLIST.children);
  }

  if (answers.additionalIncome?.includes('pillar3a')) {
    docs.push(...DOCUMENT_CHECKLIST.pillar3a);
  }

  if (answers.additionalIncome?.includes('securities')) {
    docs.push(...DOCUMENT_CHECKLIST.securities);
  }

  if (answers.employment === 'selfEmployed') {
    docs.push(...DOCUMENT_CHECKLIST.selfEmployed);
  }

  if (answers.employment === 'retired') {
    docs.push(...DOCUMENT_CHECKLIST.retired);
  }

  return docs;
}
