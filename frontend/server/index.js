import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import Anthropic from '@anthropic-ai/sdk';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize Claude client
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
console.log('API Key loaded:', !!process.env.ANTHROPIC_API_KEY);

// Knowledge paths
const AGENTS_PATH = join(__dirname, '../../.claude/plugins/ge-impots-expert/agents');
const KNOWLEDGE_PATH = join(__dirname, '../../2024/knowledge');

function loadFile(path) {
  return existsSync(path) ? readFileSync(path, 'utf-8') : '';
}

const app = express();
app.use(cors());
app.use(express.json());

// Chat endpoint
app.post('/api/chat', async (req, res) => {
  console.log('=== Chat request received ===');
  const { message, context = [], agent = 'tax-coordinator' } = req.body;
  console.log(`Message: "${message}", Agent: ${agent}`);

  try {
    const agentPath = join(AGENTS_PATH, `${agent}.md`);
    const deductionsPath = join(KNOWLEDGE_PATH, 'deductions-2024.md');
    const getaxFieldsPath = join(KNOWLEDGE_PATH, 'getax-fields.md');
    console.log('Agent path exists:', existsSync(agentPath));

    const agentPrompt = loadFile(agentPath);
    const deductions = loadFile(deductionsPath);

    // Load extra knowledge for getax-guide agent
    let extraKnowledge = '';
    if (agent === 'getax-guide') {
      const getaxFields = loadFile(getaxFieldsPath);
      extraKnowledge = `\n\n## Référence des Rubriques GeTax\n${getaxFields}`;
    }

    const systemPrompt = `${agentPrompt}\n\n## Limites de déductions 2024\n${deductions}${extraKnowledge}\n\nRépondez en français.`;
    console.log('System prompt length:', systemPrompt.length);

    const messages = [
      ...context.map(m => ({ role: m.role, content: m.content })),
      { role: 'user', content: message }
    ];
    console.log('Calling Claude API...');

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: systemPrompt,
      messages
    });

    console.log('Response OK');
    res.json({ content: response.content[0].text, usage: response.usage });
  } catch (error) {
    console.error('=== ERROR ===');
    console.error('Message:', error.message);
    console.error('Stack:', error.stack);
    res.status(500).json({ error: error.message });
  }
});

// Other routes
app.get('/api/chat/agents', (req, res) => {
  res.json([
    { id: 'tax-coordinator', name: 'Coordinateur fiscal (général)' },
    { id: 'getax-guide', name: '📋 Guide GeTax pas à pas' },
    { id: 'revenus-expert', name: 'Expert revenus' },
    { id: 'deductions-expert', name: 'Expert déductions' },
    { id: 'fortune-expert', name: 'Expert fortune' },
    { id: 'immobilier-expert', name: 'Expert immobilier' },
    { id: 'optimizer', name: 'Optimiseur fiscal' },
    { id: 'compliance-checker', name: 'Vérificateur conformité' },
  ]);
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/declaration/data', (req, res) => {
  // Demo data to show tax calculation
  res.json({
    year: 2024,
    income: {
      grossSalary: 120000,
      avsContributions: 6300,
      lppContributions: 8500
    },
    deductions: {
      pilier3a: 7056,
      healthInsurance: 6000
    },
    wealth: {
      bankAccounts: 45000,
      securities: 25000,
      vehicleValue: 15000,
      personalLoans: 5000,
      otherDebts: 0
    }
  });
});

app.post('/api/declaration/questionnaire/:id', (req, res) => {
  res.json({ success: true, nextSection: parseInt(req.params.id) + 1 });
});

// Start server
const PORT = 3002;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
