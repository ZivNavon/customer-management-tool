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
    // Check if API key is configured
    if (!settingsManager.isConfigured()) {
      throw new Error('OpenAI API key not configured. Please go to Settings to add your API key.');
    }

    const apiKey = settingsManager.getApiKey();

    try {
      // Call server-side API with the user's API key
      const response = await fetch('/api/ai-summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          apiKey, // Pass the API key from localStorage
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
    } catch (error) {
      console.error('Error generating AI summary:', error);
      
      // Provide user-friendly error messages
      if (error instanceof Error) {
        if (error.message.includes('API key')) {
          throw new Error('Invalid API key. Please check your settings.');
        } else if (error.message.includes('rate limit')) {
          throw new Error('Rate limit exceeded. Please try again later.');
        } else if (error.message.includes('quota')) {
          throw new Error('API quota exceeded. Please check your OpenAI billing.');
        }
      }
      
      throw new Error('Failed to generate AI analysis. Please try again.');
    }
  }
}

export const penteraAI = PenteraAIService.getInstance();
