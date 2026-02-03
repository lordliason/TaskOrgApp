import { createContext, useContext, useState, useCallback, memo } from 'react';
import { CheckCircle2, AlertCircle, Info, X, AlertTriangle } from 'lucide-react';

// Toast context
const ToastContext = createContext(null);

// Toast types configuration
const toastConfig = {
  success: {
    icon: CheckCircle2,
    bgClass: 'bg-emerald-500/10 border-emerald-500/30',
    iconClass: 'text-emerald-400',
    progressClass: 'bg-emerald-400',
  },
  error: {
    icon: AlertCircle,
    bgClass: 'bg-red-500/10 border-red-500/30',
    iconClass: 'text-red-400',
    progressClass: 'bg-red-400',
  },
  warning: {
    icon: AlertTriangle,
    bgClass: 'bg-amber-500/10 border-amber-500/30',
    iconClass: 'text-amber-400',
    progressClass: 'bg-amber-400',
  },
  info: {
    icon: Info,
    bgClass: 'bg-accent-blue/10 border-accent-blue/30',
    iconClass: 'text-accent-blue',
    progressClass: 'bg-accent-blue',
  },
};

// Individual toast component
const ToastItem = memo(function ToastItem({ toast, onDismiss }) {
  const config = toastConfig[toast.type] || toastConfig.info;
  const Icon = config.icon;

  return (
    <div
      className={`toast-enter flex items-start gap-3 p-4 rounded-xl border backdrop-blur-xl shadow-lg min-w-[300px] max-w-[400px] ${config.bgClass}`}
      role="alert"
    >
      <Icon className={`h-5 w-5 flex-shrink-0 mt-0.5 ${config.iconClass}`} />

      <div className="flex-1 min-w-0">
        {toast.title && (
          <div className="font-semibold text-text-primary text-sm mb-0.5">
            {toast.title}
          </div>
        )}
        <div className="text-sm text-text-secondary">{toast.message}</div>

        {/* Action button */}
        {toast.action && (
          <button
            onClick={() => {
              toast.action.onClick();
              onDismiss(toast.id);
            }}
            className="mt-2 text-sm font-medium text-accent-blue hover:text-accent-blue/80 transition-colors"
          >
            {toast.action.label}
          </button>
        )}
      </div>

      <button
        onClick={() => onDismiss(toast.id)}
        className="p-1 text-text-muted hover:text-text-primary rounded-lg hover:bg-white/5 transition-colors flex-shrink-0"
      >
        <X className="h-4 w-4" />
      </button>

      {/* Progress bar for auto-dismiss */}
      {toast.duration > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 overflow-hidden rounded-b-xl">
          <div
            className={`h-full ${config.progressClass} toast-progress`}
            style={{ animationDuration: `${toast.duration}ms` }}
          />
        </div>
      )}
    </div>
  );
});

// Toast container component
const ToastContainer = memo(function ToastContainer({ toasts, onDismiss }) {
  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
});

// Toast provider component
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback(({
    type = 'info',
    title,
    message,
    duration = 4000,
    action,
  }) => {
    const id = Date.now() + Math.random();

    setToasts((prev) => [...prev, { id, type, title, message, duration, action }]);

    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }

    return id;
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback({
    success: (message, options = {}) =>
      addToast({ type: 'success', message, ...options }),
    error: (message, options = {}) =>
      addToast({ type: 'error', message, ...options }),
    warning: (message, options = {}) =>
      addToast({ type: 'warning', message, ...options }),
    info: (message, options = {}) =>
      addToast({ type: 'info', message, ...options }),
    dismiss: dismissToast,
  }, [addToast, dismissToast]);

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </ToastContext.Provider>
  );
}

// Hook to use toast
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

export default ToastProvider;
