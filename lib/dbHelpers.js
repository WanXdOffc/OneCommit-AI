import { connectDB } from './db';
import User from '@/models/User';
import Event from '@/models/Event';
import Repo from '@/models/Repo';
import Commit from '@/models/Commit';
import Score from '@/models/Score';

/**
 * Initialize database with default data
 */
export async function initializeDatabase() {
  try {
    await connectDB();
    
    console.log('🗄️ Initializing database...');
    
    // Create indexes
    await createIndexes();
    
    console.log('✅ Database initialized');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
}

/**
 * Create database indexes
 */
async function createIndexes() {
  await User.createIndexes();
  await Event.createIndexes();
  await Repo.createIndexes();
  await Commit.createIndexes();
  await Score.createIndexes();
  
  console.log('✅ Database indexes created');
}

/**
 * Clear all data (for testing)
 */
export async function clearDatabase() {
  await User.deleteMany({});
  await Event.deleteMany({});
  await Repo.deleteMany({});
  await Commit.deleteMany({});
  await Score.deleteMany({});
  
  console.log('✅ Database cleared');
}

/**
 * Get database statistics
 */
export async function getDatabaseStats() {
  const stats = {
    users: await User.countDocuments(),
    admins: await User.countDocuments({ role: 'admin' }),
    participants: await User.countDocuments({ role: 'participant' }),
    events: {
      total: await Event.countDocuments(),
      waiting: await Event.countDocuments({ status: 'waiting' }),
      running: await Event.countDocuments({ status: 'running' }),
      finished: await Event.countDocuments({ status: 'finished' })
    },
    repos: await Repo.countDocuments(),
    commits: {
      total: await Commit.countDocuments(),
      valid: await Commit.countDocuments({ isValid: true }),
      spam: await Commit.countDocuments({ 'aiAnalysis.isSpam': true }),
      unprocessed: await Commit.countDocuments({ 'aiAnalysis.processed': false })
    },
    scores: await Score.countDocuments()
  };
  
  return stats;
}

/**
 * Validate models
 */
export function validateModels() {
  const models = {
    User: User.modelName === 'User',
    Event: Event.modelName === 'Event',
    Repo: Repo.modelName === 'Repo',
    Commit: Commit.modelName === 'Commit',
    Score: Score.modelName === 'Score'
  };
  
  const allValid = Object.values(models).every(v => v);
  
  if (!allValid) {
    throw new Error('Some models failed to load');
  }
  
  console.log('✅ All models validated');
  return models;
}

/**
 * Seed database with sample data (for testing)
 */
export async function seedDatabase() {
  try {
    await connectDB();
    
    console.log('🌱 Seeding database...');
    
    // Check if already seeded
    const userCount = await User.countDocuments();
    if (userCount > 0) {
      console.log('⚠️ Database already has data, skipping seed');
      return;
    }
    
    // Create sample users
    const { createUser } = await import('./auth');
    
    const admin = await createUser({
      name: 'Admin User',
      email: 'admin@onecommit.ai',
      password: 'admin123',
      role: 'admin',
      githubUsername: 'adminuser'
    });
    
    const user1 = await createUser({
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password123',
      githubUsername: 'johndoe'
    });
    
    const user2 = await createUser({
      name: 'Jane Smith',
      email: 'jane@example.com',
      password: 'password123',
      githubUsername: 'janesmith'
    });
    
    console.log('✅ Sample users created');
    
    // Create sample event
    const event = await Event.create({
      name: 'Sample Hackathon 2024',
      description: 'A test hackathon event',
      createdBy: admin._id,
      maxParticipants: 50,
      duration: 48,
      status: 'waiting'
    });
    
    console.log('✅ Sample event created');
    
    console.log('🌱 Database seeded successfully');
    console.log('📧 Admin: admin@onecommit.ai / admin123');
    console.log('📧 User 1: john@example.com / password123');
    console.log('📧 User 2: jane@example.com / password123');
    
  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    throw error;
  }
}

/**
 * Backup database data
 */
export async function backupDatabase() {
  const data = {
    users: await User.find().lean(),
    events: await Event.find().lean(),
    repos: await Repo.find().lean(),
    commits: await Commit.find().lean(),
    scores: await Score.find().lean()
  };
  
  return data;
}

/**
 * Health check for database
 */
export async function healthCheck() {
  try {
    const { isMongoConnected } = await import('./db');
    
    if (!isMongoConnected()) {
      throw new Error('Database not connected');
    }
    
    // Try a simple query
    await User.findOne().limit(1);
    
    return {
      status: 'healthy',
      connected: true,
      models: ['User', 'Event', 'Repo', 'Commit', 'Score']
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      connected: false,
      error: error.message
    };
  }
}