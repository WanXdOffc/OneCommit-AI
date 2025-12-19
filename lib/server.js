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

    // 3. Start Discord Bot (will be implemented in Phase 6)
    console.log('🤖 Discord Bot (pending Phase 6)...');
    // await startDiscordBot();

    // 4. Register GitHub Webhook (will be implemented in Phase 4)
    console.log('🔗 GitHub Webhook (pending Phase 4)...');
    // await registerGitHubWebhook();

    // 5. Start Event Watcher (will be implemented in Phase 3)
    console.log('⏰ Event Watcher (pending Phase 3)...');
    // await startEventWatcher();

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