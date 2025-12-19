import { bootServer } from '@/lib/server';
import { isMongoConnected, getConnectionStatus } from '@/lib/db';

// Boot server when this route is first called
bootServer().catch(error => {
  console.error('Failed to boot server:', error);
});

/**
 * Health check endpoint
 * GET /api/_boot
 */
export async function GET() {
  try {
    const status = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      services: {
        mongodb: {
          connected: isMongoConnected(),
          status: getConnectionStatus()
        },
        discord: {
          status: 'pending' // Will be updated in Phase 6
        },
        github: {
          status: 'pending' // Will be updated in Phase 4
        },
        ai: {
          status: 'pending' // Will be updated in Phase 5
        }
      },
      environment: process.env.NODE_ENV || 'development'
    };

    return Response.json(status, { status: 200 });
  } catch (error) {
    return Response.json(
      { 
        status: 'error', 
        message: error.message,
        timestamp: new Date().toISOString()
      }, 
      { status: 500 }
    );
  }
}