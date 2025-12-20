import OpenAI from 'openai';

const AI_PROVIDER = process.env.AI_PROVIDER || 'openai';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

/**
 * Create AI client based on provider
 */
function createAIClient() {
  switch (AI_PROVIDER) {
    case 'openai':
      if (!OPENAI_API_KEY) {
        throw new Error('OPENAI_API_KEY not set');
      }
      return new OpenAI({ apiKey: OPENAI_API_KEY });
    
    case 'groq':
      if (!GROQ_API_KEY) {
        throw new Error('GROQ_API_KEY not set');
      }
      return new OpenAI({
        apiKey: GROQ_API_KEY,
        baseURL: 'https://api.groq.com/openai/v1'
      });
    
    case 'openrouter':
      if (!OPENROUTER_API_KEY) {
        throw new Error('OPENROUTER_API_KEY not set');
      }
      return new OpenAI({
        apiKey: OPENROUTER_API_KEY,
        baseURL: 'https://openrouter.ai/api/v1'
      });
    
    case 'gemini':
      // Note: Gemini uses different API, we'll use OpenAI-compatible wrapper
      if (!GEMINI_API_KEY) {
        throw new Error('GEMINI_API_KEY not set');
      }
      // For now, fallback to OpenAI format
      console.warn('⚠️ Gemini integration pending, using OpenAI format');
      return new OpenAI({ apiKey: GEMINI_API_KEY });
    
    default:
      throw new Error(`Unknown AI provider: ${AI_PROVIDER}`);
  }
}

/**
 * Get model name based on provider
 */
function getModelName() {
  switch (AI_PROVIDER) {
    case 'openai':
      return 'gpt-4o-mini';
    case 'groq':
      return 'llama-3.1-70b-versatile';
    case 'openrouter':
      return 'tngtech/deepseek-r1t2-chimera:free';
    case 'gemini':
      return 'gemini-pro';
    default:
      return 'gpt-4o-mini';
  }
}

/**
 * Analyze commit with AI
 */
export async function analyzeCommit(commitData) {
  try {
    const client = createAIClient();
    const model = getModelName();
    
    console.log('🤖 AI Analysis started');
    console.log('Provider:', AI_PROVIDER);
    console.log('Model:', model);
    
    // Build prompt
    const prompt = buildCommitAnalysisPrompt(commitData);
    
    // Call AI
    const response = await client.chat.completions.create({
      model,
      messages: [
        {
          role: 'system',
          content: 'You are a code review expert. Analyze commits and provide structured feedback in JSON format.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 1000,
      response_format: { type: 'json_object' }
    });
    
    const content = response.choices[0].message.content;
    const analysis = JSON.parse(content);
    
    // Validate and normalize response
    const normalizedAnalysis = normalizeAnalysis(analysis);
    
    console.log('✅ AI Analysis complete');
    console.log('Quality Score:', normalizedAnalysis.qualityScore);
    console.log('Category:', normalizedAnalysis.category);
    console.log('Is Spam:', normalizedAnalysis.isSpam);
    
    return normalizedAnalysis;
    
  } catch (error) {
    console.error('❌ AI Analysis error:', error.message);
    
    // Return fallback analysis
    return getFallbackAnalysis(commitData);
  }
}

/**
 * Build prompt for commit analysis
 */
function buildCommitAnalysisPrompt(commitData) {
  const { message, stats, files } = commitData;
  
  // Prepare files summary
  const filesSummary = files.slice(0, 20).map(f => {
    return `- ${f.filename} (${f.status}, +${f.additions}/-${f.deletions})`;
  }).join('\n');
  
  const hasMoreFiles = files.length > 20;
  const filesText = filesSummary + (hasMoreFiles ? `\n... and ${files.length - 20} more files` : '');
  
  return `Analyze this Git commit and provide a JSON response with the following structure:

{
  "qualityScore": 0-100,
  "isSpam": boolean,
  "category": "feature|bugfix|refactor|docs|test|chore|other",
  "summary": "brief description",
  "feedback": "constructive feedback",
  "suggestions": ["suggestion1", "suggestion2"],
  "technologies": ["tech1", "tech2"],
  "complexity": "low|medium|high"
}

Commit Message:
${message}

Statistics:
- Additions: ${stats.additions}
- Deletions: ${stats.deletions}
- Files Changed: ${stats.filesChanged}

Files:
${filesText}

Scoring Guidelines:
- Quality Score (0-100): Code quality, commit message clarity, meaningful changes
- Is Spam: Detect meaningless commits like "test", "asdf", minimal changes
- Category: Classify the type of work done
- Summary: 1-2 sentence description of what was done
- Feedback: Constructive advice for improvement
- Suggestions: 2-3 specific recommendations
- Technologies: Programming languages/frameworks used
- Complexity: Based on scope and difficulty

Be critical but fair. Focus on meaningful contributions.`;
}

/**
 * Normalize AI response
 */
function normalizeAnalysis(analysis) {
  return {
    qualityScore: Math.min(100, Math.max(0, analysis.qualityScore || 50)),
    isSpam: Boolean(analysis.isSpam),
    category: validateCategory(analysis.category),
    summary: String(analysis.summary || 'No summary provided').substring(0, 500),
    feedback: String(analysis.feedback || 'No feedback provided').substring(0, 1000),
    suggestions: Array.isArray(analysis.suggestions) 
      ? analysis.suggestions.slice(0, 5).map(s => String(s).substring(0, 200))
      : [],
    technologies: Array.isArray(analysis.technologies)
      ? analysis.technologies.slice(0, 10).map(t => String(t).substring(0, 50))
      : [],
    complexity: validateComplexity(analysis.complexity)
  };
}

/**
 * Validate category
 */
function validateCategory(category) {
  const validCategories = ['feature', 'bugfix', 'refactor', 'docs', 'test', 'chore', 'other'];
  return validCategories.includes(category) ? category : 'other';
}

/**
 * Validate complexity
 */
function validateComplexity(complexity) {
  const validComplexity = ['low', 'medium', 'high'];
  return validComplexity.includes(complexity) ? complexity : 'medium';
}

/**
 * Fallback analysis when AI fails
 */
function getFallbackAnalysis(commitData) {
  const { message, stats } = commitData;
  
  // Simple heuristics
  const totalChanges = stats.additions + stats.deletions;
  const isSmallChange = totalChanges < 10;
  const isLargeChange = totalChanges > 500;
  
  // Detect spam patterns
  const spamPatterns = /^(test|asdf|aaa|111|fix|update|change|temp)$/i;
  const isShortMessage = message.length < 10;
  const isSpam = spamPatterns.test(message.trim()) || isShortMessage;
  
  // Determine category from message
  let category = 'other';
  if (message.match(/feat|feature|add/i)) category = 'feature';
  else if (message.match(/fix|bug/i)) category = 'bugfix';
  else if (message.match(/refactor|improve|optimize/i)) category = 'refactor';
  else if (message.match(/doc|readme/i)) category = 'docs';
  else if (message.match(/test|spec/i)) category = 'test';
  
  // Calculate quality score
  let qualityScore = 50;
  if (!isSpam) qualityScore += 20;
  if (message.length > 20) qualityScore += 10;
  if (totalChanges > 20 && totalChanges < 500) qualityScore += 10;
  if (stats.filesChanged > 1 && stats.filesChanged < 10) qualityScore += 10;
  
  return {
    qualityScore: Math.min(100, qualityScore),
    isSpam,
    category,
    summary: isSpam ? 'Low quality commit' : 'Code changes committed',
    feedback: isSpam 
      ? 'Write more descriptive commit messages and make meaningful changes'
      : 'Consider adding more detailed commit message',
    suggestions: [
      'Write clear, descriptive commit messages',
      'Break large changes into smaller commits',
      'Follow conventional commit format'
    ],
    technologies: [],
    complexity: isSmallChange ? 'low' : isLargeChange ? 'high' : 'medium'
  };
}

/**
 * Batch analyze multiple commits
 */
export async function batchAnalyzeCommits(commits) {
  const results = [];
  
  for (const commit of commits) {
    try {
      const analysis = await analyzeCommit({
        message: commit.message,
        stats: commit.stats,
        files: commit.files || []
      });
      
      results.push({
        commitId: commit._id,
        success: true,
        analysis
      });
      
      // Small delay to avoid rate limits
      await sleep(1000);
      
    } catch (error) {
      results.push({
        commitId: commit._id,
        success: false,
        error: error.message
      });
    }
  }
  
  return results;
}

/**
 * Get AI provider info
 */
export function getAIProviderInfo() {
  return {
    provider: AI_PROVIDER,
    model: getModelName(),
    configured: Boolean(
      (AI_PROVIDER === 'openai' && OPENAI_API_KEY) ||
      (AI_PROVIDER === 'groq' && GROQ_API_KEY) ||
      (AI_PROVIDER === 'gemini' && GEMINI_API_KEY) ||
      (AI_PROVIDER === 'openrouter' && OPENROUTER_API_KEY)
    )
  };
}

/**
 * Test AI connection
 */
export async function testAIConnection() {
  try {
    const client = createAIClient();
    const model = getModelName();
    
    const response = await client.chat.completions.create({
      model,
      messages: [
        { role: 'user', content: 'Say "OK" if you can read this.' }
      ],
      max_tokens: 10
    });
    
    return {
      success: true,
      provider: AI_PROVIDER,
      model,
      response: response.choices[0].message.content
    };
  } catch (error) {
    return {
      success: false,
      provider: AI_PROVIDER,
      error: error.message
    };
  }
}

/**
 * Sleep utility
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}