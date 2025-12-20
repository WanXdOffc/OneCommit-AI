import Event from '@/models/Event';
import Repo from '@/models/Repo';
import Commit from '@/models/Commit';
import Score from '@/models/Score';
import { getCommitDetails } from './github';

/**
 * Process AI analysis asynchronously
 */
async function processAIAnalysisAsync(commitId) {
  try {
    // Small delay to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const commit = await Commit.findById(commitId);
    if (!commit || commit.aiAnalysis.processed) return;
    
    console.log('🤖 Processing AI analysis for:', commit.sha.substring(0, 7));
    
    // Dynamic import AI to avoid issues
    const { analyzeCommit } = await import('./ai.js');
    
    const analysis = await analyzeCommit({
      message: commit.message,
      stats: commit.stats,
      files: commit.files
    });
    
    await commit.setAIAnalysis(analysis);
    await commit.calculateScore();
    
    // Update score
    const score = await Score.findOne({
      event: commit.event,
      user: commit.user
    });
    
    if (score) {
      await score.calculateRank();
    }
    
    console.log('✅ AI analysis complete:', commit.sha.substring(0, 7));
    
  } catch (error) {
    console.error('❌ AI analysis failed:', error.message);
  }
}

/**
 * Process incoming commit from webhook
 */
export async function processCommit(repoFullName, commitData, eventId = null) {
  try {
    console.log('📝 Processing commit:', commitData.id);
    
    // Find repository
    const query = { fullName: repoFullName };
    if (eventId) {
      query.event = eventId;
    }
    
    const repo = await Repo.findOne(query)
      .populate('event')
      .populate('user');
    
    if (!repo) {
      console.log('⚠️ Repository not found:', repoFullName);
      return null;
    }
    
    // Check if event is running
    if (repo.event.status !== 'running') {
      console.log('⚠️ Event not running:', repo.event.status);
      return null;
    }
    
    // Check if commit already exists
    const existingCommit = await Commit.findOne({ sha: commitData.id });
    if (existingCommit) {
      console.log('⚠️ Commit already processed:', commitData.id);
      return existingCommit;
    }
    
    // Check if commit is within event time
    const commitTime = new Date(commitData.timestamp);
    const eventStart = new Date(repo.event.startTime);
    const eventEnd = new Date(repo.event.endTime);
    
    if (commitTime < eventStart) {
      console.log('⚠️ Commit before event start');
      return null;
    }
    
    const isLateSubmission = commitTime > eventEnd;
    
    // Get detailed commit info from GitHub
    let detailedCommit;
    try {
      const [owner, repoName] = repoFullName.split('/');
      detailedCommit = await getCommitDetails(owner, repoName, commitData.id);
    } catch (error) {
      console.error('❌ Failed to get commit details:', error.message);
      // Use webhook data as fallback
      detailedCommit = {
        sha: commitData.id,
        message: commitData.message,
        author: commitData.author,
        timestamp: commitData.timestamp,
        url: commitData.url,
        stats: {
          additions: 0,
          deletions: 0,
          total: 0,
          filesChanged: 0
        },
        files: []
      };
    }
    
    // Determine if first commit
    const commitCount = await Commit.countDocuments({
      repo: repo._id,
      event: repo.event._id
    });
    const isFirstCommit = commitCount === 0;
    
    // Determine if large commit
    const isLargeCommit = detailedCommit.stats.total > 1000;
    
    // Create commit record
    const commit = await Commit.create({
      event: repo.event._id,
      repo: repo._id,
      user: repo.user._id,
      sha: detailedCommit.sha,
      message: detailedCommit.message,
      author: detailedCommit.author,
      timestamp: detailedCommit.timestamp,
      url: detailedCommit.url,
      stats: detailedCommit.stats,
      files: detailedCommit.files,
      flags: {
        isLateSubmission,
        isFirstCommit,
        isLargeCommit
      },
      isValid: !isLateSubmission
    });
    
    // Calculate initial score (before AI)
    await commit.calculateScore();
    
    // Trigger AI analysis asynchronously
    processAIAnalysisAsync(commit._id);
    
    // Update repository stats
    await repo.updateStats(commit);
    
    // Update event total commits
    repo.event.totalCommits += 1;
    await repo.event.save();
    
    // Update score
    const score = await Score.findOne({
      event: repo.event._id,
      user: repo.user._id
    });
    
    if (score) {
      await score.updateFromCommit(commit);
      
      // Check for achievements
      if (isFirstCommit) {
        await score.addAchievement('first_commit');
      }
      
      // Update rank
      await score.calculateRank();
    }
    
    console.log('✅ Commit processed:', commit.sha);
    console.log('📊 Score:', commit.score.total);
    
    return commit;
    
  } catch (error) {
    console.error('❌ Error processing commit:', error);
    throw error;
  }
}

/**
 * Process multiple commits (for initial sync)
 */
export async function processMultipleCommits(repoFullName, commits, eventId) {
  const results = {
    processed: 0,
    skipped: 0,
    errors: 0
  };
  
  for (const commitData of commits) {
    try {
      const commit = await processCommit(repoFullName, commitData, eventId);
      
      if (commit) {
        results.processed++;
      } else {
        results.skipped++;
      }
    } catch (error) {
      console.error('Error processing commit:', commitData.id, error.message);
      results.errors++;
    }
  }
  
  return results;
}

/**
 * Validate commit against event rules
 */
export function validateCommitRules(commit, eventRules) {
  const violations = [];
  
  // Check minimum commits (this would be at event level)
  // Check allowed languages
  if (eventRules.allowedLanguages && eventRules.allowedLanguages.length > 0) {
    const commitLanguages = commit.files.map(f => {
      const ext = f.filename.split('.').pop();
      return ext;
    });
    
    const hasAllowedLanguage = commitLanguages.some(lang => 
      eventRules.allowedLanguages.includes(lang)
    );
    
    if (!hasAllowedLanguage) {
      violations.push('No allowed language files in commit');
    }
  }
  
  // Check for test files if required
  if (eventRules.requireTests) {
    const hasTests = commit.files.some(f => 
      f.filename.includes('test') || 
      f.filename.includes('spec') ||
      f.filename.includes('.test.') ||
      f.filename.includes('.spec.')
    );
    
    if (!hasTests) {
      violations.push('No test files found');
    }
  }
  
  return {
    valid: violations.length === 0,
    violations
  };
}

/**
 * Get commit statistics for a repository
 */
export async function getRepoCommitStats(repoId) {
  try {
    const commits = await Commit.find({ repo: repoId, isValid: true });
    
    const stats = {
      totalCommits: commits.length,
      totalAdditions: commits.reduce((sum, c) => sum + c.stats.additions, 0),
      totalDeletions: commits.reduce((sum, c) => sum + c.stats.deletions, 0),
      totalFiles: commits.reduce((sum, c) => sum + c.stats.filesChanged, 0),
      averageScore: commits.length > 0 
        ? commits.reduce((sum, c) => sum + c.score.total, 0) / commits.length 
        : 0,
      firstCommit: commits.length > 0 ? commits[0].timestamp : null,
      lastCommit: commits.length > 0 ? commits[commits.length - 1].timestamp : null
    };
    
    return stats;
  } catch (error) {
    console.error('Error getting commit stats:', error);
    throw error;
  }
}