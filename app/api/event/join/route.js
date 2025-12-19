import { connectDB } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import Event from '@/models/Event';
import Repo from '@/models/Repo';
import Score from '@/models/Score';

/**
 * Join event with GitHub repository
 * POST /api/event/join
 */
export async function POST(request) {
  try {
    await connectDB();
    
    // Check authentication
    const user = await requireAuth(request);
    
    const body = await request.json();
    const { eventId, githubUrl } = body;
    
    // Validation
    if (!eventId || !githubUrl) {
      return Response.json(
        { error: 'Event ID and GitHub URL are required' },
        { status: 400 }
      );
    }
    
    // Validate GitHub URL format
    const githubRegex = /^https:\/\/github\.com\/([\w-]+)\/([\w-]+)$/;
    const match = githubUrl.match(githubRegex);
    
    if (!match) {
      return Response.json(
        { error: 'Invalid GitHub repository URL. Format: https://github.com/owner/repo' },
        { status: 400 }
      );
    }
    
    const [, owner, repoName] = match;
    const fullName = `${owner}/${repoName}`;
    
    // Find event
    const event = await Event.findById(eventId);
    
    if (!event) {
      return Response.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }
    
    // Check if event can be joined
    if (!event.canJoin()) {
      if (event.status !== 'waiting') {
        return Response.json(
          { error: 'Event has already started or finished' },
          { status: 400 }
        );
      }
      if (event.isFull) {
        return Response.json(
          { error: 'Event is full' },
          { status: 400 }
        );
      }
    }
    
    // Check if user already joined
    const alreadyJoined = event.participants.some(
      p => p.user.toString() === user._id.toString()
    );
    
    if (alreadyJoined) {
      return Response.json(
        { error: 'You have already joined this event' },
        { status: 400 }
      );
    }
    
    // Check if repo already used in this event
    const existingRepo = await Repo.findOne({ 
      event: eventId, 
      githubUrl 
    });
    
    if (existingRepo) {
      return Response.json(
        { error: 'This repository is already registered for this event' },
        { status: 400 }
      );
    }
    
    // Create repo entry
    const repo = await Repo.create({
      event: eventId,
      user: user._id,
      githubUrl,
      owner,
      repoName,
      fullName,
      isActive: true
    });
    
    // Add participant to event
    await event.addParticipant(user._id, repo._id);
    
    // Create score entry
    await Score.create({
      event: eventId,
      user: user._id,
      repo: repo._id,
      totalCommits: 0,
      totalScore: 0
    });
    
    // Update user stats
    user.totalEvents += 1;
    await user.save();
    
    console.log('✅ User joined event:', user.email, '→', event.name);
    
    // Populate event data
    await event.populate('participants.user', 'name email githubUsername');
    
    return Response.json({
      success: true,
      message: 'Successfully joined event',
      event: {
        id: event._id,
        name: event.name,
        status: event.status,
        currentParticipants: event.currentParticipants,
        maxParticipants: event.maxParticipants
      },
      repo: {
        id: repo._id,
        githubUrl: repo.githubUrl,
        fullName: repo.fullName
      }
    }, { status: 201 });
    
  } catch (error) {
    console.error('❌ Join event error:', error);
    
    if (error.message === 'Authentication required') {
      return Response.json(
        { error: error.message },
        { status: 401 }
      );
    }
    
    return Response.json(
      { error: error.message || 'Failed to join event' },
      { status: 500 }
    );
  }
}