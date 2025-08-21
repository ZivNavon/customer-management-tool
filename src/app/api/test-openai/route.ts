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

    // Test the API key with a minimal request
    const openai = new OpenAI({ apiKey });
    
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: "Test" }],
        max_tokens: 5
      });

      return NextResponse.json({
        success: true,
        model: response.model,
        message: 'API key is valid and working'
      });
    } catch (openaiError: any) {
      let errorMessage = 'Unknown error occurred';
      
      if (openaiError.status === 401) {
        errorMessage = 'Invalid API key';
      } else if (openaiError.status === 429) {
        errorMessage = 'Rate limit exceeded or quota reached';
      } else if (openaiError.status === 403) {
        errorMessage = 'API key does not have required permissions';
      } else if (openaiError.message) {
        errorMessage = openaiError.message;
      }

      return NextResponse.json(
        { success: false, error: errorMessage },
        { status: 400 }
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
