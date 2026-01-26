import { useState, useEffect } from 'react';
import type { PDFImage } from '@shared/types';

interface AltTextEditorProps {
  image: PDFImage | null;
  onSave: (imageId: string, altText: string) => void;
  onGenerateAltText: (imageId: string) => void;
  isGenerating: boolean;
}

export default function AltTextEditor({
  image,
  onSave,
  onGenerateAltText,
  isGenerating
}: AltTextEditorProps) {
  const [altText, setAltText] = useState('');
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (image) {
      setAltText(image.altText || '');
      setIsDirty(false);
    }
  }, [image]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setAltText(e.target.value);
    setIsDirty(e.target.value !== (image?.altText || ''));
  };

  const handleSave = () => {
    if (image && isDirty) {
      onSave(image.id, altText);
      setIsDirty(false);
    }
  };

  if (!image) {
    return (
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Alt-Text Editor</h2>
        <div className="text-center py-12 text-gray-500">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"
            />
          </svg>
          <p className="mt-2">Select an image to edit its alt-text</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Alt-Text Editor</h2>

      <div className="space-y-4">
        {/* Image Preview */}
        <div className="bg-gray-100 rounded-lg p-4 flex items-center justify-center">
          {image.dataUrl ? (
            <img
              src={image.dataUrl}
              alt={image.altText || 'Selected image'}
              className="max-w-full max-h-48 object-contain"
            />
          ) : (
            <div className="h-48 flex items-center justify-center text-gray-400">
              <svg className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
          )}
        </div>

        {/* Image Info */}
        <div className="text-sm text-gray-600">
          <span className="font-medium">Page {image.pageNumber}</span>
          <span className="mx-2">|</span>
          <span>Image {image.index + 1}</span>
          <span className="mx-2">|</span>
          <span>{image.width}x{image.height}px</span>
        </div>

        {/* Alt-text Input */}
        <div>
          <label
            htmlFor="alt-text"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Alternative Text
          </label>
          <textarea
            id="alt-text"
            value={altText}
            onChange={handleChange}
            rows={4}
            className="input resize-none"
            placeholder="Describe this image for screen readers..."
          />
          <p className="mt-1 text-xs text-gray-500">
            {altText.length} characters | Aim for 125 characters or less
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => onGenerateAltText(image.id)}
            disabled={isGenerating}
            className="btn-secondary inline-flex items-center"
          >
            {isGenerating ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Generating...
              </>
            ) : (
              <>
                <svg className="-ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
                Generate with AI
              </>
            )}
          </button>

          <button
            onClick={handleSave}
            disabled={!isDirty}
            className="btn-primary disabled:opacity-50"
          >
            Save Changes
          </button>
        </div>

        {image.altTextGenerated && (
          <p className="text-xs text-green-600 flex items-center">
            <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Alt-text generated by AI
          </p>
        )}
      </div>
    </div>
  );
}
