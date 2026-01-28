import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ImageList from '../components/ImageList';
import AltTextEditor from '../components/AltTextEditor';
import ProgressIndicator from '../components/ProgressIndicator';
import pdfApi from '../services/api';
import type { PDFDocument, PDFImage, PDFMetadata, AccessibilityReport } from '@shared/types';

export default function Process() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [document, setDocument] = useState<PDFDocument | null>(null);
  const [images, setImages] = useState<PDFImage[]>([]);
  const [selectedImage, setSelectedImage] = useState<PDFImage | null>(null);
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [isGeneratingAll, setIsGeneratingAll] = useState(false);
  const [isRemediating, setIsRemediating] = useState(false);
  const [report, setReport] = useState<AccessibilityReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [metadata, setMetadata] = useState<PDFMetadata>({
    title: '',
    author: '',
    subject: '',
    language: 'en'
  });

  // Load document on mount
  useEffect(() => {
    if (!id) {
      navigate('/');
      return;
    }

    loadDocument();
  }, [id]);

  const loadDocument = async () => {
    if (!id) return;

    try {
      const response = await pdfApi.getDocument(id);
      if (response.success) {
        setDocument(response.document);
        setImages(response.document.images);

        // Set metadata if available
        if (response.document.metadata) {
          setMetadata(prev => ({
            ...prev,
            ...response.document.metadata
          }));
        }
      }
    } catch (err) {
      setError('Failed to load document');
    }
  };

  const extractImages = async () => {
    if (!id) return;

    try {
      setDocument(prev => prev ? { ...prev, status: 'extracting' } : null);
      const response = await pdfApi.extractImages(id);

      if (response.success) {
        setImages(response.images);
        setDocument(prev => prev ? { ...prev, images: response.images, status: 'uploaded' } : null);
      }
    } catch (err) {
      setError('Failed to extract images');
      setDocument(prev => prev ? { ...prev, status: 'error' } : null);
    }
  };

  const generateAltText = async (imageId: string) => {
    const image = images.find(img => img.id === imageId);
    if (!image?.dataUrl) return;

    setGeneratingId(imageId);
    try {
      const response = await pdfApi.generateAltText(image.dataUrl);
      if (response.success) {
        setImages(prev => prev.map(img =>
          img.id === imageId
            ? { ...img, altText: response.altText, altTextGenerated: true }
            : img
        ));

        // Update selected image if it's the one we generated for
        if (selectedImage?.id === imageId) {
          setSelectedImage(prev => prev ? { ...prev, altText: response.altText, altTextGenerated: true } : null);
        }
      }
    } catch (err) {
      setError('Failed to generate alt-text. AI vision service unavailable.');
    } finally {
      setGeneratingId(null);
    }
  };

  const generateAllAltTexts = async () => {
    if (!id) return;

    setIsGeneratingAll(true);
    setDocument(prev => prev ? { ...prev, status: 'generating-alt-text' } : null);

    try {
      const response = await pdfApi.generateAllAltTexts(id);
      if (response.success) {
        setImages(response.images);
        setDocument(prev => prev ? { ...prev, images: response.images, status: 'uploaded' } : null);
      }
    } catch (err) {
      setError('Failed to generate alt-texts. AI vision service unavailable.');
      setDocument(prev => prev ? { ...prev, status: 'error' } : null);
    } finally {
      setIsGeneratingAll(false);
    }
  };

  const saveAltText = useCallback((imageId: string, altText: string) => {
    setImages(prev => prev.map(img =>
      img.id === imageId ? { ...img, altText } : img
    ));

    if (selectedImage?.id === imageId) {
      setSelectedImage(prev => prev ? { ...prev, altText } : null);
    }
  }, [selectedImage]);

  const remediate = async () => {
    if (!id) return;

    setIsRemediating(true);
    setDocument(prev => prev ? { ...prev, status: 'remediating' } : null);

    try {
      const imageAltTexts = images.map(img => ({
        id: img.id,
        altText: img.altText || ''
      }));

      const response = await pdfApi.remediate(id, imageAltTexts, metadata);

      if (response.success) {
        setReport(response.report || null);
        setDocument(prev => prev ? { ...prev, status: 'completed' } : null);
      }
    } catch (err) {
      setError('Failed to remediate PDF');
      setDocument(prev => prev ? { ...prev, status: 'error' } : null);
    } finally {
      setIsRemediating(false);
    }
  };

  const downloadPdf = () => {
    if (!id) return;
    window.location.href = pdfApi.getDownloadUrl(id);
  };

  if (!document) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate('/')}
          className="text-sm text-gray-600 hover:text-gray-900 flex items-center mb-4"
        >
          <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Upload
        </button>
        <h1 className="text-2xl font-bold text-gray-900">{document.originalName}</h1>
        <p className="text-gray-600">
          {document.pageCount} pages | {(document.fileSize / 1024 / 1024).toFixed(2)} MB
        </p>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between">
          <div className="flex items-center">
            <svg className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="ml-2 text-sm font-medium text-red-800">{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-red-600 hover:text-red-800">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Image List */}
        <div className="lg:col-span-1">
          <ImageList
            images={images}
            selectedImageId={selectedImage?.id}
            onSelectImage={setSelectedImage}
            onGenerateAltText={generateAltText}
            generatingId={generatingId || undefined}
          />

          {images.length === 0 && document.status === 'uploaded' && (
            <button
              onClick={extractImages}
              className="mt-4 w-full btn-primary"
            >
              Extract Images
            </button>
          )}

          {images.length > 0 && (
            <button
              onClick={generateAllAltTexts}
              disabled={isGeneratingAll}
              className="mt-4 w-full btn-secondary"
            >
              {isGeneratingAll ? 'Generating...' : 'Generate All Alt-Text'}
            </button>
          )}
        </div>

        {/* Middle Column - Editor */}
        <div className="lg:col-span-1">
          <AltTextEditor
            image={selectedImage}
            onSave={saveAltText}
            onGenerateAltText={generateAltText}
            isGenerating={generatingId === selectedImage?.id}
          />

          {/* Metadata Section */}
          <div className="card mt-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Document Metadata</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  value={metadata.title || ''}
                  onChange={e => setMetadata(prev => ({ ...prev, title: e.target.value }))}
                  className="input"
                  placeholder="Document title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Author</label>
                <input
                  type="text"
                  value={metadata.author || ''}
                  onChange={e => setMetadata(prev => ({ ...prev, author: e.target.value }))}
                  className="input"
                  placeholder="Document author"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
                <select
                  value={metadata.language || 'en'}
                  onChange={e => setMetadata(prev => ({ ...prev, language: e.target.value }))}
                  className="input"
                >
                  <option value="en">English</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                  <option value="de">German</option>
                  <option value="it">Italian</option>
                  <option value="pt">Portuguese</option>
                  <option value="zh">Chinese</option>
                  <option value="ja">Japanese</option>
                  <option value="ko">Korean</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Progress & Actions */}
        <div className="lg:col-span-1">
          <ProgressIndicator status={document.status} />

          {/* Action Buttons */}
          <div className="card mt-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Actions</h2>
            <div className="space-y-3">
              <button
                onClick={remediate}
                disabled={isRemediating || document.status === 'completed'}
                className="w-full btn-primary"
              >
                {isRemediating ? 'Processing...' : 'Remediate PDF'}
              </button>

              {document.status === 'completed' && (
                <button
                  onClick={downloadPdf}
                  className="w-full btn-secondary flex items-center justify-center"
                >
                  <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download Accessible PDF
                </button>
              )}
            </div>
          </div>

          {/* Accessibility Report */}
          {report && (
            <div className="card mt-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Accessibility Report</h2>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">WCAG Level</span>
                  <span className={`px-2 py-1 rounded text-sm font-medium ${
                    report.wcagLevel === 'AA' ? 'bg-green-100 text-green-800' :
                    report.wcagLevel === 'A' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {report.wcagLevel}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Images Processed</span>
                  <span className="text-sm font-medium">{report.imagesProcessed}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Alt-Texts Added</span>
                  <span className="text-sm font-medium">{report.altTextsAdded}</span>
                </div>

                {report.metadataAdded.length > 0 && (
                  <div>
                    <span className="text-sm text-gray-600">Metadata Added:</span>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {report.metadataAdded.map(item => (
                        <span key={item} className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded">
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {report.issues.length > 0 && (
                  <div>
                    <span className="text-sm text-gray-600">Issues ({report.issues.length}):</span>
                    <ul className="mt-2 space-y-1">
                      {report.issues.map((issue, idx) => (
                        <li key={idx} className={`text-sm ${
                          issue.type === 'error' ? 'text-red-600' : 'text-amber-600'
                        }`}>
                          {issue.message}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
