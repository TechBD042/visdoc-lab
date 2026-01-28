import { pdfService } from './pdfService.js';
import { getVisionService, getVisionProvider, type VisionProviderType } from './visionProvider.js';
import { documentStore } from './documentStore.js';
import type { AccessibilityReport, AccessibilityIssue, PDFImage, PDFMetadata } from '../../../shared/types/index.js';

class AccessibilityService {
  async processDocument(documentId: string): Promise<{
    images: PDFImage[];
    metadata: PDFMetadata;
  }> {
    // Update status
    documentStore.update(documentId, { status: 'extracting' });

    // Extract images from PDF
    const images = await pdfService.extractImages(documentId);

    // Get existing metadata
    const metadata = await pdfService.getDocumentMetadata(documentId);

    // Update document with extracted images
    documentStore.update(documentId, {
      status: 'uploaded',
      images
    });

    return { images, metadata };
  }

  async generateAltTexts(documentId: string): Promise<PDFImage[]> {
    const document = documentStore.get(documentId);
    if (!document) {
      throw new Error('Document not found');
    }

    documentStore.update(documentId, { status: 'generating-alt-text' });

    const updatedImages: PDFImage[] = [];

    for (const image of document.images) {
      if (image.dataUrl && !image.altTextGenerated) {
        try {
          // Extract base64 from data URL
          const base64Match = image.dataUrl.match(/base64,(.+)$/);
          if (base64Match) {
            const visionService = getVisionService();
            const altText = await visionService.generateAltText(base64Match[1]);
            updatedImages.push({
              ...image,
              altText,
              altTextGenerated: true
            });
          } else {
            updatedImages.push(image);
          }
        } catch (error) {
          console.error(`Failed to generate alt-text for image ${image.id}:`, error);
          updatedImages.push({
            ...image,
            altText: 'Image description unavailable',
            altTextGenerated: false
          });
        }
      } else {
        updatedImages.push(image);
      }
    }

    documentStore.update(documentId, {
      images: updatedImages,
      status: 'uploaded'
    });

    return updatedImages;
  }

  async remediateDocument(
    documentId: string,
    imageAltTexts: { id: string; altText: string }[],
    metadata?: PDFMetadata
  ): Promise<{ filename: string; report: AccessibilityReport }> {
    documentStore.update(documentId, { status: 'remediating' });

    // Apply accessibility fixes to PDF
    const outputFilename = await pdfService.addAccessibilityMetadata(
      documentId,
      imageAltTexts,
      metadata
    );

    // Generate accessibility report
    const report = this.generateReport(documentId, imageAltTexts, metadata);

    documentStore.update(documentId, {
      status: 'completed',
      metadata
    });

    return { filename: outputFilename, report };
  }

  private generateReport(
    documentId: string,
    imageAltTexts: { id: string; altText: string }[],
    metadata?: PDFMetadata
  ): AccessibilityReport {
    const issues: AccessibilityIssue[] = [];
    const metadataAdded: string[] = [];

    // Check metadata
    if (metadata?.title) {
      metadataAdded.push('title');
    } else {
      issues.push({
        type: 'warning',
        code: 'MISSING_TITLE',
        message: 'Document title is not set'
      });
    }

    if (metadata?.language) {
      metadataAdded.push('language');
    } else {
      issues.push({
        type: 'warning',
        code: 'MISSING_LANGUAGE',
        message: 'Document language is not set'
      });
    }

    if (metadata?.author) {
      metadataAdded.push('author');
    }

    if (metadata?.subject) {
      metadataAdded.push('subject');
    }

    // Check alt-texts
    const emptyAltTexts = imageAltTexts.filter(
      img => !img.altText || img.altText === 'Image description unavailable'
    );

    if (emptyAltTexts.length > 0) {
      issues.push({
        type: 'warning',
        code: 'MISSING_ALT_TEXT',
        message: `${emptyAltTexts.length} image(s) are missing meaningful alt-text`
      });
    }

    // Determine WCAG level
    let wcagLevel: 'A' | 'AA' | 'AAA' | 'partial' = 'partial';

    if (issues.filter(i => i.type === 'error').length === 0) {
      if (issues.filter(i => i.type === 'warning').length === 0) {
        wcagLevel = 'AA';
      } else if (issues.filter(i => i.type === 'warning').length <= 2) {
        wcagLevel = 'A';
      }
    }

    return {
      documentId,
      timestamp: new Date(),
      imagesProcessed: imageAltTexts.length,
      altTextsAdded: imageAltTexts.filter(img => img.altText && img.altText !== 'Image description unavailable').length,
      metadataAdded,
      wcagLevel,
      issues
    };
  }

  async checkVisionStatus(): Promise<{
    connected: boolean;
    modelAvailable: boolean;
    provider: VisionProviderType;
  }> {
    const visionService = getVisionService();
    const provider = getVisionProvider();
    const connected = await visionService.checkConnection();
    const modelAvailable = connected ? await visionService.isModelAvailable() : false;

    return { connected, modelAvailable, provider };
  }
}

export const accessibilityService = new AccessibilityService();
