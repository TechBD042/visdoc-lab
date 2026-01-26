import type { PDFDocument, ProcessingJob } from '../../../shared/types/index.js';

// In-memory store for documents (in production, use a database)
class DocumentStore {
  private documents: Map<string, PDFDocument> = new Map();
  private jobs: Map<string, ProcessingJob> = new Map();

  // Document methods
  set(id: string, document: PDFDocument): void {
    this.documents.set(id, document);
  }

  get(id: string): PDFDocument | undefined {
    return this.documents.get(id);
  }

  update(id: string, updates: Partial<PDFDocument>): PDFDocument | undefined {
    const doc = this.documents.get(id);
    if (doc) {
      const updated = { ...doc, ...updates };
      this.documents.set(id, updated);
      return updated;
    }
    return undefined;
  }

  delete(id: string): boolean {
    return this.documents.delete(id);
  }

  getAll(): PDFDocument[] {
    return Array.from(this.documents.values());
  }

  // Job methods
  setJob(id: string, job: ProcessingJob): void {
    this.jobs.set(id, job);
  }

  getJob(id: string): ProcessingJob | undefined {
    return this.jobs.get(id);
  }

  updateJob(id: string, updates: Partial<ProcessingJob>): ProcessingJob | undefined {
    const job = this.jobs.get(id);
    if (job) {
      const updated = { ...job, ...updates };
      this.jobs.set(id, updated);
      return updated;
    }
    return undefined;
  }
}

export const documentStore = new DocumentStore();
