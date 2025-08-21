import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { apiKey, meetingNotes, customerName, meetingType, screenshots } = body;

    // Validate input
    if (!apiKey || !meetingNotes || !customerName) {
      return NextResponse.json(
        { error: 'Missing required fields (apiKey, meetingNotes, customerName)' },
        { status: 400 }
      );
    }

    // Validate API key format
    if (!apiKey.startsWith('sk-')) {
      return NextResponse.json(
        { error: 'Invalid API key format' },
        { status: 400 }
      );
    }

    const openai = new OpenAI({
      apiKey: apiKey,
    });

    // Generate AI analysis (simplified version)
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an AI assistant helping a cybersecurity consultant at Pentera. 
          Generate a structured analysis of a client meeting in JSON format with these fields:
          - summary: Brief meeting overview
          - keyFindings: Array of main security findings
          - actionItems: Array of specific tasks
          - technicalRecommendations: Array of technical guidance
          - nextSteps: Array of follow-up actions`
        },
        {
          role: "user",
          content: `Customer: ${customerName}\nMeeting Type: ${meetingType}\nNotes: ${meetingNotes}`
        }
      ],
      temperature: 0.7,
      max_tokens: 2000
    });

    const analysisResult = response.choices[0]?.message?.content;
    
    if (!analysisResult) {
      throw new Error('No analysis result from OpenAI');
    }

    let parsedResult;
    try {
      parsedResult = JSON.parse(analysisResult);
    } catch (parseError) {
      parsedResult = {
        summary: analysisResult.substring(0, 500),
        keyFindings: ['Analysis generated - see summary for details'],
        actionItems: ['Review full analysis and create specific action items'],
        technicalRecommendations: ['Technical review recommended'],
        nextSteps: ['Schedule follow-up meeting']
      };
    }

    // Generate Hebrew email draft
    const emailResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `Generate a professional follow-up email in Hebrew for a Pentera cybersecurity consultation. 
          Use Hebrew for main text but keep English technical terms. Format professionally.`
        },
        {
          role: "user",
          content: `Generate email for customer ${customerName} based on: ${JSON.stringify(parsedResult)}`
        }
      ],
      temperature: 0.6,
      max_tokens: 1000
    });

    const emailDraft = emailResponse.choices[0]?.message?.content || 'Email generation failed';

    return NextResponse.json({
      success: true,
      data: {
        ...parsedResult,
        emailDraft
      }
    });

  } catch (error) {
    console.error('AI analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to generate AI analysis' },
      { status: 500 }
    );
  }
}
