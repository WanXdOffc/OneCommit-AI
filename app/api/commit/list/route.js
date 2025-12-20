import { connectDB } from '@/lib/db';
import Commit from '@/models/Commit';

/**
 * List commits with filters
 * GET /api/commit/list?eventId=xxx&repoId=xxx&userId=xxx&limit=20
 */
export async function GET(request) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');
    const repoId = searchParams.get('repoId');
    const userId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit')) || 50;
    const page = parseInt(searchParams.get('page')) || 1;
    const sortBy = searchParams.get('sortBy') || 'timestamp'; // timestamp, score
    const order = searchParams.get('order') === 'asc' ? 1 : -1;
    
    // Build query
    const query = { isValid: true };
    
    if (eventId) {
      query.event = eventId;
    }
    
    if (repoId) {
      query.repo = repoId;
    }
    
    if (userId) {
      query.user = userId;
    }
    
    // Build sort
    const sort = {};
    if (sortBy === 'score') {
      sort['score.total'] = order;
    } else {
      sort.timestamp = order;
    }
    
    // Get total count
    const total = await Commit.countDocuments(query);
    
    // Get commits
    const commits = await Commit.find(query)
      .populate('user', 'name email githubUsername avatar')
      .populate('repo', 'repoName fullName githubUrl')
      .sort(sort)
      .limit(limit)
      .skip((page - 1) * limit)
      .select('-files') // Exclude large files array
      .lean();
    
    // Format commits
    const formattedCommits = commits.map(commit => ({
      id: commit._id,
      sha: commit.sha,
      message: commit.message,
      author: commit.author,
      timestamp: commit.timestamp,
      url: commit.url,
      stats: commit.stats,
      score: commit.score,
      aiAnalysis: {
        qualityScore: commit.aiAnalysis?.qualityScore || 0,
        category: commit.aiAnalysis?.category || 'other',
        isSpam: commit.aiAnalysis?.isSpam || false
      },
      user: commit.user,
      repo: commit.repo,
      flags: commit.flags
    }));
    
    return Response.json({
      success: true,
      commits: formattedCommits,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
    
  } catch (error) {
    console.error('❌ List commits error:', error);
    return Response.json(
      { error: error.message || 'Failed to list commits' },
      { status: 500 }
    );
  }
}