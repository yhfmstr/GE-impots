// GET /api/upload/categories - Return document categories

const CATEGORIES = [
  { 
    id: 'certificats-salaire', 
    name: 'Certificats de salaire', 
    description: 'Documents de votre employeur' 
  },
  { 
    id: 'releves-bancaires', 
    name: 'Relevés bancaires', 
    description: 'Relevés de comptes au 31.12' 
  },
  { 
    id: 'attestations-3a', 
    name: 'Attestations 3a', 
    description: 'Prévoyance pilier 3a' 
  },
  { 
    id: 'attestations-lpp', 
    name: 'Attestations LPP', 
    description: 'Caisse de pension, rachats' 
  },
  { 
    id: 'assurances', 
    name: 'Assurances', 
    description: 'Primes maladie, 3b, etc.' 
  },
  { 
    id: 'immobilier', 
    name: 'Documents immobiliers', 
    description: 'Intérêts hypothécaires, charges' 
  },
  { 
    id: 'dons', 
    name: 'Dons et contributions', 
    description: 'Reçus de dons' 
  },
  { 
    id: 'autres', 
    name: 'Autres documents', 
    description: 'Autres justificatifs' 
  }
];

export default function handler(req, res) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    return res.status(200).json(CATEGORIES);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

