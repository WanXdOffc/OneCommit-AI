import { connectDB } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import Event from '@/models/Event';
import Score from '@/models/Score';

/**
 * Get current user's events
 * GET /api/user/events
 */
export async function GET(request) {
  try {
    await connectDB();
    
    const user = await requireAuth(request);
    
    // Find all events where user is a participant
    const events = await Event.find({
      'participants.user': user._id
    })
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .lean();
    
    // Get scores for each event
    const eventsWithScores = await Promise.all(
      events.map(async (event) => {
        const score = await Score.findOne({
          event: event._id,
          user: user._id
        }).lean();
        
        return {
          ...event,
          myScore: score ? {
            totalCommits: score.totalCommits,
            totalScore: score.totalScore,
            rank: score.rank,
            percentile: score.percentile,
            achievements: score.achievements
          } : null,
          remainingSlots: event.maxParticipants - event.currentParticipants,
          isFull: event.currentParticipants >= event.maxParticipants,
          isActive: event.status === 'running'
        };
      })
    );
    
    return Response.json({
      success: true,
      events: eventsWithScores,
      total: eventsWithScores.length
    });
    
  } catch (error) {
    console.error('❌ Get user events error:', error);
    
    if (error.message === 'Authentication required') {
      return Response.json(
        { error: error.message },
        { status: 401 }
      );
    }
    
    return Response.json(
      { error: error.message || 'Failed to get user events' },
      { status: 500 }
    );
  }
}