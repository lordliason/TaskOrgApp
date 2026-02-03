import { useState, useEffect } from 'react';
import { useOnboardingStore, ONBOARDING_STEPS } from '../../store/onboardingStore';
import { useAuthStore } from '../../store/authStore';
import { LayoutGrid, Calendar, Trophy, ChevronRight, Sparkles } from 'lucide-react';

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
        <div className="w-8 h-1 rounded-full bg-purple-500/80" />
        <div className="w-8 h-1 rounded-full bg-dark-hover" />
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
        <div className="w-8 h-1 rounded-full bg-dark-hover" />
        <div className="w-8 h-1 rounded-full bg-purple-500/80" />
      </div>
    </div>
  );
}

export default OnboardingFlow;
