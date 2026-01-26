import type { PDFImage } from '@shared/types';

interface ImageListProps {
  images: PDFImage[];
  selectedImageId?: string;
  onSelectImage: (image: PDFImage) => void;
  onGenerateAltText?: (imageId: string) => void;
  generatingId?: string;
}

export default function ImageList({
  images,
  selectedImageId,
  onSelectImage,
  onGenerateAltText,
  generatingId
}: ImageListProps) {
  if (images.length === 0) {
    return (
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Extracted Images</h2>
        <div className="text-center py-8 text-gray-500">
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
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <p className="mt-2">No images found in this PDF</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">
          Extracted Images ({images.length})
        </h2>
      </div>

      <div className="space-y-3 max-h-[500px] overflow-y-auto">
        {images.map((image) => (
          <div
            key={image.id}
            onClick={() => onSelectImage(image)}
            className={`
              p-3 rounded-lg border cursor-pointer transition-all
              ${selectedImageId === image.id
                ? 'border-primary-500 bg-primary-50'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }
            `}
          >
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-16 h-16 bg-gray-100 rounded flex items-center justify-center overflow-hidden">
                {image.dataUrl ? (
                  <img
                    src={image.dataUrl}
                    alt={image.altText || 'Extracted image'}
                    className="max-w-full max-h-full object-contain"
                  />
                ) : (
                  <svg
                    className="h-8 w-8 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-900">
                    Page {image.pageNumber}, Image {image.index + 1}
                  </p>
                  <span className="text-xs text-gray-500">
                    {image.width}x{image.height}
                  </span>
                </div>

                {image.altText ? (
                  <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                    {image.altText}
                  </p>
                ) : (
                  <p className="mt-1 text-sm text-amber-600 italic">
                    No alt-text
                  </p>
                )}

                {image.altTextGenerated && (
                  <span className="inline-flex items-center mt-1 px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                    AI Generated
                  </span>
                )}
              </div>

              {onGenerateAltText && !image.altTextGenerated && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onGenerateAltText(image.id);
                  }}
                  disabled={generatingId === image.id}
                  className="flex-shrink-0 p-2 text-primary-600 hover:bg-primary-50 rounded"
                  title="Generate alt-text with AI"
                >
                  {generatingId === image.id ? (
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
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
                  ) : (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                  )}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
