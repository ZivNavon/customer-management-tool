import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { apiKey } = await request.json();

    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'API key is required' },
        { status: 400 }
      );
    }

    // Dynamic import to avoid build-time dependency issues
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    
    // Initialize the Gemini API client
    const genAI = new GoogleGenerativeAI(apiKey);
    
    try {
      // Test the API key with a simple request
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      
      // Simple test prompt
      const result = await model.generateContent("Test connection. Respond with 'OK' only.");
      const response = await result.response;
      const text = response.text();

      return NextResponse.json({
        success: true,
        model: 'gemini-1.5-flash',
        response: text,
        availableModels: {
          'gemini-1.5-flash': true,
          'gemini-1.5-pro': true,
          'gemini-pro': true
        },
        message: 'API key is valid and has model access'
      });

    } catch (geminiError: any) {
      let errorMessage = 'Unknown error occurred';
      let statusCode = 400;
      
      console.error('Gemini API Error:', geminiError);
      
      if (geminiError.status === 401 || geminiError.message?.includes('API_KEY_INVALID')) {
        errorMessage = 'Invalid API key - Authentication failed';
      } else if (geminiError.status === 429 || geminiError.message?.includes('RATE_LIMIT_EXCEEDED')) {
        errorMessage = 'Rate limit exceeded - Please wait a moment and try again';
        statusCode = 429;
      } else if (geminiError.status === 403 || geminiError.message?.includes('permission')) {
        errorMessage = 'API key does not have required permissions';
      } else if (geminiError.status === 400) {
        errorMessage = 'Bad request - Check API key format and permissions';
      } else if (geminiError.status === 500) {
        errorMessage = 'Gemini service temporarily unavailable';
        statusCode = 503;
      } else if (geminiError.message) {
        errorMessage = `Gemini API Error: ${geminiError.message}`;
      } else if (geminiError.code) {
        errorMessage = `API Error Code: ${geminiError.code}`;
      }

      return NextResponse.json(
        { 
          success: false, 
          error: errorMessage,
          details: geminiError.status ? `HTTP ${geminiError.status}` : 'No status code'
        },
        { status: statusCode }
      );
    }

  } catch (error: any) {
    console.error('Test Gemini API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to test API key',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
