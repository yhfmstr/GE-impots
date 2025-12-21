/**
 * Test fixtures for Geneva Tax Declaration 2024
 * Values based on official 2024 tax guide
 */

export const TAX_LIMITS_2024 = {
  // 3ème pilier A (with LPP)
  pilier3a_with_lpp: 7056,
  pilier3a_without_lpp: 35280,

  // Frais de garde
  frais_garde_icc: 26080,
  frais_garde_ifd: 25500,

  // Formation continue
  formation_icc: 12640,
  formation_ifd: 12900,

  // Primes d'assurance maladie
  assurance_maladie_adulte: 16207,
  assurance_maladie_enfant: 6483,

  // Frais médicaux
  frais_medicaux_threshold: 0.05, // 5% du revenu

  // Dons
  dons_min: 100,
  dons_max_icc: 0.20, // 20% du revenu
  dons_max_ifd: 0.20,

  // Rachats LPP
  rachat_lpp_unlimited: true,

  // Frais professionnels forfait
  frais_pro_forfait_min: 632,
  frais_pro_forfait_max: 2528,

  // Transport
  transport_forfait_max: 500,
  transport_abonnement_max_ifd: 3200,

  // Repas
  repas_par_jour: 15,
  repas_max_icc: 3270,
  repas_max_ifd: 3200,
};

export const GETAX_CODES = {
  // Annexe A - Activité dépendante
  annexeA: ['11.10', '11.20', '12.10', '13.10', '14.10', '15.10', '16.10'],

  // Annexe C - Assurances
  annexeC: ['31.10', '31.20', '31.40', '32.10', '33.10'],

  // Annexe D - Fortune immobilière
  annexeD: ['41.10', '41.20', '42.10', '43.10', '44.10'],

  // Annexe E - Fortune mobilière
  annexeE: ['51.10', '51.20', '52.10', '52.21'],

  // Annexe F - Fortune mobilière (suite)
  annexeF: ['52.21', '52.30', '53.10', '54.10'],
};

export const SUPPORTED_DOCUMENT_TYPES = [
  'Certificat de salaire',
  'Attestation LPP',
  'Attestation 3ème pilier A',
  'Attestation assurance maladie',
  'Relevé bancaire',
  'Attestation hypothécaire',
  'Relevé de titres',
  'Attestation de frais médicaux',
];

export const SAMPLE_SALARY_CERTIFICATE = {
  type: 'certificat-salaire',
  data: {
    employeur: 'Test Entreprise SA',
    salaire_brut: 120000,
    avs_ai_apg: 6330,
    ac: 1320,
    lpp: 8400,
    autres_deductions: 0,
    salaire_net: 103950,
    frais_effectifs: 0,
    voiture_service: false,
  },
};

export const SAMPLE_LPP_STATEMENT = {
  type: 'attestation-lpp',
  data: {
    avoir_total: 250000,
    cotisations_annuelles: 8400,
    rachat_possible: 45000,
    prestation_libre_passage: 245000,
  },
};

export const SAMPLE_PILIER3A_STATEMENT = {
  type: 'attestation-3a',
  data: {
    versements_annee: 7056,
    avoir_total: 85000,
    institution: 'PostFinance',
  },
};

export const SAMPLE_HEALTH_INSURANCE = {
  type: 'attestation-assurance-maladie',
  data: {
    prime_annuelle: 6500,
    franchise: 2500,
    assureur: 'Assura',
    subsides_recus: 0,
  },
};

export const SAMPLE_MORTGAGE_STATEMENT = {
  type: 'attestation-hypothecaire',
  data: {
    dette_hypothecaire: 650000,
    interet_annuel: 9750,
    banque: 'UBS',
    bien_immobilier: 'Appartement Genève',
  },
};

export const TAX_BRACKETS_ICC_2024 = {
  // Simplified ICC brackets for testing
  rates: [
    { min: 0, max: 17697, rate: 0 },
    { min: 17697, max: 21285, rate: 8 },
    { min: 21285, max: 23494, rate: 9 },
    { min: 23494, max: 25798, rate: 10 },
    { min: 25798, max: 28300, rate: 11 },
    { min: 28300, max: 31003, rate: 12 },
    { min: 31003, max: 33968, rate: 13 },
    { min: 33968, max: 176968, rate: 14 },
    { min: 176968, max: 189461, rate: 14.5 },
    { min: 189461, max: 254453, rate: 15 },
    { min: 254453, max: 392733, rate: 15.5 },
    { min: 392733, max: 616983, rate: 16 },
    { min: 616983, max: Infinity, rate: 17 },
  ],
  // Centime additionnel
  centime_cantonal: 47.5,
  centime_communal: 45, // Varies by commune
};

export const TAX_BRACKETS_IFD_2024 = {
  // Simplified IFD brackets for testing
  rates: [
    { min: 0, max: 14500, rate: 0 },
    { min: 14500, max: 31600, rate: 0.77 },
    { min: 31600, max: 41400, rate: 0.88 },
    { min: 41400, max: 55200, rate: 2.64 },
    { min: 55200, max: 72500, rate: 2.97 },
    { min: 72500, max: 78100, rate: 5.94 },
    { min: 78100, max: 103600, rate: 6.6 },
    { min: 103600, max: 134600, rate: 8.8 },
    { min: 134600, max: 176000, rate: 11 },
    { min: 176000, max: 755200, rate: 13.2 },
    { min: 755200, max: Infinity, rate: 11.5 },
  ],
};

export const IMMOBILIER_FORFAITS = {
  // Forfait pour frais d'entretien immobilier
  age_tranches: [
    { years: '0-10', forfait: 10 },
    { years: '11-25', forfait: 15 },
    { years: '26-50', forfait: 20 },
    { years: '51+', forfait: 25 },
  ],
  // Abattement sur valeur fiscale
  abattement: {
    residence_principale: 4,
    residence_secondaire: 0,
  },
  // IIC (Impôt Immobilier Complémentaire)
  iic_taux: 1, // 1 pour mille
};

export const GENEVA_COMMUNES = [
  { name: 'Genève', code: '6621', centime: 45 },
  { name: 'Carouge', code: '6608', centime: 44 },
  { name: 'Lancy', code: '6628', centime: 47 },
  { name: 'Meyrin', code: '6630', centime: 39 },
  { name: 'Vernier', code: '6636', centime: 51 },
  { name: 'Onex', code: '6631', centime: 50 },
  { name: 'Thônex', code: '6635', centime: 44 },
  { name: 'Grand-Saconnex', code: '6625', centime: 30 },
  { name: 'Plan-les-Ouates', code: '6632', centime: 28 },
  { name: 'Chêne-Bougeries', code: '6612', centime: 32 },
];

export const TEST_SCENARIOS = {
  // Single person, employee
  single_employee: {
    profile: {
      etat_civil: 'célibataire',
      enfants: 0,
      commune: 'Genève',
    },
    revenus: {
      salaire_brut: 85000,
    },
    deductions: {
      avs: 4482.50,
      lpp: 6000,
      pilier3a: 7056,
      assurance_maladie: 5500,
    },
    expected: {
      revenu_imposable_approx: 62000,
    },
  },

  // Married couple with children
  family_two_incomes: {
    profile: {
      etat_civil: 'marié',
      enfants: 2,
      commune: 'Meyrin',
    },
    revenus: {
      salaire_contribuable1: 95000,
      salaire_contribuable2: 65000,
    },
    deductions: {
      avs: 8430,
      lpp: 14000,
      pilier3a: 14112, // 2x7056
      assurance_maladie: 18000,
      frais_garde: 24000,
    },
    expected: {
      revenu_imposable_approx: 85000,
    },
  },

  // Property owner
  property_owner: {
    profile: {
      etat_civil: 'célibataire',
      enfants: 0,
      commune: 'Carouge',
    },
    revenus: {
      salaire_brut: 120000,
      valeur_locative: 18000,
    },
    charges: {
      interets_hypothecaires: 9500,
      frais_entretien_forfait: 3600, // 20% de valeur locative
    },
    expected: {
      revenu_imposable_approx: 100000,
    },
  },
};
