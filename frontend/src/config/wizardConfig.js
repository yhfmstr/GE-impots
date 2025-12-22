/**
 * Wizard Configuration for Guided Tax Declaration
 *
 * Defines user profiles with their relevant sections and estimated completion times.
 * Each profile targets a specific user scenario with streamlined questions.
 */

/**
 * Section IDs reference (from Questionnaire.jsx SECTIONS):
 * 0 - Informations personnelles
 * 1 - Revenus professionnels
 * 2 - Prestations et rentes
 * 3 - Prévoyance
 * 4 - Frais professionnels
 * 5 - Autres déductions
 * 6 - Fortune
 * 7 - Immobilier
 * 8 - Dettes
 */

export const WIZARD_PROFILES = {
  salarie_simple: {
    id: 'salarie_simple',
    name: 'Salarié(e) simple',
    description: 'Revenus d\'un seul emploi, sans immobilier',
    icon: 'Briefcase',
    estimatedTime: 15,
    sections: [0, 1, 3, 5, 6, 8],
    characteristics: [
      'Un seul employeur',
      'Locataire ou hébergé',
      'Pas de revenus accessoires'
    ],
    helpTips: {
      grossSalary: 'Rubrique 1 de votre certificat de salaire',
      avsContributions: 'Rubrique 9.1 de votre certificat de salaire',
      lppContributions: 'Rubrique 10.1 de votre certificat de salaire',
      pilier3a: 'Maximum CHF 7\'056 si affilié LPP'
    }
  },

  proprietaire: {
    id: 'proprietaire',
    name: 'Propriétaire immobilier',
    description: 'Possède un bien immobilier (résidence principale ou secondaire)',
    icon: 'Home',
    estimatedTime: 25,
    sections: [0, 1, 3, 5, 6, 7, 8],
    characteristics: [
      'Propriétaire d\'un logement',
      'Intérêts hypothécaires',
      'Valeur locative à déclarer'
    ],
    helpTips: {
      propertyValue: 'Valeur fiscale indiquée sur l\'avis d\'imposition',
      rentalValue: 'Calculée par l\'administration fiscale (70% valeur marché)',
      mortgageInterest: 'Attestation de votre banque',
      mortgageBalance: 'Solde au 31 décembre'
    }
  },

  famille: {
    id: 'famille',
    name: 'Famille avec enfants',
    description: 'Couple ou parent seul avec enfants à charge',
    icon: 'Users',
    estimatedTime: 20,
    sections: [0, 1, 2, 3, 5, 6, 8],
    characteristics: [
      'Enfants à charge',
      'Frais de garde déductibles',
      'Allocations familiales'
    ],
    helpTips: {
      childrenCount: 'Enfants de moins de 25 ans en formation',
      childcareCosts: 'Maximum CHF 26\'080 par enfant',
      healthInsurance: 'Primes pour toute la famille'
    }
  },

  retraite: {
    id: 'retraite',
    name: 'Retraité(e)',
    description: 'Revenus principaux de rentes AVS/LPP',
    icon: 'Armchair',
    estimatedTime: 18,
    sections: [0, 2, 5, 6, 7, 8],
    characteristics: [
      'Rentes AVS et/ou LPP',
      'Pas de revenu salarié',
      'Éventuellement propriétaire'
    ],
    helpTips: {
      pensionAmount: 'Total des rentes AVS + LPP annuelles',
      bankAccounts: 'Solde total au 31 décembre',
      medicalExpenses: 'Déductible si > 5% du revenu net'
    }
  },

  complet: {
    id: 'complet',
    name: 'Déclaration complète',
    description: 'Accès à toutes les sections et options',
    icon: 'FileStack',
    estimatedTime: 35,
    sections: [0, 1, 2, 3, 4, 5, 6, 7, 8],
    characteristics: [
      'Toutes les rubriques',
      'Situations complexes',
      'Frais effectifs'
    ],
    helpTips: {}
  }
};

/**
 * Profiling questions for users who are unsure of their profile
 */
export const PROFILING_QUESTIONS = [
  {
    id: 'employment',
    question: 'Quelle est votre situation professionnelle principale?',
    options: [
      { value: 'employed', label: 'Salarié(e)', profiles: ['salarie_simple', 'proprietaire', 'famille'] },
      { value: 'retired', label: 'Retraité(e)', profiles: ['retraite'] },
      { value: 'self_employed', label: 'Indépendant(e)', profiles: ['complet'] },
      { value: 'unemployed', label: 'Sans emploi / Chômage', profiles: ['complet'] }
    ]
  },
  {
    id: 'property',
    question: 'Êtes-vous propriétaire d\'un bien immobilier?',
    options: [
      { value: 'yes', label: 'Oui', profiles: ['proprietaire'] },
      { value: 'no', label: 'Non (locataire ou hébergé)', profiles: ['salarie_simple', 'famille'] }
    ]
  },
  {
    id: 'children',
    question: 'Avez-vous des enfants à charge?',
    options: [
      { value: 'yes', label: 'Oui', profiles: ['famille'] },
      { value: 'no', label: 'Non', profiles: ['salarie_simple', 'proprietaire'] }
    ]
  }
];

/**
 * Calculate the best profile based on profiling answers
 * @param {Object} answers - Object with question ids as keys and answer values
 * @returns {string} Best matching profile id
 */
export const determineBestProfile = (answers) => {
  const profileScores = {};

  // Initialize scores
  Object.keys(WIZARD_PROFILES).forEach(profileId => {
    profileScores[profileId] = 0;
  });

  // Score based on answers
  PROFILING_QUESTIONS.forEach(question => {
    const answer = answers[question.id];
    if (answer) {
      const option = question.options.find(o => o.value === answer);
      if (option) {
        option.profiles.forEach(profileId => {
          profileScores[profileId] = (profileScores[profileId] || 0) + 1;
        });
      }
    }
  });

  // Find highest scoring profile (excluding 'complet' unless it's the only match)
  let bestProfile = 'salarie_simple';
  let bestScore = 0;

  Object.entries(profileScores).forEach(([profileId, score]) => {
    if (score > bestScore && profileId !== 'complet') {
      bestScore = score;
      bestProfile = profileId;
    }
  });

  // If no good match, suggest complete
  if (bestScore === 0) {
    bestProfile = 'complet';
  }

  return bestProfile;
};

/**
 * Get contextual help for a field based on profile
 * @param {string} profileId - Current profile id
 * @param {string} fieldName - Field name to get help for
 * @returns {string|null} Help text or null
 */
export const getFieldHelp = (profileId, fieldName) => {
  const profile = WIZARD_PROFILES[profileId];
  if (!profile) return null;
  return profile.helpTips[fieldName] || null;
};

/**
 * Section metadata with descriptions
 */
export const SECTION_METADATA = {
  0: {
    title: 'Informations personnelles',
    description: 'Votre situation familiale et lieu de résidence',
    icon: 'User'
  },
  1: {
    title: 'Revenus professionnels',
    description: 'Salaires, bonus et autres revenus du travail',
    icon: 'Briefcase'
  },
  2: {
    title: 'Prestations et rentes',
    description: 'Chômage, AVS, AI et autres rentes',
    icon: 'HandCoins'
  },
  3: {
    title: 'Prévoyance',
    description: '2ème et 3ème pilier',
    icon: 'PiggyBank'
  },
  4: {
    title: 'Frais professionnels',
    description: 'Transport, repas et formation',
    icon: 'Receipt'
  },
  5: {
    title: 'Autres déductions',
    description: 'Assurance maladie, garde, dons',
    icon: 'FileCheck'
  },
  6: {
    title: 'Fortune',
    description: 'Comptes, titres et autres actifs',
    icon: 'Wallet'
  },
  7: {
    title: 'Immobilier',
    description: 'Propriétés et hypothèques',
    icon: 'Home'
  },
  8: {
    title: 'Dettes',
    description: 'Crédits et autres passifs',
    icon: 'CreditCard'
  }
};

export default {
  WIZARD_PROFILES,
  PROFILING_QUESTIONS,
  determineBestProfile,
  getFieldHelp,
  SECTION_METADATA
};
