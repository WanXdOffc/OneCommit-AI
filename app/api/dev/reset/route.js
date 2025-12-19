import { connectDB } from '@/lib/db';
import { clearDatabase } from '@/lib/dbHelpers';
import { createAdminUser } from '@/lib/auth';

/**
 * Reset database (DEV ONLY)
 * POST /api/dev/reset
 */
export async function POST(request) {
  try {
    // Only allow in development
    if (process.env.NODE_ENV === 'production') {
      return Response.json(
        { error: 'Not allowed in production' },
        { status: 403 }
      );
    }

    await connectDB();
    
    console.log('🗑️ Clearing database...');
    await clearDatabase();
    
    console.log('👤 Creating admin user...');
    const admin = await createAdminUser();
    
    return Response.json({
      success: true,
      message: 'Database reset successfully',
      admin: {
        email: admin.email,
        role: admin.role
      }
    });
    
  } catch (error) {
    console.error('Reset error:', error);
    return Response.json(
      { error: error.message || 'Reset failed' },
      { status: 500 }
    );
  }
}

/**
 * Get reset instructions
 * GET /api/dev/reset
 */
export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return Response.json(
      { error: 'Not allowed in production' },
      { status: 403 }
    );
  }

  return Response.json({
    message: 'Database Reset Endpoint',
    usage: 'POST /api/dev/reset',
    warning: 'This will delete ALL data and recreate admin user',
    admin: {
      email: process.env.ADMIN_EMAIL || 'admin@onecommit.ai',
      password: process.env.ADMIN_PASSWORD || 'admin123'
    }
  });
}