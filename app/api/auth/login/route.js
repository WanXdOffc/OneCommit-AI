import { connectDB } from '@/lib/db';
import { authenticateUser } from '@/lib/auth';

/**
 * Login user
 * POST /api/auth/login
 */
export async function POST(request) {
  try {
    await connectDB();
    
    const body = await request.json();
    const { email, password } = body;
    
    // Validation
    if (!email || !password) {
      return Response.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }
    
    // Authenticate user
    const { user, token } = await authenticateUser(email, password);
    
    return Response.json({
      success: true,
      message: 'Login successful',
      user: user.toJSON(),
      token
    });
    
  } catch (error) {
    console.error('Login error:', error);
    return Response.json(
      { error: error.message || 'Login failed' },
      { status: 401 }
    );
  }
}