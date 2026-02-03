import { useEffect, useState, useCallback, memo } from 'react';
import { X } from 'lucide-react';

const Modal = memo(function Modal({ isOpen, onClose, title, children, size = 'md' }) {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  // Handle open/close with animation
  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      // Small delay to trigger enter animation
      requestAnimationFrame(() => {
        setIsAnimating(true);
      });
      document.body.style.overflow = 'hidden';
    } else if (isVisible) {
      setIsAnimating(false);
      // Wait for exit animation before hiding
      const timer = setTimeout(() => {
        setIsVisible(false);
        document.body.style.overflow = 'unset';
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [isOpen, isVisible]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Handle backdrop click
  const handleBackdropClick = useCallback((e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }, [onClose]);

  if (!isVisible) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm ${
          isAnimating ? 'modal-backdrop-enter' : 'modal-backdrop-exit'
        }`}
        onClick={handleBackdropClick}
      />

      {/* Modal */}
      <div
        className="flex min-h-full items-center justify-center p-4"
        style={{
          paddingTop: 'max(1rem, env(safe-area-inset-top))',
          paddingBottom: 'max(1rem, env(safe-area-inset-bottom))'
        }}
        onClick={handleBackdropClick}
      >
        <div
          className={`relative bg-dark-main border border-dark-border rounded-2xl shadow-2xl w-full ${sizeClasses[size]} ${
            isAnimating ? 'modal-content-enter' : 'modal-content-exit'
          }`}
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-dark-border">
            <h3 id="modal-title" className="text-lg font-semibold text-text-primary">
              {title}
            </h3>
            <button
              onClick={onClose}
              className="p-2 text-text-muted hover:text-text-primary rounded-lg hover:bg-dark-hover transition-colors focus-ring touch-feedback"
              aria-label="Close modal"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="px-6 py-5 max-h-[calc(100vh-12rem)] overflow-y-auto">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
});

export default Modal;
