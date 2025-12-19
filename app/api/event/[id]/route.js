import { connectDB } from '@/lib/db';
import Event from '@/models/Event';
import Repo from '@/models/Repo';
import Score from '@/models/Score';

/**
 * Get event details by ID
 * GET /api/event/[id]
 */
export async function GET(request, { params }) {
  try {
    await connectDB();
    
    const { id } = params;
    
    if (!id) {
      return Response.json(
        { error: 'Event ID is required' },
        { status: 400 }
      );
    }
    
    // Find event
    const event = await Event.findById(id)
      .populate('createdBy', 'name email')
      .populate('participants.user', 'name email githubUsername avatar')
      .populate('participants.repo', 'githubUrl fullName totalCommits totalScore')
      .lean();
    
    if (!event) {
      return Response.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }
    
    // Get leaderboard if event is running or finished
    let leaderboard = [];
    if (event.status === 'running' || event.status === 'finished') {
      leaderboard = await Score.find({ event: id })
        .populate('user', 'name email githubUsername avatar')
        .populate('repo', 'githubUrl fullName')
        .sort({ totalScore: -1 })
        .limit(10)
        .lean();
    }
    
    // Add computed fields
    const eventWithStats = {
      ...event,
      remainingSlots: event.maxParticipants - event.currentParticipants,
      isFull: event.currentParticipants >= event.maxParticipants,
      isActive: event.status === 'running',
      isExpired: event.endTime ? new Date() > new Date(event.endTime) : false,
      leaderboard
    };
    
    return Response.json({
      success: true,
      event: eventWithStats
    });
    
  } catch (error) {
    console.error('❌ Get event error:', error);
    return Response.json(
      { error: error.message || 'Failed to get event' },
      { status: 500 }
    );
  }
}

/**
 * Update event (Admin only)
 * PATCH /api/event/[id]
 */
export async function PATCH(request, { params }) {
  try {
    await connectDB();
    
    const { requireAdmin } = await import('@/lib/auth');
    const admin = await requireAdmin(request);
    
    const { id } = params;
    const body = await request.json();
    
    const event = await Event.findById(id);
    
    if (!event) {
      return Response.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }
    
    // Update allowed fields
    const allowedUpdates = ['name', 'description', 'isPublic', 'prizes'];
    
    allowedUpdates.forEach(field => {
      if (body[field] !== undefined) {
        event[field] = body[field];
      }
    });
    
    await event.save();
    
    console.log('✅ Event updated:', event.name, 'by', admin.email);
    
    return Response.json({
      success: true,
      message: 'Event updated successfully',
      event
    });
    
  } catch (error) {
    console.error('❌ Update event error:', error);
    
    if (error.message === 'Admin access required' || error.message === 'Authentication required') {
      return Response.json(
        { error: error.message },
        { status: 401 }
      );
    }
    
    return Response.json(
      { error: error.message || 'Failed to update event' },
      { status: 500 }
    );
  }
}

/**
 * Delete event (Admin only)
 * DELETE /api/event/[id]
 */
export async function DELETE(request, { params }) {
  try {
    await connectDB();
    
    const { requireAdmin } = await import('@/lib/auth');
    const admin = await requireAdmin(request);
    
    const { id } = params;
    
    const event = await Event.findById(id);
    
    if (!event) {
      return Response.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }
    
    // Don't allow deleting running events
    if (event.status === 'running') {
      return Response.json(
        { error: 'Cannot delete a running event. Finish it first.' },
        { status: 400 }
      );
    }
    
    // Delete related data
    await Repo.deleteMany({ event: id });
    await Score.deleteMany({ event: id });
    
    await Event.findByIdAndDelete(id);
    
    console.log('✅ Event deleted:', event.name, 'by', admin.email);
    
    return Response.json({
      success: true,
      message: 'Event deleted successfully'
    });
    
  } catch (error) {
    console.error('❌ Delete event error:', error);
    
    if (error.message === 'Admin access required' || error.message === 'Authentication required') {
      return Response.json(
        { error: error.message },
        { status: 401 }
      );
    }
    
    return Response.json(
      { error: error.message || 'Failed to delete event' },
      { status: 500 }
    );
  }
}