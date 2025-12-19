import { connectDB } from '@/lib/db';
import Event from '@/models/Event';

/**
 * List events with filters
 * GET /api/event/list?status=waiting&limit=10
 */
export async function GET(request) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // waiting, running, finished
    const limit = parseInt(searchParams.get('limit')) || 20;
    const page = parseInt(searchParams.get('page')) || 1;
    const isPublic = searchParams.get('public') === 'true';
    
    // Build query
    const query = {};
    
    if (status) {
      query.status = status;
    }
    
    if (isPublic) {
      query.isPublic = true;
    }
    
    // Get total count
    const total = await Event.countDocuments(query);
    
    // Get events with pagination
    const events = await Event.find(query)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit)
      .lean();
    
    // Add computed fields
    const eventsWithStats = events.map(event => ({
      ...event,
      remainingSlots: event.maxParticipants - event.currentParticipants,
      isFull: event.currentParticipants >= event.maxParticipants,
      isActive: event.status === 'running',
      isExpired: event.endTime ? new Date() > new Date(event.endTime) : false
    }));
    
    return Response.json({
      success: true,
      events: eventsWithStats,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
    
  } catch (error) {
    console.error('❌ List events error:', error);
    return Response.json(
      { error: error.message || 'Failed to list events' },
      { status: 500 }
    );
  }
}