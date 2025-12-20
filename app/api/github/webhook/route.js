import { connectDB } from '@/lib/db';
import { verifyWebhookSignature } from '@/lib/github';
import { processCommit } from '@/lib/commitProcessor';

/**
 * GitHub Webhook Handler
 * POST /api/github/webhook
 */
export async function POST(request) {
  try {
    await connectDB();
    
    // Get headers
    const signature = request.headers.get('x-hub-signature-256');
    const event = request.headers.get('x-github-event');
    const delivery = request.headers.get('x-github-delivery');
    
    console.log('📨 GitHub webhook received');
    console.log('Event:', event);
    console.log('Delivery:', delivery);
    
    // Get raw body for signature verification
    const body = await request.text();
    
    // Verify signature
    if (signature && !verifyWebhookSignature(body, signature)) {
      console.error('❌ Invalid webhook signature');
      return Response.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }
    
    // Parse body
    const payload = JSON.parse(body);
    
    // Handle ping event
    if (event === 'ping') {
      console.log('✅ Webhook ping successful');
      return Response.json({
        message: 'Pong! Webhook is active',
        zen: payload.zen
      });
    }
    
    // Handle push event
    if (event === 'push') {
      console.log('📝 Processing push event');
      console.log('Repository:', payload.repository.full_name);
      console.log('Commits:', payload.commits.length);
      
      const repoFullName = payload.repository.full_name;
      const results = {
        processed: 0,
        skipped: 0,
        errors: []
      };
      
      // Process each commit
      for (const commitData of payload.commits) {
        try {
          const commit = await processCommit(repoFullName, {
            id: commitData.id,
            message: commitData.message,
            timestamp: commitData.timestamp,
            url: commitData.url,
            author: {
              name: commitData.author.name,
              email: commitData.author.email,
              username: commitData.author.username
            },
            added: commitData.added,
            removed: commitData.removed,
            modified: commitData.modified
          });
          
          if (commit) {
            results.processed++;
            console.log('✅ Commit processed:', commit.sha.substring(0, 7));
          } else {
            results.skipped++;
            console.log('⚠️ Commit skipped:', commitData.id.substring(0, 7));
          }
        } catch (error) {
          results.errors.push({
            commit: commitData.id,
            error: error.message
          });
          console.error('❌ Error processing commit:', commitData.id, error.message);
        }
      }
      
      console.log('📊 Webhook processing complete');
      console.log('Processed:', results.processed);
      console.log('Skipped:', results.skipped);
      console.log('Errors:', results.errors.length);
      
      return Response.json({
        success: true,
        message: 'Webhook processed',
        results
      });
    }
    
    // Other events - just acknowledge
    console.log('⚠️ Unhandled event type:', event);
    return Response.json({
      message: 'Event received but not processed',
      event
    });
    
  } catch (error) {
    console.error('❌ Webhook error:', error);
    return Response.json(
      { error: error.message || 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

/**
 * Get webhook info
 * GET /api/github/webhook
 */
export async function GET() {
  return Response.json({
    message: 'GitHub Webhook Endpoint',
    events: ['ping', 'push'],
    requirements: {
      headers: [
        'x-github-event',
        'x-github-delivery',
        'x-hub-signature-256'
      ],
      contentType: 'application/json'
    },
    setup: {
      url: `${process.env.NEXT_PUBLIC_APP_URL}/api/github/webhook`,
      contentType: 'application/json',
      secret: 'Set GITHUB_WEBHOOK_SECRET in .env',
      events: ['push']
    }
  });
}