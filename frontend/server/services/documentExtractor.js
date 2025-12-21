import Anthropic from '@anthropic-ai/sdk';
import { readFileSync, writeFileSync, unlinkSync } from 'fs';
import path from 'path';
import { pdf } from 'pdf-to-img';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

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
};

// Convert PDF to images
async function convertPdfToImages(filePath) {
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
    // Only process first 3 pages to avoid token limits
    if (pageNum >= 3) break;
  }

  return images;
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
    console.log('Converting PDF to images...');
    const pdfImages = await convertPdfToImages(filePath);
    imageContents = pdfImages.map(img => ({
      type: 'image',
      source: {
        type: 'base64',
        media_type: img.mediaType,
        data: img.data,
      }
    }));
    console.log(`Converted ${pdfImages.length} page(s)`);
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
6. Sois précis et vérifie les champs standards des documents suisses`;

  const userPrompt = `${docConfig.prompt}

Retourne les données extraites au format JSON avec ces clés:
${docConfig.fields.map(f => `- ${f.key}: ${f.label} (${f.type})`).join('\n')}

Format de réponse attendu (JSON uniquement):
{
  ${docConfig.fields.map(f => `"${f.key}": ${f.type === 'number' ? '12345' : f.type === 'boolean' ? 'true' : '"valeur"'}`).join(',\n  ')}
}`;

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
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
      data: extractedData,
      usage: response.usage,
    };
  } catch (error) {
    console.error('Extraction error:', error);
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

export { DOCUMENT_TYPES };
