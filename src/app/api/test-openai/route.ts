import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function POST(request: NextRequest) {
  try {
    const { apiKey } = await request.json();

    if (!apiKey || !apiKey.startsWith('sk-')) {
      return NextResponse.json(
        { success: false, error: 'Invalid API key format' },
        { status: 400 }
      );
    }

    // Test the API key with a minimal request using the same models as the main system
    const openai = new OpenAI({ apiKey });
    
    try {
      // First try to list models (minimal API call with lower rate limit impact)
      const models = await openai.models.list();
      
      // Check if we have access to required models
      const modelsList = models.data.map(m => m.id);
      const hasGPT4o = modelsList.some(id => id.includes('gpt-4o'));
      const hasGPT4oMini = modelsList.some(id => id.includes('gpt-4o-mini'));
      const hasGPT35 = modelsList.some(id => id.includes('gpt-3.5-turbo'));
      
      if (!hasGPT4o && !hasGPT4oMini && !hasGPT35) {
        return NextResponse.json({
          success: false,
          error: 'API key does not have access to required models (gpt-4o, gpt-4o-mini, or gpt-3.5-turbo)'
        }, { status: 400 });
      }

      // If we have models access, the API key is valid
      // Skip the chat completion test to avoid rate limits during validation
      return NextResponse.json({
        success: true,
        model: 'API Key Valid',
        availableModels: {
          'gpt-4o': hasGPT4o,
          'gpt-4o-mini': hasGPT4oMini,
          'gpt-3.5-turbo': hasGPT35
        },
        message: 'API key is valid and has model access'
      });

    } catch (openaiError: any) {
      let errorMessage = 'Unknown error occurred';
      let statusCode = 400;
      
      console.error('OpenAI API Error:', openaiError);
      
      if (openaiError.status === 401) {
        errorMessage = 'Invalid API key - Authentication failed';
      } else if (openaiError.status === 429) {
        errorMessage = 'Rate limit exceeded - Please wait a moment and try again';
        statusCode = 429;
      } else if (openaiError.status === 403) {
        errorMessage = 'API key does not have required permissions';
      } else if (openaiError.status === 400) {
        errorMessage = 'Bad request - Check API key format and permissions';
      } else if (openaiError.status === 500) {
        errorMessage = 'OpenAI service temporarily unavailable';
        statusCode = 503;
      } else if (openaiError.message) {
        errorMessage = `OpenAI API Error: ${openaiError.message}`;
      } else if (openaiError.code) {
        errorMessage = `API Error Code: ${openaiError.code}`;
      }

      return NextResponse.json(
        { 
          success: false, 
          error: errorMessage,
          details: openaiError.status ? `HTTP ${openaiError.status}` : 'No status code'
        },
        { status: statusCode }
      );
    }
  } catch (error) {
    console.error('Test API key error:', error);
    return NextResponse.json(
      { success: false, error: 'Server error occurred' },
      { status: 500 }
    );
  }
}
