import { useEffect } from 'react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { useNavigate } from 'react-router-dom';

const InstallPWA = () => {
  const { isInstallable, isInstalled, promptInstall } = usePWAInstall();
  const navigate = useNavigate();

  useEffect(() => {
    // Auto-trigger the install prompt when this page loads
    if (isInstallable) {
      const timer = setTimeout(() => {
        promptInstall();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isInstallable, promptInstall]);

  const handleInstallClick = async () => {
    const result = await promptInstall();
    if (result.success) {
      // Navigate to home after successful install
      setTimeout(() => navigate('/'), 1000);
    }
  };

  const handleContinueToApp = () => {
    navigate('/');
  };

  if (isInstalled) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-main px-4">
        <div className="max-w-md w-full bg-dark-card border border-dark-border rounded-2xl p-8 text-center">
          <div className="mb-6">
            <div className="w-24 h-24 mx-auto mb-4 rounded-3xl flex items-center justify-center shadow-lg overflow-hidden relative">
              <img
                src="/icon.png"
                alt="Task Matrix"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-br from-accent-green/20 to-accent-green/30 flex items-center justify-center">
                <svg className="w-12 h-12 text-white drop-shadow-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <h1 className="text-2xl font-bold text-text-primary mb-2">Already Installed!</h1>
            <p className="text-text-secondary">
              Task Matrix is already installed on your device.
            </p>
          </div>

          <button
            onClick={handleContinueToApp}
            className="w-full bg-gradient-to-r from-accent-blue to-accent-purple text-white font-medium py-3 px-6 rounded-xl hover:shadow-lg transition-all duration-200"
          >
            Continue to App
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-main px-4">
      <div className="max-w-md w-full bg-dark-card border border-dark-border rounded-2xl p-8">
        <div className="text-center mb-8">
          <div className="w-24 h-24 mx-auto mb-4 rounded-3xl flex items-center justify-center shadow-lg overflow-hidden">
            <img
              src="/icon.png"
              alt="Task Matrix"
              className="w-full h-full object-cover"
            />
          </div>
          <h1 className="text-2xl font-bold text-text-primary mb-2">Install Task Matrix</h1>
          <p className="text-text-secondary">
            Add Task Matrix to your home screen for quick and easy access.
          </p>
        </div>

        <div className="space-y-4 mb-6">
          <div className="flex items-start gap-3 bg-dark-hover p-4 rounded-xl">
            <div className="flex-shrink-0 w-8 h-8 bg-accent-blue/20 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-accent-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h3 className="text-text-primary font-medium mb-1">Fast Access</h3>
              <p className="text-text-muted text-sm">Launch instantly from your home screen</p>
            </div>
          </div>

          <div className="flex items-start gap-3 bg-dark-hover p-4 rounded-xl">
            <div className="flex-shrink-0 w-8 h-8 bg-accent-purple/20 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-accent-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <div>
              <h3 className="text-text-primary font-medium mb-1">Works Offline</h3>
              <p className="text-text-muted text-sm">Access your tasks even without internet</p>
            </div>
          </div>

          <div className="flex items-start gap-3 bg-dark-hover p-4 rounded-xl">
            <div className="flex-shrink-0 w-8 h-8 bg-accent-green/20 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-accent-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <div>
              <h3 className="text-text-primary font-medium mb-1">Push Notifications</h3>
              <p className="text-text-muted text-sm">Get reminders for your important tasks</p>
            </div>
          </div>
        </div>

        {isInstallable ? (
          <button
            onClick={handleInstallClick}
            className="w-full bg-gradient-to-r from-accent-blue to-accent-purple text-white font-medium py-3 px-6 rounded-xl hover:shadow-lg transition-all duration-200 mb-3"
          >
            Install Now
          </button>
        ) : (
          <div className="bg-dark-hover border border-dark-border rounded-xl p-4 mb-3">
            <p className="text-text-secondary text-sm text-center mb-2">
              To install on iOS:
            </p>
            <ol className="text-text-muted text-sm space-y-1 text-left list-decimal list-inside">
              <li>Tap the Share button in Safari</li>
              <li>Scroll down and tap "Add to Home Screen"</li>
              <li>Tap "Add" in the top right corner</li>
            </ol>
          </div>
        )}

        <button
          onClick={handleContinueToApp}
          className="w-full bg-dark-hover text-text-secondary font-medium py-3 px-6 rounded-xl hover:bg-dark-border transition-all duration-200"
        >
          Continue in Browser
        </button>
      </div>
    </div>
  );
};

export default InstallPWA;
