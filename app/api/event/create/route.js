import { connectDB } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import Event from '@/models/Event';

/**
 * Create new event (Admin only)
 * POST /api/event/create
 */
export async function POST(request) {
  try {
    await connectDB();
    
    // Check admin authentication
    const admin = await requireAdmin(request);
    
    const body = await request.json();
    const {
      name,
      description,
      maxParticipants,
      duration,
      rules,
      prizes,
      isPublic
    } = body;
    
    // Validation
    if (!name || !maxParticipants || !duration) {
      return Response.json(
        { error: 'Name, maxParticipants, and duration are required' },
        { status: 400 }
      );
    }
    
    if (maxParticipants < 1 || maxParticipants > 1000) {
      return Response.json(
        { error: 'Max participants must be between 1 and 1000' },
        { status: 400 }
      );
    }
    
    if (duration < 1 || duration > 720) {
      return Response.json(
        { error: 'Duration must be between 1 hour and 30 days (720 hours)' },
        { status: 400 }
      );
    }
    
    // Create event
    const event = await Event.create({
      name,
      description: description || '',
      createdBy: admin._id,
      maxParticipants,
      duration,
      rules: rules || {},
      prizes: prizes || [],
      isPublic: isPublic !== false,
      status: 'waiting'
    });
    
    await event.populate('createdBy', 'name email');
    
    console.log('✅ Event created:', event.name, 'by', admin.email);
    
    return Response.json({
      success: true,
      message: 'Event created successfully',
      event
    }, { status: 201 });
    
  } catch (error) {
    console.error('❌ Create event error:', error);
    
    if (error.message === 'Admin access required' || error.message === 'Authentication required') {
      return Response.json(
        { error: error.message },
        { status: 401 }
      );
    }
    
    return Response.json(
      { error: error.message || 'Failed to create event' },
      { status: 500 }
    );
  }
}