import { connectDB } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { analyzeCommit } from '@/lib/ai';
import Commit from '@/models/Commit';

/**
 * Analyze single commit with AI
 * POST /api/ai/analyze
 */
export async function POST(request) {
  try {
    await connectDB();
    
    await requireAuth(request);
    
    const body = await request.json();
    const { commitId } = body;
    
    if (!commitId) {
      return Response.json(
        { error: 'Commit ID is required' },
        { status: 400 }
      );
    }
    
    // Find commit
    const commit = await Commit.findById(commitId);
    
    if (!commit) {
      return Response.json(
        { error: 'Commit not found' },
        { status: 404 }
      );
    }
    
    // Check if already analyzed
    if (commit.aiAnalysis.processed) {
      return Response.json({
        success: true,
        message: 'Commit already analyzed',
        analysis: commit.aiAnalysis
      });
    }
    
    console.log('🤖 Analyzing commit:', commit.sha);
    
    // Analyze with AI
    const analysis = await analyzeCommit({
      message: commit.message,
      stats: commit.stats,
      files: commit.files
    });
    
    // Save analysis
    await commit.setAIAnalysis(analysis);
    
    // Recalculate score with AI quality
    await commit.calculateScore();
    
    // Update user score
    const Score = (await import('@/models/Score')).default;
    const score = await Score.findOne({
      event: commit.event,
      user: commit.user
    });
    
    if (score) {
      await score.updateFromCommit(commit);
      await score.calculateRank();
    }
    
    console.log('✅ Commit analyzed and scored');
    
    return Response.json({
      success: true,
      message: 'Commit analyzed successfully',
      analysis: commit.aiAnalysis,
      score: commit.score
    });
    
  } catch (error) {
    console.error('❌ AI analyze error:', error);
    
    if (error.message === 'Authentication required') {
      return Response.json(
        { error: error.message },
        { status: 401 }
      );
    }
    
    return Response.json(
      { error: error.message || 'Failed to analyze commit' },
      { status: 500 }
    );
  }
}