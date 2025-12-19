import { connectDB } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import Event from '@/models/Event';

/**
 * Start event (Admin only)
 * POST /api/event/start
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
    
    // Check if event can be started
    if (event.status !== 'waiting') {
      return Response.json(
        { error: `Event is already ${event.status}` },
        { status: 400 }
      );
    }
    
    // Check if event has participants
    if (event.currentParticipants === 0) {
      return Response.json(
        { error: 'Cannot start event with no participants' },
        { status: 400 }
      );
    }
    
    // Start event
    await event.startEvent();
    
    await event.populate('participants.user', 'name email githubUsername');
    await event.populate('participants.repo', 'githubUrl fullName');
    
    console.log('✅ Event started:', event.name, 'by', admin.email);
    console.log('⏰ Duration:', event.duration, 'hours');
    console.log('👥 Participants:', event.currentParticipants);
    console.log('📅 Start:', event.startTime);
    console.log('📅 End:', event.endTime);
    
    return Response.json({
      success: true,
      message: 'Event started successfully',
      event: {
        id: event._id,
        name: event.name,
        status: event.status,
        startTime: event.startTime,
        endTime: event.endTime,
        duration: event.duration,
        participants: event.currentParticipants
      }
    });
    
  } catch (error) {
    console.error('❌ Start event error:', error);
    
    if (error.message === 'Admin access required' || error.message === 'Authentication required') {
      return Response.json(
        { error: error.message },
        { status: 401 }
      );
    }
    
    return Response.json(
      { error: error.message || 'Failed to start event' },
      { status: 500 }
    );
  }
}