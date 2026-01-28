import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import uploadRoutes from './routes/upload.js';
import processRoutes from './routes/process.js';
import { ensureDirectories } from './utils/fileUtils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static files for uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('/output', express.static(path.join(__dirname, '../output')));

// API Routes
app.use('/api', uploadRoutes);
app.use('/api', processRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve static frontend files in production
const clientDistPath = path.join(__dirname, '../../client/dist');
app.use(express.static(clientDistPath));

// Handle client-side routing - serve index.html for all non-API routes
app.get('*', (_req, res) => {
  res.sendFile(path.join(clientDistPath, 'index.html'));
});

// Error handling middleware
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    message: err.message || 'Internal server error'
  });
});

// Initialize directories and start server
async function start() {
  await ensureDirectories();

  app.listen(PORT, () => {
    console.log(`VisdDoc-Lab server running on http://localhost:${PORT}`);
    console.log('API endpoints:');
    console.log('  POST /api/upload - Upload PDF files');
    console.log('  GET  /api/pdf/:id - Get PDF info');
    console.log('  GET  /api/pdf/:id/images - Extract images from PDF');
    console.log('  POST /api/alt-text - Generate alt-text for image');
    console.log('  POST /api/remediate/:id - Apply accessibility fixes');
    console.log('  GET  /api/download/:id - Download remediated PDF');
    console.log('  GET  /api/status/:id - Check processing status');
  });
}

start().catch(console.error);
