import { useEffect } from 'react';
import { Trophy, Flame, Target, Award, TrendingUp } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useGamificationStore } from '../../store/gamificationStore';
import StreakDisplay from './StreakDisplay';
import BadgeGallery from './BadgeGallery';
import ChallengeProgress from './ChallengeProgress';
import Leaderboard from './Leaderboard';

function GamificationHub() {
  const { user, organization } = useAuthStore();
  const { initializeGamification, userStats, userStreak, userBadges, isLoading } =
    useGamificationStore();

  useEffect(() => {
    if (user?.id && organization?.id) {
      initializeGamification(user.id, organization.id);
    }
  }, [user?.id, organization?.id]);

  // Quick stats for the overview cards
  const stats = [
    {
      icon: Flame,
      label: 'Current Streak',
      value: userStreak?.current_streak || 0,
      suffix: 'days',
      color: 'text-orange-400',
      bgColor: 'bg-orange-400/10',
    },
    {
      icon: Award,
      label: 'Badges Earned',
      value: userBadges?.length || 0,
      suffix: 'badges',
      color: 'text-purple-400',
      bgColor: 'bg-purple-400/10',
    },
    {
      icon: Target,
      label: 'Tasks Completed',
      value: userStats?.total_tasks_completed || 0,
      suffix: 'total',
      color: 'text-blue-400',
      bgColor: 'bg-blue-400/10',
    },
    {
      icon: TrendingUp,
      label: 'Total Points',
      value: userStats?.total_points_earned || 0,
      suffix: 'pts',
      color: 'text-green-400',
      bgColor: 'bg-green-400/10',
    },
  ];

  return (
    <div className="space-y-8 view-transition-enter">
      {/* Header */}
      <div>
        <h1 className="font-serif text-2xl text-text-primary flex items-center gap-3 mb-2">
          <Trophy className="h-7 w-7 text-yellow-500" />
          Gamification Hub
        </h1>
        <p className="text-text-muted">Track your progress, earn badges, and compete with your team</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-dark-card border border-dark-border rounded-2xl p-4 hover:border-dark-border/80 transition-all duration-300"
          >
            <div className={`w-10 h-10 rounded-xl ${stat.bgColor} flex items-center justify-center mb-3`}>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </div>
            <div className="text-2xl font-bold text-text-primary">{stat.value}</div>
            <div className="text-sm text-text-muted">{stat.suffix}</div>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Streak Display */}
          <StreakDisplay />

          {/* Weekly Challenge */}
          <ChallengeProgress />
        </div>

        {/* Right Column - Leaderboard */}
        <Leaderboard />
      </div>

      {/* Badges Section */}
      <BadgeGallery showAll={true} />
    </div>
  );
}

export default GamificationHub;
