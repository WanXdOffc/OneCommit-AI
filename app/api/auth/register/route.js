import { connectDB } from '@/lib/db';
import { createUser, generateToken } from '@/lib/auth';
import User from '@/models/User';

/**
 * Register new user
 * POST /api/auth/register
 */
export async function POST(request) {
  try {
    await connectDB();
    
    const body = await request.json();
    const { name, email, password, githubUsername } = body;
    
    // Validation
    if (!name || !email || !password) {
      return Response.json(
        { error: 'Name, email, and password are required' },
        { status: 400 }
      );
    }
    
    if (password.length < 6) {
      return Response.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }
    
    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return Response.json(
        { error: 'Email already registered' },
        { status: 400 }
      );
    }
    
    // Create user
    const user = await createUser({
      name,
      email,
      password,
      githubUsername: githubUsername || null,
      role: 'participant'
    });
    
    // Generate token
    const token = generateToken({
      userId: user._id,
      email: user.email,
      role: user.role
    });
    
    return Response.json({
      success: true,
      message: 'User registered successfully',
      user: user.toJSON(),
      token
    }, { status: 201 });
    
  } catch (error) {
    console.error('Register error:', error);
    return Response.json(
      { error: error.message || 'Registration failed' },
      { status: 500 }
    );
  }
}