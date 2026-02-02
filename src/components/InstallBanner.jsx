import { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';

const InstallBanner = () => {
  const { isInstallable, promptInstall } = usePWAInstall();
  const [isDismissed, setIsDismissed] = useState(() => {
    return localStorage.getItem('installBannerDismissed') === 'true';
  });

  const handleInstall = async () => {
    const result = await promptInstall();
    if (result.success) {
      setIsDismissed(true);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem('installBannerDismissed', 'true');
  };

  if (!isInstallable || isDismissed) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-accent-blue to-accent-purple p-4 shadow-lg">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1">
          <div className="hidden sm:flex w-10 h-10 bg-white/20 rounded-lg items-center justify-center flex-shrink-0">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-medium text-sm sm:text-base">
              Install Task Matrix
            </p>
            <p className="text-white/90 text-xs sm:text-sm">
              Get quick access from your home screen
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleInstall}
            className="bg-white text-accent-blue font-medium px-4 py-2 rounded-lg hover:bg-white/90 transition-colors text-sm whitespace-nowrap"
          >
            Install
          </button>
          <button
            onClick={handleDismiss}
            className="text-white hover:bg-white/10 p-2 rounded-lg transition-colors"
            aria-label="Dismiss"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default InstallBanner;
