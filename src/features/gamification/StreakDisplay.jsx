import { useEffect } from 'react';
import { Flame, Snowflake } from 'lucide-react';
import { useGamificationStore } from '../../store/gamificationStore';
import { useAuthStore } from '../../store/authStore';
import { getStreakBonus } from '../../lib/constants';

function StreakDisplay({ compact = false }) {
  const { user, organization } = useAuthStore();
  const { userStreak, fetchUserStreak } = useGamificationStore();

  useEffect(() => {
    if (user?.id && organization?.id) {
      fetchUserStreak(user.id, organization.id);
    }
  }, [user?.id, organization?.id]);

  if (!userStreak) return null;

  const currentStreak = userStreak.current_streak || 0;
  const longestStreak = userStreak.longest_streak || 0;
  const freezeTokens = userStreak.streak_freeze_tokens || 0;
  const streakBonus = getStreakBonus(currentStreak);

  if (compact) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-dark-card border border-dark-border">
        <Flame
          className={`h-4 w-4 ${currentStreak >= 3 ? 'text-orange-400' : 'text-text-muted'}`}
        />
        <span className="text-sm font-semibold text-text-primary">{currentStreak}</span>
        {streakBonus.label && (
          <span className="text-xs text-orange-400 font-medium">{streakBonus.label}</span>
        )}
      </div>
    );
  }

  return (
    <div className="bg-dark-card border border-dark-border rounded-2xl p-5">
      {/* Streak Counter */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              currentStreak >= 7
                ? 'bg-gradient-to-br from-orange-500 to-red-500'
                : currentStreak >= 3
                ? 'bg-gradient-to-br from-orange-400 to-orange-600'
                : 'bg-dark-hover'
            }`}
          >
            <Flame className={`h-6 w-6 ${currentStreak >= 3 ? 'text-white' : 'text-text-muted'}`} />
          </div>
          <div>
            <div className="text-3xl font-bold text-text-primary">{currentStreak}</div>
            <div className="text-sm text-text-muted">day streak</div>
          </div>
        </div>

        {streakBonus.label && (
          <div className="text-right">
            <div className="text-lg font-bold text-orange-400">{streakBonus.label}</div>
            <div className="text-xs text-text-muted">bonus points</div>
          </div>
        )}
      </div>

      {/* Streak Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-xs text-text-muted mb-1">
          <span>Progress to next bonus</span>
          <span>
            {currentStreak < 3
              ? `${3 - currentStreak} days to +10%`
              : currentStreak < 7
              ? `${7 - currentStreak} days to +25%`
              : currentStreak < 14
              ? `${14 - currentStreak} days to +35%`
              : currentStreak < 30
              ? `${30 - currentStreak} days to +50%`
              : 'Max bonus!'}
          </span>
        </div>
        <div className="h-2 bg-dark-hover rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-orange-400 to-red-500 rounded-full transition-all duration-500"
            style={{
              width: `${
                currentStreak >= 30
                  ? 100
                  : currentStreak >= 14
                  ? ((currentStreak - 14) / 16) * 100
                  : currentStreak >= 7
                  ? ((currentStreak - 7) / 7) * 100
                  : currentStreak >= 3
                  ? ((currentStreak - 3) / 4) * 100
                  : (currentStreak / 3) * 100
              }%`,
            }}
          />
        </div>
      </div>

      {/* Stats Row */}
      <div className="flex items-center justify-between pt-3 border-t border-dark-border">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-text-muted">Best:</span>
          <span className="font-semibold text-text-primary">{longestStreak} days</span>
        </div>

        {freezeTokens > 0 && (
          <div className="flex items-center gap-2 text-sm">
            <Snowflake className="h-4 w-4 text-blue-400" />
            <span className="text-text-muted">Freeze tokens:</span>
            <span className="font-semibold text-blue-400">{freezeTokens}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default StreakDisplay;
