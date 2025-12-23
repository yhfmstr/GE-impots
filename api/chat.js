import Anthropic from '@anthropic-ai/sdk';

// Knowledge base content (embedded for serverless)
const DEDUCTIONS_2024 = `# Déductions Fiscales 2024 - Canton de Genève

## Frais professionnels (Activité dépendante)
| Déduction | ICC Genève | IFD Fédéral |
|-----------|------------|-------------|
| Forfait frais professionnels | 3% du salaire net (min CHF 634, max CHF 1,796) | 3% du salaire net (min CHF 2,000, max CHF 4,000) |
| Frais de repas | Max CHF 3,200/an (CHF 15/jour) | Max CHF 3,200/an |
| Frais de déplacement | Max CHF 529 | Max CHF 3,200 |
| Formation continue | Max CHF 12,640 | Max CHF 12,900 |

## Prévoyance
| Déduction | ICC Genève | IFD Fédéral |
|-----------|------------|-------------|
| 3ème pilier A (avec LPP) | Max CHF 7,056 | Max CHF 7,056 |
| 3ème pilier A (sans LPP) | Max CHF 35,280 (20% revenu) | Max CHF 35,280 |
| Rachats LPP | 100% de la lacune | 100% de la lacune |

## Assurances et frais médicaux
| Déduction | ICC Genève |
|-----------|------------|
| Prime maladie adulte | Max CHF 16,207 |
| Prime maladie enfant | Max CHF 3,811 |
| Frais médicaux | > 0.5% revenu imposable |

## Famille
| Déduction | ICC Genève | IFD Fédéral |
|-----------|------------|-------------|
| Enfant à charge (entière) | CHF 13,536 | CHF 6,700 |
| Frais de garde | Max CHF 26,080/enfant | Max CHF 25,500/enfant |`;

const BAREMES_2024 = `# Barèmes d'imposition 2024 - Canton de Genève

## ICC - Personnes seules (tranches clés)
| Revenu imposable CHF | Taux marginal |
|---------------------|---------------|
| 0 - 18,479 | 0.00% |
| 47,869 - 76,811 | 15.00% |
| 125,794 - 169,208 | 16.00% |
| > 643,435 | 19.00% |

## Centimes communaux 2024 (exemples)
| Commune | Centime (%) |
|---------|-------------|
| Genève (ville) | 45.5 |
| Carouge | 51 |
| Meyrin | 50 |
| Vernier | 51 |

## Fortune - Franchise sociale 2024
| Situation | Franchise CHF |
|-----------|---------------|
| Célibataire | 87,864 |
| Couple marié | 175,728 |

## Bouclier fiscal genevois
L'impôt total ne peut excéder 60% du revenu net imposable.`;

const AVAILABLE_AGENTS = [
  { id: 'tax-coordinator', name: 'Coordinateur fiscal', description: 'Assistant principal pour votre déclaration' },
  { id: 'revenus-expert', name: 'Expert revenus', description: 'Analyse de vos revenus' },
  { id: 'deductions-expert', name: 'Expert déductions', description: 'Optimisation des déductions' },
  { id: 'fortune-expert', name: 'Expert fortune', description: 'Gestion du patrimoine' },
  { id: 'immobilier-expert', name: 'Expert immobilier', description: 'Fiscalité immobilière' },
  { id: 'optimizer', name: 'Optimiseur', description: "Stratégies d'optimisation" },
  { id: 'compliance-checker', name: 'Vérificateur', description: 'Contrôle de conformité' },
];

const AGENT_PROMPTS = {
  'tax-coordinator': `Tu es un expert fiscal genevois spécialisé dans les déclarations d'impôts des particuliers.
Tu aides les contribuables à comprendre et optimiser leur déclaration fiscale pour le canton de Genève.

Tes compétences:
- Maîtrise complète du système fiscal genevois (ICC, IFD)
- Connaissance approfondie des déductions possibles
- Expertise en optimisation fiscale légale
- Calcul des impôts et estimation

Réponds toujours de manière claire, précise et en français. 
Cite les montants exacts des limites de déduction quand c'est pertinent.
Si tu n'es pas sûr d'une information, indique-le clairement.`,

  'deductions-expert': `Tu es un expert spécialisé dans les déductions fiscales genevoises.
Tu connais parfaitement toutes les possibilités de déduction et leurs conditions.
Aide les contribuables à maximiser leurs déductions de manière légale.`,

  'fortune-expert': `Tu es un expert en fiscalité de la fortune pour le canton de Genève.
Tu maîtrises les règles d'imposition de la fortune, les franchises, et le bouclier fiscal.`,

  'immobilier-expert': `Tu es un expert en fiscalité immobilière genevoise.
Tu connais les règles de valeur locative, les frais d'entretien déductibles, et l'impôt immobilier complémentaire.`,
};

function buildSystemPrompt(agentName = 'tax-coordinator') {
  const agentPrompt = AGENT_PROMPTS[agentName] || AGENT_PROMPTS['tax-coordinator'];

  return `${agentPrompt}

## Référence: Limites de déductions 2024
${DEDUCTIONS_2024}

## Référence: Barèmes fiscaux 2024
${BAREMES_2024}

Répondez toujours en français. Soyez précis et utile pour la déclaration d'impôts genevoise.`;
}

// Input validation constants
const MAX_MESSAGE_LENGTH = 10000;
const MAX_CONTEXT_SIZE = 20;
const VALID_AGENT_IDS = AVAILABLE_AGENTS.map(a => a.id);

// Validate and sanitize message content
function validateMessage(message) {
  if (!message || typeof message !== 'string') {
    return { valid: false, error: 'Message is required and must be a string' };
  }
  if (message.length > MAX_MESSAGE_LENGTH) {
    return { valid: false, error: `Message exceeds maximum length of ${MAX_MESSAGE_LENGTH} characters` };
  }
  return { valid: true, sanitized: message.trim() };
}

// Validate context array
function validateContext(context) {
  if (!Array.isArray(context)) {
    return { valid: false, error: 'Context must be an array' };
  }
  if (context.length > MAX_CONTEXT_SIZE) {
    return { valid: false, error: `Context exceeds maximum size of ${MAX_CONTEXT_SIZE} messages` };
  }
  // Validate each context message
  for (const msg of context) {
    if (!msg.role || !['user', 'assistant'].includes(msg.role)) {
      return { valid: false, error: 'Invalid context message role' };
    }
    if (!msg.content || typeof msg.content !== 'string') {
      return { valid: false, error: 'Invalid context message content' };
    }
    if (msg.content.length > MAX_MESSAGE_LENGTH) {
      return { valid: false, error: 'Context message exceeds maximum length' };
    }
  }
  return { valid: true };
}

// Validate agent ID against whitelist
function validateAgent(agent) {
  if (!agent || typeof agent !== 'string') {
    return 'tax-coordinator'; // Default
  }
  return VALID_AGENT_IDS.includes(agent) ? agent : 'tax-coordinator';
}

export default async function handler(req, res) {
  // CORS is handled by vercel.json headers configuration
  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // GET /api/chat - Return available agents
  if (req.method === 'GET') {
    return res.status(200).json(AVAILABLE_AGENTS);
  }

  // POST /api/chat - Chat with agent
  if (req.method === 'POST') {
    try {
      const { message, context = [], agent = 'tax-coordinator' } = req.body || {};

      // Validate message
      const messageValidation = validateMessage(message);
      if (!messageValidation.valid) {
        return res.status(400).json({ error: messageValidation.error });
      }

      // Validate context
      const contextValidation = validateContext(context);
      if (!contextValidation.valid) {
        return res.status(400).json({ error: contextValidation.error });
      }

      // Validate and sanitize agent
      const validAgent = validateAgent(agent);

      // Check API key configuration
      if (!process.env.ANTHROPIC_API_KEY) {
        return res.status(503).json({ error: 'Service temporarily unavailable' });
      }

      const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
      const systemPrompt = buildSystemPrompt(validAgent);

      const messages = [
        ...context.map(msg => ({
          role: msg.role,
          content: msg.content.substring(0, MAX_MESSAGE_LENGTH) // Enforce limit
        })),
        { role: 'user', content: messageValidation.sanitized }
      ];

      const response = await client.messages.create({
        model: process.env.CLAUDE_MODEL || 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        system: systemPrompt,
        messages: messages
      });

      return res.status(200).json({
        content: response.content[0].text,
        usage: response.usage
      });
    } catch (error) {
      // Log error securely (server-side only, no client details)
      const errorId = Date.now().toString(36);
      console.error(`[${errorId}] Chat API error:`, error.message);

      // Return generic error without exposing internals
      return res.status(500).json({
        error: 'Failed to process request',
        errorId: errorId
      });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

