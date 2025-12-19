import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '@/models/User';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = '7d';
const SALT_ROUNDS = 10;

/**
 * Hash password
 */
export async function hashPassword(password) {
  return await bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Compare password with hash
 */
export async function comparePassword(password, hash) {
  return await bcrypt.compare(password, hash);
}

/**
 * Generate JWT token
 */
export function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN
  });
}

/**
 * Verify JWT token
 */
export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

/**
 * Create user with hashed password
 */
export async function createUser(userData) {
  const { password, ...rest } = userData;
  
  const hashedPassword = await hashPassword(password);
  
  const user = await User.create({
    ...rest,
    password: hashedPassword
  });
  
  return user;
}

/**
 * Authenticate user
 */
export async function authenticateUser(email, password) {
  const user = await User.findByEmail(email);
  
  if (!user) {
    throw new Error('Invalid credentials');
  }
  
  if (!user.isActive) {
    throw new Error('Account is inactive');
  }
  
  const isValid = await comparePassword(password, user.password);
  
  if (!isValid) {
    throw new Error('Invalid credentials');
  }
  
  // Update last login
  user.lastLogin = new Date();
  await user.save();
  
  const token = generateToken({
    userId: user._id,
    email: user.email,
    role: user.role
  });
  
  return { user, token };
}

/**
 * Get user from token
 */
export async function getUserFromToken(token) {
  const decoded = verifyToken(token);
  
  if (!decoded) {
    return null;
  }
  
  const user = await User.findById(decoded.userId);
  
  if (!user || !user.isActive) {
    return null;
  }
  
  return user;
}

/**
 * Extract token from request headers
 */
export function extractTokenFromHeaders(headers) {
  const authorization = headers.get('authorization');
  
  if (!authorization || !authorization.startsWith('Bearer ')) {
    return null;
  }
  
  return authorization.substring(7);
}

/**
 * Middleware to check if user is authenticated
 */
export async function requireAuth(request) {
  const token = extractTokenFromHeaders(request.headers);
  
  if (!token) {
    throw new Error('Authentication required');
  }
  
  const user = await getUserFromToken(token);
  
  if (!user) {
    throw new Error('Invalid or expired token');
  }
  
  return user;
}

/**
 * Middleware to check if user is admin
 */
export async function requireAdmin(request) {
  const user = await requireAuth(request);
  
  if (user.role !== 'admin') {
    throw new Error('Admin access required');
  }
  
  return user;
}

/**
 * Create admin user
 */
export async function createAdminUser() {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@onecommit.ai';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
  
  const existingAdmin = await User.findByEmail(adminEmail);
  
  if (existingAdmin) {
    console.log('✅ Admin user already exists');
    return existingAdmin;
  }
  
  const admin = await createUser({
    name: 'Administrator',
    email: adminEmail,
    password: adminPassword,
    role: 'admin'
  });
  
  console.log('✅ Admin user created');
  console.log(`📧 Email: ${adminEmail}`);
  console.log(`🔑 Password: ${adminPassword}`);
  
  return admin;
}