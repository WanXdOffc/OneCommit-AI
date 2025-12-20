import { Octokit } from '@octokit/rest';
import crypto from 'crypto';

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const WEBHOOK_SECRET = process.env.GITHUB_WEBHOOK_SECRET;

/**
 * Create Octokit instance
 */
export function createOctokit() {
  if (!GITHUB_TOKEN) {
    console.warn('⚠️ GITHUB_TOKEN not set, GitHub API calls will be limited');
    return new Octokit();
  }
  
  return new Octokit({
    auth: GITHUB_TOKEN
  });
}

/**
 * Verify GitHub webhook signature
 */
export function verifyWebhookSignature(payload, signature) {
  if (!WEBHOOK_SECRET) {
    console.warn('⚠️ GITHUB_WEBHOOK_SECRET not set, skipping signature verification');
    return true;
  }
  
  const hmac = crypto.createHmac('sha256', WEBHOOK_SECRET);
  const digest = 'sha256=' + hmac.update(payload).digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(digest)
  );
}

/**
 * Parse GitHub repository URL
 */
export function parseGithubUrl(url) {
  const regex = /^https:\/\/github\.com\/([\w-]+)\/([\w-]+)$/;
  const match = url.match(regex);
  
  if (!match) {
    throw new Error('Invalid GitHub URL format');
  }
  
  return {
    owner: match[1],
    repo: match[2],
    fullName: `${match[1]}/${match[2]}`
  };
}

/**
 * Validate GitHub repository exists
 */
export async function validateRepository(owner, repo) {
  try {
    const octokit = createOctokit();
    
    const { data } = await octokit.repos.get({
      owner,
      repo
    });
    
    return {
      valid: true,
      data: {
        name: data.name,
        fullName: data.full_name,
        description: data.description,
        language: data.language,
        isPrivate: data.private,
        defaultBranch: data.default_branch,
        owner: data.owner.login,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      }
    };
  } catch (error) {
    if (error.status === 404) {
      return {
        valid: false,
        error: 'Repository not found'
      };
    }
    
    return {
      valid: false,
      error: error.message
    };
  }
}

/**
 * Get repository commits
 */
export async function getRepositoryCommits(owner, repo, options = {}) {
  try {
    const octokit = createOctokit();
    
    const { data } = await octokit.repos.listCommits({
      owner,
      repo,
      per_page: options.limit || 100,
      since: options.since,
      until: options.until,
      sha: options.branch || 'main'
    });
    
    return data;
  } catch (error) {
    console.error('Error fetching commits:', error.message);
    throw error;
  }
}

/**
 * Get single commit details
 */
export async function getCommitDetails(owner, repo, sha) {
  try {
    const octokit = createOctokit();
    
    const { data } = await octokit.repos.getCommit({
      owner,
      repo,
      ref: sha
    });
    
    return {
      sha: data.sha,
      message: data.commit.message,
      author: {
        name: data.commit.author.name,
        email: data.commit.author.email,
        username: data.author?.login || null,
        avatar: data.author?.avatar_url || null
      },
      timestamp: data.commit.author.date,
      url: data.html_url,
      stats: {
        additions: data.stats?.additions || 0,
        deletions: data.stats?.deletions || 0,
        total: data.stats?.total || 0,
        filesChanged: data.files?.length || 0
      },
      files: (data.files || []).map(file => ({
        filename: file.filename,
        status: file.status,
        additions: file.additions,
        deletions: file.deletions,
        changes: file.changes,
        patch: file.patch
      }))
    };
  } catch (error) {
    console.error('Error fetching commit details:', error.message);
    throw error;
  }
}

/**
 * Create webhook for repository
 */
export async function createWebhook(owner, repo, webhookUrl) {
  try {
    const octokit = createOctokit();
    
    const { data } = await octokit.repos.createWebhook({
      owner,
      repo,
      config: {
        url: webhookUrl,
        content_type: 'json',
        secret: WEBHOOK_SECRET,
        insecure_ssl: '0'
      },
      events: ['push'],
      active: true
    });
    
    console.log('✅ Webhook created:', data.id);
    
    return {
      id: data.id,
      url: data.config.url,
      active: data.active,
      events: data.events
    };
  } catch (error) {
    if (error.status === 422) {
      // Webhook already exists
      return await getExistingWebhook(owner, repo, webhookUrl);
    }
    
    console.error('Error creating webhook:', error.message);
    throw error;
  }
}

/**
 * Get existing webhook
 */
async function getExistingWebhook(owner, repo, webhookUrl) {
  try {
    const octokit = createOctokit();
    
    const { data } = await octokit.repos.listWebhooks({
      owner,
      repo
    });
    
    const webhook = data.find(w => w.config.url === webhookUrl);
    
    if (webhook) {
      console.log('✅ Webhook already exists:', webhook.id);
      return {
        id: webhook.id,
        url: webhook.config.url,
        active: webhook.active,
        events: webhook.events
      };
    }
    
    throw new Error('Webhook exists but not found');
  } catch (error) {
    console.error('Error getting webhook:', error.message);
    throw error;
  }
}

/**
 * Delete webhook
 */
export async function deleteWebhook(owner, repo, webhookId) {
  try {
    const octokit = createOctokit();
    
    await octokit.repos.deleteWebhook({
      owner,
      repo,
      hook_id: webhookId
    });
    
    console.log('✅ Webhook deleted:', webhookId);
    return true;
  } catch (error) {
    console.error('Error deleting webhook:', error.message);
    return false;
  }
}

/**
 * Test webhook connection
 */
export async function testWebhook(owner, repo, webhookId) {
  try {
    const octokit = createOctokit();
    
    await octokit.repos.pingWebhook({
      owner,
      repo,
      hook_id: webhookId
    });
    
    console.log('✅ Webhook ping successful');
    return true;
  } catch (error) {
    console.error('Error pinging webhook:', error.message);
    return false;
  }
}

/**
 * Get repository info
 */
export async function getRepositoryInfo(owner, repo) {
  try {
    const octokit = createOctokit();
    
    const { data } = await octokit.repos.get({
      owner,
      repo
    });
    
    return {
      name: data.name,
      fullName: data.full_name,
      description: data.description,
      language: data.language,
      isPrivate: data.private,
      stars: data.stargazers_count,
      forks: data.forks_count,
      openIssues: data.open_issues_count,
      defaultBranch: data.default_branch,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      pushedAt: data.pushed_at
    };
  } catch (error) {
    console.error('Error getting repository info:', error.message);
    throw error;
  }
}