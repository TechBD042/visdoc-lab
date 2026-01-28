import { Router, Request, Response } from 'express';
import fs from 'fs/promises';
import path from 'path';
import archiver from 'archiver';
import { documentStore } from '../services/documentStore.js';
import { pdfService } from '../services/pdfService.js';
import { getVisionService } from '../services/visionProvider.js';
import { accessibilityService } from '../services/accessibilityService.js';
import { OUTPUT_DIR, fileExists } from '../utils/fileUtils.js';
import type { ExtractImagesResponse, GenerateAltTextResponse, RemediateResponse, PDFImage } from '../../../shared/types/index.js';

const router = Router();

// GET /api/pdf/:id/images - Extract images from PDF
router.get('/pdf/:id/images', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const document = documentStore.get(id);

    if (!document) {
      res.status(404).json({ success: false, message: 'Document not found' });
      return;
    }

    // If images already extracted, return them
    if (document.images.length > 0) {
      const response: ExtractImagesResponse = {
        success: true,
        images: document.images
      };
      res.json(response);
      return;
    }

    // Extract images
    const { images } = await accessibilityService.processDocument(id);

    const response: ExtractImagesResponse = {
      success: true,
      images,
      message: `Extracted ${images.length} images from ${document.pageCount} pages`
    };

    res.json(response);
  } catch (error) {
    console.error('Image extraction error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to extract images'
    });
  }
});

// POST /api/alt-text - Generate alt-text for a single image
router.post('/alt-text', async (req: Request, res: Response) => {
  try {
    const { imageData, context } = req.body;

    if (!imageData) {
      res.status(400).json({ success: false, message: 'Image data is required' });
      return;
    }

    // Extract base64 if data URL provided
    let base64 = imageData;
    if (imageData.includes('base64,')) {
      base64 = imageData.split('base64,')[1];
    }

    const visionService = getVisionService();
    const altText = await visionService.generateAltText(base64, context);

    const response: GenerateAltTextResponse = {
      success: true,
      altText
    };

    res.json(response);
  } catch (error) {
    console.error('Alt-text generation error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to generate alt-text'
    });
  }
});

// POST /api/pdf/:id/generate-alt-texts - Generate alt-texts for all images in document
router.post('/pdf/:id/generate-alt-texts', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const document = documentStore.get(id);

    if (!document) {
      res.status(404).json({ success: false, message: 'Document not found' });
      return;
    }

    const images = await accessibilityService.generateAltTexts(id);

    res.json({
      success: true,
      images,
      message: `Generated alt-text for ${images.filter(i => i.altTextGenerated).length} images`
    });
  } catch (error) {
    console.error('Batch alt-text generation error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to generate alt-texts'
    });
  }
});

// POST /api/remediate/:id - Apply accessibility fixes
router.post('/remediate/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { images, metadata } = req.body;

    const document = documentStore.get(id);
    if (!document) {
      res.status(404).json({ success: false, message: 'Document not found' });
      return;
    }

    const { filename, report } = await accessibilityService.remediateDocument(
      id,
      images || [],
      metadata
    );

    const response: RemediateResponse = {
      success: true,
      downloadUrl: `/api/download/${id}`,
      report,
      message: 'PDF remediated successfully'
    };

    res.json(response);
  } catch (error) {
    console.error('Remediation error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to remediate PDF'
    });
  }
});

// GET /api/download/:id - Download remediated PDF
router.get('/download/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const document = documentStore.get(id);

    if (!document) {
      res.status(404).json({ success: false, message: 'Document not found' });
      return;
    }

    const filename = `${id}_remediated.pdf`;
    const filePath = path.join(OUTPUT_DIR, filename);

    if (!(await fileExists(filePath))) {
      res.status(404).json({ success: false, message: 'Remediated file not found' });
      return;
    }

    const originalName = document.originalName.replace('.pdf', '_accessible.pdf');
    res.download(filePath, originalName);
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Download failed'
    });
  }
});

// POST /api/batch/remediate - Remediate multiple PDFs
router.post('/batch/remediate', async (req: Request, res: Response) => {
  try {
    const { documentIds, metadata } = req.body;

    if (!documentIds || !Array.isArray(documentIds)) {
      res.status(400).json({ success: false, message: 'Document IDs array required' });
      return;
    }

    const results: Array<{ id: string; success: boolean; filename?: string; report?: any; error?: string }> = [];

    for (const docId of documentIds) {
      const document = documentStore.get(docId);
      if (document) {
        try {
          const { filename, report } = await accessibilityService.remediateDocument(
            docId,
            document.images.map(img => ({ id: img.id, altText: img.altText || '' })),
            metadata
          );
          results.push({ id: docId, success: true, filename, report });
        } catch (error) {
          results.push({
            id: docId,
            success: false,
            error: error instanceof Error ? error.message : 'Failed'
          });
        }
      }
    }

    res.json({
      success: true,
      results,
      downloadUrl: `/api/batch/download?ids=${documentIds.join(',')}`
    });
  } catch (error) {
    console.error('Batch remediation error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Batch remediation failed'
    });
  }
});

// GET /api/batch/download - Download multiple remediated PDFs as ZIP
router.get('/batch/download', async (req: Request, res: Response) => {
  try {
    const idsParam = req.query.ids as string;
    if (!idsParam) {
      res.status(400).json({ success: false, message: 'Document IDs required' });
      return;
    }

    const ids = idsParam.split(',');

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename=remediated_pdfs.zip');

    const archive = archiver('zip', { zlib: { level: 9 } });
    archive.pipe(res);

    for (const id of ids) {
      const document = documentStore.get(id);
      if (document) {
        const filename = `${id}_remediated.pdf`;
        const filePath = path.join(OUTPUT_DIR, filename);

        if (await fileExists(filePath)) {
          const originalName = document.originalName.replace('.pdf', '_accessible.pdf');
          archive.file(filePath, { name: originalName });
        }
      }
    }

    await archive.finalize();
  } catch (error) {
    console.error('Batch download error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Batch download failed'
    });
  }
});

// GET /api/vision/status - Check vision AI service connection status
router.get('/vision/status', async (_req: Request, res: Response) => {
  try {
    const status = await accessibilityService.checkVisionStatus();
    res.json({ success: true, ...status });
  } catch (error) {
    res.json({ success: false, connected: false, modelAvailable: false, provider: 'unknown' });
  }
});

// Keep legacy endpoint for backwards compatibility
router.get('/ollama/status', async (_req: Request, res: Response) => {
  try {
    const status = await accessibilityService.checkVisionStatus();
    res.json({ success: true, ...status });
  } catch (error) {
    res.json({ success: false, connected: false, modelAvailable: false, provider: 'unknown' });
  }
});

export default router;
