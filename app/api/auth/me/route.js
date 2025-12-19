import { connectDB } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

/**
 * Get current user
 * GET /api/auth/me
 */
export async function GET(request) {
  try {
    await connectDB();
    
    const user = await requireAuth(request);
    
    return Response.json({
      success: true,
      user: user.toJSON()
    });
    
  } catch (error) {
    console.error('Get user error:', error);
    return Response.json(
      { error: error.message || 'Authentication failed' },
      { status: 401 }
    );
  }
}