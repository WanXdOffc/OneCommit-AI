import { connectDB } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import Event from '@/models/Event';
import Score from '@/models/Score';

/**
 * Finish event manually (Admin only)
 * POST /api/event/finish
 */
export async function POST(request) {
  try {
    await connectDB();
    
    // Check admin authentication
    const admin = await requireAdmin(request);
    
    const body = await request.json();
    const { eventId } = body;
    
    // Validation
    if (!eventId) {
      return Response.json(
        { error: 'Event ID is required' },
        { status: 400 }
      );
    }
    
    // Find event
    const event = await Event.findById(eventId);
    
    if (!event) {
      return Response.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }
    
    // Check if event can be finished
    if (event.status !== 'running') {
      return Response.json(
        { error: `Event is not running (status: ${event.status})` },
        { status: 400 }
      );
    }
    
    // Finish event
    await event.finishEvent();
    
    // Lock all scores
    const scores = await Score.find({ event: eventId });
    for (const score of scores) {
      await score.lockScore();
      await score.calculateRank();
    }
    
    // Update all ranks
    await Score.updateAllRanks(eventId);
    
    console.log('✅ Event finished:', event.name, 'by', admin.email);
    console.log('🔒 Scores locked for', scores.length, 'participants');
    
    return Response.json({
      success: true,
      message: 'Event finished successfully',
      event: {
        id: event._id,
        name: event.name,
        status: event.status,
        startTime: event.startTime,
        endTime: event.endTime,
        totalParticipants: event.currentParticipants,
        totalCommits: event.totalCommits
      }
    });
    
  } catch (error) {
    console.error('❌ Finish event error:', error);
    
    if (error.message === 'Admin access required' || error.message === 'Authentication required') {
      return Response.json(
        { error: error.message },
        { status: 401 }
      );
    }
    
    return Response.json(
      { error: error.message || 'Failed to finish event' },
      { status: 500 }
    );
  }
}