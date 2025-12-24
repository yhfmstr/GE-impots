import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { getClient, getModel } from './anthropicClient.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load agent prompts from plugin
const AGENTS_PATH = join(__dirname, '../../../.claude/plugins/ge-impots-expert/agents');
const KNOWLEDGE_PATH = join(__dirname, '../../../2024/knowledge');

function loadAgentPrompt(agentName) {
  const filePath = join(AGENTS_PATH, `${agentName}.md`);
  if (existsSync(filePath)) {
    return readFileSync(filePath, 'utf-8');
  }
  return null;
}

function loadKnowledge(fileName) {
  const filePath = join(KNOWLEDGE_PATH, fileName);
  if (existsSync(filePath)) {
    return readFileSync(filePath, 'utf-8');
  }
  return null;
}

// Build system prompt with knowledge base
function buildSystemPrompt(agentName = 'tax-coordinator') {
  const agentPrompt = loadAgentPrompt(agentName) || '';
  const deductions = loadKnowledge('deductions-2024.md') || '';
  const baremes = loadKnowledge('baremes-2024.md') || '';

  return `${agentPrompt}

## Référence: Limites de déductions 2024
${deductions}

## Référence: Barèmes fiscaux 2024
${baremes}

Répondez toujours en français. Soyez précis et utile pour la déclaration d'impôts genevoise.`;
}

export async function chat(message, context = [], agentName = 'tax-coordinator') {
  const systemPrompt = buildSystemPrompt(agentName);

  const messages = [
    ...context.map(msg => ({
      role: msg.role,
      content: msg.content
    })),
    { role: 'user', content: message }
  ];

  try {
    const response = await getClient().messages.create({
      model: getModel(),
      max_tokens: 4096,
      system: systemPrompt,
      messages: messages
    });

    return {
      content: response.content[0].text,
      usage: response.usage
    };
  } catch (error) {
    throw error;
  }
}

export async function extractDocument(documentContent, documentType) {
  const extractorPrompt = loadAgentPrompt('pdf-extractor') || '';

  const systemPrompt = `${extractorPrompt}

Extrayez les informations structurées de ce document de type: ${documentType}`;

  try {
    const response = await getClient().messages.create({
      model: getModel(),
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: 'user', content: documentContent }]
    });

    return {
      content: response.content[0].text,
      usage: response.usage
    };
  } catch (error) {
    throw error;
  }
}

export const AVAILABLE_AGENTS = [
  { id: 'tax-coordinator', name: 'Coordinateur fiscal', description: 'Assistant principal pour votre déclaration' },
  { id: 'revenus-expert', name: 'Expert revenus', description: 'Analyse de vos revenus' },
  { id: 'deductions-expert', name: 'Expert déductions', description: 'Optimisation des déductions' },
  { id: 'fortune-expert', name: 'Expert fortune', description: 'Gestion du patrimoine' },
  { id: 'immobilier-expert', name: 'Expert immobilier', description: 'Fiscalité immobilière' },
  { id: 'optimizer', name: 'Optimiseur', description: 'Stratégies d\'optimisation' },
  { id: 'compliance-checker', name: 'Vérificateur', description: 'Contrôle de conformité' },
];
