import Event from '@/models/Event';
import Score from '@/models/Score';

let watcherInterval = null;
const CHECK_INTERVAL = 60 * 1000; // Check every 1 minute

/**
 * Start event watcher
 * Checks for expired events and auto-finishes them
 */
export function startEventWatcher() {
  if (watcherInterval) {
    console.log('⚠️ Event watcher already running');
    return;
  }
  
  console.log('⏰ Starting event watcher...');
  console.log(`🔍 Checking every ${CHECK_INTERVAL / 1000} seconds`);
  
  // Initial check
  checkExpiredEvents();
  
  // Set interval
  watcherInterval = setInterval(async () => {
    await checkExpiredEvents();
  }, CHECK_INTERVAL);
  
  console.log('✅ Event watcher started');
}

/**
 * Stop event watcher
 */
export function stopEventWatcher() {
  if (watcherInterval) {
    clearInterval(watcherInterval);
    watcherInterval = null;
    console.log('⏹️ Event watcher stopped');
  }
}

/**
 * Check and finish expired events
 */
async function checkExpiredEvents() {
  try {
    const now = new Date();
    
    // Find all running events that have expired
    const expiredEvents = await Event.find({
      status: 'running',
      endTime: { $lte: now }
    });
    
    if (expiredEvents.length === 0) {
      return;
    }
    
    console.log(`⏰ Found ${expiredEvents.length} expired event(s)`);
    
    for (const event of expiredEvents) {
      try {
        console.log(`🏁 Auto-finishing event: ${event.name}`);
        
        // Finish event
        await event.finishEvent();
        
        // Lock all scores
        const scores = await Score.find({ event: event._id });
        
        for (const score of scores) {
          await score.lockScore();
          await score.calculateRank();
        }
        
        // Update all ranks
        await Score.updateAllRanks(event._id);
        
        console.log(`✅ Event finished: ${event.name}`);
        console.log(`🔒 Scores locked for ${scores.length} participants`);
        
        // TODO: Send Discord notification in Phase 6
        // await sendDiscordNotification(event);
        
      } catch (error) {
        console.error(`❌ Failed to finish event ${event.name}:`, error.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Event watcher error:', error);
  }
}

/**
 * Get watcher status
 */
export function getWatcherStatus() {
  return {
    running: watcherInterval !== null,
    interval: CHECK_INTERVAL,
    intervalSeconds: CHECK_INTERVAL / 1000
  };
}

/**
 * Manual check (for testing)
 */
export async function manualCheck() {
  console.log('🔍 Manual event check triggered');
  await checkExpiredEvents();
}