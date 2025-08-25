// Server-side AI service using Next.js API routes with localStorage API key
import { settingsManager } from './settingsManager';

export interface AIAnalysisInput {
  meetingNotes: string;
  screenshots: File[];
  customerName: string;
  customerContext?: {
    previousMeetings?: string[];
    communicationStyle?: string;
    technicalBackground?: string;
  };
  meetingType?: 'consultation' | 'follow-up' | 'technical' | 'planning';
}

export interface AIAnalysisResult {
  summary: string;
  keyFindings: string[];
  actionItems: string[];
  technicalRecommendations: string[];
  nextSteps: string[];
  emailDraft: string;
}

export class PenteraAIService {
  private static instance: PenteraAIService;

  public static getInstance(): PenteraAIService {
    if (!PenteraAIService.instance) {
      PenteraAIService.instance = new PenteraAIService();
    }
    return PenteraAIService.instance;
  }

  public async generateMeetingSummary(input: AIAnalysisInput): Promise<AIAnalysisResult> {
    // Check if any provider is configured
    if (!settingsManager.isConfigured()) {
      throw new Error('⚙️ No AI provider configured. Please go to Settings to add your API key.');
    }

    const settings = settingsManager.getSettings();
    const provider = settings.provider || 'openai';
    const apiKey = settingsManager.getApiKeyForProvider(provider);

    if (!apiKey) {
      throw new Error(`🔑 ${provider === 'openai' ? 'OpenAI' : 'Gemini'} API key not configured. Please check your settings.`);
    }

    try {
      // Call server-side API with the user's API key and provider
      const response = await fetch('/api/ai-summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          provider,
          apiKey,
          meetingNotes: input.meetingNotes,
          customerName: input.customerName,
          meetingType: input.meetingType,
          // Note: Screenshots would need additional handling for file upload
          screenshots: input.screenshots.length
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `API request failed: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'API request failed');
      }

      // Update usage stats
      settingsManager.updateUsageStats(1, 0); // You can track actual costs if needed

      return result.data;
    } catch (error: any) {
      console.error('Error generating AI summary:', error);
      
      // Provide user-friendly error messages based on error type
      if (error instanceof Error) {
        if (error.message.includes('API key') || error.message.includes('Authentication')) {
          throw new Error(`🔑 Invalid API key. Please check your ${provider === 'openai' ? 'OpenAI' : 'Gemini'} settings and ensure the key is correct.`);
        } else if (error.message.includes('rate limit') || error.message.includes('Rate limit')) {
          throw new Error('⏱️ Rate limit exceeded. Please wait 1-2 minutes and try again.');
        } else if (error.message.includes('quota') || error.message.includes('billing')) {
          throw new Error(`💳 API quota exceeded. Please check your ${provider === 'openai' ? 'OpenAI' : 'Google Cloud'} billing and usage limits.`);
        } else if (error.message.includes('permissions')) {
          throw new Error(`🚫 API key lacks required permissions. Ensure it has access to ${provider === 'openai' ? 'GPT-4o models' : 'Gemini API'}.`);
        } else if (error.message.includes('Network') || error.message.includes('fetch')) {
          throw new Error('🌐 Network connection error. Please check your internet connection.');
        } else if (error.message.includes('configured')) {
          throw new Error('⚙️ AI provider not configured. Please go to Settings to add your API key.');
        }
      }
      
      // Generic fallback with helpful suggestion
      throw new Error('❌ Failed to generate AI analysis. Please check your API key in Settings and try again.');
    }
  }
}

export const penteraAI = PenteraAIService.getInstance();
