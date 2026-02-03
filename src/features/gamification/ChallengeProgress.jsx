import { useEffect } from 'react';
import { Target, Trophy, Clock, Sparkles } from 'lucide-react';
import { useGamificationStore } from '../../store/gamificationStore';
import { useAuthStore } from '../../store/authStore';

function ChallengeProgress({ compact = false }) {
  const { organization } = useAuthStore();
  const { activeChallenge, fetchActiveChallenge } = useGamificationStore();

  useEffect(() => {
    if (organization?.id) {
      fetchActiveChallenge(organization.id);
    }
  }, [organization?.id]);

  if (!activeChallenge) return null;

  const progress = Math.min(100, (activeChallenge.current_value / activeChallenge.target_value) * 100);
  const isCompleted = activeChallenge.is_completed;

  // Calculate days remaining
  const endDate = new Date(activeChallenge.end_date);
  const today = new Date();
  const daysRemaining = Math.max(0, Math.ceil((endDate - today) / (1000 * 60 * 60 * 24)));

  if (compact) {
    return (
      <div
        className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border transition-all duration-300 ${
          isCompleted
            ? 'bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/30'
            : 'bg-dark-card border-dark-border hover:border-accent-purple/30'
        }`}
      >
        <div
          className={`w-8 h-8 rounded-lg flex items-center justify-center ${
            isCompleted ? 'bg-green-500/20' : 'bg-accent-purple/20'
          }`}
        >
          {isCompleted ? (
            <Trophy className="h-4 w-4 text-green-400" />
          ) : (
            <Target className="h-4 w-4 text-accent-purple" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-text-primary truncate">
            {activeChallenge.title}
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-dark-hover rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  isCompleted ? 'bg-green-500' : 'bg-accent-purple'
                }`}
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-xs text-text-muted whitespace-nowrap">
              {activeChallenge.current_value}/{activeChallenge.target_value}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`rounded-2xl p-5 border transition-all duration-300 ${
        isCompleted
          ? 'bg-gradient-to-br from-green-500/10 via-emerald-500/5 to-transparent border-green-500/30'
          : 'bg-dark-card border-dark-border'
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              isCompleted
                ? 'bg-gradient-to-br from-green-500 to-emerald-600'
                : 'bg-gradient-to-br from-accent-purple to-accent-blue'
            }`}
          >
            {isCompleted ? (
              <Trophy className="h-6 w-6 text-white" />
            ) : (
              <Target className="h-6 w-6 text-white" />
            )}
          </div>
          <div>
            <div className="text-xs uppercase tracking-wider text-text-muted mb-0.5">
              Weekly Challenge
            </div>
            <h3 className="font-bold text-lg text-text-primary">{activeChallenge.title}</h3>
          </div>
        </div>

        {!isCompleted && (
          <div className="flex items-center gap-1.5 text-text-muted">
            <Clock className="h-4 w-4" />
            <span className="text-sm">{daysRemaining}d left</span>
          </div>
        )}
      </div>

      {/* Description */}
      <p className="text-text-secondary text-sm mb-4">{activeChallenge.description}</p>

      {/* Progress */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-text-muted">Progress</span>
          <span className="text-sm font-semibold text-text-primary">
            {activeChallenge.current_value} / {activeChallenge.target_value}
          </span>
        </div>
        <div className="h-3 bg-dark-hover rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ease-out ${
              isCompleted
                ? 'bg-gradient-to-r from-green-500 to-emerald-400'
                : 'bg-gradient-to-r from-accent-purple to-accent-blue'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Reward */}
      <div
        className={`flex items-center justify-between p-3 rounded-xl ${
          isCompleted ? 'bg-green-500/10' : 'bg-dark-hover/50'
        }`}
      >
        <div className="flex items-center gap-2">
          <Sparkles
            className={`h-4 w-4 ${isCompleted ? 'text-green-400' : 'text-accent-purple'}`}
          />
          <span className="text-sm text-text-secondary">Team Reward</span>
        </div>
        <div
          className={`font-bold ${
            isCompleted ? 'text-green-400' : 'text-text-primary'
          }`}
        >
          {isCompleted ? 'Claimed!' : `+${activeChallenge.reward_points} pts each`}
        </div>
      </div>

      {/* Completed banner */}
      {isCompleted && (
        <div className="mt-4 text-center">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/20 text-green-400 text-sm font-semibold">
            <Trophy className="h-4 w-4" />
            Challenge Complete!
          </span>
        </div>
      )}
    </div>
  );
}

export default ChallengeProgress;
