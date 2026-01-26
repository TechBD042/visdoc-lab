// PDF Document Types
export interface PDFDocument {
  id: string;
  filename: string;
  originalName: string;
  uploadedAt: Date;
  status: ProcessingStatus;
  pageCount: number;
  fileSize: number;
  images: PDFImage[];
  metadata?: PDFMetadata;
}

export type ProcessingStatus =
  | 'uploaded'
  | 'extracting'
  | 'generating-alt-text'
  | 'remediating'
  | 'completed'
  | 'error';

export interface PDFImage {
  id: string;
  pageNumber: number;
  index: number;
  width: number;
  height: number;
  format: string;
  dataUrl?: string;
  altText?: string;
  altTextGenerated?: boolean;
}

export interface PDFMetadata {
  title?: string;
  author?: string;
  subject?: string;
  language?: string;
  isTagged?: boolean;
}

// API Request/Response Types
export interface UploadResponse {
  success: boolean;
  document: PDFDocument;
  message?: string;
}

export interface ExtractImagesResponse {
  success: boolean;
  images: PDFImage[];
  message?: string;
}

export interface GenerateAltTextRequest {
  imageId: string;
  imageData: string; // base64
  context?: string;
}

export interface GenerateAltTextResponse {
  success: boolean;
  altText: string;
  confidence?: number;
  message?: string;
}

export interface RemediateRequest {
  documentId: string;
  images: { id: string; altText: string }[];
  metadata?: PDFMetadata;
}

export interface RemediateResponse {
  success: boolean;
  downloadUrl: string;
  report?: AccessibilityReport;
  message?: string;
}

export interface AccessibilityReport {
  documentId: string;
  timestamp: Date;
  imagesProcessed: number;
  altTextsAdded: number;
  metadataAdded: string[];
  wcagLevel: 'A' | 'AA' | 'AAA' | 'partial';
  issues: AccessibilityIssue[];
}

export interface AccessibilityIssue {
  type: 'warning' | 'error';
  code: string;
  message: string;
  location?: string;
}

// Processing Queue Types
export interface ProcessingJob {
  id: string;
  documentId: string;
  status: ProcessingStatus;
  progress: number;
  startedAt: Date;
  completedAt?: Date;
  error?: string;
}

export interface BatchUploadResponse {
  success: boolean;
  documents: PDFDocument[];
  jobId: string;
  message?: string;
}

export interface BatchStatusResponse {
  jobId: string;
  status: 'processing' | 'completed' | 'error';
  progress: number;
  documents: PDFDocument[];
  completedCount: number;
  totalCount: number;
}
