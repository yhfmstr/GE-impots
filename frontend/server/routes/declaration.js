import { Router } from 'express';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = Router();

const SKILLS_PATH = join(__dirname, '../../../.claude/plugins/ge-impots-expert/skills');

// In-memory storage for declaration data (in production, use a database)
let declarationData = {
  year: 2024,
  personalInfo: {},
  income: {},
  deductions: {},
  wealth: {},
  realEstate: {},
  currentSection: 0
};

// Get questionnaire structure
router.get('/questionnaire', (req, res) => {
  const questionnairePath = join(SKILLS_PATH, 'questionnaire.md');

  if (!existsSync(questionnairePath)) {
    return res.status(404).json({ error: 'Questionnaire not found' });
  }

  // Parse questionnaire into sections
  const sections = [
    { id: 0, title: 'Informations personnelles', description: 'État civil, enfants, résidence' },
    { id: 1, title: 'Revenus professionnels', description: 'Salaires, activité indépendante' },
    { id: 2, title: 'Prestations et rentes', description: 'Chômage, AVS, AI, pensions' },
    { id: 3, title: 'Prévoyance', description: '3ème pilier, rachats LPP' },
    { id: 4, title: 'Frais professionnels', description: 'Forfait ou frais effectifs' },
    { id: 5, title: 'Autres déductions', description: 'Assurances, frais médicaux, dons' },
    { id: 6, title: 'Fortune', description: 'Comptes, titres, véhicules' },
    { id: 7, title: 'Immobilier', description: 'Propriétés, hypothèques' },
    { id: 8, title: 'Dettes', description: 'Crédits, leasings' }
  ];

  res.json({
    year: declarationData.year,
    sections,
    currentSection: declarationData.currentSection,
    data: declarationData
  });
});

// Save section data
router.post('/questionnaire/:sectionId', (req, res) => {
  const sectionId = parseInt(req.params.sectionId);
  const { data } = req.body;

  // Map section to data category
  const sectionMap = {
    0: 'personalInfo',
    1: 'income',
    2: 'income',
    3: 'deductions',
    4: 'deductions',
    5: 'deductions',
    6: 'wealth',
    7: 'realEstate',
    8: 'wealth'
  };

  const category = sectionMap[sectionId] || 'other';
  declarationData[category] = { ...declarationData[category], ...data };
  declarationData.currentSection = Math.max(declarationData.currentSection, sectionId + 1);

  res.json({
    success: true,
    nextSection: sectionId + 1,
    data: declarationData
  });
});

// Get current declaration data
router.get('/data', (req, res) => {
  res.json(declarationData);
});

// Reset declaration
router.post('/reset', (req, res) => {
  declarationData = {
    year: 2024,
    personalInfo: {},
    income: {},
    deductions: {},
    wealth: {},
    realEstate: {},
    currentSection: 0
  };
  res.json({ success: true });
});

// Get deduction limits for reference
router.get('/limits', (req, res) => {
  res.json({
    pilier3a: {
      withLPP: 7056,
      withoutLPP: 35280
    },
    pilier3b: {
      single: 2324,
      married: 4648
    },
    professionalFees: {
      forfaitMin: 634,
      forfaitMax: 1796,
      forfaitRate: 0.03
    },
    meals: 3200,
    childcare: 26080,
    training: 12640,
    healthInsurance: {
      adult: 16207,
      child: 5402
    },
    donations: {
      minPercent: 0.01,
      maxPercent: 0.20
    }
  });
});

export default router;
