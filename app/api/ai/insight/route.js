import { connectDB } from '@/lib/db';
import Commit from '@/models/Commit';

/**
 * Get AI insights for event
 * GET /api/ai/insights?eventId=xxx
 */
export async function GET(request) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');
    
    if (!eventId) {
      return Response.json(
        { error: 'Event ID is required' },
        { status: 400 }
      );
    }
    
    // Get all analyzed commits for event
    const commits = await Commit.find({
      event: eventId,
      'aiAnalysis.processed': true,
      isValid: true
    }).lean();
    
    if (commits.length === 0) {
      return Response.json({
        success: true,
        message: 'No analyzed commits yet',
        insights: null
      });
    }
    
    // Calculate insights
    const insights = {
      totalAnalyzed: commits.length,
      
      // Average quality score
      averageQuality: (
        commits.reduce((sum, c) => sum + (c.aiAnalysis.qualityScore || 0), 0) / commits.length
      ).toFixed(2),
      
      // Category distribution
      categories: {},
      
      // Complexity distribution
      complexity: {
        low: 0,
        medium: 0,
        high: 0
      },
      
      // Spam detection
      spamCount: commits.filter(c => c.aiAnalysis.isSpam).length,
      spamPercentage: (
        (commits.filter(c => c.aiAnalysis.isSpam).length / commits.length) * 100
      ).toFixed(2),
      
      // Technology usage
      technologies: {},
      
      // Quality distribution
      qualityDistribution: {
        excellent: 0,  // 80-100
        good: 0,       // 60-79
        fair: 0,       // 40-59
        poor: 0        // 0-39
      },
      
      // Top quality commits
      topCommits: commits
        .sort((a, b) => (b.aiAnalysis.qualityScore || 0) - (a.aiAnalysis.qualityScore || 0))
        .slice(0, 5)
        .map(c => ({
          sha: c.sha,
          message: c.message,
          qualityScore: c.aiAnalysis.qualityScore,
          category: c.aiAnalysis.category,
          user: c.user
        })),
      
      // Common suggestions
      commonSuggestions: {}
    };
    
    // Process each commit for insights
    commits.forEach(commit => {
      const ai = commit.aiAnalysis;
      
      // Category distribution
      insights.categories[ai.category] = (insights.categories[ai.category] || 0) + 1;
      
      // Complexity distribution
      insights.complexity[ai.complexity] = (insights.complexity[ai.complexity] || 0) + 1;
      
      // Technology usage
      (ai.technologies || []).forEach(tech => {
        insights.technologies[tech] = (insights.technologies[tech] || 0) + 1;
      });
      
      // Quality distribution
      const score = ai.qualityScore || 0;
      if (score >= 80) insights.qualityDistribution.excellent++;
      else if (score >= 60) insights.qualityDistribution.good++;
      else if (score >= 40) insights.qualityDistribution.fair++;
      else insights.qualityDistribution.poor++;
      
      // Common suggestions
      (ai.suggestions || []).forEach(suggestion => {
        const key = suggestion.toLowerCase().substring(0, 50);
        insights.commonSuggestions[key] = (insights.commonSuggestions[key] || 0) + 1;
      });
    });
    
    // Sort technologies by usage
    insights.topTechnologies = Object.entries(insights.technologies)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([tech, count]) => ({ technology: tech, count }));
    
    // Sort suggestions by frequency
    insights.topSuggestions = Object.entries(insights.commonSuggestions)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([suggestion, count]) => ({ suggestion, count }));
    
    return Response.json({
      success: true,
      insights
    });
    
  } catch (error) {
    console.error('❌ Get insights error:', error);
    return Response.json(
      { error: error.message || 'Failed to get insights' },
      { status: 500 }
    );
  }
}