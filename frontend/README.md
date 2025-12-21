# GE-Impots Frontend

Interface web pour l'assistant de declaration d'impots genevoise 2024.

## Fonctionnalites

- **Assistant Chat** - Posez vos questions fiscales a l'IA
- **Questionnaire guide** - 9 sections pour completer votre declaration
- **Upload de documents** - Telechargez vos certificats et justificatifs
- **Calcul d'impots** - Estimation ICC, IFD et impot sur la fortune

## Installation

```bash
cd frontend
npm install
```

## Configuration

Creez un fichier `.env` a partir de `.env.example`:

```bash
cp .env.example .env
```

Ajoutez votre cle API Anthropic:

```
ANTHROPIC_API_KEY=sk-ant-...
PORT=3001
UPLOAD_DIR=../2024/user-data
```

## Lancement

### Option 1: Serveurs separes

Terminal 1 - Frontend (Vite):
```bash
npm run dev
```

Terminal 2 - Backend (Express):
```bash
npm run server
```

## URLs

- **Frontend**: http://localhost:5173
- **API**: http://localhost:3001

## Structure

```
frontend/
├── src/
│   ├── components/     # Chat, Questionnaire, FileUpload, Results
│   ├── pages/          # Home, ChatPage, DeclarationPage, etc.
│   └── App.jsx         # Routing principal
├── server/
│   ├── routes/         # API endpoints
│   └── services/       # Claude API integration
└── .env                # Configuration
```

## API Endpoints

| Methode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/health` | Health check |
| POST | `/api/chat` | Chat avec l'assistant |
| GET | `/api/chat/agents` | Liste des agents disponibles |
| POST | `/api/upload` | Upload de documents |
| GET | `/api/declaration/questionnaire` | Structure du questionnaire |
| POST | `/api/declaration/questionnaire/:id` | Sauvegarder section |
| GET | `/api/declaration/data` | Donnees de la declaration |
