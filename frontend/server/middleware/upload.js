import multer from 'multer';
import { join, dirname, extname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync, mkdirSync, readFileSync, unlinkSync } from 'fs';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Upload directory
const UPLOAD_DIR = join(__dirname, '../../../2024/user-uploads');
if (!existsSync(UPLOAD_DIR)) {
  mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Allowed file extensions and their magic bytes
const ALLOWED_FILES = {
  '.pdf': { mimeTypes: ['application/pdf'], magic: [0x25, 0x50, 0x44, 0x46] }, // %PDF
  '.jpg': { mimeTypes: ['image/jpeg'], magic: [0xFF, 0xD8, 0xFF] },
  '.jpeg': { mimeTypes: ['image/jpeg'], magic: [0xFF, 0xD8, 0xFF] },
  '.png': { mimeTypes: ['image/png'], magic: [0x89, 0x50, 0x4E, 0x47] },
  '.gif': { mimeTypes: ['image/gif'], magic: [0x47, 0x49, 0x46] },
  '.webp': { mimeTypes: ['image/webp'], magic: [0x52, 0x49, 0x46, 0x46] } // RIFF
};

// Generate secure filename
function generateSecureFilename(originalName) {
  const ext = extname(originalName).toLowerCase();
  const hash = crypto.randomBytes(16).toString('hex');
  const timestamp = Date.now();
  return `doc-${timestamp}-${hash}${ext}`;
}

// Validate file signature (magic bytes)
function validateFileSignature(filePath, expectedMagic) {
  try {
    const buffer = readFileSync(filePath);
    if (buffer.length < expectedMagic.length) return false;

    for (let i = 0; i < expectedMagic.length; i++) {
      if (buffer[i] !== expectedMagic[i]) return false;
    }
    return true;
  } catch {
    return false;
  }
}

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    cb(null, generateSecureFilename(file.originalname));
  }
});

// File filter with extension validation
const fileFilter = (req, file, cb) => {
  const ext = extname(file.originalname).toLowerCase();
  const fileConfig = ALLOWED_FILES[ext];

  if (!fileConfig) {
    return cb(new Error('Type de fichier non supporté. Utilisez PDF, JPG, PNG, GIF ou WEBP.'));
  }

  if (!fileConfig.mimeTypes.includes(file.mimetype)) {
    return cb(new Error('Le type MIME ne correspond pas à l\'extension du fichier.'));
  }

  cb(null, true);
};

// Multer instance
export const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 1 // Only one file at a time
  },
  fileFilter
});

// Post-upload validation middleware (validates magic bytes after file is saved)
export const validateUploadedFile = async (req, res, next) => {
  if (!req.file) {
    return next();
  }

  const ext = extname(req.file.originalname).toLowerCase();
  const fileConfig = ALLOWED_FILES[ext];

  if (!fileConfig) {
    // Clean up uploaded file
    try {
      unlinkSync(req.file.path);
    } catch (err) {
      console.error(`[Upload] Failed to cleanup invalid file type: ${req.file.path}`, err.message);
    }
    return res.status(400).json({ error: 'Type de fichier non supporté.' });
  }

  // Validate file signature
  if (!validateFileSignature(req.file.path, fileConfig.magic)) {
    // Clean up uploaded file - it's potentially malicious
    try {
      unlinkSync(req.file.path);
    } catch (err) {
      console.error(`[Upload] Failed to cleanup malicious file: ${req.file.path}`, err.message);
    }
    return res.status(400).json({
      error: 'Le contenu du fichier ne correspond pas à son type déclaré. Fichier rejeté.'
    });
  }

  next();
};

// Export upload directory for other modules
export const uploadDir = UPLOAD_DIR;
