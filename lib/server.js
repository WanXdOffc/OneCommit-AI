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

  console.log('');
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
    }

    // 3. Start Discord Bot
    console.log('🤖 Starting Discord Bot...');
    try {
      const { initializeBot } = await import('../bot/index.js');
      const botStarted = await initializeBot();
      if (botStarted) {
        console.log('✅ Discord bot started');
        
        // Register commands
        console.log('🔄 Registering Discord slash commands...');
        const { registerCommands } = await import('../bot/registerCommands.js');
        await registerCommands();
      } else {
        console.warn('⚠️ Discord bot not started (check DISCORD_TOKEN in .env)');
      }
    } catch (error) {
      console.error('❌ Discord bot error:', error.message);
      console.warn('⚠️ Continuing without Discord bot');
    }

    // 4. GitHub Webhook Configuration
    console.log('🔗 GitHub Webhook Configuration...');
    const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/github/webhook`;
    console.log('   Webhook URL:', webhookUrl);
    if (process.env.GITHUB_TOKEN) {
      console.log('   ✅ GitHub Token configured');
    } else {
      console.warn('   ⚠️ GITHUB_TOKEN not set');
    }
    if (process.env.GITHUB_WEBHOOK_SECRET) {
      console.log('   ✅ Webhook Secret configured');
    } else {
      console.warn('   ⚠️ GITHUB_WEBHOOK_SECRET not set');
    }
    
    // 4.1 Check AI Configuration
    console.log('🤖 AI Configuration...');
    try {
      const { getAIProviderInfo } = await import('./ai.js');
      const aiInfo = getAIProviderInfo();
      console.log('   Provider:', aiInfo.provider);
      console.log('   Model:', aiInfo.model);
      if (aiInfo.configured) {
        console.log('   ✅ AI configured');
      } else {
        console.warn(`   ⚠️ AI not configured (set ${aiInfo.provider.toUpperCase()}_API_KEY)`);
      }
    } catch (error) {
      console.warn('   ⚠️ Could not load AI config');
    }

    // 5. Start Event Watcher
    console.log('⏰ Starting Event Watcher...');
    try {
      const { startEventWatcher } = await import('./eventWatcher.js');
      startEventWatcher();
    } catch (error) {
      console.error('❌ Event watcher error:', error.message);
    }

    isBooted = true;

    console.log('================================');
    console.log('✅ Server booted successfully!');
    console.log('🌐 Ready to accept requests');
    console.log('================================');
    console.log('');

  } catch (error) {
    console.error('❌ Server boot failed:', error.message);
    console.error(error);
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

  const recommended = [
    'GITHUB_TOKEN',
    'DISCORD_TOKEN',
    'OPENAI_API_KEY'
  ];

  const missingRecommended = recommended.filter(key => !process.env[key]);
  
  if (missingRecommended.length > 0) {
    console.warn(`   ⚠️ Missing recommended: ${missingRecommended.join(', ')}`);
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
    
    const { stopDiscordBot } = await import('../bot/index.js');
    await stopDiscordBot();
    
    isBooted = false;
    console.log('✅ Server shutdown complete');
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
  }
}

if (typeof process !== 'undefined') {
  process.on('SIGTERM', shutdownServer);
  process.on('SIGINT', shutdownServer);
}