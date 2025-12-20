import { connectDB } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { analyzeCommit } from '@/lib/ai';
import Commit from '@/models/Commit';
import Score from '@/models/Score';

/**
 * Batch analyze unprocessed commits (Admin only)
 * POST /api/ai/batch-analyze
 */
export async function POST(request) {
  try {
    await connectDB();
    
    const admin = await requireAdmin(request);
    
    const body = await request.json();
    const { eventId, limit = 50 } = body;
    
    console.log('🤖 Starting batch AI analysis');
    console.log('Admin:', admin.email);
    if (eventId) console.log('Event:', eventId);
    console.log('Limit:', limit);
    
    // Find unprocessed commits
    const query = {
      'aiAnalysis.processed': false,
      isValid: true
    };
    
    if (eventId) {
      query.event = eventId;
    }
    
    const commits = await Commit.find(query)
      .limit(limit)
      .lean();
    
    console.log('📋 Found', commits.length, 'unprocessed commits');
    
    if (commits.length === 0) {
      return Response.json({
        success: true,
        message: 'No unprocessed commits found',
        results: {
          total: 0,
          processed: 0,
          failed: 0
        }
      });
    }
    
    const results = {
      total: commits.length,
      processed: 0,
      failed: 0,
      errors: []
    };
    
    // Process each commit
    for (const commitData of commits) {
      try {
        console.log('🔍 Analyzing:', commitData.sha.substring(0, 7));
        
        // Get full commit document
        const commit = await Commit.findById(commitData._id);
        
        // Analyze with AI
        const analysis = await analyzeCommit({
          message: commit.message,
          stats: commit.stats,
          files: commit.files
        });
        
        // Save analysis
        await commit.setAIAnalysis(analysis);
        
        // Recalculate score
        await commit.calculateScore();
        
        // Update user score
        const score = await Score.findOne({
          event: commit.event,
          user: commit.user
        });
        
        if (score) {
          // Recalculate score stats
          await score.calculateRank();
        }
        
        results.processed++;
        console.log('✅ Analyzed:', commitData.sha.substring(0, 7), 'Score:', commit.score.total);
        
        // Small delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        results.failed++;
        results.errors.push({
          commitId: commitData._id,
          sha: commitData.sha,
          error: error.message
        });
        console.error('❌ Failed:', commitData.sha.substring(0, 7), error.message);
      }
    }
    
    console.log('🎉 Batch analysis complete');
    console.log('Processed:', results.processed);
    console.log('Failed:', results.failed);
    
    // Update all ranks for affected events
    if (eventId) {
      await Score.updateAllRanks(eventId);
      console.log('✅ Rankings updated');
    }
    
    return Response.json({
      success: true,
      message: 'Batch analysis complete',
      results
    });
    
  } catch (error) {
    console.error('❌ Batch analyze error:', error);
    
    if (error.message === 'Admin access required' || error.message === 'Authentication required') {
      return Response.json(
        { error: error.message },
        { status: 401 }
      );
    }
    
    return Response.json(
      { error: error.message || 'Batch analysis failed' },
      { status: 500 }
    );
  }
}