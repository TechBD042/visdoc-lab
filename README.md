# VisdDoc-Lab

PDF accessibility remediation tool with WCAG 2.2 AA compliance features.

## Features

- **PDF Upload**: Drag & drop single or multiple PDF files
- **Image Extraction**: Automatically extract images from PDF pages
- **AI Alt-Text Generation**: Generate descriptive alt-text using Google Gemini or Ollama
- **Accessibility Metadata**: Add document title, author, language, and other accessibility metadata
- **Batch Processing**: Process multiple PDFs with ZIP download
- **Accessibility Reports**: Generate WCAG compliance reports

## Prerequisites

- Node.js 18+
- npm 9+
- Google Gemini API key (recommended) OR Ollama (for local processing)

## AI Vision Setup

### Option 1: Google Gemini (Recommended)

Gemini offers a generous free tier (15 req/min, 1M tokens/day) with no local setup required.

1. Get your free API key at https://aistudio.google.com/apikey
2. Create the environment file:
   ```bash
   cd server
   cp .env.example .env
   ```
3. Edit `.env` and add your API key:
   ```
   VISION_PROVIDER=gemini
   GEMINI_API_KEY=your-api-key-here
   ```

### Option 2: Ollama (Local Processing)

For offline/local processing without cloud dependencies.

```bash
# Install Ollama (macOS)
brew install ollama

# Start Ollama service
ollama serve

# Pull llava vision model (~4GB)
ollama pull llava
```

Set in `.env`:
```
VISION_PROVIDER=ollama
```

## Installation

```bash
# Install dependencies
npm install

# Start development servers (client + server)
npm run dev
```

The client runs on http://localhost:5173 and the server on http://localhost:3001.

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VISION_PROVIDER` | AI provider: `gemini` or `ollama` | Auto-detect |
| `GEMINI_API_KEY` | Google Gemini API key | - |

If `VISION_PROVIDER` is not set, the system auto-detects: uses Gemini if `GEMINI_API_KEY` is present, otherwise falls back to Ollama.

## Project Structure

```
visdoc-lab/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # UI components
│   │   ├── pages/          # Route pages
│   │   ├── hooks/          # Custom hooks
│   │   ├── services/       # API client
│   │   └── types/          # TypeScript types
│   └── package.json
├── server/                 # Node.js backend
│   ├── src/
│   │   ├── routes/         # API endpoints
│   │   ├── services/       # Business logic
│   │   └── utils/          # Helpers
│   └── package.json
├── shared/                 # Shared types
└── package.json            # Root workspace
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/upload | Upload single PDF |
| POST | /api/upload/batch | Upload multiple PDFs |
| GET | /api/pdf/:id | Get PDF info |
| GET | /api/pdf/:id/images | Extract images |
| POST | /api/alt-text | Generate alt-text |
| POST | /api/remediate/:id | Apply fixes |
| GET | /api/download/:id | Download PDF |
| GET | /api/vision/status | Check AI vision status |

## Tech Stack

**Frontend**: React 19, TypeScript, Tailwind CSS, react-dropzone, react-pdf

**Backend**: Node.js, Express, pdf-lib, pdfjs-dist

**AI Vision**: Google Gemini 2.0 Flash, Ollama (llava)

## License

MIT
