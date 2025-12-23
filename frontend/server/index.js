/**
 * GE-impots API Server
 *
 * Express server providing:
 * - Tax assistant AI chat
 * - Document extraction with Claude Vision
 * - Security middleware (CORS, CSRF, rate limiting)
 * - Structured logging
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { readFileSync, existsSync, readdirSync, statSync, unlinkSync } from 'fs';
import { join, dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

// Configuration & logging
import { config, validateEnvironment } from './config/env.js';
import { createLogger, requestLogger, logError } from './config/logger.js';

// Middleware
import { apiLimiter, chatLimiter, extractionLimiter } from './middleware/rateLimiter.js';
import { validateBody, chatSchema, documentExtractSchema } from './middleware/validation.js';
import { upload, validateUploadedFile, uploadDir } from './middleware/upload.js';
import { csrfProtection, csrfTokenEndpoint } from './middleware/csrf.js';

// Services
import { extractFromDocument, getDocumentTypes, detectDocumentType } from './services/documentExtractor.js';
import { getClient, getModel } from './services/anthropicClient.js';

// Validate environment at startup
try {
  validateEnvironment();
} catch (error) {
  console.error('\n' + error.message + '\n');
  process.exit(1);
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create loggers
const log = createLogger('Server');
const chatLog = createLogger('Chat');
const docLog = createLogger('Documents');
const securityLog = createLogger('Security');

// Get shared Claude client
const client = getClient();

// Knowledge paths
const AGENTS_PATH = join(__dirname, '../../.claude/plugins/ge-impots-expert/agents');
const KNOWLEDGE_PATH = join(__dirname, '../../2024/knowledge');

function loadFile(path) {
  return existsSync(path) ? readFileSync(path, 'utf-8') : '';
}

// File cleanup job
function cleanupOldFiles() {
  try {
    const uploadPath = join(__dirname, '../../2024/user-uploads');
    if (!existsSync(uploadPath)) return;

    const now = Date.now();
    const files = readdirSync(uploadPath);
    let deletedCount = 0;

    for (const file of files) {
      if (file.startsWith('.')) continue;

      const filePath = join(uploadPath, file);
      try {
        const stats = statSync(filePath);
        if (stats.isFile() && (now - stats.mtimeMs) > config.fileMaxAgeMs) {
          unlinkSync(filePath);
          deletedCount++;
        }
      } catch (err) {
        log.warn({ file, error: err.message }, 'Could not process file during cleanup');
      }
    }

    if (deletedCount > 0) {
      log.info({ deletedCount }, 'Cleaned up old upload files');
    }
  } catch (error) {
    logError(error, 'Cleanup');
  }
}

// Start cleanup job
setInterval(cleanupOldFiles, config.fileCleanupIntervalMs);
setTimeout(cleanupOldFiles, 5000);

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

// Pre-load knowledge at startup
const unifiedAgentPrompt = loadFile(join(AGENTS_PATH, 'unified-assistant.md'));
const allKnowledge = loadAllKnowledge();

log.info('Knowledge base loaded successfully');

// Create Express app
const app = express();

// Trust proxy for production (Vercel, etc.)
if (config.isProduction) {
  app.set('trust proxy', 1);
}

// CORS configuration
const allowedOrigins = [
  ...config.frontendUrls,
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
      connectSrc: ["'self'", "https://api.anthropic.com", ...config.frontendUrls],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// CORS
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) {
      if (config.isProduction) {
        securityLog.warn('Request without origin header in production');
        return callback(new Error('Origin header required'));
      }
      return callback(null, true);
    }
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    securityLog.warn({ origin }, 'Blocked request from unauthorized origin');
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token']
}));

// Body parsing
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

// Request logging
app.use('/api/', requestLogger);

// Rate limiting
app.use('/api/', apiLimiter);

// CSRF protection for state-changing operations
app.use('/api/', csrfProtection);

// Health check endpoint (no rate limit, no CSRF)
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0'
  });
});

// CSRF token endpoint
app.get('/api/csrf-token', csrfTokenEndpoint);

// Chat endpoint
app.post('/api/chat', chatLimiter, validateBody(chatSchema), async (req, res) => {
  const { message, context } = req.body;

  try {
    const systemPrompt = `${unifiedAgentPrompt}\n\n# BASE DE CONNAISSANCES FISCALES 2024\n${allKnowledge}`;

    const messages = [
      ...context.map(m => ({ role: m.role, content: m.content })),
      { role: 'user', content: message }
    ];

    chatLog.info({ messageLength: message.length, contextLength: context.length }, 'Processing chat request');

    const response = await client.messages.create({
      model: getModel(),
      max_tokens: 4096,
      system: systemPrompt,
      messages
    });

    chatLog.info({ usage: response.usage }, 'Chat response generated');
    res.json({ content: response.content[0].text, usage: response.usage });
  } catch (error) {
    logError(error, 'Chat');
    res.status(500).json({ error: 'Erreur lors de la communication avec l\'assistant.' });
  }
});

// List available agents
app.get('/api/chat/agents', (req, res) => {
  res.json([
    { id: 'tax-coordinator', name: 'Coordinateur fiscal (général)' },
    { id: 'getax-guide', name: 'Guide GeTax pas à pas' },
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

// Auto-detect document type
app.post('/api/documents/detect',
  extractionLimiter,
  upload.single('document'),
  validateUploadedFile,
  async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: 'Aucun fichier fourni' });
    }

    try {
      docLog.info({ filename: req.file.originalname }, 'Detecting document type');
      const result = await detectDocumentType(req.file.path);
      docLog.info({ detectedType: result.detectedType, confidence: result.confidence }, 'Document type detected');
      res.json(result);
    } catch (error) {
      logError(error, 'Documents');
      res.status(500).json({ error: 'Erreur lors de la détection du type de document.' });
    }
  }
);

// Document extraction with validation
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
      docLog.info({ filename: req.file.originalname, documentType }, 'Extracting document data');
      const result = await extractFromDocument(req.file.path, documentType);
      docLog.info({ success: result.success, fields: Object.keys(result.data || {}).length }, 'Extraction complete');
      res.json(result);
    } catch (error) {
      logError(error, 'Documents');
      res.status(500).json({ error: 'Erreur lors de l\'extraction du document.' });
    }
  }
);

// Extract with auto-detection
app.post('/api/documents/extract-auto',
  extractionLimiter,
  upload.single('document'),
  validateUploadedFile,
  async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: 'Aucun fichier fourni' });
    }

    try {
      docLog.info({ filename: req.file.originalname }, 'Auto-detecting document type');
      const detection = await detectDocumentType(req.file.path);

      if (!detection.success || !detection.detectedType) {
        return res.json({
          success: false,
          requiresConfirmation: true,
          suggestedTypes: getDocumentTypes(),
          error: 'Impossible de détecter automatiquement le type de document.'
        });
      }

      res.json({
        success: true,
        requiresConfirmation: true,
        detectedType: detection.detectedType,
        confidence: detection.confidence,
        filePath: req.file.path,
        fileName: req.file.originalname
      });
    } catch (error) {
      logError(error, 'Documents');
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

    // Security: Validate path is within upload directory
    const normalizedUploadDir = resolve(uploadDir);
    const normalizedFilePath = resolve(filePath);

    if (!normalizedFilePath.startsWith(normalizedUploadDir)) {
      securityLog.warn({ attemptedPath: filePath }, 'Path traversal attempt blocked');
      return res.status(400).json({ error: 'Chemin de fichier invalide.' });
    }

    if (!existsSync(normalizedFilePath)) {
      return res.status(400).json({ error: 'Fichier non trouvé. Veuillez télécharger à nouveau.' });
    }

    try {
      docLog.info({ documentType }, 'Confirming extraction');
      const result = await extractFromDocument(normalizedFilePath, documentType);
      res.json(result);
    } catch (error) {
      logError(error, 'Documents');
      res.status(500).json({ error: 'Erreur lors de l\'extraction du document.' });
    }
  }
);

// Get stored extractions (placeholder)
app.get('/api/documents/extractions', (req, res) => {
  res.json([]);
});

// Error handling middleware
app.use((err, req, res, next) => {
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({ error: 'Origin not allowed', code: 'CORS_ERROR' });
  }
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'Fichier trop volumineux (max 10 MB)', code: 'FILE_TOO_LARGE' });
  }
  if (err.code?.startsWith('CSRF_')) {
    return res.status(403).json({ error: err.message, code: err.code });
  }

  // Log unexpected errors
  logError(err, 'Unhandled');

  if (err instanceof Error) {
    return res.status(400).json({ error: err.message });
  }
  res.status(500).json({ error: 'Erreur serveur interne', code: 'INTERNAL_ERROR' });
});

// Start server
app.listen(config.port, () => {
  log.info({ port: config.port, env: config.nodeEnv }, 'Server started');

  if (config.isDevelopment) {
    console.log(`\n  Server running on http://localhost:${config.port}\n`);
  }
});
