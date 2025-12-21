import { connectDB } from '@/lib/db';
//import { requireAuth } from '@/lib/auth';
import { createWebhook, parseGithubUrl } from '@/lib/github';
import Repo from '@/models/Repo';

/**
 * Setup webhook for repository
 * POST /api/repo/webhook
 */
export async function POST(request) {
  try {
    await connectDB();
    
    if (!user) {
      return Response.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    const { repoId } = body;
    
    if (!repoId) {
      return Response.json(
        { error: 'Repository ID is required' },
        { status: 400 }
      );
    }
    
    // Find repository
    const repo = await Repo.findById(repoId);
    
    if (!repo) {
      return Response.json(
        { error: 'Repository not found' },
        { status: 404 }
      );
    }
    
    // Check ownership
    if (repo.user.toString() !== user._id.toString()) {
      return Response.json(
        { error: 'Not authorized to setup webhook for this repository' },
        { status: 403 }
      );
    }
    
    // Check if webhook already active
    if (repo.webhookActive && repo.webhookId) {
      return Response.json({
        success: true,
        message: 'Webhook already active',
        webhookId: repo.webhookId
      });
    }
    
    // Parse GitHub URL
    const { owner, repo: repoName } = parseGithubUrl(repo.githubUrl);
    
    // Create webhook URL
    const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/github/webhook`;
    
    // Create webhook on GitHub
    try {
      const webhook = await createWebhook(owner, repoName, webhookUrl);
      
      // Update repo with webhook info
      await repo.activateWebhook(webhook.id);
      
      console.log('✅ Webhook setup for:', repo.fullName);
      
      return Response.json({
        success: true,
        message: 'Webhook setup successfully',
        webhook: {
          id: webhook.id,
          url: webhook.url,
          active: webhook.active,
          events: webhook.events
        }
      });
      
    } catch (webhookError) {
      console.error('❌ Webhook creation failed:', webhookError.message);
      
      return Response.json({
        success: false,
        error: 'Failed to create webhook on GitHub',
        details: webhookError.message,
        hint: 'Make sure you have admin access to the repository and GITHUB_TOKEN is set'
      }, { status: 500 });
    }
    
  } catch (error) {
    console.error('❌ Setup webhook error:', error);
    
    if (error.message === 'Authentication required') {
      return Response.json(
        { error: error.message },
        { status: 401 }
      );
    }
    
    return Response.json(
      { error: error.message || 'Failed to setup webhook' },
      { status: 500 }
    );
  }
}