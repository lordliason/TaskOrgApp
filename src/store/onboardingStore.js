import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const ONBOARDING_STEPS = {
  WELCOME: 'welcome',
  QUICK_TOUR: 'quick_tour',
  COMPLETED: 'completed',
};

export const useOnboardingStore = create(
  persist(
    (set, get) => ({
      // Current step in onboarding
      currentStep: ONBOARDING_STEPS.WELCOME,

      // Has user completed onboarding
      hasCompletedOnboarding: false,

      // Track if this is user's first task
      hasCreatedFirstTask: false,

      // Show celebration for first task completion
      showFirstTaskCelebration: false,

      // Track first task completion
      hasCompletedFirstTask: false,

      // Move to next step
      nextStep: () => {
        const { currentStep } = get();

        if (currentStep === ONBOARDING_STEPS.WELCOME) {
          set({ currentStep: ONBOARDING_STEPS.QUICK_TOUR });
        } else if (currentStep === ONBOARDING_STEPS.QUICK_TOUR) {
          set({
            currentStep: ONBOARDING_STEPS.COMPLETED,
            hasCompletedOnboarding: true
          });
        }
      },

      // Skip onboarding entirely
      skipOnboarding: () => {
        set({
          currentStep: ONBOARDING_STEPS.COMPLETED,
          hasCompletedOnboarding: true
        });
      },

      // Mark first task as created
      markFirstTaskCreated: () => {
        const { hasCreatedFirstTask } = get();
        if (!hasCreatedFirstTask) {
          set({ hasCreatedFirstTask: true });
        }
      },

      // Trigger first task completion celebration
      triggerFirstTaskCelebration: () => {
        const { hasCompletedFirstTask } = get();
        if (!hasCompletedFirstTask) {
          set({
            showFirstTaskCelebration: true,
            hasCompletedFirstTask: true
          });

          // Auto-hide after animation
          setTimeout(() => {
            set({ showFirstTaskCelebration: false });
          }, 2500);
        }
      },

      // Reset onboarding (for testing)
      resetOnboarding: () => {
        set({
          currentStep: ONBOARDING_STEPS.WELCOME,
          hasCompletedOnboarding: false,
          hasCreatedFirstTask: false,
          showFirstTaskCelebration: false,
          hasCompletedFirstTask: false,
        });
      },
    }),
    {
      name: 'onboarding-storage',
    }
  )
);

export { ONBOARDING_STEPS };
