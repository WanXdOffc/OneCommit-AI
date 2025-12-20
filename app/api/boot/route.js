import { bootServer } from '@/lib/server';
import { isMongoConnected, getConnectionStatus } from '@/lib/db';

// Boot server immediately when module loads
let bootPromise = null;

if (!bootPromise) {
  bootPromise = bootServer().catch(error => {
    console.error('Failed to boot server:', error);
  });
}

/**
 * Health check endpoint
 * GET /api/_boot
 */
export async function GET() {
  try {
    // Wait for boot to complete
    await bootPromise;

    // Dynamic import to avoid circular dependency
    let aiInfo = { provider: 'none', model: 'none', configured: false };
    try {
      const aiModule = await import('@/lib/ai');
      aiInfo = aiModule.getAIProviderInfo();
    } catch (error) {
      console.error('Could not load AI info:', error.message);
    }

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
          status: process.env.GITHUB_TOKEN ? 'configured' : 'not configured',
          webhook: process.env.GITHUB_WEBHOOK_SECRET ? 'configured' : 'not configured'
        },
        ai: {
          provider: aiInfo.provider,
          model: aiInfo.model,
          status: aiInfo.configured ? 'configured' : 'not configured'
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