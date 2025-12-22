/**
 * GeTax Annexes Configuration
 *
 * This file contains all 6 Geneva tax declaration annexes with their
 * rubrique codes, field definitions, and document type mappings.
 *
 * Structure:
 * - GETAX_PAGES: Array of annexe definitions
 * - DOCUMENT_TYPE_NAMES: Human-readable document type names
 * - getAnnexeById: Helper to find annexe by ID
 * - getDocumentTypeName: Helper to get document display name
 */

export const GETAX_PAGES = [
  {
    id: 'annexe-a',
    name: 'Annexe A - Activité dépendante',
    description: 'Salaires, cotisations sociales, frais professionnels',
    documentTypes: ['certificat-salaire', 'attestation-3a', 'attestation-lpp-rachat', 'facture-formation'],
    fields: [
      // === REVENUS ===
      { code: '11.10', name: 'Salaires bruts c.A', source: 'Certificat champ 8', dataKey: 'grossSalary' },
      { code: '11.15', name: 'Bonus, gratification c.A', source: 'Certificat', dataKey: 'bonus' },
      { code: '11.30', name: 'Tantièmes, jetons de présence c.A', source: 'Certificat', dataKey: 'boardFees' },
      { code: '11.40', name: 'Actions/options collaborateur c.A', source: 'Certificat', dataKey: 'stockOptions' },
      { code: '11.50', name: 'Indemnités chômage/maladie c.A', source: 'Attestation', dataKey: 'unemploymentBenefits' },
      { code: '11.60', name: 'Vacations, ponts, prestations nature c.A', source: 'Certificat', dataKey: 'benefitsInKind' },
      { code: '11.70', name: 'Prestations en capital c.A', source: 'Certificat', dataKey: 'capitalBenefits' },
      { code: '11.90', name: 'Frais de représentation c.A', source: 'Certificat 13.2.1', dataKey: 'representationFees' },
      { code: '11.91', name: 'Frais de voiture c.A', source: 'Certificat 13.2.2', dataKey: 'carAllowance' },
      { code: '11.92', name: 'Autres frais c.A', source: 'Certificat 13.2.3', dataKey: 'otherAllowances' },
      // === COTISATIONS SOCIALES ===
      { code: '31.10', name: 'Cotisations AVS/AI c.A', source: 'Certificat champ 9', dataKey: 'avsContributions' },
      { code: '31.12', name: 'Cotisations 2e pilier c.A', source: 'Certificat champ 10', dataKey: 'lppContributions' },
      { code: '31.30', name: 'Rachats 2e pilier c.A', source: 'Attestation rachat', dataKey: 'lppBuyback' },
      { code: '31.40', name: 'Cotisations 3e pilier A c.A', source: 'Formulaire 21 EDP', dataKey: 'pilier3a', limit: 7056 },
      // === FRAIS PROFESSIONNELS FORFAIT ===
      { code: '31.50', name: 'Forfait frais pro ICC c.A', calculated: true, formula: '3% (min 634, max 1796)' },
      { code: '31.20', name: 'Forfait frais pro IFD c.A', calculated: true, formula: '3% (min 2000, max 4000)' },
      // === FRAIS PROFESSIONNELS EFFECTIFS ===
      { code: '31.60', name: 'Frais de repas effectifs c.A', source: 'Justificatifs', dataKey: 'mealExpenses', limit: 3200 },
      { code: '31.70', name: 'Frais de déplacement ICC c.A', source: 'Justificatifs', dataKey: 'travelExpensesICC', limit: 529 },
      { code: '31.71', name: 'Frais de déplacement IFD c.A', source: 'Justificatifs', dataKey: 'travelExpensesIFD', limit: 3200 },
      { code: '31.63', name: 'Autres frais professionnels c.A', source: 'Justificatifs', dataKey: 'otherProfExpenses' },
      // === DÉDUCTION ACTIVITÉ DOUBLE (couples) ===
      { code: '31.90', name: 'Déduction activité double IFD', calculated: true, formula: 'Max CHF 13,900' },
      { code: '31.95', name: 'Déduction activité double ICC', calculated: true, formula: 'CHF 1,041' },
    ]
  },
  {
    id: 'annexe-b',
    name: 'Annexe B - Activité indépendante',
    description: 'Bénéfices, cotisations sociales indépendants',
    documentTypes: ['comptabilite', 'attestation-avs-indep', 'attestation-3a', 'attestation-lpp-rachat'],
    fields: [
      // === REVENUS ===
      { code: '12.01', name: 'Bénéfice net activité indépendante c.A', source: 'Comptabilité', dataKey: 'selfEmployedProfit' },
      { code: '12.28', name: 'Réduction liée aux brevets ICC c.A', source: 'Déclaration brevets', dataKey: 'patentReduction' },
      { code: '12.29', name: 'Réduction dépenses R&D ICC c.A', source: 'Déclaration R&D', dataKey: 'rdReduction' },
      { code: '22.01', name: 'Bénéfice net activité indépendante c.B', source: 'Comptabilité', dataKey: 'selfEmployedProfitB' },
      // === COTISATIONS SOCIALES ===
      { code: '32.10', name: 'Cotisations AVS/AI indépendant c.A', source: 'Attestation AVS', dataKey: 'avsIndependent' },
      { code: '42.10', name: 'Cotisations AVS/AI indépendant c.B', source: 'Attestation AVS', dataKey: 'avsIndependentB' },
      { code: '32.20', name: 'Cotisations 2e pilier indépendant c.A', source: 'Attestation LPP', dataKey: 'lppIndependent' },
      { code: '42.20', name: 'Cotisations 2e pilier indépendant c.B', source: 'Attestation LPP', dataKey: 'lppIndependentB' },
      { code: '32.30', name: 'Rachats 2e pilier indépendant c.A', source: 'Attestation rachat', dataKey: 'lppBuybackIndep' },
      { code: '32.40', name: 'Cotisations 3e pilier A indépendant c.A', source: '21 EDP', dataKey: 'pilier3aIndep', limit: 35280 },
    ]
  },
  {
    id: 'annexe-c',
    name: 'Annexe C - Autres revenus et déductions',
    description: 'Assurances, déductions familiales, pensions, dons',
    documentTypes: ['attestation-maladie', 'attestation-vie', 'facture-garde', 'facture-formation', 'facture-dons', 'justificatif-pension', 'facture-medicale'],
    fields: [
      // === RENTES AVS/AI ===
      { code: '17.10', name: 'Rentes AVS/AI c.A', source: 'Attestation AVS', dataKey: 'avsRente' },
      { code: '17.20', name: 'Autres prestations sociales c.A', source: 'Attestation', dataKey: 'otherSocialBenefits' },
      // === AUTRES REVENUS ===
      { code: '13.10', name: 'Pensions alimentaires reçues', source: 'Justificatifs', dataKey: 'alimonyReceived' },
      { code: '13.15', name: 'Avances SCARPA reçues', source: 'Attestation SCARPA', dataKey: 'scarpaAdvances' },
      { code: '13.20', name: 'Rentes prévoyance professionnelle', source: 'Attestation LPP', dataKey: 'lppRente' },
      { code: '13.30', name: 'Prestations assurance militaire', source: 'Attestation', dataKey: 'militaryInsurance' },
      { code: '13.40', name: 'Autres rentes', source: 'Justificatifs', dataKey: 'otherRentes' },
      { code: '13.50', name: 'Rentes viagères reçues', source: 'Contrat', dataKey: 'annuitiesReceived' },
      // === REVENUS DIVERS ===
      { code: '16.10', name: 'Produits sous-location', source: 'Baux', dataKey: 'subletIncome' },
      { code: '16.20', name: 'Gains accessoires', source: 'Justificatifs', dataKey: 'sideIncome' },
      { code: '16.30', name: 'Subside assurance-maladie', source: 'Attestation', dataKey: 'healthSubsidy' },
      { code: '16.35', name: 'Allocation logement', source: 'Attestation', dataKey: 'housingAllowance' },
      { code: '16.40', name: 'Numéraires, métaux précieux trouvés', source: 'Déclaration', dataKey: 'foundValuables' },
      { code: '16.50', name: 'Successions non partagées', source: 'Documents succession', dataKey: 'undividedInheritance' },
      { code: '16.63', name: 'Allocations familiales', source: 'Attestation', dataKey: 'familyAllowances' },
      { code: '16.64', name: 'Autres revenus', source: 'Justificatifs', dataKey: 'otherIncome' },
      { code: '16.80', name: 'Successions', source: 'Documents succession', dataKey: 'inheritance' },
      // === ASSURANCES ===
      { code: '52.21', name: 'Primes assurance-maladie', source: 'Attestation caisse', dataKey: 'healthInsurance', limit: 16207 },
      { code: '52.22', name: 'Primes assurance-accidents', source: 'Attestation', dataKey: 'accidentInsurance' },
      { code: '52.11', name: 'Assurance-vie 3b (primes)', source: 'Attestation', dataKey: 'lifeInsurance3b', limit: 2324 },
      { code: '52.00', name: 'Forfait assurances IFD', calculated: true, formula: 'Célibataire: 1800, Couple: 3600' },
      { code: '52.15', name: 'Sous-total ICC assurances', calculated: true, formula: 'Selon situation familiale' },
      // === DÉDUCTIONS FAMILIALES ===
      { code: '59.10', name: 'Frais de garde enfants ICC', source: 'Factures garde', dataKey: 'childcareICC', limit: 26080 },
      { code: '59.12', name: 'Frais de garde enfants IFD', source: 'Factures garde', dataKey: 'childcareIFD', limit: 25500 },
      { code: '59.20', name: 'Déduction époux IFD', calculated: true, formula: 'CHF 2,800' },
      // === FORMATION & HANDICAP ===
      { code: '59.50', name: 'Formation continue', source: 'Factures formation', dataKey: 'continuingEducation', limit: 12640 },
      { code: '59.40', name: 'Frais liés au handicap', source: 'Justificatifs médicaux', dataKey: 'disabilityCosts' },
      // === DÉDUCTIONS GAINS ACCESSOIRES ===
      { code: '59.70', name: 'Déduction gains accessoires ICC', calculated: true, formula: '20% (max CHF 2400)' },
      { code: '59.75', name: 'Déduction gains accessoires IFD', calculated: true, formula: '20% (max CHF 800)' },
      // === PENSIONS VERSÉES ===
      { code: '53.10', name: 'Pensions alimentaires versées', source: 'Justificatifs', dataKey: 'alimonyPaid' },
      { code: '54.10', name: 'Rentes viagères payées', source: 'Justificatifs', dataKey: 'annuitiesPaid' },
      { code: '33.20', name: 'Déduction rentes LPP historiques', source: 'Attestation', dataKey: 'historicLppRentes' },
      // === INTÉRÊTS ÉPARGNE ===
      { code: '56.30', name: 'Intérêts capitaux d\'épargne', source: 'État des titres', dataKey: 'savingsInterest' },
      // === PRÉVOYANCE SPÉCIALE (58+) ===
      { code: '59.65', name: 'Maintien prévoyance - cotisations', source: 'Attestation', dataKey: 'pensionMaintenance' },
      { code: '59.66', name: 'Maintien prévoyance - rachats', source: 'Attestation', dataKey: 'pensionMaintenanceBuyback' },
      // === DONS ===
      { code: '58.10', name: 'Dons (utilité publique)', source: 'Reçus dons', dataKey: 'donations' },
      // === FRAIS MÉDICAUX ===
      { code: '52.30', name: 'Frais médicaux (au-delà seuil)', source: 'Factures médicales', dataKey: 'medicalExpenses' },
      // === CHARGES DE FAMILLE ===
      { code: '80.10', name: 'Déduction enfant (charge complète)', calculated: true, formula: 'ICC: 13536, IFD: 6700' },
      { code: '80.20', name: 'Déduction enfant (demi-charge)', calculated: true, formula: 'ICC: 6768, IFD: 3350' },
    ]
  },
  {
    id: 'annexe-d',
    name: 'Annexe D - Fortune immobilière',
    description: 'Valeur locative, frais entretien, hypothèque',
    documentTypes: ['attestation-hypothecaire', 'estimation-immobiliere', 'facture-entretien'],
    fields: [
      // === REVENUS IMMOBILIERS ===
      { code: '15.10', name: 'Valeur locative brute', source: 'Questionnaire officiel', dataKey: 'rentalValue' },
      { code: '15.13', name: 'Subventions reçues (travaux énergie)', source: 'Attestation subvention', dataKey: 'energySubsidy' },
      { code: '15.20', name: 'Loyers encaissés', source: 'Baux', dataKey: 'rentalIncome' },
      { code: '15.30', name: 'Rendement immeubles commerciaux', source: 'Comptabilité', dataKey: 'commercialPropertyIncome' },
      { code: '15.40', name: 'Épargne logement (intérêts bonifiés)', source: 'Relevé compte', dataKey: 'housingBonusInterest' },
      { code: '15.43', name: 'Subventions PPE', source: 'Attestation PPE', dataKey: 'ppeSubsidy' },
      { code: '15.50', name: 'Loyers HLM / coopératives', source: 'Attestation', dataKey: 'hlmRent' },
      // === FRAIS D'ENTRETIEN ===
      { code: '35.10', name: 'Frais entretien forfait ICC', calculated: true, formula: '≤10 ans: 15%, >10 ans: 25%' },
      { code: '35.11', name: 'Frais entretien forfait IFD', calculated: true, formula: '≤10 ans: 10%, >10 ans: 20%' },
      { code: '35.20', name: 'Frais d\'entretien effectifs', source: 'Factures', dataKey: 'maintenanceActual' },
      // === CHARGES ===
      { code: '35.30', name: 'Intérêts hypothécaires', source: 'Relevé banque', dataKey: 'mortgageInterest' },
      // === FORTUNE ===
      { code: '65.10', name: 'Valeur fiscale immeuble', source: 'Estimation officielle', dataKey: 'propertyValue' },
      { code: '65.20', name: 'Dette hypothécaire', source: 'Relevé banque 31.12', dataKey: 'mortgageDebt' },
    ]
  },
  {
    id: 'annexe-e',
    name: 'Annexe E - Dettes',
    description: 'Dettes privées, intérêts passifs',
    documentTypes: ['releve-credit'],
    fields: [
      { code: '55.10', name: 'Intérêts passifs privés', source: 'Relevés crédits', dataKey: 'loanInterest' },
      { code: '55.20', name: 'Autres intérêts passifs', source: 'Relevés', dataKey: 'otherInterest' },
      { code: '66.10', name: 'Dettes privées', source: 'Contrats, relevés', dataKey: 'personalLoans' },
    ]
  },
  {
    id: 'annexe-f',
    name: 'Annexe F - Fortune mobilière',
    description: 'Comptes bancaires, titres, véhicules',
    documentTypes: ['releve-bancaire', 'etat-titres'],
    fields: [
      { code: '60.10', name: 'Comptes bancaires CH', source: 'Relevés 31.12', dataKey: 'bankAccounts' },
      { code: '60.20', name: 'Comptes bancaires étrangers', source: 'Relevés 31.12', dataKey: 'foreignBankAccounts' },
      { code: '60.30', name: 'Titres cotés', source: 'État des titres', dataKey: 'securities' },
      { code: '60.40', name: 'Titres non cotés', source: 'Évaluation', dataKey: 'unlistedSecurities' },
      { code: '60.50', name: 'Véhicules', source: 'Valeur vénale', dataKey: 'vehicleValue' },
      { code: '60.60', name: 'Assurance-vie (valeur de rachat)', source: 'Attestation', dataKey: 'lifeInsuranceValue' },
      { code: '60.70', name: 'Cryptomonnaies', source: 'Valeur 31.12', dataKey: 'crypto' },
      { code: '60.80', name: 'Autres actifs mobiliers', source: 'Estimation', dataKey: 'otherAssets' },
    ]
  },
];

/**
 * Document type display names (French)
 */
export const DOCUMENT_TYPE_NAMES = {
  // Annexe A
  'certificat-salaire': 'Certificat de salaire',
  'attestation-3a': 'Attestation 3ème pilier A',
  'attestation-lpp-rachat': 'Attestation rachat LPP',
  'facture-formation': 'Facture formation continue',
  // Annexe B
  'comptabilite': 'Comptabilité / Bilan',
  'attestation-avs-indep': 'Attestation AVS indépendant',
  // Annexe C
  'attestation-maladie': 'Attestation assurance maladie',
  'attestation-vie': 'Attestation assurance-vie (3b)',
  'facture-garde': 'Facture frais de garde',
  'facture-dons': 'Reçus de dons',
  'justificatif-pension': 'Justificatif pension alimentaire',
  'facture-medicale': 'Factures médicales',
  // Annexe D
  'attestation-hypothecaire': 'Attestation hypothécaire',
  'estimation-immobiliere': 'Estimation immobilière',
  'facture-entretien': 'Factures entretien immobilier',
  // Annexe E & F
  'releve-bancaire': 'Relevé bancaire',
  'etat-titres': 'État des titres',
  'releve-credit': 'Relevé de crédit/leasing',
};

/**
 * Helper to find an annexe by ID
 * @param {string} id - Annexe ID (e.g., 'annexe-a')
 * @returns {Object|undefined} - Annexe configuration or undefined
 */
export const getAnnexeById = (id) => GETAX_PAGES.find(p => p.id === id);

/**
 * Helper to get document type display name
 * @param {string} type - Document type key
 * @returns {string} - Human-readable name or the key if not found
 */
export const getDocumentTypeName = (type) => DOCUMENT_TYPE_NAMES[type] || type;

/**
 * Get all unique document types across all annexes
 * @returns {string[]} - Array of document type keys
 */
export const getAllDocumentTypes = () => {
  const types = new Set();
  GETAX_PAGES.forEach(page => {
    page.documentTypes?.forEach(type => types.add(type));
  });
  return Array.from(types);
};

/**
 * Get total field count across all annexes
 * @returns {number} - Total number of fields
 */
export const getTotalFieldCount = () => {
  return GETAX_PAGES.reduce((sum, page) => sum + page.fields.length, 0);
};
