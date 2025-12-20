import { connectDB } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { getRepositoryCommits, parseGithubUrl } from '@/lib/github';
import { processMultipleCommits } from '@/lib/commitProcessor';
import Repo from '@/models/Repo';
import Event from '@/models/Event';

/**
 * Sync repository commits
 * POST /api/repo/sync-commits
 */
export async function POST(request) {
  try {
    await connectDB();
    
    const user = await requireAuth(request);
    
    const body = await request.json();
    const { repoId } = body;
    
    if (!repoId) {
      return Response.json(
        { error: 'Repository ID is required' },
        { status: 400 }
      );
    }
    
    // Find repository
    const repo = await Repo.findById(repoId).populate('event');
    
    if (!repo) {
      return Response.json(
        { error: 'Repository not found' },
        { status: 404 }
      );
    }
    
    // Check ownership
    if (repo.user.toString() !== user._id.toString()) {
      return Response.json(
        { error: 'Not authorized to sync this repository' },
        { status: 403 }
      );
    }
    
    // Check if event is running
    if (repo.event.status !== 'running') {
      return Response.json(
        { error: 'Event is not running, cannot sync commits' },
        { status: 400 }
      );
    }
    
    console.log('🔄 Syncing commits for:', repo.fullName);
    
    // Parse GitHub URL
    const { owner, repo: repoName } = parseGithubUrl(repo.githubUrl);
    
    // Get commits from GitHub
    const githubCommits = await getRepositoryCommits(owner, repoName, {
      since: repo.event.startTime,
      until: repo.event.endTime || new Date(),
      branch: repo.defaultBranch,
      limit: 100
    });
    
    console.log('📥 Found', githubCommits.length, 'commits on GitHub');
    
    // Format commits for processing
    const formattedCommits = githubCommits.map(commit => ({
      id: commit.sha,
      message: commit.commit.message,
      timestamp: commit.commit.author.date,
      url: commit.html_url,
      author: {
        name: commit.commit.author.name,
        email: commit.commit.author.email,
        username: commit.author?.login || null,
        avatar: commit.author?.avatar_url || null
      }
    }));
    
    // Process commits
    const results = await processMultipleCommits(
      repo.fullName,
      formattedCommits,
      repo.event._id
    );
    
    console.log('✅ Sync complete');
    console.log('Processed:', results.processed);
    console.log('Skipped:', results.skipped);
    console.log('Errors:', results.errors);
    
    return Response.json({
      success: true,
      message: 'Commits synced successfully',
      results: {
        total: githubCommits.length,
        processed: results.processed,
        skipped: results.skipped,
        errors: results.errors
      }
    });
    
  } catch (error) {
    console.error('❌ Sync commits error:', error);
    
    if (error.message === 'Authentication required') {
      return Response.json(
        { error: error.message },
        { status: 401 }
      );
    }
    
    return Response.json(
      { error: error.message || 'Failed to sync commits' },
      { status: 500 }
    );
  }
}