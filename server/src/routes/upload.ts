import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { UPLOADS_DIR } from '../utils/fileUtils.js';
import { documentStore } from '../services/documentStore.js';
import { pdfService } from '../services/pdfService.js';
import type { PDFDocument, UploadResponse, BatchUploadResponse } from '../../../shared/types/index.js';

const router = Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (_req, file, cb) => {
    const uniqueId = uuidv4();
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueId}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB max
  },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  }
});

// POST /api/upload - Upload single PDF
router.post('/upload', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, message: 'No file uploaded' });
      return;
    }

    const { filename, originalname, size, path: filePath } = req.file;
    const id = path.basename(filename, path.extname(filename));

    // Get page count from PDF
    const pageCount = await pdfService.getPageCount(filePath);

    const document: PDFDocument = {
      id,
      filename,
      originalName: originalname,
      uploadedAt: new Date(),
      status: 'uploaded',
      pageCount,
      fileSize: size,
      images: []
    };

    documentStore.set(id, document);

    const response: UploadResponse = {
      success: true,
      document,
      message: 'File uploaded successfully'
    };

    res.json(response);
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Upload failed'
    });
  }
});

// POST /api/upload/batch - Upload multiple PDFs
router.post('/upload/batch', upload.array('files', 20), async (req: Request, res: Response) => {
  try {
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      res.status(400).json({ success: false, message: 'No files uploaded' });
      return;
    }

    const jobId = uuidv4();
    const documents: PDFDocument[] = [];

    for (const file of files) {
      const id = path.basename(file.filename, path.extname(file.filename));
      const pageCount = await pdfService.getPageCount(file.path);

      const document: PDFDocument = {
        id,
        filename: file.filename,
        originalName: file.originalname,
        uploadedAt: new Date(),
        status: 'uploaded',
        pageCount,
        fileSize: file.size,
        images: []
      };

      documentStore.set(id, document);
      documents.push(document);
    }

    const response: BatchUploadResponse = {
      success: true,
      documents,
      jobId,
      message: `${files.length} files uploaded successfully`
    };

    res.json(response);
  } catch (error) {
    console.error('Batch upload error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Batch upload failed'
    });
  }
});

// GET /api/pdf/:id - Get PDF info
router.get('/pdf/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const document = documentStore.get(id);

  if (!document) {
    res.status(404).json({ success: false, message: 'Document not found' });
    return;
  }

  res.json({ success: true, document });
});

// GET /api/status/:id - Get processing status
router.get('/status/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const document = documentStore.get(id);

  if (!document) {
    res.status(404).json({ success: false, message: 'Document not found' });
    return;
  }

  res.json({
    success: true,
    status: document.status,
    document
  });
});

export default router;
