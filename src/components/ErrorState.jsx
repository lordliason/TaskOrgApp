import { memo } from 'react';
import { AlertCircle, RefreshCw, WifiOff } from 'lucide-react';

// Reusable error state component with retry functionality
const ErrorState = memo(function ErrorState({
  title = 'Something went wrong',
  message,
  onRetry,
  isRetrying = false,
  isOffline = false,
  compact = false,
}) {
  const Icon = isOffline ? WifiOff : AlertCircle;

  if (compact) {
    return (
      <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
        <Icon className="h-5 w-5 text-red-400 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm text-red-400">{message || title}</p>
        </div>
        {onRetry && (
          <button
            onClick={onRetry}
            disabled={isRetrying}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRetrying ? 'animate-spin' : ''}`} />
            {isRetrying ? 'Retrying...' : 'Retry'}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
        <Icon className="h-8 w-8 text-red-400" />
      </div>

      <h3 className="text-lg font-semibold text-text-primary mb-2">
        {isOffline ? 'You are offline' : title}
      </h3>

      <p className="text-sm text-text-secondary max-w-sm mb-6">
        {message || (isOffline
          ? 'Please check your internet connection and try again.'
          : 'An error occurred while loading the data. Please try again.'
        )}
      </p>

      {onRetry && (
        <button
          onClick={onRetry}
          disabled={isRetrying}
          className="btn btn-primary flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isRetrying ? 'animate-spin' : ''}`} />
          {isRetrying ? 'Retrying...' : 'Try Again'}
        </button>
      )}
    </div>
  );
});

// Empty state component
export const EmptyState = memo(function EmptyState({
  icon: Icon,
  title,
  message,
  action,
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      {Icon && (
        <div className="w-16 h-16 rounded-full bg-dark-hover flex items-center justify-center mb-4">
          <Icon className="h-8 w-8 text-text-muted" />
        </div>
      )}

      <h3 className="text-lg font-semibold text-text-primary mb-2">{title}</h3>

      {message && (
        <p className="text-sm text-text-secondary max-w-sm mb-6">{message}</p>
      )}

      {action && (
        <button onClick={action.onClick} className="btn btn-primary">
          {action.label}
        </button>
      )}
    </div>
  );
});

export default ErrorState;
