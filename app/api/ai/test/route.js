import { testAIConnection, getAIProviderInfo } from '@/lib/ai';

/**
 * Test AI connection
 * GET /api/ai/test
 */
export async function GET() {
  try {
    const info = getAIProviderInfo();
    
    if (!info.configured) {
      return Response.json({
        success: false,
        message: 'AI provider not configured',
        info,
        hint: `Set ${info.provider.toUpperCase()}_API_KEY in .env`
      }, { status: 500 });
    }
    
    console.log('🧪 Testing AI connection...');
    
    const result = await testAIConnection();
    
    if (result.success) {
      console.log('✅ AI connection successful');
      return Response.json({
        success: true,
        message: 'AI connection successful',
        ...result
      });
    } else {
      console.error('❌ AI connection failed:', result.error);
      return Response.json({
        success: false,
        message: 'AI connection failed',
        ...result
      }, { status: 500 });
    }
    
  } catch (error) {
    console.error('❌ AI test error:', error);
    return Response.json(
      { 
        success: false,
        error: error.message || 'AI test failed' 
      },
      { status: 500 }
    );
  }
}