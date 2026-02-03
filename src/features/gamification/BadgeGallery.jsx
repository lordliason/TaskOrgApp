import { useEffect, useState } from 'react';
import { Award, Lock } from 'lucide-react';
import { useGamificationStore } from '../../store/gamificationStore';
import { useAuthStore } from '../../store/authStore';
import { BADGE_CATEGORIES } from '../../lib/constants';

function BadgeGallery({ showAll = true }) {
  const { user, organization } = useAuthStore();
  const { userBadges, allBadges, userStats, fetchUserBadges, fetchAllBadges, fetchUserStats } =
    useGamificationStore();
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    if (user?.id && organization?.id) {
      fetchUserBadges(user.id, organization.id);
      fetchAllBadges();
      fetchUserStats(user.id, organization.id);
    }
  }, [user?.id, organization?.id]);

  const earnedBadgeIds = new Set(userBadges.map((ub) => ub.badge_id));

  const categories = [
    { id: 'all', label: 'All' },
    ...Object.entries(BADGE_CATEGORIES).map(([id, cat]) => ({
      id,
      label: cat.label,
    })),
  ];

  const filteredBadges =
    selectedCategory === 'all'
      ? allBadges
      : allBadges.filter((b) => b.category === selectedCategory);

  const getProgress = (badge) => {
    if (!userStats) return { current: 0, target: badge.requirement_value, percent: 0 };
    const current = userStats[badge.requirement_type] || 0;
    const percent = Math.min(100, (current / badge.requirement_value) * 100);
    return { current, target: badge.requirement_value, percent };
  };

  if (!showAll) {
    // Compact view - just show earned badges
    const recentBadges = userBadges.slice(0, 5);
    if (recentBadges.length === 0) return null;

    return (
      <div className="flex items-center gap-2">
        {recentBadges.map((ub) => (
          <div
            key={ub.id}
            className="w-8 h-8 rounded-full flex items-center justify-center text-lg"
            style={{
              backgroundColor: BADGE_CATEGORIES[ub.badge.category]?.bgColor || 'rgba(139, 92, 246, 0.15)',
              border: `2px solid ${BADGE_CATEGORIES[ub.badge.category]?.color || '#8B5CF6'}`,
            }}
            title={ub.badge.name}
          >
            {ub.badge.icon}
          </div>
        ))}
        {userBadges.length > 5 && (
          <div className="text-sm text-text-muted">+{userBadges.length - 5} more</div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
          <Award className="h-6 w-6 text-accent-purple" />
          Badges & Achievements
        </h2>
        <div className="text-sm text-text-muted">
          <span className="font-semibold text-text-primary">{userBadges.length}</span> /{' '}
          {allBadges.length} earned
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 flex-wrap">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 border ${
              selectedCategory === cat.id
                ? 'bg-accent-purple text-white border-accent-purple'
                : 'bg-dark-card text-text-primary border-dark-border hover:bg-dark-hover'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Badges Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredBadges.map((badge) => {
          const isEarned = earnedBadgeIds.has(badge.id);
          const progress = getProgress(badge);
          const categoryStyle = BADGE_CATEGORIES[badge.category];

          return (
            <div
              key={badge.id}
              className={`relative rounded-2xl p-4 border transition-all duration-300 ${
                isEarned
                  ? 'bg-dark-card border-dark-border hover:border-accent-purple'
                  : 'bg-dark-card/50 border-dark-border/50 opacity-75 hover:opacity-100'
              }`}
            >
              {/* Badge Icon */}
              <div className="flex items-start gap-4">
                <div
                  className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl ${
                    isEarned ? '' : 'grayscale'
                  }`}
                  style={{
                    backgroundColor: isEarned
                      ? categoryStyle?.bgColor
                      : 'rgba(100, 100, 100, 0.15)',
                    border: `2px solid ${isEarned ? categoryStyle?.color : '#666'}`,
                  }}
                >
                  {isEarned ? badge.icon : <Lock className="h-6 w-6 text-text-muted" />}
                </div>

                <div className="flex-1 min-w-0">
                  <h3
                    className={`font-semibold ${
                      isEarned ? 'text-text-primary' : 'text-text-muted'
                    }`}
                  >
                    {badge.name}
                  </h3>
                  <p className="text-sm text-text-muted line-clamp-2">{badge.description}</p>
                </div>
              </div>

              {/* Progress Bar (for unearned badges) */}
              {!isEarned && (
                <div className="mt-4">
                  <div className="flex justify-between text-xs text-text-muted mb-1">
                    <span>
                      {progress.current} / {progress.target}
                    </span>
                    <span>{Math.round(progress.percent)}%</span>
                  </div>
                  <div className="h-1.5 bg-dark-hover rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${progress.percent}%`,
                        backgroundColor: categoryStyle?.color || '#8B5CF6',
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Points Bonus */}
              {badge.points_bonus > 0 && (
                <div className="absolute top-3 right-3 text-xs font-semibold text-accent-purple">
                  +{badge.points_bonus} pts
                </div>
              )}

              {/* Earned indicator */}
              {isEarned && (
                <div
                  className="absolute -top-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-white text-xs"
                  style={{ backgroundColor: categoryStyle?.color || '#8B5CF6' }}
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={3}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filteredBadges.length === 0 && (
        <div className="text-center py-12 text-text-muted">
          <Award className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>No badges in this category yet</p>
        </div>
      )}
    </div>
  );
}

export default BadgeGallery;
