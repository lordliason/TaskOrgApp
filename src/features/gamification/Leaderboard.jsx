import { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useOrganizationStore } from '../../store/organizationStore';
import { Trophy, TrendingUp, Calendar, Sparkles } from 'lucide-react';

function Leaderboard() {
  const { organization } = useAuthStore();
  const { members, scores, fetchScores, isLoading } = useOrganizationStore();
  const [period, setPeriod] = useState('week'); // 'day', 'week', 'month', 'alltime'

  useEffect(() => {
    if (organization?.id) {
      const days = period === 'day' ? 1 : period === 'week' ? 7 : period === 'month' ? 30 : 365;
      fetchScores(organization.id, days);
    }
  }, [organization?.id, period]);

  // Calculate leaderboard data based on period
  const todayStr = new Date().toISOString().split('T')[0];
  
  const getFilteredScores = () => {
    if (period === 'day') {
      return scores.filter((s) => s.date === todayStr);
    }
    return scores;
  };

  const filteredScores = getFilteredScores();

  const leaderboard = members.map((member) => {
    const userScores = filteredScores.filter((s) => s.user_id === member.id);
    const totalPoints = userScores.reduce((sum, s) => sum + s.points, 0);
    const totalTasks = userScores.reduce((sum, s) => sum + s.tasks_completed, 0);

    return {
      id: member.id,
      displayName: member.display_name,
      color: member.color,
      totalPoints,
      totalTasks,
    };
  }).sort((a, b) => b.totalPoints - a.totalPoints);

  const periods = [
    { id: 'day', label: 'Today' },
    { id: 'week', label: 'This Week' },
    { id: 'month', label: 'This Month' },
    { id: 'alltime', label: 'All Time' },
  ];

  const getRankClass = (index) => {
    if (index === 0) return 'gold';
    if (index === 1) return 'silver';
    if (index === 2) return 'bronze';
    return 'normal';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-blue"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="leaderboard-header">
        <h1 className="font-serif text-2xl text-text-primary flex items-center gap-3 mb-4">
          <Trophy className="h-7 w-7 text-yellow-500" />
          Leaderboard
        </h1>

        {/* Period Selector */}
        <div className="flex gap-2 flex-wrap">
          {periods.map((p) => (
            <button
              key={p.id}
              onClick={() => setPeriod(p.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 border ${
                period === p.id
                  ? 'bg-accent-blue text-white border-accent-blue'
                  : 'bg-dark-card text-text-primary border-dark-border hover:bg-dark-hover'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Leaderboard Content */}
      <div className="space-y-4">
        {leaderboard.length === 0 ? (
          <div className="text-center py-12 text-text-muted">
            <Trophy className="h-16 w-16 mx-auto mb-4 opacity-30" />
            <p className="text-lg">No scores recorded yet</p>
            <p className="text-sm mt-2">Complete tasks to earn points!</p>
          </div>
        ) : (
          leaderboard.map((player, index) => (
            <div
              key={player.id}
              className="leaderboard-entry"
            >
              {/* Rank */}
              <div className={`leaderboard-rank ${getRankClass(index)}`}>
                {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
              </div>

              {/* Player info */}
              <div className="flex items-center gap-4 flex-1">
                {/* Avatar */}
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm"
                  style={{ backgroundColor: player.color }}
                >
                  {player.displayName.charAt(0).toUpperCase()}
                </div>

                {/* Name and stats */}
                <div className="flex-1">
                  <div className="font-semibold text-text-primary text-lg">
                    {player.displayName}
                  </div>
                  <div className="text-sm text-text-muted">
                    {player.totalTasks} tasks completed
                  </div>
                </div>
              </div>

              {/* Points */}
              <div className="text-right">
                <div className="text-2xl font-bold text-text-primary">
                  {player.totalPoints}
                </div>
                <div className="text-xs text-text-muted uppercase tracking-wider">
                  points
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Points Guide */}
      <div className="bg-dark-card border border-dark-border rounded-2xl p-6">
        <h3 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-accent-purple" />
          Points Guide
        </h3>
        <div className="grid grid-cols-5 gap-3 text-center">
          {[
            { size: 'XS', points: 5 },
            { size: 'S', points: 10 },
            { size: 'M', points: 20 },
            { size: 'L', points: 35 },
            { size: 'XL', points: 50 },
          ].map((item) => (
            <div
              key={item.size}
              className="bg-dark-hover border border-dark-border rounded-xl p-3 transition-all duration-200 hover:border-accent-blue"
            >
              <div className="font-bold text-lg text-text-primary">
                {item.size}
              </div>
              <div className="text-sm text-text-muted">
                {item.points} pts
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Streak / Motivation (optional fun addition) */}
      {leaderboard.length > 0 && leaderboard[0].totalPoints > 0 && (
        <div className="bg-gradient-to-r from-accent-blue/10 to-accent-purple/10 border border-dark-border rounded-2xl p-6">
          <div className="flex items-center gap-4">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-lg"
              style={{ backgroundColor: leaderboard[0].color }}
            >
              👑
            </div>
            <div>
              <div className="text-sm text-text-muted uppercase tracking-wider">
                Current Leader
              </div>
              <div className="text-xl font-bold text-text-primary">
                {leaderboard[0].displayName}
              </div>
              <div className="text-sm text-text-secondary">
                {leaderboard[0].totalPoints} points with {leaderboard[0].totalTasks} tasks
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Leaderboard;
