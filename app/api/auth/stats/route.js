import { connectDB } from '@/lib/db';
import { getDatabaseStats, healthCheck } from '@/lib/dbHelpers';

/**
 * Get database statistics
 * GET /api/stats
 */
export async function GET(request) {
  try {
    await connectDB();
    
    const stats = await getDatabaseStats();
    const health = await healthCheck();
    
    return Response.json({
      success: true,
      timestamp: new Date().toISOString(),
      health,
      stats
    });
    
  } catch (error) {
    console.error('Stats error:', error);
    return Response.json(
      { error: error.message || 'Failed to get statistics' },
      { status: 500 }
    );
  }
}