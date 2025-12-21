import { Router } from 'express';
import multer from 'multer';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync, mkdirSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = Router();

// Configure upload directory
const UPLOAD_DIR = process.env.UPLOAD_DIR || join(__dirname, '../../../2024/user-data');

// Ensure upload directories exist
const directories = ['certificats-salaire', 'releves-bancaires', 'attestations-3a', 'autres'];
directories.forEach(dir => {
  const fullPath = join(UPLOAD_DIR, dir);
  if (!existsSync(fullPath)) {
    mkdirSync(fullPath, { recursive: true });
  }
});

// Configure multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const category = req.body.category || 'autres';
    const dest = join(UPLOAD_DIR, category);
    cb(null, dest);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const safeName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, `${timestamp}-${safeName}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Type de fichier non supporté. Utilisez PDF, JPEG, PNG ou WebP.'));
    }
  }
});

// Upload endpoint
router.post('/', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    res.json({
      success: true,
      filename: req.file.filename,
      originalName: req.file.originalname,
      path: req.file.path,
      size: req.file.size,
      category: req.body.category || 'autres'
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get upload categories
router.get('/categories', (req, res) => {
  res.json([
    { id: 'certificats-salaire', name: 'Certificats de salaire', description: 'Documents de votre employeur' },
    { id: 'releves-bancaires', name: 'Relevés bancaires', description: 'Relevés de comptes au 31.12' },
    { id: 'attestations-3a', name: 'Attestations 3a', description: 'Prévoyance pilier 3a' },
    { id: 'autres', name: 'Autres documents', description: 'Autres justificatifs' }
  ]);
});

export default router;
