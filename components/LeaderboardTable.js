export default function LeaderboardTable({ leaderboard, showAchievements = false }) {
  const medals = ['🥇', '🥈', '🥉'];

  if (!leaderboard || leaderboard.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        No leaderboard data available yet
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-700">
            <th className="text-left py-3 px-4 text-gray-400 font-medium">Rank</th>
            <th className="text-left py-3 px-4 text-gray-400 font-medium">User</th>
            <th className="text-right py-3 px-4 text-gray-400 font-medium">Score</th>
            <th className="text-right py-3 px-4 text-gray-400 font-medium">Commits</th>
            <th className="text-right py-3 px-4 text-gray-400 font-medium">Avg Quality</th>
            {showAchievements && (
              <th className="text-right py-3 px-4 text-gray-400 font-medium">Achievements</th>
            )}
          </tr>
        </thead>
        <tbody>
          {leaderboard.map((entry, index) => (
            <tr 
              key={entry._id || index} 
              className={`border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors ${
                index < 3 ? 'bg-slate-700/20' : ''
              }`}
            >
              <td className="py-4 px-4">
                <div className="flex items-center space-x-2">
                  {index < 3 ? (
                    <span className="text-2xl">{medals[index]}</span>
                  ) : (
                    <span className="text-gray-400 font-semibold">#{entry.rank || index + 1}</span>
                  )}
                </div>
              </td>
              <td className="py-4 px-4">
                <div className="flex items-center space-x-3">
                  {entry.user?.avatar && (
                    <img 
                      src={entry.user.avatar} 
                      alt={entry.user.name}
                      className="w-10 h-10 rounded-full"
                    />
                  )}
                  <div>
                    <div className="font-semibold text-white">{entry.user?.name || 'Unknown'}</div>
                    {entry.user?.githubUsername && (
                      <div className="text-sm text-gray-500">@{entry.user.githubUsername}</div>
                    )}
                  </div>
                </div>
              </td>
              <td className="py-4 px-4 text-right">
                <div className="text-xl font-bold text-white">
                  {entry.stats?.totalScore || entry.totalScore || 0}
                </div>
                {entry.stats?.averageScore && (
                  <div className="text-xs text-gray-500">
                    {entry.stats.averageScore} avg
                  </div>
                )}
              </td>
              <td className="py-4 px-4 text-right">
                <div className="text-white font-semibold">
                  {entry.stats?.totalCommits || entry.totalCommits || 0}
                </div>
                {entry.stats?.validCommits && (
                  <div className="text-xs text-gray-500">
                    {entry.stats.validCommits} valid
                  </div>
                )}
              </td>
              <td className="py-4 px-4 text-right">
                <div className="text-white font-semibold">
                  {entry.stats?.averageQuality || 0}
                </div>
              </td>
              {showAchievements && entry.achievements && (
                <td className="py-4 px-4 text-right">
                  <div className="flex justify-end space-x-1">
                    {entry.achievements.slice(0, 3).map((ach, i) => (
                      <span key={i} className="text-lg" title={ach.type}>
                        🏆
                      </span>
                    ))}
                    {entry.achievements.length > 3 && (
                      <span className="text-xs text-gray-400">+{entry.achievements.length - 3}</span>
                    )}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}