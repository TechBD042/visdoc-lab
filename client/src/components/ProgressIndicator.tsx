import type { ProcessingStatus } from '@shared/types';

interface ProgressIndicatorProps {
  status: ProcessingStatus;
  progress?: number;
}

const statusConfig: Record<ProcessingStatus, { label: string; color: string; icon: string }> = {
  uploaded: {
    label: 'Uploaded',
    color: 'bg-blue-500',
    icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
  },
  extracting: {
    label: 'Extracting Images',
    color: 'bg-yellow-500',
    icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z'
  },
  'generating-alt-text': {
    label: 'Generating Alt-Text',
    color: 'bg-purple-500',
    icon: 'M13 10V3L4 14h7v7l9-11h-7z'
  },
  remediating: {
    label: 'Remediating PDF',
    color: 'bg-orange-500',
    icon: 'M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z'
  },
  completed: {
    label: 'Completed',
    color: 'bg-green-500',
    icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
  },
  error: {
    label: 'Error',
    color: 'bg-red-500',
    icon: 'M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
  }
};

const steps: ProcessingStatus[] = ['uploaded', 'extracting', 'generating-alt-text', 'remediating', 'completed'];

export default function ProgressIndicator({ status, progress }: ProgressIndicatorProps) {
  const currentStepIndex = steps.indexOf(status);
  const config = statusConfig[status];

  return (
    <div className="card">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Processing Status</h2>

      {/* Current Status Badge */}
      <div className="flex items-center mb-6">
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium text-white ${config.color}`}>
          <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={config.icon} />
          </svg>
          {config.label}
        </span>
        {progress !== undefined && progress > 0 && progress < 100 && (
          <span className="ml-3 text-sm text-gray-600">{progress}%</span>
        )}
      </div>

      {/* Progress Steps */}
      <div className="relative">
        {/* Progress Line */}
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />

        <div className="space-y-4">
          {steps.map((step, index) => {
            const stepConfig = statusConfig[step];
            const isCompleted = index < currentStepIndex;
            const isCurrent = index === currentStepIndex;
            const isPending = index > currentStepIndex;

            return (
              <div key={step} className="relative flex items-center">
                {/* Step Circle */}
                <div
                  className={`
                    relative z-10 flex items-center justify-center w-8 h-8 rounded-full
                    ${isCompleted ? 'bg-green-500' : isCurrent ? stepConfig.color : 'bg-gray-200'}
                  `}
                >
                  {isCompleted ? (
                    <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : isCurrent && status !== 'completed' && status !== 'error' ? (
                    <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                  ) : (
                    <span className={`text-xs font-medium ${isPending ? 'text-gray-500' : 'text-white'}`}>
                      {index + 1}
                    </span>
                  )}
                </div>

                {/* Step Label */}
                <span
                  className={`
                    ml-4 text-sm font-medium
                    ${isCompleted ? 'text-green-600' : isCurrent ? 'text-gray-900' : 'text-gray-400'}
                  `}
                >
                  {stepConfig.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Progress Bar (for current step) */}
      {progress !== undefined && status !== 'completed' && status !== 'error' && (
        <div className="mt-6">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>Progress</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${config.color}`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
