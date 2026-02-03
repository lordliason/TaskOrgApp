import { useState, useEffect } from 'react';
import { useOnboardingStore, ONBOARDING_STEPS } from '../../store/onboardingStore';
import { useAuthStore } from '../../store/authStore';
import { useNotificationStore } from '../../store/notificationStore';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { LayoutGrid, Calendar, Trophy, ChevronRight, Sparkles, Bell, BellRing, Download, Smartphone, Share, Plus, Check } from 'lucide-react';

function OnboardingFlow() {
  const { currentStep, nextStep, skipOnboarding } = useOnboardingStore();
  const { profile, organization } = useAuthStore();
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Slight delay for smooth entrance
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleNext = () => {
    setIsExiting(true);
    setTimeout(() => {
      nextStep();
      setIsExiting(false);
    }, 300);
  };

  const handleSkip = () => {
    setIsExiting(true);
    setTimeout(() => {
      skipOnboarding();
    }, 300);
  };

  if (currentStep === ONBOARDING_STEPS.COMPLETED) {
    return null;
  }

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center p-4 transition-opacity duration-300 ${
        isVisible && !isExiting ? 'opacity-100' : 'opacity-0'
      }`}
      style={{
        background: 'rgba(10, 10, 12, 0.9)',
        backdropFilter: 'blur(8px)',
      }}
    >
      <div
        className={`relative w-full max-w-md transition-all duration-500 ease-out ${
          isVisible && !isExiting
            ? 'translate-y-0 scale-100 opacity-100'
            : 'translate-y-4 scale-95 opacity-0'
        }`}
      >
        {currentStep === ONBOARDING_STEPS.WELCOME && (
          <WelcomeStep
            displayName={profile?.displayName}
            orgName={organization?.name}
            onNext={handleNext}
            onSkip={handleSkip}
          />
        )}

        {currentStep === ONBOARDING_STEPS.QUICK_TOUR && (
          <QuickTourStep onNext={handleNext} onSkip={handleSkip} />
        )}

        {currentStep === ONBOARDING_STEPS.NOTIFICATIONS && (
          <NotificationsStep onNext={handleNext} onSkip={handleSkip} />
        )}

        {currentStep === ONBOARDING_STEPS.ADD_TO_HOME && (
          <AddToHomeStep onNext={handleNext} onSkip={handleSkip} />
        )}
      </div>
    </div>
  );
}

function WelcomeStep({ displayName, orgName, onNext, onSkip }) {
  const firstName = displayName?.split(' ')[0] || 'there';

  return (
    <div className="card text-center">
      {/* Subtle gradient orb */}
      <div
        className="absolute -top-20 left-1/2 -translate-x-1/2 w-40 h-40 rounded-full opacity-30 blur-3xl pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(167, 139, 250, 0.6), rgba(74, 158, 255, 0.4))',
        }}
      />

      <div className="relative">
        <div className="mb-6">
          <span className="text-4xl">
            <Sparkles className="w-10 h-10 mx-auto text-purple-400 opacity-80" />
          </span>
        </div>

        <h1 className="text-2xl font-semibold text-text-primary mb-2">
          Welcome, {firstName}
        </h1>

        <p className="text-text-secondary mb-8 leading-relaxed">
          {orgName ? `${orgName} is ready.` : 'Your workspace is ready.'}{' '}
          <span className="text-text-muted">
            Take a quick look around?
          </span>
        </p>

        <div className="flex flex-col gap-3">
          <button
            onClick={onNext}
            className="btn btn-primary w-full flex items-center justify-center gap-2"
          >
            Show me around
            <ChevronRight className="w-4 h-4" />
          </button>

          <button
            onClick={onSkip}
            className="text-text-muted text-sm hover:text-text-secondary transition-colors py-2"
          >
            Skip, I'll explore myself
          </button>
        </div>
      </div>

      {/* Progress indicator */}
      <div className="flex justify-center gap-2 mt-8">
        <div className="w-6 h-1 rounded-full bg-purple-500/80" />
        <div className="w-6 h-1 rounded-full bg-dark-hover" />
        <div className="w-6 h-1 rounded-full bg-dark-hover" />
        <div className="w-6 h-1 rounded-full bg-dark-hover" />
      </div>
    </div>
  );
}

function QuickTourStep({ onNext, onSkip }) {
  const [activeFeature, setActiveFeature] = useState(0);

  const features = [
    {
      icon: LayoutGrid,
      title: 'Matrix View',
      description: 'Prioritize tasks by urgency and importance. Drag to reposition.',
      color: 'text-emerald-400',
    },
    {
      icon: Calendar,
      title: 'Daily Planner',
      description: 'Focus on what matters today. AI can help plan your day.',
      color: 'text-blue-400',
    },
    {
      icon: Trophy,
      title: 'Leaderboard',
      description: 'Track progress with your team. Complete tasks to earn points.',
      color: 'text-amber-400',
    },
  ];

  // Auto-cycle through features
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % features.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="card">
      <h2 className="text-xl font-semibold text-text-primary mb-6 text-center">
        Three ways to stay organized
      </h2>

      <div className="space-y-3 mb-8">
        {features.map((feature, index) => {
          const Icon = feature.icon;
          const isActive = index === activeFeature;

          return (
            <button
              key={feature.title}
              onClick={() => setActiveFeature(index)}
              className={`w-full flex items-start gap-4 p-4 rounded-2xl text-left transition-all duration-300 ${
                isActive
                  ? 'bg-dark-hover/80 border border-white/10'
                  : 'bg-transparent border border-transparent hover:bg-dark-hover/40'
              }`}
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
                  isActive ? 'bg-dark-card scale-110' : 'bg-dark-hover/50'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? feature.color : 'text-text-muted'}`} />
              </div>

              <div className="flex-1 min-w-0">
                <h3
                  className={`font-medium transition-colors duration-300 ${
                    isActive ? 'text-text-primary' : 'text-text-secondary'
                  }`}
                >
                  {feature.title}
                </h3>
                <p
                  className={`text-sm mt-0.5 transition-all duration-300 ${
                    isActive
                      ? 'text-text-secondary opacity-100 max-h-20'
                      : 'text-text-muted opacity-0 max-h-0 overflow-hidden'
                  }`}
                >
                  {feature.description}
                </p>
              </div>

              <div
                className={`w-2 h-2 rounded-full mt-3 transition-all duration-300 ${
                  isActive ? 'bg-purple-400 scale-100' : 'bg-dark-hover scale-0'
                }`}
              />
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-3">
        <button
          onClick={onNext}
          className="btn btn-primary w-full flex items-center justify-center gap-2"
        >
          Get started
          <ChevronRight className="w-4 h-4" />
        </button>

        <button
          onClick={onSkip}
          className="text-text-muted text-sm hover:text-text-secondary transition-colors py-2"
        >
          Skip
        </button>
      </div>

      {/* Progress indicator */}
      <div className="flex justify-center gap-2 mt-8">
        <div className="w-6 h-1 rounded-full bg-dark-hover" />
        <div className="w-6 h-1 rounded-full bg-emerald-500/80" />
        <div className="w-6 h-1 rounded-full bg-dark-hover" />
        <div className="w-6 h-1 rounded-full bg-dark-hover" />
      </div>
    </div>
  );
}

function NotificationsStep({ onNext, onSkip }) {
  const [isEnabling, setIsEnabling] = useState(false);
  const [permissionResult, setPermissionResult] = useState(null);
  const { initializeNotifications, requestPermission, isSupported, permissionStatus } = useNotificationStore();

  useEffect(() => {
    initializeNotifications();
  }, [initializeNotifications]);

  const handleEnableNotifications = async () => {
    setIsEnabling(true);
    const result = await requestPermission();
    setPermissionResult(result);
    setIsEnabling(false);

    // Auto-advance after successful permission
    if (result.success || result.permission === 'granted') {
      setTimeout(() => onNext(), 1000);
    }
  };

  const alreadyGranted = permissionStatus === 'granted';
  const wasDenied = permissionResult?.permission === 'denied' || permissionStatus === 'denied';

  return (
    <div className="card text-center">
      {/* Gradient orb */}
      <div
        className="absolute -top-20 left-1/2 -translate-x-1/2 w-40 h-40 rounded-full opacity-30 blur-3xl pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(251, 146, 60, 0.6), rgba(239, 68, 68, 0.4))',
        }}
      />

      <div className="relative">
        <div className="mb-6">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-orange-500/20 to-red-500/20 flex items-center justify-center">
            {alreadyGranted || permissionResult?.success ? (
              <BellRing className="w-8 h-8 text-orange-400" />
            ) : (
              <Bell className="w-8 h-8 text-orange-400" />
            )}
          </div>
        </div>

        <h2 className="text-xl font-semibold text-text-primary mb-2">
          {alreadyGranted || permissionResult?.success ? 'Notifications enabled!' : 'Stay in the loop'}
        </h2>

        <p className="text-text-secondary mb-6 leading-relaxed">
          {alreadyGranted || permissionResult?.success ? (
            "You'll get reminders for due tasks, daily summaries, and team updates."
          ) : wasDenied ? (
            <>
              Notifications were blocked. You can enable them later in your browser settings.
            </>
          ) : !isSupported ? (
            "Your browser doesn't support push notifications. You can still use the app!"
          ) : (
            <>
              Get notified about <span className="text-text-primary">due dates</span>,{' '}
              <span className="text-text-primary">daily summaries</span>, and{' '}
              <span className="text-text-primary">team updates</span>.
            </>
          )}
        </p>

        {/* Benefits list */}
        {!alreadyGranted && !permissionResult?.success && !wasDenied && isSupported && (
          <div className="space-y-3 mb-8 text-left">
            {[
              { text: 'Due date reminders 24 hours ahead', icon: '⏰' },
              { text: 'Daily task summary each morning', icon: '📋' },
              { text: 'Alerts for urgent assignments', icon: '🔔' },
            ].map((item, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-3 rounded-xl bg-dark-hover/50"
              >
                <span className="text-lg">{item.icon}</span>
                <span className="text-sm text-text-secondary">{item.text}</span>
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-col gap-3">
          {alreadyGranted || permissionResult?.success ? (
            <button
              onClick={onNext}
              className="btn btn-primary w-full flex items-center justify-center gap-2"
            >
              Continue
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : wasDenied || !isSupported ? (
            <button
              onClick={onNext}
              className="btn btn-primary w-full flex items-center justify-center gap-2"
            >
              Continue anyway
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <>
              <button
                onClick={handleEnableNotifications}
                disabled={isEnabling}
                className="btn btn-primary w-full flex items-center justify-center gap-2"
              >
                {isEnabling ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Enabling...
                  </>
                ) : (
                  <>
                    <Bell className="w-4 h-4" />
                    Enable notifications
                  </>
                )}
              </button>
              <button
                onClick={onSkip}
                className="text-text-muted text-sm hover:text-text-secondary transition-colors py-2"
              >
                Maybe later
              </button>
            </>
          )}
        </div>
      </div>

      {/* Progress indicator */}
      <div className="flex justify-center gap-2 mt-8">
        <div className="w-6 h-1 rounded-full bg-dark-hover" />
        <div className="w-6 h-1 rounded-full bg-dark-hover" />
        <div className="w-6 h-1 rounded-full bg-orange-500/80" />
        <div className="w-6 h-1 rounded-full bg-dark-hover" />
      </div>
    </div>
  );
}

function AddToHomeStep({ onNext, onSkip }) {
  const { isInstallable, isInstalled, promptInstall } = usePWAInstall();
  const [isInstalling, setIsInstalling] = useState(false);
  const [installResult, setInstallResult] = useState(null);

  // Detect iOS
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

  const handleInstall = async () => {
    setIsInstalling(true);
    const result = await promptInstall();
    setInstallResult(result);
    setIsInstalling(false);

    if (result.success) {
      setTimeout(() => onNext(), 1500);
    }
  };

  const showSuccess = isInstalled || installResult?.success;

  return (
    <div className="card text-center">
      {/* Gradient orb */}
      <div
        className="absolute -top-20 left-1/2 -translate-x-1/2 w-40 h-40 rounded-full opacity-30 blur-3xl pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(59, 130, 246, 0.6), rgba(147, 51, 234, 0.4))',
        }}
      />

      <div className="relative">
        <div className="mb-6">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
            {showSuccess ? (
              <Check className="w-8 h-8 text-green-400" />
            ) : (
              <Smartphone className="w-8 h-8 text-blue-400" />
            )}
          </div>
        </div>

        <h2 className="text-xl font-semibold text-text-primary mb-2">
          {showSuccess ? 'Added to home screen!' : 'Add to home screen'}
        </h2>

        <p className="text-text-secondary mb-6 leading-relaxed">
          {showSuccess ? (
            "Task Matrix is now just one tap away on your home screen."
          ) : (
            "Get fast access like a native app. Works offline too!"
          )}
        </p>

        {/* Benefits */}
        {!showSuccess && !isIOS && (
          <div className="space-y-3 mb-8 text-left">
            {[
              { text: 'Launch instantly from home screen', icon: <Download className="w-4 h-4 text-blue-400" /> },
              { text: 'Works offline', icon: <Smartphone className="w-4 h-4 text-purple-400" /> },
              { text: 'Full screen experience', icon: <LayoutGrid className="w-4 h-4 text-emerald-400" /> },
            ].map((item, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-3 rounded-xl bg-dark-hover/50"
              >
                {item.icon}
                <span className="text-sm text-text-secondary">{item.text}</span>
              </div>
            ))}
          </div>
        )}

        {/* iOS Instructions */}
        {isIOS && !showSuccess && (
          <div className="mb-8 text-left">
            <p className="text-sm text-text-muted mb-4">To add to your home screen:</p>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-dark-hover/50">
                <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                  <Share className="w-4 h-4 text-blue-400" />
                </div>
                <span className="text-sm text-text-secondary">
                  Tap the <span className="text-text-primary">Share</span> button in Safari
                </span>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-dark-hover/50">
                <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                  <Plus className="w-4 h-4 text-purple-400" />
                </div>
                <span className="text-sm text-text-secondary">
                  Select <span className="text-text-primary">"Add to Home Screen"</span>
                </span>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-dark-hover/50">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                  <Check className="w-4 h-4 text-emerald-400" />
                </div>
                <span className="text-sm text-text-secondary">
                  Tap <span className="text-text-primary">"Add"</span> to confirm
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-3">
          {showSuccess ? (
            <button
              onClick={onNext}
              className="btn btn-primary w-full flex items-center justify-center gap-2"
            >
              Get started
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : isIOS ? (
            <button
              onClick={onNext}
              className="btn btn-primary w-full flex items-center justify-center gap-2"
            >
              I've added it
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : isInstallable ? (
            <>
              <button
                onClick={handleInstall}
                disabled={isInstalling}
                className="btn btn-primary w-full flex items-center justify-center gap-2"
              >
                {isInstalling ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Installing...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    Add to home screen
                  </>
                )}
              </button>
              <button
                onClick={onSkip}
                className="text-text-muted text-sm hover:text-text-secondary transition-colors py-2"
              >
                Skip for now
              </button>
            </>
          ) : (
            <button
              onClick={onNext}
              className="btn btn-primary w-full flex items-center justify-center gap-2"
            >
              Continue
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Progress indicator */}
      <div className="flex justify-center gap-2 mt-8">
        <div className="w-6 h-1 rounded-full bg-dark-hover" />
        <div className="w-6 h-1 rounded-full bg-dark-hover" />
        <div className="w-6 h-1 rounded-full bg-dark-hover" />
        <div className="w-6 h-1 rounded-full bg-blue-500/80" />
      </div>
    </div>
  );
}

export default OnboardingFlow;
