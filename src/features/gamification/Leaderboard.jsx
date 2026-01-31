import { useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useOrganizationStore } from '../../store/organizationStore';
import { Trophy, Medal, Award, TrendingUp } from 'lucide-react';

function Leaderboard() {
  const { organization } = useAuthStore();
  const { members, scores, fetchScores, isLoading } = useOrganizationStore();

  useEffect(() => {
    if (organization?.id) {
      fetchScores(organization.id, 7); // Last 7 days
    }
  }, [organization?.id]);

  // Calculate leaderboard data
  const leaderboard = members.map((member) => {
    const userScores = scores.filter((s) => s.user_id === member.id);
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

  // Get today's scores
  const todayStr = new Date().toISOString().split('T')[0];
  const todayScores = members.map((member) => {
    const todayScore = scores.find(
      (s) => s.user_id === member.id && s.date === todayStr
    );
    return {
      id: member.id,
      displayName: member.display_name,
      color: member.color,
      points: todayScore?.points || 0,
      tasks: todayScore?.tasks_completed || 0,
    };
  }).sort((a, b) => b.points - a.points);

  const getRankIcon = (index) => {
    switch (index) {
      case 0:
        return <Trophy className="h-6 w-6 text-yellow-500" />;
      case 1:
        return <Medal className="h-6 w-6 text-gray-400" />;
      default:
        return <Award className="h-6 w-6 text-amber-600" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Trophy className="h-6 w-6 text-yellow-500" />
        <h2 className="text-xl font-semibold text-gray-900">Leaderboard</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Weekly standings */}
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary-600" />
            This Week
          </h3>
          
          {leaderboard.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No scores recorded yet
            </p>
          ) : (
            <div className="space-y-4">
              {leaderboard.map((player, index) => (
                <div
                  key={player.id}
                  className={`flex items-center gap-4 p-3 rounded-lg ${
                    index === 0 ? 'bg-yellow-50' : 'bg-gray-50'
                  }`}
                >
                  {/* Rank */}
                  <div className="flex-shrink-0">
                    {getRankIcon(index)}
                  </div>

                  {/* Avatar */}
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                    style={{ backgroundColor: player.color }}
                  >
                    {player.displayName.charAt(0).toUpperCase()}
                  </div>

                  {/* Name and stats */}
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">
                      {player.displayName}
                    </div>
                    <div className="text-sm text-gray-500">
                      {player.totalTasks} tasks completed
                    </div>
                  </div>

                  {/* Points */}
                  <div className="text-right">
                    <div className="text-2xl font-bold text-primary-600">
                      {player.totalPoints}
                    </div>
                    <div className="text-xs text-gray-500">points</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Today's scores */}
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-4">Today</h3>
          
          {todayScores.every((s) => s.points === 0) ? (
            <p className="text-gray-500 text-center py-8">
              No tasks completed today yet
            </p>
          ) : (
            <div className="space-y-4">
              {todayScores.map((player, index) => (
                <div
                  key={player.id}
                  className="flex items-center gap-4 p-3 rounded-lg bg-gray-50"
                >
                  {/* Rank number */}
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-bold text-sm">
                    {index + 1}
                  </div>

                  {/* Avatar */}
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                    style={{ backgroundColor: player.color }}
                  >
                    {player.displayName.charAt(0).toUpperCase()}
                  </div>

                  {/* Name */}
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">
                      {player.displayName}
                    </div>
                    <div className="text-sm text-gray-500">
                      {player.tasks} tasks
                    </div>
                  </div>

                  {/* Points */}
                  <div className="text-xl font-bold text-gray-900">
                    {player.points} pts
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Points guide */}
      <div className="card">
        <h3 className="font-semibold text-gray-900 mb-3">Points Guide</h3>
        <div className="grid grid-cols-5 gap-4 text-center">
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="font-bold text-lg">XS</div>
            <div className="text-sm text-gray-500">5 pts</div>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="font-bold text-lg">S</div>
            <div className="text-sm text-gray-500">10 pts</div>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="font-bold text-lg">M</div>
            <div className="text-sm text-gray-500">20 pts</div>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="font-bold text-lg">L</div>
            <div className="text-sm text-gray-500">35 pts</div>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="font-bold text-lg">XL</div>
            <div className="text-sm text-gray-500">50 pts</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Leaderboard;
