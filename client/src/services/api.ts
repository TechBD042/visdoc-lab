import axios from 'axios';
import type {
  PDFDocument,
  UploadResponse,
  BatchUploadResponse,
  ExtractImagesResponse,
  GenerateAltTextResponse,
  RemediateResponse,
  PDFMetadata,
  BatchStatusResponse
} from '@shared/types';

const api = axios.create({
  baseURL: '/api',
  timeout: 120000, // 2 minutes for large files
});

export const pdfApi = {
  // Upload single PDF
  async upload(file: File): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await api.post<UploadResponse>('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  // Upload multiple PDFs
  async uploadBatch(files: File[]): Promise<BatchUploadResponse> {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    const { data } = await api.post<BatchUploadResponse>('/upload/batch', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  // Get PDF info
  async getDocument(id: string): Promise<{ success: boolean; document: PDFDocument }> {
    const { data } = await api.get(`/pdf/${id}`);
    return data;
  },

  // Get processing status
  async getStatus(id: string): Promise<{ success: boolean; status: string; document: PDFDocument }> {
    const { data } = await api.get(`/status/${id}`);
    return data;
  },

  // Extract images from PDF
  async extractImages(id: string): Promise<ExtractImagesResponse> {
    const { data } = await api.get<ExtractImagesResponse>(`/pdf/${id}/images`);
    return data;
  },

  // Generate alt-text for single image
  async generateAltText(imageData: string, context?: string): Promise<GenerateAltTextResponse> {
    const { data } = await api.post<GenerateAltTextResponse>('/alt-text', {
      imageData,
      context,
    });
    return data;
  },

  // Generate alt-texts for all images in document
  async generateAllAltTexts(id: string): Promise<{ success: boolean; images: PDFDocument['images'] }> {
    const { data } = await api.post(`/pdf/${id}/generate-alt-texts`);
    return data;
  },

  // Remediate PDF
  async remediate(
    id: string,
    images: { id: string; altText: string }[],
    metadata?: PDFMetadata
  ): Promise<RemediateResponse> {
    const { data } = await api.post<RemediateResponse>(`/remediate/${id}`, {
      images,
      metadata,
    });
    return data;
  },

  // Get download URL
  getDownloadUrl(id: string): string {
    return `/api/download/${id}`;
  },

  // Batch remediate
  async batchRemediate(
    documentIds: string[],
    metadata?: PDFMetadata
  ): Promise<{ success: boolean; results: Array<{ id: string; success: boolean }>; downloadUrl: string }> {
    const { data } = await api.post('/batch/remediate', {
      documentIds,
      metadata,
    });
    return data;
  },

  // Get batch download URL
  getBatchDownloadUrl(ids: string[]): string {
    return `/api/batch/download?ids=${ids.join(',')}`;
  },

  // Check vision AI status
  async checkVisionStatus(): Promise<{ success: boolean; connected: boolean; modelAvailable: boolean; provider: string }> {
    const { data } = await api.get('/vision/status');
    return data;
  },

  // Legacy alias
  async checkOllamaStatus(): Promise<{ success: boolean; connected: boolean; modelAvailable: boolean; provider: string }> {
    return this.checkVisionStatus();
  },
};

export default pdfApi;
