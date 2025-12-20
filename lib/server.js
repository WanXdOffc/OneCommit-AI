import { connectDB } from './db.js';

let isBooted = false;

/**
 * Boot server - Initialize all services
 */
export async function bootServer() {
  if (isBooted) {
    console.log('⚠️ Server already booted');
    return;
  }

  console.log('🚀 Starting OneCommit AI Server...');
  console.log('================================');

  try {
    // 1. Load environment variables
    console.log('📦 Loading environment variables...');
    validateEnv();
    console.log('✅ Environment validated');

    // 2. Connect to MongoDB
    console.log('🗄️ Connecting to MongoDB...');
    await connectDB();
    
    // 2.1 Initialize database & create admin
    console.log('🔧 Initializing database...');
    try {
      const { initializeDatabase } = await import('./dbHelpers.js');
      const { createAdminUser } = await import('./auth.js');
      await initializeDatabase();
      await createAdminUser();
    } catch (error) {
      console.error('⚠️ Database initialization warning:', error.message);
      // Continue boot even if initialization has issues
    }

    // 3. Start Discord Bot (will be implemented in Phase 6)
    console.log('🤖 Discord Bot (pending Phase 6)...');
    // await startDiscordBot();

    // 4. Register GitHub Webhook info
    console.log('🔗 GitHub Webhook Configuration...');
    const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/github/webhook`;
    console.log('Webhook URL:', webhookUrl);
    if (process.env.GITHUB_TOKEN) {
      console.log('✅ GitHub Token configured');
    } else {
      console.warn('⚠️ GITHUB_TOKEN not set (webhook creation will fail)');
    }
    if (process.env.GITHUB_WEBHOOK_SECRET) {
      console.log('✅ Webhook Secret configured');
    } else {
      console.warn('⚠️ GITHUB_WEBHOOK_SECRET not set (signature verification disabled)');
    }

    // 5. Start Event Watcher
    console.log('⏰ Starting Event Watcher...');
    const { startEventWatcher } = await import('./eventWatcher.js');
    startEventWatcher();

    isBooted = true;

    console.log('================================');
    console.log('✅ Server booted successfully!');
    console.log('🌐 Ready to accept requests');
    console.log('================================');

  } catch (error) {
    console.error('❌ Server boot failed:', error.message);
    throw error;
  }
}

/**
 * Validate required environment variables
 */
function validateEnv() {
  const required = [
    'MONGODB_URI',
    'JWT_SECRET',
    'NEXT_PUBLIC_APP_URL'
  ];

  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  // Warn about optional but recommended variables
  const recommended = [
    'GITHUB_TOKEN',
    'DISCORD_TOKEN',
    'OPENAI_API_KEY'
  ];

  const missingRecommended = recommended.filter(key => !process.env[key]);
  
  if (missingRecommended.length > 0) {
    console.warn(`⚠️ Missing recommended variables: ${missingRecommended.join(', ')}`);
  }
}

/**
 * Graceful shutdown
 */
export async function shutdownServer() {
  console.log('🛑 Shutting down server...');
  
  try {
    const { disconnectDB } = await import('./db.js');
    await disconnectDB();
    
    // Stop Discord bot if running
    // await stopDiscordBot();
    
    isBooted = false;
    console.log('✅ Server shutdown complete');
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
  }
}

// Handle process termination
if (typeof process !== 'undefined') {
  process.on('SIGTERM', shutdownServer);
  process.on('SIGINT', shutdownServer);
}