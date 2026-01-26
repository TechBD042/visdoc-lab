import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useNavigate } from 'react-router-dom';
import pdfApi from '../services/api';

interface FileUploadProps {
  onUploadStart?: () => void;
  onUploadComplete?: (documentId: string) => void;
  onError?: (error: string) => void;
  multiple?: boolean;
}

export default function FileUpload({
  onUploadStart,
  onUploadComplete,
  onError,
  multiple = false
}: FileUploadProps) {
  const navigate = useNavigate();
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    setUploading(true);
    setUploadProgress(0);
    onUploadStart?.();

    try {
      if (multiple && acceptedFiles.length > 1) {
        // Batch upload
        const response = await pdfApi.uploadBatch(acceptedFiles);
        if (response.success) {
          const ids = response.documents.map(d => d.id);
          setUploadedFiles(prev => [...prev, ...ids]);
          // Navigate to first document for now
          navigate(`/process/${ids[0]}`);
        }
      } else {
        // Single upload
        const file = acceptedFiles[0];
        const response = await pdfApi.upload(file);

        if (response.success) {
          setUploadedFiles(prev => [...prev, response.document.id]);
          onUploadComplete?.(response.document.id);
          navigate(`/process/${response.document.id}`);
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Upload failed';
      onError?.(message);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  }, [multiple, navigate, onUploadStart, onUploadComplete, onError]);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    multiple,
    disabled: uploading
  });

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div
        {...getRootProps()}
        className={`
          relative border-2 border-dashed rounded-xl p-12 text-center cursor-pointer
          transition-all duration-200 ease-in-out
          ${isDragActive && !isDragReject
            ? 'border-primary-500 bg-primary-50'
            : isDragReject
            ? 'border-red-500 bg-red-50'
            : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'
          }
          ${uploading ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input {...getInputProps()} />

        <div className="space-y-4">
          <div className="flex justify-center">
            <svg
              className={`h-16 w-16 ${isDragActive ? 'text-primary-500' : 'text-gray-400'}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
          </div>

          {uploading ? (
            <div className="space-y-2">
              <p className="text-lg font-medium text-gray-700">Uploading...</p>
              <div className="w-48 mx-auto bg-gray-200 rounded-full h-2">
                <div
                  className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          ) : isDragActive ? (
            <p className="text-lg font-medium text-primary-600">
              Drop your PDF{multiple ? 's' : ''} here
            </p>
          ) : (
            <>
              <p className="text-lg font-medium text-gray-700">
                Drag & drop PDF{multiple ? 's' : ''} here
              </p>
              <p className="text-sm text-gray-500">
                or <span className="text-primary-600 hover:text-primary-700">browse</span> to upload
              </p>
            </>
          )}

          {isDragReject && (
            <p className="text-sm text-red-600">
              Only PDF files are accepted
            </p>
          )}
        </div>
      </div>

      <p className="mt-4 text-center text-sm text-gray-500">
        Maximum file size: 100MB {multiple && '| Up to 20 files'}
      </p>

      {uploadedFiles.length > 0 && (
        <div className="mt-6">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Recently uploaded:</h3>
          <ul className="space-y-1">
            {uploadedFiles.map(id => (
              <li key={id} className="text-sm text-primary-600 hover:text-primary-700">
                <a href={`/process/${id}`}>Document {id.slice(0, 8)}...</a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
