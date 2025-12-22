import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { readFileSync, existsSync, readdirSync, statSync, unlinkSync } from 'fs';
import { join, dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

// Middleware imports
import { apiLimiter, chatLimiter, extractionLimiter } from './middleware/rateLimiter.js';
import { validateBody, chatSchema, documentExtractSchema, documentAutoDetectSchema } from './middleware/validation.js';
import { upload, validateUploadedFile, uploadDir } from './middleware/upload.js';
import { extractFromDocument, getDocumentTypes, detectDocumentType } from './services/documentExtractor.js';
import { getClient } from './services/anthropicClient.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Get shared Claude client
const client = getClient();

// Simple logger for production
const log = {
  info: (context, message) => {
    console.log(`[${new Date().toISOString()}] [INFO] ${context}: ${message}`);
  },
  error: (context, error) => {
    console.error(`[${new Date().toISOString()}] [ERROR] ${context}:`, {
      message: error.message,
      stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined
    });
  },
  warn: (context, message) => {
    console.warn(`[${new Date().toISOString()}] [WARN] ${context}: ${message}`);
  }
};

// File cleanup job - removes files older than 1 hour
const FILE_MAX_AGE_MS = 60 * 60 * 1000; // 1 hour in milliseconds
const CLEANUP_INTERVAL_MS = 15 * 60 * 1000; // Run every 15 minutes

function cleanupOldFiles() {
  try {
    const uploadPath = join(__dirname, '../../2024/user-uploads');
    if (!existsSync(uploadPath)) return;

    const now = Date.now();
    const files = readdirSync(uploadPath);
    let deletedCount = 0;

    for (const file of files) {
      // Skip hidden files and directories
      if (file.startsWith('.')) continue;

      const filePath = join(uploadPath, file);
      try {
        const stats = statSync(filePath);
        if (stats.isFile() && (now - stats.mtimeMs) > FILE_MAX_AGE_MS) {
          unlinkSync(filePath);
          deletedCount++;
        }
      } catch (err) {
        log.warn('Cleanup', `Could not process file ${file}: ${err.message}`);
      }
    }

    if (deletedCount > 0) {
      log.info('Cleanup', `Removed ${deletedCount} old file(s) from uploads`);
    }
  } catch (error) {
    log.error('Cleanup', error);
  }
}

// Start cleanup job
setInterval(cleanupOldFiles, CLEANUP_INTERVAL_MS);
// Run once at startup after a short delay
setTimeout(cleanupOldFiles, 5000);

// Knowledge paths
const AGENTS_PATH = join(__dirname, '../../.claude/plugins/ge-impots-expert/agents');
const KNOWLEDGE_PATH = join(__dirname, '../../2024/knowledge');

function loadFile(path) {
  return existsSync(path) ? readFileSync(path, 'utf-8') : '';
}

const app = express();

// CORS configuration - restrict to specific origins
const frontendUrls = (process.env.FRONTEND_URL || 'http://localhost:5173').split(',').map(u => u.trim());
const allowedOrigins = [
  ...frontendUrls,
  'http://localhost:5173',
  'http://localhost:3000'
];

// Security headers with helmet
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "blob:"],
      connectSrc: ["'self'", "https://api.anthropic.com"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false, // Allow embedding for development
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  }
}));

app.use(cors({
  origin: (origin, callback) => {
    // In production, always require origin
    if (!origin) {
      if (process.env.NODE_ENV === 'production') {
        return callback(new Error('Origin header required'));
      }
      // In development, only allow localhost without origin (e.g., curl for testing)
      log.warn('CORS', 'Request without origin header in development');
      return callback(null, true);
    }
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '1mb' })); // Limit JSON body size

// Apply general rate limiter to all API routes
app.use('/api/', apiLimiter);

// Health check endpoint (no rate limit)
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Load all knowledge files for the unified assistant
function loadAllKnowledge() {
  const knowledgeFiles = [
    'deductions-2024.md',
    'baremes-2024.md',
    'immobilier.md',
    'fortune.md',
    'prevoyance.md',
    'frais-professionnels.md',
    'getax-fields.md',
    'taxation-codes.md'
  ];

  let knowledge = '';
  for (const file of knowledgeFiles) {
    const content = loadFile(join(KNOWLEDGE_PATH, file));
    if (content) {
      const title = file.replace('.md', '').replace(/-/g, ' ').toUpperCase();
      knowledge += `\n\n## ${title}\n${content}`;
    }
  }
  return knowledge;
}

// Pre-load knowledge at startup for better performance
const unifiedAgentPrompt = loadFile(join(AGENTS_PATH, 'unified-assistant.md'));
const allKnowledge = loadAllKnowledge();

// Chat endpoint with validation and stricter rate limiting
app.post('/api/chat', chatLimiter, validateBody(chatSchema), async (req, res) => {
  const { message, context } = req.body;

  try {
    // Always use the unified assistant with all knowledge
    const systemPrompt = `${unifiedAgentPrompt}\n\n# BASE DE CONNAISSANCES FISCALES 2024\n${allKnowledge}`;

    const messages = [
      ...context.map(m => ({ role: m.role, content: m.content })),
      { role: 'user', content: message }
    ];

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: systemPrompt,
      messages
    });

    res.json({ content: response.content[0].text, usage: response.usage });
  } catch (error) {
    log.error('Chat API', error);
    res.status(500).json({ error: 'Erreur lors de la communication avec l\'assistant.' });
  }
});

// List available agents
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

// Demo declaration data
app.get('/api/declaration/data', (req, res) => {
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

// Document types endpoint
app.get('/api/documents/types', (req, res) => {
  res.json(getDocumentTypes());
});

// Auto-detect document type endpoint (new feature)
app.post('/api/documents/detect',
  extractionLimiter,
  upload.single('document'),
  validateUploadedFile,
  async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: 'Aucun fichier fourni' });
    }

    try {
      const result = await detectDocumentType(req.file.path);
      res.json(result);
    } catch (error) {
      log.error('Document Detection', error);
      res.status(500).json({ error: 'Erreur lors de la détection du type de document.' });
    }
  }
);

// Document extraction with validation and rate limiting
app.post('/api/documents/extract',
  extractionLimiter,
  upload.single('document'),
  validateUploadedFile,
  validateBody(documentExtractSchema),
  async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: 'Aucun fichier fourni' });
    }

    const { documentType } = req.body;

    try {
      const result = await extractFromDocument(req.file.path, documentType);
      res.json(result);
    } catch (error) {
      log.error('Document Extraction', error);
      res.status(500).json({ error: 'Erreur lors de l\'extraction du document.' });
    }
  }
);

// Extract with auto-detection (combines detect + extract)
app.post('/api/documents/extract-auto',
  extractionLimiter,
  upload.single('document'),
  validateUploadedFile,
  async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: 'Aucun fichier fourni' });
    }

    try {
      // First detect the document type
      const detection = await detectDocumentType(req.file.path);

      if (!detection.success || !detection.detectedType) {
        return res.json({
          success: false,
          requiresConfirmation: true,
          suggestedTypes: getDocumentTypes(),
          error: 'Impossible de détecter automatiquement le type de document.'
        });
      }

      // Return detected type for user confirmation
      res.json({
        success: true,
        requiresConfirmation: true,
        detectedType: detection.detectedType,
        confidence: detection.confidence,
        filePath: req.file.path,
        fileName: req.file.originalname
      });
    } catch (error) {
      log.error('Document Auto-Detect', error);
      res.status(500).json({ error: 'Erreur lors de la détection du type de document.' });
    }
  }
);

// Confirm and extract after auto-detection
app.post('/api/documents/confirm-extract',
  extractionLimiter,
  validateBody(documentExtractSchema),
  async (req, res) => {
    const { documentType, filePath } = req.body;

    if (!filePath) {
      return res.status(400).json({ error: 'Chemin du fichier requis.' });
    }

    // SECURITY: Validate path is within upload directory to prevent path traversal
    const normalizedUploadDir = resolve(uploadDir);
    const normalizedFilePath = resolve(filePath);

    if (!normalizedFilePath.startsWith(normalizedUploadDir)) {
      log.warn('Security', `Path traversal attempt blocked: ${filePath}`);
      return res.status(400).json({ error: 'Chemin de fichier invalide.' });
    }

    if (!existsSync(normalizedFilePath)) {
      return res.status(400).json({ error: 'Fichier non trouvé. Veuillez télécharger à nouveau.' });
    }

    try {
      const result = await extractFromDocument(normalizedFilePath, documentType);
      res.json(result);
    } catch (error) {
      log.error('Document Confirm-Extract', error);
      res.status(500).json({ error: 'Erreur lors de l\'extraction du document.' });
    }
  }
);

// Get stored extractions (placeholder - data is stored client-side)
app.get('/api/documents/extractions', (req, res) => {
  res.json([]);
});

// Error handling middleware
app.use((err, req, res, next) => {
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({ error: 'Origin not allowed' });
  }
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'Fichier trop volumineux (max 10 MB)' });
  }
  if (err instanceof Error) {
    return res.status(400).json({ error: err.message });
  }
  res.status(500).json({ error: 'Erreur serveur interne' });
});

// Start server
const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  if (process.env.NODE_ENV !== 'production') {
    console.log(`Server running on http://localhost:${PORT}`);
  }
});
