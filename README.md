# GE-Impots - Geneva Tax Declaration Assistant

A modern web application and Claude Code plugin to help Geneva (Switzerland) residents complete their annual tax declaration (GeTax). Features AI-powered document analysis, automatic field extraction, and expert tax guidance.

## Features

### Web Application
- **Declaration Guide** - Step-by-step guide through all 6 GeTax annexes with 94 rubrique codes
- **Document Upload** - Upload tax documents (salary certificates, bank statements, etc.) with AI extraction
- **AI Chat Assistant** - Ask questions about Geneva tax rules, get personalized advice
- **Results Dashboard** - View extracted data, calculate estimated taxes

### Claude Code Plugin
- **8 Specialized Agents** - Tax coordinator, PDF extractor, revenue/deduction/fortune/real estate experts, compliance checker, optimizer
- **7 Slash Commands** - `/analyser-situation`, `/optimiser-deductions`, `/calculer-impots`, and more
- **Comprehensive Knowledge Base** - 2024 Geneva tax rules, limits, and calculations

## Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Anthropic API key (for AI features)

### Installation

```bash
# Clone the repository
git clone https://github.com/yhfmstr/GE-impots.git
cd GE-impots

# Install frontend dependencies
cd frontend
npm install

# Create environment file
cp .env.example .env
# Edit .env and add your ANTHROPIC_API_KEY

# Start the application (frontend + backend)
npm start
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3002

## Technical Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                            CLIENT (Browser)                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌────────────┐ │
│   │    Home      │  │  GuidePage   │  │  Documents   │  │  Results   │ │
│   │              │  │  (6 Annexes) │  │   Manager    │  │  Dashboard │ │
│   └──────────────┘  └──────────────┘  └──────────────┘  └────────────┘ │
│                              │                  │                       │
│   ┌──────────────┐  ┌────────┴─────────┐  ┌────┴───────────────────┐   │
│   │  Chat        │  │   FileUpload     │  │  Encrypted LocalStorage │   │
│   │  Assistant   │  │   Component      │  │  (AES-256)              │   │
│   └──────┬───────┘  └────────┬─────────┘  └─────────────────────────┘   │
│          │                   │                                          │
└──────────┼───────────────────┼──────────────────────────────────────────┘
           │                   │
           │    HTTP/REST      │
           ▼                   ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         EXPRESS.JS SERVER                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   ┌─────────────────────────────────────────────────────────────────┐   │
│   │                        MIDDLEWARE                                │   │
│   │  ┌────────────┐  ┌────────────────┐  ┌───────────────────────┐  │   │
│   │  │ Rate       │  │ Request        │  │ File Upload           │  │   │
│   │  │ Limiter    │  │ Validation     │  │ (Multer + Validation) │  │   │
│   │  └────────────┘  └────────────────┘  └───────────────────────┘  │   │
│   └─────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│   ┌──────────────────────────────────────────────────────────────────┐  │
│   │                         API ROUTES                                │  │
│   │                                                                   │  │
│   │  POST /api/chat           - AI conversation                       │  │
│   │  POST /api/documents/extract - Document analysis                  │  │
│   │  POST /api/documents/detect  - Auto-detect document type          │  │
│   │  GET  /api/documents/types   - Available document types           │  │
│   │  GET  /api/health            - Health check                       │  │
│   └──────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│   ┌──────────────────────────────────────────────────────────────────┐  │
│   │                        SERVICES                                   │  │
│   │  ┌──────────────────┐  ┌───────────────────────────────────────┐ │  │
│   │  │  Anthropic       │  │  Document Extractor                   │ │  │
│   │  │  Client          │  │  (PDF → Claude Vision → Structured)   │ │  │
│   │  │  (Claude API)    │  │                                       │ │  │
│   │  └──────────────────┘  └───────────────────────────────────────┘ │  │
│   └──────────────────────────────────────────────────────────────────┘  │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
           │
           │  API Call
           ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         ANTHROPIC API                                    │
│                                                                          │
│   ┌─────────────────────────────────────────────────────────────────┐   │
│   │  Claude Sonnet 4 (claude-sonnet-4-20250514)                      │   │
│   │  - Chat conversations with tax knowledge context                 │   │
│   │  - Document analysis via Vision API                              │   │
│   │  - Field extraction from PDFs/images                             │   │
│   └─────────────────────────────────────────────────────────────────┘   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

## Project Structure

```
GE-impots/
├── frontend/                      # Web application
│   ├── src/
│   │   ├── components/            # React components
│   │   │   ├── ui/                # shadcn/ui components
│   │   │   ├── Chat.jsx           # AI chat interface
│   │   │   ├── FileUpload.jsx     # Document upload
│   │   │   ├── Layout.jsx         # App layout with navigation
│   │   │   └── ErrorBoundary.jsx  # Error handling
│   │   ├── pages/
│   │   │   ├── Home.jsx           # Landing page
│   │   │   ├── GuidePage.jsx      # Declaration guide (94 fields)
│   │   │   ├── DocumentsPage.jsx  # Document management
│   │   │   ├── ChatPage.jsx       # AI assistant
│   │   │   └── ResultsPage.jsx    # Tax calculation results
│   │   ├── lib/
│   │   │   ├── storage.js         # Encrypted localStorage
│   │   │   ├── api.js             # API client
│   │   │   └── utils.js           # Utility functions
│   │   └── config/
│   │       └── taxYear.js         # Centralized tax year config
│   ├── server/                    # Express.js backend
│   │   ├── index.js               # Server entry point
│   │   ├── middleware/
│   │   │   ├── rateLimiter.js     # Rate limiting
│   │   │   ├── validation.js      # Zod request validation
│   │   │   └── upload.js          # File upload handling
│   │   └── services/
│   │       ├── anthropicClient.js # Claude API client
│   │       ├── claude.js          # AI service wrapper
│   │       └── documentExtractor.js # PDF/image extraction
│   ├── e2e/                       # Playwright E2E tests
│   │   ├── pages/                 # Page Objects
│   │   └── *.spec.js              # Test specifications
│   └── package.json
│
├── 2024/                          # Tax year data
│   ├── guidepp-2024-*.pdf         # Official Geneva tax guide
│   ├── knowledge/                 # Structured knowledge base
│   │   ├── baremes-2024.md        # Tax brackets (ICC/IFD)
│   │   ├── deductions-2024.md     # All deductions with limits
│   │   ├── immobilier.md          # Real estate taxation
│   │   ├── fortune.md             # Wealth tax rules
│   │   ├── prevoyance.md          # Pension system (3 pillars)
│   │   ├── frais-professionnels.md # Professional expenses
│   │   └── taxation-codes.md      # GeTax field codes
│   └── user-uploads/              # User documents (gitignored)
│
├── .claude/
│   └── plugins/
│       └── ge-impots-expert/      # Claude Code plugin
│           ├── plugin.json        # Plugin configuration
│           ├── agents/            # 8 specialized AI agents
│           └── skills/            # 7 slash commands
│
└── README.md
```

## GeTax Annexes Coverage

The application covers all 6 official GeTax annexes with 94 rubrique codes:

| Annexe | Name | Fields | Key Codes |
|--------|------|--------|-----------|
| **A** | Activité dépendante | 22 | 11.10-11.92, 31.10-31.95 |
| **B** | Activité indépendante | 10 | 12.01-12.29, 22.01, 32.10-42.20 |
| **C** | Autres revenus et déductions | 40 | 13.xx, 16.xx, 17.xx, 52.xx, 53.xx, 58.xx, 59.xx, 80.xx |
| **D** | Fortune immobilière | 13 | 15.xx, 35.xx, 65.xx |
| **E** | Dettes | 3 | 55.xx, 66.xx |
| **F** | Fortune mobilière | 8 | 60.xx |

## Supported Document Types

| Type | Description | Extracted Fields |
|------|-------------|------------------|
| `certificat-salaire` | Salary certificate | Gross salary, AVS, LPP contributions |
| `attestation-3a` | Pillar 3A attestation | Annual contributions |
| `attestation-lpp` | Pension fund statement | LPP contributions, buybacks |
| `attestation-hypothecaire` | Mortgage certificate | Property value, interest paid |
| `releve-bancaire` | Bank statement | Account balance, interest earned |
| `attestation-maladie` | Health insurance | Premium amounts |
| `facture-formation` | Training invoice | Course costs |
| `facture-garde` | Childcare invoice | Childcare expenses |

## API Endpoints

### Chat
```
POST /api/chat
Body: { message: string, context: Message[] }
Response: { content: string, usage: { input_tokens, output_tokens } }
```

### Document Processing
```
POST /api/documents/extract
Body: FormData { document: File, documentType: string }
Response: { success: boolean, fields: ExtractedField[], notes: string[] }

POST /api/documents/detect
Body: FormData { document: File }
Response: { success: boolean, detectedType: string, confidence: number }

GET /api/documents/types
Response: { id: string, name: string, description: string }[]
```

### Health
```
GET /api/health
Response: { status: "ok", timestamp: string }
```

## Testing

### Run E2E Tests
```bash
cd frontend

# Install Playwright browsers (first time only)
npx playwright install

# Run all tests
npx playwright test

# Run with UI
npx playwright test --ui

# Run specific test file
npx playwright test guide.spec.js
```

### Test Coverage
- **76 E2E tests** across 5 spec files
- Page Object pattern for maintainability
- Tests: navigation, guide pages, document upload, chat, results

## Security Features

### Data Protection
- **Client-side encryption** - All localStorage data encrypted with AES-256
- **No server-side storage** - Tax data stays in browser
- **Path traversal protection** - File paths validated on server
- **Rate limiting** - API endpoints protected against abuse
- **Input validation** - Zod schemas validate all requests
- **CORS protection** - Restricted to allowed origins

### File Upload Security
- **Type validation** - Only PDF/PNG/JPG/JPEG allowed
- **Size limits** - Max 10MB per file
- **Magic number check** - File type verified by content, not extension

## Key Tax Limits 2024 (Geneva)

| Deduction | ICC (Cantonal) | IFD (Federal) |
|-----------|----------------|---------------|
| 3ème pilier A (with LPP) | CHF 7,056 | CHF 7,056 |
| 3ème pilier A (without LPP) | CHF 35,280 | CHF 35,280 |
| Professional expenses (forfait) | 3% (634-1,796) | 3% (2,000-4,000) |
| Meal expenses | CHF 3,200 | CHF 3,200 |
| Travel expenses | CHF 529 | CHF 3,200 |
| Continuing education | CHF 12,640 | CHF 12,000 |
| Childcare | CHF 26,080 | CHF 25,500 |
| Health insurance (adult) | CHF 16,207 | — |
| Union contributions | CHF 700 | — |

## Claude Code Plugin

### Available Agents

| Agent | Purpose |
|-------|---------|
| `tax-coordinator` | Main orchestrator, routes to specialists |
| `pdf-extractor` | Extracts data from tax documents |
| `revenus-expert` | Income analysis and optimization |
| `deductions-expert` | Maximizes legal deductions |
| `fortune-expert` | Wealth declaration |
| `immobilier-expert` | Real estate taxation |
| `compliance-checker` | Legal compliance verification |
| `optimizer` | Global tax optimization |

### Slash Commands

```bash
/analyser-situation      # Complete tax situation analysis
/optimiser-deductions    # Identify all possible deductions
/extraire-documents      # Extract info from documents
/verifier-conformite     # Check compliance
/calculer-impots         # Calculate ICC + IFD estimates
/generer-rapport         # Generate tax report
/questionnaire           # Guided questionnaire
```

## Environment Variables

```env
# Required
ANTHROPIC_API_KEY=sk-ant-...

# Server
PORT=3002
NODE_ENV=development

# Upload
UPLOAD_DIR=../2024/user-uploads

# CORS
FRONTEND_URL=http://localhost:5173

# Frontend (prefix with VITE_)
VITE_API_URL=http://localhost:3002/api
VITE_STORAGE_KEY=your-encryption-key
VITE_TAX_YEAR=2024
```

## Development

### Start Development Server
```bash
cd frontend
npm run dev      # Vite dev server only
npm run server   # Express server only
npm start        # Both (concurrently)
```

### Build for Production
```bash
cd frontend
npm run build    # Creates dist/
npm run preview  # Preview production build
```

### Linting
```bash
cd frontend
npm run lint
```

## Data Privacy

- All tax data is stored **locally in your browser** (encrypted localStorage)
- Documents uploaded are processed by Claude API but **not stored on our servers**
- The `2024/user-uploads/` folder is gitignored and never committed
- You can export/import your data and clear all data at any time

## Sources

- [Guide fiscal 2024 - Canton de Genève](https://www.ge.ch/document/guide-fiscal-2024-particuliers)
- [GeTax - Application de déclaration](https://www.getax.ch/)
- [AFC - Administration fédérale des contributions](https://www.estv.admin.ch/)

## Disclaimer

This tool is provided as an **aid for tax declaration**. It does not constitute tax advice. For complex situations, please consult a qualified tax professional. Tax rules and limits may change - always verify with official sources.

## License

MIT

---

Built with React, Express.js, Claude AI, and Tailwind CSS.
