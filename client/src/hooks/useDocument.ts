import { useState, useEffect, useCallback } from 'react';
import pdfApi from '../services/api';
import type { PDFDocument, PDFImage } from '@shared/types';

interface UseDocumentResult {
  document: PDFDocument | null;
  images: PDFImage[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  extractImages: () => Promise<void>;
  generateAltText: (imageId: string) => Promise<void>;
  generateAllAltTexts: () => Promise<void>;
  updateImage: (imageId: string, altText: string) => void;
}

export function useDocument(documentId: string | undefined): UseDocumentResult {
  const [document, setDocument] = useState<PDFDocument | null>(null);
  const [images, setImages] = useState<PDFImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!documentId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await pdfApi.getDocument(documentId);
      if (response.success) {
        setDocument(response.document);
        setImages(response.document.images);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load document');
    } finally {
      setLoading(false);
    }
  }, [documentId]);

  const extractImages = useCallback(async () => {
    if (!documentId) return;

    try {
      const response = await pdfApi.extractImages(documentId);
      if (response.success) {
        setImages(response.images);
        setDocument(prev => prev ? { ...prev, images: response.images } : null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to extract images');
    }
  }, [documentId]);

  const generateAltText = useCallback(async (imageId: string) => {
    const image = images.find(img => img.id === imageId);
    if (!image?.dataUrl) return;

    try {
      const response = await pdfApi.generateAltText(image.dataUrl);
      if (response.success) {
        setImages(prev => prev.map(img =>
          img.id === imageId
            ? { ...img, altText: response.altText, altTextGenerated: true }
            : img
        ));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate alt-text');
    }
  }, [images]);

  const generateAllAltTexts = useCallback(async () => {
    if (!documentId) return;

    try {
      const response = await pdfApi.generateAllAltTexts(documentId);
      if (response.success) {
        setImages(response.images);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate alt-texts');
    }
  }, [documentId]);

  const updateImage = useCallback((imageId: string, altText: string) => {
    setImages(prev => prev.map(img =>
      img.id === imageId ? { ...img, altText } : img
    ));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    document,
    images,
    loading,
    error,
    refresh,
    extractImages,
    generateAltText,
    generateAllAltTexts,
    updateImage
  };
}
