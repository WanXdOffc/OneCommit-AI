import { connectDB } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { getRepositoryInfo, parseGithubUrl } from '@/lib/github';
import { getRepoCommitStats } from '@/lib/commitProcessor';
import Repo from '@/models/Repo';
import Commit from '@/models/Commit';

/**
 * Get repository details
 * GET /api/repo/[id]
 */
export async function GET(request, { params }) {
  try {
    await connectDB();
    
    const { id } = params;
    
    if (!id) {
      return Response.json(
        { error: 'Repository ID is required' },
        { status: 400 }
      );
    }
    
    // Find repository
    const repo = await Repo.findById(id)
      .populate('user', 'name email githubUsername avatar')
      .populate('event', 'name status startTime endTime')
      .lean();
    
    if (!repo) {
      return Response.json(
        { error: 'Repository not found' },
        { status: 404 }
      );
    }
    
    // Get commit stats
    const stats = await getRepoCommitStats(id);
    
    // Get recent commits
    const recentCommits = await Commit.find({ repo: id })
      .sort({ timestamp: -1 })
      .limit(10)
      .select('sha message timestamp stats score aiAnalysis.qualityScore')
      .lean();
    
    return Response.json({
      success: true,
      repo: {
        ...repo,
        stats,
        recentCommits
      }
    });
    
  } catch (error) {
    console.error('❌ Get repo error:', error);
    return Response.json(
      { error: error.message || 'Failed to get repository' },
      { status: 500 }
    );
  }
}

/**
 * Update repository
 * PATCH /api/repo/[id]
 */
export async function PATCH(request, { params }) {
  try {
    await connectDB();
    
    const user = await requireAuth(request);
    
    const { id } = params;
    const body = await request.json();
    
    const repo = await Repo.findById(id);
    
    if (!repo) {
      return Response.json(
        { error: 'Repository not found' },
        { status: 404 }
      );
    }
    
    // Check ownership
    if (repo.user.toString() !== user._id.toString()) {
      return Response.json(
        { error: 'Not authorized to update this repository' },
        { status: 403 }
      );
    }
    
    // Update allowed fields
    const allowedUpdates = ['description', 'defaultBranch'];
    
    allowedUpdates.forEach(field => {
      if (body[field] !== undefined) {
        repo[field] = body[field];
      }
    });
    
    await repo.save();
    
    console.log('✅ Repository updated:', repo.fullName);
    
    return Response.json({
      success: true,
      message: 'Repository updated successfully',
      repo
    });
    
  } catch (error) {
    console.error('❌ Update repo error:', error);
    
    if (error.message === 'Authentication required') {
      return Response.json(
        { error: error.message },
        { status: 401 }
      );
    }
    
    return Response.json(
      { error: error.message || 'Failed to update repository' },
      { status: 500 }
    );
  }
}

/**
 * Refresh repository info from GitHub
 * POST /api/repo/[id]/refresh
 */
export async function POST(request, { params }) {
  try {
    await connectDB();
    
    const user = await requireAuth(request);
    
    const { id } = params;
    
    const repo = await Repo.findById(id);
    
    if (!repo) {
      return Response.json(
        { error: 'Repository not found' },
        { status: 404 }
      );
    }
    
    // Check ownership
    if (repo.user.toString() !== user._id.toString()) {
      return Response.json(
        { error: 'Not authorized' },
        { status: 403 }
      );
    }
    
    // Get fresh info from GitHub
    const { owner, repo: repoName } = parseGithubUrl(repo.githubUrl);
    const githubInfo = await getRepositoryInfo(owner, repoName);
    
    // Update repo with fresh data
    repo.description = githubInfo.description;
    repo.language = githubInfo.language;
    repo.defaultBranch = githubInfo.defaultBranch;
    
    await repo.save();
    
    console.log('✅ Repository refreshed:', repo.fullName);
    
    return Response.json({
      success: true,
      message: 'Repository refreshed successfully',
      repo
    });
    
  } catch (error) {
    console.error('❌ Refresh repo error:', error);
    
    if (error.message === 'Authentication required') {
      return Response.json(
        { error: error.message },
        { status: 401 }
      );
    }
    
    return Response.json(
      { error: error.message || 'Failed to refresh repository' },
      { status: 500 }
    );
  }
}