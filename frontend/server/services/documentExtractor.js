import { readFileSync } from 'fs';
import path from 'path';
import { pdf } from 'pdf-to-img';
import { getClient, getModel } from './anthropicClient.js';

// Get shared client and model lazily
const getAnthropicClient = () => getClient();
const getConfiguredModel = () => getModel();

// Document type definitions with extraction instructions
const DOCUMENT_TYPES = {
  'certificat-salaire': {
    name: 'Certificat de salaire',
    description: 'Salary certificate from employer',
    fields: [
      { key: 'grossSalary', label: 'Salaire brut (champ 8)', type: 'number' },
      { key: 'avsContributions', label: 'Cotisations AVS/AI/APG/AC (champ 9)', type: 'number' },
      { key: 'lppContributions', label: 'Cotisations LPP (champ 10)', type: 'number' },
      { key: 'lppBuyback', label: 'Rachats LPP (champ 10.2)', type: 'number' },
      { key: 'bonus', label: 'Bonus/Gratification', type: 'number' },
      { key: 'transportFree', label: 'Case F cochée (transport gratuit)', type: 'boolean' },
      { key: 'mealSubsidy', label: 'Case G cochée (repas subventionnés)', type: 'boolean' },
      { key: 'employerName', label: 'Nom employeur', type: 'string' },
    ],
    prompt: `Analyse ce certificat de salaire suisse et extrait les informations suivantes:
- Champ 8: Salaire brut annuel
- Champ 9: Total des cotisations sociales (AVS/AI/APG/AC/AANP/AMat)
- Champ 10: Cotisations LPP (2ème pilier)
- Champ 10.2: Rachats LPP si présent
- Bonus ou gratifications
- Case F: Transport gratuit fourni par l'employeur (cochée ou non)
- Case G: Participation aux repas par l'employeur (cochée ou non)
- Nom de l'employeur

IMPORTANT: Retourne les montants en nombres sans apostrophes ni espaces.`
  },

  'attestation-3a': {
    name: 'Attestation 3ème pilier A',
    description: 'Third pillar A pension contribution attestation',
    fields: [
      { key: 'pilier3a', label: 'Versement 3ème pilier A', type: 'number' },
      { key: 'pilier3aInstitution', label: 'Institution', type: 'string' },
      { key: 'pilier3aAccount', label: 'Numéro de compte', type: 'string' },
    ],
    prompt: `Analyse cette attestation de 3ème pilier A (formulaire 21 EDP) et extrait:
- Le montant total versé en 2024
- Le nom de l'institution (banque ou assurance)
- Le numéro de compte/police

IMPORTANT: Le maximum déductible pour 2024 est CHF 7'056 (avec LPP) ou CHF 35'280 (sans LPP).`
  },

  'attestation-lpp-rachat': {
    name: 'Attestation rachat LPP',
    description: 'Pension fund buyback attestation',
    fields: [
      { key: 'rachatLPP', label: 'Montant rachat LPP', type: 'number' },
      { key: 'caisseNom', label: 'Nom de la caisse', type: 'string' },
    ],
    prompt: `Analyse cette attestation de rachat de 2ème pilier (LPP) et extrait:
- Le montant total du rachat effectué en 2024
- Le nom de la caisse de pension

Note: Les rachats LPP sont 100% déductibles mais bloqués 3 ans.`
  },

  'releve-bancaire': {
    name: 'Relevé bancaire',
    description: 'Bank account statement',
    fields: [
      { key: 'bankAccounts', label: 'Solde au 31.12', type: 'number' },
      { key: 'bankName', label: 'Nom de la banque', type: 'string' },
      { key: 'accountNumber', label: 'Numéro de compte (IBAN)', type: 'string' },
      { key: 'interestEarned', label: 'Intérêts perçus', type: 'number' },
    ],
    prompt: `Analyse ce relevé bancaire et extrait:
- Le solde du compte au 31 décembre 2024 (ou la date la plus proche)
- Le nom de la banque
- Le numéro de compte ou IBAN
- Les intérêts perçus durant l'année 2024

IMPORTANT: Pour la fortune, c'est le solde au 31.12 qui compte.`
  },

  'etat-titres': {
    name: 'État des titres',
    description: 'Securities portfolio statement',
    fields: [
      { key: 'securities', label: 'Valeur totale des titres', type: 'number' },
      { key: 'dividends', label: 'Dividendes perçus', type: 'number' },
      { key: 'bankName', label: 'Dépositaire', type: 'string' },
    ],
    prompt: `Analyse cet état des titres (portefeuille) et extrait:
- La valeur totale du portefeuille au 31.12.2024
- Le total des dividendes perçus en 2024
- Le nom de la banque dépositaire

Note: La valeur fiscale des titres cotés = valeur boursière au 31.12.`
  },

  'attestation-maladie': {
    name: 'Attestation assurance maladie',
    description: 'Health insurance premium attestation',
    fields: [
      { key: 'healthInsurance', label: 'Total primes maladie', type: 'number' },
      { key: 'insurerName', label: 'Nom de la caisse', type: 'string' },
      { key: 'insuredPersons', label: 'Personnes assurées', type: 'string' },
    ],
    prompt: `Analyse cette attestation d'assurance maladie et extrait:
- Le total des primes payées en 2024 (LAMal + complémentaires)
- Le nom de la caisse maladie
- Les personnes assurées (noms)

Limites de déduction ICC 2024:
- 0-18 ans: max 3'811 CHF
- 19-25 ans: max 12'442 CHF
- 26+ ans: max 16'207 CHF`
  },

  'attestation-vie': {
    name: 'Attestation assurance-vie (3b)',
    description: 'Life insurance attestation',
    fields: [
      { key: 'pilier3b', label: 'Prime assurance-vie', type: 'number' },
      { key: 'lifeInsuranceValue', label: 'Valeur de rachat', type: 'number' },
      { key: 'insurerName', label: 'Assureur', type: 'string' },
    ],
    prompt: `Analyse cette attestation d'assurance-vie (3ème pilier B) et extrait:
- La prime annuelle payée en 2024
- La valeur de rachat au 31.12.2024 (pour la fortune)
- Le nom de l'assureur

Limites ICC 2024 (avec 3a): Célib 2'324, Couple 3'486, +951/enfant`
  },

  'facture-garde': {
    name: 'Facture frais de garde',
    description: 'Childcare invoice',
    fields: [
      { key: 'childcareCosts', label: 'Frais de garde', type: 'number' },
      { key: 'childName', label: 'Nom de l\'enfant', type: 'string' },
      { key: 'providerName', label: 'Structure de garde', type: 'string' },
    ],
    prompt: `Analyse cette facture de frais de garde et extrait:
- Le montant total payé en 2024
- Le nom de l'enfant gardé
- Le nom de la structure (crèche, garderie, etc.)

Limite déductible ICC: max 26'080 CHF par enfant de moins de 14 ans.`
  },

  'attestation-hypothecaire': {
    name: 'Attestation hypothécaire',
    description: 'Mortgage statement',
    fields: [
      { key: 'mortgageBalance', label: 'Solde hypothèque au 31.12', type: 'number' },
      { key: 'mortgageInterest', label: 'Intérêts payés en 2024', type: 'number' },
      { key: 'bankName', label: 'Banque', type: 'string' },
    ],
    prompt: `Analyse cette attestation hypothécaire et extrait:
- Le solde de la dette hypothécaire au 31.12.2024
- Le total des intérêts hypothécaires payés en 2024
- Le nom de la banque créancière

Les intérêts hypothécaires sont 100% déductibles du revenu.`
  },

  'facture-formation': {
    name: 'Facture formation continue',
    description: 'Professional training invoice',
    fields: [
      { key: 'trainingCosts', label: 'Frais de formation', type: 'number' },
      { key: 'trainingDescription', label: 'Description', type: 'string' },
    ],
    prompt: `Analyse cette facture de formation et extrait:
- Le montant total payé
- La description de la formation

Limite déductible: ICC max 12'640 CHF, IFD max 12'900 CHF
Note: La formation doit être liée à l'activité professionnelle.`
  },

  'releve-credit': {
    name: 'Relevé de crédit/leasing',
    description: 'Loan or leasing statement',
    fields: [
      { key: 'personalLoans', label: 'Solde dette au 31.12', type: 'number' },
      { key: 'loanInterest', label: 'Intérêts payés', type: 'number' },
      { key: 'lenderName', label: 'Créancier', type: 'string' },
    ],
    prompt: `Analyse ce relevé de crédit/leasing et extrait:
- Le solde de la dette au 31.12.2024
- Le total des intérêts payés en 2024
- Le nom du créancier

Les dettes sont déductibles de la fortune.`
  },

  'estimation-immobiliere': {
    name: 'Estimation immobilière',
    description: 'Property valuation',
    fields: [
      { key: 'propertyValue', label: 'Valeur fiscale', type: 'number' },
      { key: 'rentalValue', label: 'Valeur locative', type: 'number' },
      { key: 'propertyAddress', label: 'Adresse du bien', type: 'string' },
    ],
    prompt: `Analyse ce document d'estimation immobilière et extrait:
- La valeur fiscale du bien immobilier
- La valeur locative annuelle (si indiquée)
- L'adresse du bien

Note: Pour Genève, la valeur locative est déterminée par questionnaire officiel.`
  },

  // ===========================================
  // HISTORICAL DOCUMENTS (for prefill & comparison)
  // ===========================================

  'declaration-fiscale': {
    name: 'Déclaration fiscale complète',
    description: 'Full tax declaration from previous year (GeTax export)',
    multiPage: true, // Flag for multi-page processing
    fields: [
      // Personal info
      { key: 'taxYear', label: 'Année fiscale', type: 'number' },
      { key: 'numeroContribuable', label: 'N° contribuable', type: 'string' },
      { key: 'filingDate', label: 'Date de dépôt', type: 'string' },
      { key: 'filingReference', label: 'N° dossier e-démarches', type: 'string' },
      { key: 'fullName', label: 'Nom complet', type: 'string' },
      { key: 'dateOfBirth', label: 'Date de naissance', type: 'string' },
      { key: 'civilStatus', label: 'État civil', type: 'string' },
      { key: 'nationality', label: 'Nationalité', type: 'string' },
      { key: 'profession', label: 'Profession', type: 'string' },
      { key: 'address', label: 'Adresse complète', type: 'string' },
      { key: 'commune', label: 'Commune', type: 'string' },
      { key: 'phone', label: 'Téléphone', type: 'string' },
      { key: 'annualRent', label: 'Loyer annuel', type: 'number' },

      // Summary totals (PG2-PG4)
      { key: 'revenuBrutICC', label: 'Revenu brut ICC (91.00)', type: 'number' },
      { key: 'revenuBrutIFD', label: 'Revenu brut IFD (91.00)', type: 'number' },
      { key: 'revenuNetICC', label: 'Revenu net ICC (95.00/99.00)', type: 'number' },
      { key: 'revenuNetIFD', label: 'Revenu net IFD (95.00/99.00)', type: 'number' },
      { key: 'fortuneBrute', label: 'Fortune brute (91.00)', type: 'number' },
      { key: 'fortuneNette', label: 'Fortune nette (95.00/99.00)', type: 'number' },

      // Income details (Annexe A)
      { key: 'salaireBrut', label: 'Salaire brut (11.10)', type: 'number' },
      { key: 'bonus', label: 'Bonus/gratification (11.15)', type: 'number' },
      { key: 'revenuMobilier', label: 'Revenu mobilier (14.00)', type: 'number' },

      // Deductions (A1, C3, C4)
      { key: 'cotisationsAVS', label: 'Cotisations AVS/AI (31.10)', type: 'number' },
      { key: 'cotisationsLPP', label: 'Cotisations LPP (31.12)', type: 'number' },
      { key: 'pilier3a', label: 'Pilier 3a (31.40)', type: 'number' },
      { key: 'rachatLPP', label: 'Rachat LPP (31.30)', type: 'number' },
      { key: 'fraisRepas', label: 'Frais repas (31.60)', type: 'number' },
      { key: 'fraisDeplacements', label: 'Frais déplacements (31.70/71)', type: 'number' },
      { key: 'autresFraisPro', label: 'Autres frais prof (31.63)', type: 'number' },
      { key: 'primesAssuranceVie', label: 'Primes assurance-vie (52.11)', type: 'number' },
      { key: 'primesMaladie', label: 'Primes maladie (52.21)', type: 'number' },
      { key: 'primesAccident', label: 'Primes accident (52.22)', type: 'number' },
      { key: 'interetsDettes', label: 'Intérêts dettes (55.00)', type: 'number' },
      { key: 'fraisMedicaux', label: 'Frais médicaux (71.00)', type: 'number' },

      // Wealth (F1, F2, E)
      { key: 'comptesBancaires', label: 'Total comptes bancaires', type: 'number' },
      { key: 'titres', label: 'Total titres/placements', type: 'number' },
      { key: 'valeurRachatAssVie', label: 'Valeur rachat ass-vie (16.70)', type: 'number' },
      { key: 'autresElementsFortune', label: 'Autres éléments fortune (16.00)', type: 'number' },
      { key: 'dettes', label: 'Total dettes (55.00)', type: 'number' },
      { key: 'deductionSociale', label: 'Déduction sociale (51.50)', type: 'number' },

      // Employer info
      { key: 'employerName', label: 'Nom employeur', type: 'string' },
      { key: 'employerAddress', label: 'Adresse employeur', type: 'string' },
    ],
    prompt: `Analyse cette DÉCLARATION FISCALE COMPLÈTE de Genève (format GeTax) et extrait TOUTES les informations.

PAGES IMPORTANTES:
- Quittance (page 1): N° contribuable, date dépôt, référence, résumés
- PG1: Informations personnelles
- PG2: Récapitulation revenus (codes 11.00 à 91.00)
- PG3: Récapitulation déductions (codes 31.00 à 99.00)
- PG4: Fortune (codes 12.00 à 99.00)
- Annexe A1: Détail activité dépendante
- Annexe C3: Assurances
- Annexe E: Intérêts et dettes
- Annexe F1/F2: État des titres

EXTRACTION PRIORITAIRE:
1. Numéro de contribuable et référence dossier
2. Données personnelles (nom, adresse, profession)
3. Totaux ICC et IFD (revenus, déductions, fortune)
4. Détails employeur et salaires
5. Cotisations sociales et pilier 3a
6. Comptes bancaires et titres
7. Dettes et intérêts

IMPORTANT: Cette déclaration servira à PRÉ-REMPLIR la déclaration de l'année suivante.
Extrait tous les montants disponibles avec leurs codes GeTax (11.10, 31.40, etc.).`
  },

  'bordereau-icc': {
    name: 'Bordereau ICC (cantonal/communal)',
    description: 'Tax assessment notice for cantonal and communal taxes',
    fields: [
      { key: 'taxYear', label: 'Année fiscale', type: 'number' },
      { key: 'numeroContribuable', label: 'N° contribuable', type: 'string' },
      { key: 'referenceNumber', label: 'N° référence', type: 'string' },
      { key: 'notificationDate', label: 'Date de notification', type: 'string' },
      { key: 'periodeDebut', label: 'Période début', type: 'string' },
      { key: 'periodeFin', label: 'Période fin', type: 'string' },

      // Assessed amounts
      { key: 'revenuImposable', label: 'Revenu imposable', type: 'number' },
      { key: 'fortuneImposable', label: 'Fortune imposable', type: 'number' },
      { key: 'tauxRevenu', label: 'Taux revenu', type: 'number' },
      { key: 'tauxFortune', label: 'Taux fortune', type: 'number' },
      { key: 'bareme', label: 'Barème appliqué', type: 'string' },

      // Cantonal taxes
      { key: 'impotBaseRevenu', label: 'Impôt de base revenu', type: 'number' },
      { key: 'centimesAdditionnelsRevenu', label: 'Centimes additionnels revenu', type: 'number' },
      { key: 'reduction12pct', label: 'Réduction 12%', type: 'number' },
      { key: 'aideDomicileRevenu', label: 'Aide à domicile revenu', type: 'number' },
      { key: 'impotBaseFortune', label: 'Impôt de base fortune', type: 'number' },
      { key: 'centimesAdditionnelsFortune', label: 'Centimes additionnels fortune', type: 'number' },
      { key: 'aideDomicileFortune', label: 'Aide à domicile fortune', type: 'number' },

      // Communal taxes
      { key: 'commune', label: 'Commune', type: 'string' },
      { key: 'partPrivilegieeRevenu', label: 'Part privilégiée revenu', type: 'number' },
      { key: 'centimesCommunauxRevenu', label: 'Centimes communaux revenu', type: 'number' },
      { key: 'partPrivilegieeFortune', label: 'Part privilégiée fortune', type: 'number' },
      { key: 'centimesCommunauxFortune', label: 'Centimes communaux fortune', type: 'number' },

      // Other taxes
      { key: 'taxePersonnelle', label: 'Taxe personnelle', type: 'number' },

      // Imputations
      { key: 'impotAnticipe', label: 'Impôt anticipé', type: 'number' },
      { key: 'retenueSupplementaire', label: 'Retenue supplémentaire', type: 'number' },
      { key: 'imputationEtrangers', label: 'Imputation étrangers', type: 'number' },

      // Totals
      { key: 'totalI', label: 'Total I (avant imputations)', type: 'number' },
      { key: 'totalII', label: 'Total II (après imputations)', type: 'number' },
      { key: 'frais', label: 'Frais', type: 'number' },
      { key: 'totalImpots', label: 'TOTAL DES IMPOTS', type: 'number' },
    ],
    prompt: `Analyse ce BORDEREAU D'IMPÔTS CANTONAUX ET COMMUNAUX (ICC) de Genève.

Ce document est l'avis de taxation FINAL émis par l'Administration fiscale cantonale.
Il montre les montants DÉFINITIFS après vérification par l'administration.

EXTRAIRE:
1. IDENTIFIANTS: N° contribuable, N° référence, date notification, période
2. MONTANTS IMPOSABLES: Revenu et fortune imposables (peuvent différer de la déclaration)
3. IMPÔTS CANTONAUX:
   - Impôt de base sur le revenu
   - Centimes additionnels sur le revenu
   - Réduction de 12%
   - Aide à domicile sur le revenu
   - Impôt de base sur la fortune
   - Centimes additionnels sur la fortune
   - Aide à domicile sur la fortune
4. IMPÔTS COMMUNAUX:
   - Commune de taxation
   - Part privilégiée (revenu et fortune)
   - Centimes additionnels communaux
5. AUTRES: Taxe personnelle, frais
6. IMPUTATIONS: Impôt anticipé, retenues, imputation étrangers
7. TOTAUX: Total I, Total II, Total des impôts

IMPORTANT: Ce bordereau permet de COMPARER le revenu/fortune déclaré vs final.
Cela aide à identifier les ajustements faits par l'administration.`
  },

  'bordereau-ifd': {
    name: 'Bordereau IFD (fédéral)',
    description: 'Tax assessment notice for federal direct tax',
    fields: [
      { key: 'taxYear', label: 'Année fiscale', type: 'number' },
      { key: 'numeroContribuable', label: 'N° contribuable', type: 'string' },
      { key: 'referenceNumber', label: 'N° référence', type: 'string' },
      { key: 'notificationDate', label: 'Date de notification', type: 'string' },
      { key: 'periodeDebut', label: 'Période début', type: 'string' },
      { key: 'periodeFin', label: 'Période fin', type: 'string' },

      // Assessed amounts
      { key: 'revenuImposable', label: 'Revenu imposable', type: 'number' },
      { key: 'tauxRevenu', label: 'Taux revenu', type: 'number' },
      { key: 'bareme', label: 'Barème appliqué', type: 'string' },

      // Federal tax
      { key: 'impotBaseRevenu', label: 'Impôt de base sur le revenu', type: 'number' },
      { key: 'totalImpots', label: 'TOTAL DES IMPOTS', type: 'number' },

      // Provisional comparison
      { key: 'dernierBordereauProvisoire', label: 'Dernier bordereau provisoire', type: 'number' },
      { key: 'dateProvisoire', label: 'Date bordereau provisoire', type: 'string' },
      { key: 'degrevement', label: 'Dégrèvement (différence)', type: 'number' },

      // Payment
      { key: 'delaiPaiement', label: 'Délai de paiement', type: 'string' },
    ],
    prompt: `Analyse ce BORDEREAU D'IMPÔT FÉDÉRAL DIRECT (IFD) de Genève.

Ce document est l'avis de taxation FINAL pour l'impôt fédéral.
Il est plus simple que le bordereau ICC car il n'y a pas d'impôt sur la fortune au niveau fédéral.

EXTRAIRE:
1. IDENTIFIANTS: N° contribuable, N° référence, date notification, période
2. REVENU IMPOSABLE: Montant et taux
3. BARÈME: Article de loi appliqué (ex: art. 36, alinéa 1 LIFD)
4. IMPÔT: Impôt de base sur le revenu
5. TOTAL DES IMPÔTS
6. COMPARAISON PROVISOIRE (si présent):
   - Dernier bordereau provisoire notifié (montant et date)
   - Dégrèvement (différence positive = remboursement)
7. DÉLAI DE PAIEMENT

NOTE: L'IFD est généralement ~15-20% du total des impôts.
Le dégrèvement indique si l'acompte provisoire était trop élevé.`
  },
};

// Convert PDF to images
const MAX_PDF_PAGES = 15; // Maximum pages to process (increased for full declarations)

async function convertPdfToImages(filePath) {
  try {
    const images = [];
    const document = await pdf(filePath, { scale: 2 }); // scale 2 for better quality

    let pageNum = 0;
    for await (const image of document) {
      pageNum++;
      // image is a Buffer containing PNG data
      images.push({
        data: image.toString('base64'),
        mediaType: 'image/png',
        page: pageNum
      });
      // Limit pages to avoid excessive API costs
      if (pageNum >= MAX_PDF_PAGES) break;
    }

    if (images.length === 0) {
      throw new Error('Le PDF ne contient aucune page lisible');
    }

    return images;
  } catch (error) {
    // Re-throw with more context
    throw new Error(`Erreur lors de la conversion du PDF: ${error.message}`);
  }
}

// Extract data from document using Claude Vision
export async function extractFromDocument(filePath, documentType) {
  const docConfig = DOCUMENT_TYPES[documentType];
  if (!docConfig) {
    throw new Error(`Type de document inconnu: ${documentType}`);
  }

  const ext = path.extname(filePath).toLowerCase();
  let imageContents = [];

  // Handle PDF conversion
  if (ext === '.pdf') {
    const pdfImages = await convertPdfToImages(filePath);
    imageContents = pdfImages.map(img => ({
      type: 'image',
      source: {
        type: 'base64',
        media_type: img.mediaType,
        data: img.data,
      }
    }));
  } else {
    // Read image file directly
    const fileBuffer = readFileSync(filePath);
    const base64Data = fileBuffer.toString('base64');

    let mediaType = 'image/jpeg';
    if (ext === '.png') mediaType = 'image/png';
    else if (ext === '.gif') mediaType = 'image/gif';
    else if (ext === '.webp') mediaType = 'image/webp';

    imageContents = [{
      type: 'image',
      source: {
        type: 'base64',
        media_type: mediaType,
        data: base64Data,
      }
    }];
  }

  const systemPrompt = `Tu es un expert en extraction de données fiscales suisses.
Tu analyses des documents fiscaux et extrait les informations demandées avec précision.

RÈGLES IMPORTANTES:
1. Retourne UNIQUEMENT un objet JSON valide
2. Les montants doivent être des nombres (pas de chaînes)
3. Supprime les apostrophes et espaces des nombres (ex: 120'000 → 120000)
4. Si une information n'est pas trouvée, utilise null
5. Pour les booléens, retourne true ou false
6. Sois précis et vérifie les champs standards des documents suisses
7. IMPORTANT: Cherche aussi les notes, remarques, informations supplémentaires ou cas particuliers qui pourraient être utiles pour la déclaration fiscale
8. Signale toute information inhabituelle ou importante (ex: revenus exceptionnels, changements de situation, etc.)`;

  // Additional fields to always extract
  const additionalFields = [
    { key: 'notes', label: 'Notes ou remarques importantes', type: 'string' },
    { key: 'warnings', label: 'Avertissements ou points d\'attention', type: 'string' },
    { key: 'additionalAmounts', label: 'Autres montants trouvés (JSON)', type: 'string' },
    { key: 'period', label: 'Période concernée', type: 'string' },
    { key: 'documentDate', label: 'Date du document', type: 'string' },
  ];

  const allFields = [...docConfig.fields, ...additionalFields];

  const userPrompt = `${docConfig.prompt}

EXTRACTION ADDITIONNELLE IMPORTANTE:
- Cherche toutes les notes, remarques ou commentaires dans le document
- Identifie les montants supplémentaires non listés ci-dessus
- Signale les points d'attention (cases cochées, mentions spéciales, etc.)
- Note la période et la date du document

Retourne les données extraites au format JSON avec ces clés:
${allFields.map(f => `- ${f.key}: ${f.label} (${f.type})`).join('\n')}

Format de réponse attendu (JSON uniquement):
{
  ${allFields.map(f => `"${f.key}": ${f.type === 'number' ? '12345' : f.type === 'boolean' ? 'true' : '"valeur ou null"'}`).join(',\n  ')}
}`;

  try {
    const client = getAnthropicClient();

    // Increase max_tokens for complex multi-page documents
    const isComplexDocument = docConfig.multiPage ||
      ['declaration-fiscale', 'bordereau-icc', 'bordereau-ifd'].includes(documentType);
    const maxTokens = isComplexDocument ? 4096 : 2048;

    const response = await client.messages.create({
      model: getConfiguredModel(),
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: [
            ...imageContents,
            {
              type: 'text',
              text: userPrompt,
            },
          ],
        },
      ],
    });

    // Parse the JSON response
    const responseText = response.content[0].text;

    // Extract JSON from response (handle markdown code blocks)
    let jsonStr = responseText;
    const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim();
    }

    const extractedData = JSON.parse(jsonStr);

    return {
      success: true,
      documentType,
      documentName: docConfig.name,
      fields: docConfig.fields,
      additionalFields: additionalFields,
      data: extractedData,
      usage: response.usage,
    };
  } catch (error) {
    return {
      success: false,
      documentType,
      documentName: docConfig.name,
      error: error.message,
    };
  }
}

// Get list of supported document types
export function getDocumentTypes() {
  return Object.entries(DOCUMENT_TYPES).map(([id, config]) => ({
    id,
    name: config.name,
    description: config.description,
    fields: config.fields,
  }));
}

// Auto-detect document type using Claude Vision
export async function detectDocumentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  let imageContents = [];

  // Handle PDF conversion
  if (ext === '.pdf') {
    const pdfImages = await convertPdfToImages(filePath);
    // Only use first page for detection
    if (pdfImages.length > 0) {
      imageContents = [{
        type: 'image',
        source: {
          type: 'base64',
          media_type: pdfImages[0].mediaType,
          data: pdfImages[0].data,
        }
      }];
    }
  } else {
    // Read image file directly
    const fileBuffer = readFileSync(filePath);
    const base64Data = fileBuffer.toString('base64');

    let mediaType = 'image/jpeg';
    if (ext === '.png') mediaType = 'image/png';
    else if (ext === '.gif') mediaType = 'image/gif';
    else if (ext === '.webp') mediaType = 'image/webp';

    imageContents = [{
      type: 'image',
      source: {
        type: 'base64',
        media_type: mediaType,
        data: base64Data,
      }
    }];
  }

  const documentTypesList = Object.entries(DOCUMENT_TYPES).map(([id, config]) => ({
    id,
    name: config.name,
    description: config.description
  }));

  const systemPrompt = `Tu es un expert en classification de documents fiscaux suisses.
Tu dois identifier le type de document parmi les types suivants:

${documentTypesList.map(t => `- ${t.id}: ${t.name} (${t.description})`).join('\n')}

RÈGLES:
1. Retourne UNIQUEMENT un objet JSON valide
2. Identifie le type de document le plus probable
3. Donne un niveau de confiance entre 0 et 1
4. Si tu n'es pas sûr, retourne le type le plus probable avec une confiance basse`;

  const userPrompt = `Analyse ce document et identifie son type.

Retourne un JSON avec ce format:
{
  "detectedType": "id-du-type",
  "confidence": 0.95,
  "reasoning": "Explication courte"
}`;

  try {
    const client = getAnthropicClient();
    const response = await client.messages.create({
      model: getConfiguredModel(),
      max_tokens: 512,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: [
            ...imageContents,
            { type: 'text', text: userPrompt }
          ],
        },
      ],
    });

    const responseText = response.content[0].text;
    let jsonStr = responseText;
    const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim();
    }

    const result = JSON.parse(jsonStr);
    const docConfig = DOCUMENT_TYPES[result.detectedType];

    return {
      success: true,
      detectedType: result.detectedType,
      detectedTypeName: docConfig?.name || result.detectedType,
      confidence: result.confidence,
      reasoning: result.reasoning,
      filePath
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

export { DOCUMENT_TYPES };
