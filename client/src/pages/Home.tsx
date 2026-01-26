import { useState, useEffect } from 'react';
import FileUpload from '../components/FileUpload';
import pdfApi from '../services/api';

export default function Home() {
  const [error, setError] = useState<string | null>(null);
  const [ollamaStatus, setOllamaStatus] = useState<{
    connected: boolean;
    modelAvailable: boolean;
  } | null>(null);

  useEffect(() => {
    // Check Ollama status on mount
    pdfApi.checkOllamaStatus()
      .then(setOllamaStatus)
      .catch(() => setOllamaStatus({ connected: false, modelAvailable: false }));
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl">
          PDF Accessibility Remediation
        </h1>
        <p className="mt-4 text-xl text-gray-600 max-w-2xl mx-auto">
          Make your PDFs accessible with AI-powered alt-text generation and WCAG 2.2 AA compliance features.
        </p>
      </div>

      {/* Ollama Status Banner */}
      {ollamaStatus && !ollamaStatus.connected && (
        <div className="mb-8 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-start">
            <svg className="h-5 w-5 text-amber-600 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-amber-800">Ollama not detected</h3>
              <p className="mt-1 text-sm text-amber-700">
                AI alt-text generation requires Ollama with the llava model. Run:
              </p>
              <pre className="mt-2 text-xs bg-amber-100 p-2 rounded">
                brew install ollama && ollama serve && ollama pull llava
              </pre>
            </div>
          </div>
        </div>
      )}

      {ollamaStatus?.connected && !ollamaStatus.modelAvailable && (
        <div className="mb-8 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-start">
            <svg className="h-5 w-5 text-amber-600 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-amber-800">llava model not found</h3>
              <p className="mt-1 text-sm text-amber-700">
                The llava vision model is required for AI alt-text generation. Run:
              </p>
              <pre className="mt-2 text-xs bg-amber-100 p-2 rounded">ollama pull llava</pre>
            </div>
          </div>
        </div>
      )}

      {ollamaStatus?.connected && ollamaStatus.modelAvailable && (
        <div className="mb-8 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center">
            <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="ml-2 text-sm font-medium text-green-800">
              AI ready - Ollama with llava model connected
            </span>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <svg className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="ml-2 text-sm font-medium text-red-800">{error}</span>
          </div>
        </div>
      )}

      {/* Upload Section */}
      <FileUpload
        onError={setError}
        multiple={true}
      />

      {/* Features Section */}
      <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-primary-100">
            <svg className="h-6 w-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="mt-4 text-lg font-semibold text-gray-900">Image Extraction</h3>
          <p className="mt-2 text-gray-600">
            Automatically extract all images from your PDF documents for alt-text processing.
          </p>
        </div>

        <div className="text-center">
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-primary-100">
            <svg className="h-6 w-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h3 className="mt-4 text-lg font-semibold text-gray-900">AI Alt-Text</h3>
          <p className="mt-2 text-gray-600">
            Generate descriptive alt-text using local AI (Ollama + llava) - no cloud required.
          </p>
        </div>

        <div className="text-center">
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-primary-100">
            <svg className="h-6 w-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h3 className="mt-4 text-lg font-semibold text-gray-900">WCAG Compliance</h3>
          <p className="mt-2 text-gray-600">
            Add accessibility metadata to meet WCAG 2.2 AA guidelines.
          </p>
        </div>
      </div>

      {/* How It Works */}
      <div className="mt-16">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">How It Works</h2>
        <div className="flex flex-col md:flex-row items-center justify-center space-y-4 md:space-y-0 md:space-x-8">
          <div className="flex items-center">
            <span className="flex items-center justify-center h-8 w-8 rounded-full bg-primary-600 text-white font-bold">1</span>
            <span className="ml-3 text-gray-700">Upload PDF</span>
          </div>
          <svg className="hidden md:block h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <div className="flex items-center">
            <span className="flex items-center justify-center h-8 w-8 rounded-full bg-primary-600 text-white font-bold">2</span>
            <span className="ml-3 text-gray-700">Extract Images</span>
          </div>
          <svg className="hidden md:block h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <div className="flex items-center">
            <span className="flex items-center justify-center h-8 w-8 rounded-full bg-primary-600 text-white font-bold">3</span>
            <span className="ml-3 text-gray-700">Generate Alt-Text</span>
          </div>
          <svg className="hidden md:block h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <div className="flex items-center">
            <span className="flex items-center justify-center h-8 w-8 rounded-full bg-primary-600 text-white font-bold">4</span>
            <span className="ml-3 text-gray-700">Download Accessible PDF</span>
          </div>
        </div>
      </div>
    </div>
  );
}
