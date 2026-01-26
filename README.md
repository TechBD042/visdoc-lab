# VisdDoc-Lab

PDF accessibility remediation tool with WCAG 2.2 AA compliance features.

## Features

- **PDF Upload**: Drag & drop single or multiple PDF files
- **Image Extraction**: Automatically extract images from PDF pages
- **AI Alt-Text Generation**: Generate descriptive alt-text using Ollama (llava model)
- **Accessibility Metadata**: Add document title, author, language, and other accessibility metadata
- **Batch Processing**: Process multiple PDFs with ZIP download
- **Accessibility Reports**: Generate WCAG compliance reports

## Prerequisites

- Node.js 18+
- npm 9+
- Ollama (for AI alt-text generation)

## Ollama Setup

```bash
# Install Ollama (macOS)
brew install ollama

# Start Ollama service
ollama serve

# Pull llava vision model (~4GB)
ollama pull llava
```

## Installation

```bash
# Install dependencies
npm install

# Start development servers (client + server)
npm run dev
```

The client runs on http://localhost:5173 and the server on http://localhost:3001.

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
| GET | /api/ollama/status | Check Ollama |

## Tech Stack

**Frontend**: React 19, TypeScript, Tailwind CSS, react-dropzone, react-pdf

**Backend**: Node.js, Express, pdf-lib, pdfjs-dist, Ollama

## License

MIT
