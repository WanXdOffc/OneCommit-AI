import { connectDB } from '@/lib/db';
import Score from '@/models/Score';

/**
 * Get event leaderboard
 * GET /api/event/leaderboard?eventId=xxx&limit=10
 */
export async function GET(request) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');
    const limit = parseInt(searchParams.get('limit')) || 10;
    
    if (!eventId) {
      return Response.json(
        { error: 'Event ID is required' },
        { status: 400 }
      );
    }
    
    // Get leaderboard
    const leaderboard = await Score.getLeaderboard(eventId, limit);
    
    // Format response
    const formattedLeaderboard = leaderboard.map((score, index) => ({
      rank: score.rank || index + 1,
      user: {
        id: score.user._id,
        name: score.user.name,
        githubUsername: score.user.githubUsername,
        avatar: score.user.avatar
      },
      repo: {
        id: score.repo._id,
        name: score.repo.repoName,
        url: score.repo.githubUrl
      },
      stats: {
        totalCommits: score.totalCommits,
        validCommits: score.validCommits,
        totalScore: score.totalScore,
        averageScore: score.averageScorePerCommit || 0,
        averageQuality: score.stats.averageQuality.toFixed(2)
      },
      breakdown: score.breakdown,
      achievements: score.achievements,
      percentile: score.percentile
    }));
    
    return Response.json({
      success: true,
      leaderboard: formattedLeaderboard,
      total: formattedLeaderboard.length
    });
    
  } catch (error) {
    console.error('❌ Get leaderboard error:', error);
    return Response.json(
      { error: error.message || 'Failed to get leaderboard' },
      { status: 500 }
    );
  }
}