'use client';

import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  SparklesIcon,
  DocumentTextIcon,
  PhotoIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

interface AISummaryProps {
  meetingId: string;
  customerId: string;
  customerName: string;
  notes: string;
  screenshots: (File | string)[];
  onSummaryGenerated?: (summary: string) => void;
}

interface AIContext {
  previousEmails: string[];
  customerHistory: string[];
  meetingPatterns: string[];
}

export function AISummary({ 
  meetingId: _meetingId, 
  customerId: _customerId, 
  customerName, 
  notes, 
  screenshots, 
  onSummaryGenerated 
}: AISummaryProps) {
  const _queryClient = useQueryClient();
  const [generatedSummary, setGeneratedSummary] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showContext, setShowContext] = useState(false);

  // Mock AI context data (in real app, this would come from your email/CRM system)
  const getMockAIContext = (): AIContext => ({
    previousEmails: [
      `Email to ${customerName}: "Following up on our Q3 planning discussion..."`,
      `Email from ${customerName}: "Looking forward to implementing the new features..."`,
      `Email to ${customerName}: "Regarding the technical integration requirements..."`
    ],
    customerHistory: [
      `Previous meeting: Discussed roadmap priorities and budget allocation`,
      `Previous meeting: Technical deep-dive on API integration`,
      `Previous meeting: Contract renewal and expansion planning`
    ],
    meetingPatterns: [
      `Typical meeting outcomes: Technical requirements, timeline discussions, next steps`,
      `Customer preferences: Detailed documentation, clear action items`,
      `Communication style: Professional, technical, solution-focused`
    ]
  });

  const generateAISummary = async () => {
    setIsGenerating(true);
    
    try {
      // Simulate AI processing with realistic delay
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const context = getMockAIContext();
      
      // Mock AI summary generation based on notes, screenshots, and context
      const aiSummary = generateMockSummary(notes, screenshots.length, context, customerName);
      
      setGeneratedSummary(aiSummary);
      onSummaryGenerated?.(aiSummary);
      
      // In real implementation, this would call the backend AI service
      // const response = await meetingApi.generateSummary(meetingId, 'en');
      // setGeneratedSummary(response.data.summary);
      
    } catch (error) {
      console.error('Failed to generate AI summary:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const generateMockSummary = (notes: string, screenshotCount: number, context: AIContext, customer: string): string => {
    const hasNotes = notes && notes.trim().length > 10;
    const hasScreenshots = screenshotCount > 0;
    
    let summary = `## AI-Generated Meeting Summary\n\n`;
    
    // Context-aware summary based on previous emails and history
    summary += `### Meeting Overview\n`;
    summary += `Based on previous communications with ${customer} and meeting patterns, this session focused on:\n\n`;
    
    if (hasNotes) {
      // Analyze notes content
      const lowerNotes = notes.toLowerCase();
      if (lowerNotes.includes('technical') || lowerNotes.includes('integration')) {
        summary += `- **Technical Discussion**: Deep-dive into technical requirements and implementation details\n`;
      }
      if (lowerNotes.includes('roadmap') || lowerNotes.includes('planning') || lowerNotes.includes('future')) {
        summary += `- **Strategic Planning**: Roadmap alignment and future feature planning\n`;
      }
      if (lowerNotes.includes('issue') || lowerNotes.includes('problem') || lowerNotes.includes('bug')) {
        summary += `- **Issue Resolution**: Addressing current challenges and providing solutions\n`;
      }
      if (lowerNotes.includes('demo') || lowerNotes.includes('show') || lowerNotes.includes('present')) {
        summary += `- **Product Demonstration**: Showcasing new features and capabilities\n`;
      }
    }
    
    if (hasScreenshots) {
      summary += `- **Visual Documentation**: ${screenshotCount} screenshot${screenshotCount > 1 ? 's' : ''} captured for reference\n`;
    }
    
    summary += `\n### Key Insights (AI-Enhanced)\n`;
    summary += `*Based on previous email exchanges and customer interaction patterns:*\n\n`;
    
    // Context from previous emails
    summary += `**Communication Context:**\n`;
    summary += `- Previous discussions indicate ${customer} values detailed technical documentation\n`;
    summary += `- Customer communication style suggests preference for structured action items\n`;
    summary += `- Historical pattern shows focus on implementation timelines and deliverables\n\n`;
    
    // Meeting content analysis
    if (hasNotes) {
      summary += `**Meeting Content Analysis:**\n`;
      const noteLength = notes.length;
      if (noteLength > 500) {
        summary += `- Comprehensive discussion (${Math.floor(noteLength/100)*5}+ minutes estimated)\n`;
      } else if (noteLength > 200) {
        summary += `- Focused discussion covering key topics\n`;
      } else {
        summary += `- Brief but targeted conversation\n`;
      }
      
      // Extract potential action items from notes
      const sentences = notes.split(/[.!?]+/).filter(s => s.trim().length > 10);
      const actionWords = ['will', 'should', 'need', 'must', 'plan', 'schedule', 'follow', 'send', 'provide'];
      const potentialActions = sentences.filter(sentence => 
        actionWords.some(word => sentence.toLowerCase().includes(word))
      );
      
      if (potentialActions.length > 0) {
        summary += `- Identified ${potentialActions.length} potential action item${potentialActions.length > 1 ? 's' : ''} for follow-up\n`;
      }
    }
    
    if (hasScreenshots) {
      summary += `- Visual evidence captured for documentation and reference\n`;
      summary += `- Screenshots can be used for technical documentation and stakeholder updates\n`;
    }
    
    summary += `\n### Recommended Next Steps (AI Suggestions)\n`;
    summary += `*Based on customer communication patterns and meeting outcomes:*\n\n`;
    summary += `1. **Follow-up Email**: Send detailed summary within 24 hours (aligns with ${customer} preferences)\n`;
    summary += `2. **Documentation**: Create technical documentation if applicable\n`;
    summary += `3. **Action Items**: Schedule specific follow-up tasks based on discussion points\n`;
    summary += `4. **Stakeholder Update**: Share key outcomes with relevant team members\n\n`;
    
    summary += `### Email Context Integration\n`;
    summary += `*AI has considered the following recent communications:*\n\n`;
    context.previousEmails.slice(0, 2).forEach((email, _index) => {
      summary += `- ${email}\n`;
    });
    
    summary += `\n---\n`;
    summary += `*This summary was generated using AI analysis of meeting notes, visual content, and historical communication patterns. Review and customize as needed before sharing.*`;
    
    return summary;
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <SparklesIcon className="h-5 w-5 text-purple-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">AI Meeting Summary</h3>
        </div>
        
        <button
          onClick={() => setShowContext(!showContext)}
          className="text-sm text-gray-600 hover:text-gray-800"
        >
          {showContext ? 'Hide' : 'Show'} Context
        </button>
      </div>

      {/* AI Context Information */}
      {showContext && (
        <div className="mb-4 p-3 bg-white rounded-md border border-gray-200">
          <h4 className="font-medium text-gray-800 mb-2">AI Context Sources:</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
            <div>
              <div className="font-medium text-blue-600 mb-1">📧 Email History</div>
              <div className="text-gray-600">Previous email exchanges</div>
            </div>
            <div>
              <div className="font-medium text-green-600 mb-1">📅 Meeting Patterns</div>
              <div className="text-gray-600">Historical meeting outcomes</div>
            </div>
            <div>
              <div className="font-medium text-purple-600 mb-1">🎯 Customer Profile</div>
              <div className="text-gray-600">Communication preferences</div>
            </div>
          </div>
        </div>
      )}

      {/* Input Analysis */}
      <div className="mb-4 grid grid-cols-2 gap-4">
        <div className="flex items-center p-3 bg-white rounded-md">
          <DocumentTextIcon className="h-5 w-5 text-blue-500 mr-2" />
          <div>
            <div className="font-medium text-gray-800">Meeting Notes</div>
            <div className="text-sm text-gray-600">
              {notes && notes.trim().length > 0 
                ? `${notes.length} characters ready for analysis`
                : 'No notes provided'
              }
            </div>
          </div>
        </div>
        
        <div className="flex items-center p-3 bg-white rounded-md">
          <PhotoIcon className="h-5 w-5 text-green-500 mr-2" />
          <div>
            <div className="font-medium text-gray-800">Screenshots</div>
            <div className="text-sm text-gray-600">
              {screenshots.length > 0 
                ? `${screenshots.length} image${screenshots.length > 1 ? 's' : ''} for analysis`
                : 'No screenshots provided'
              }
            </div>
          </div>
        </div>
      </div>

      {/* Generate Button */}
      {!generatedSummary && (
        <div className="text-center mb-4">
          <button
            onClick={generateAISummary}
            disabled={isGenerating || (!notes.trim() && screenshots.length === 0)}
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isGenerating ? (
              <>
                <ArrowPathIcon className="h-5 w-5 mr-2 animate-spin" />
                Analyzing with AI...
              </>
            ) : (
              <>
                <SparklesIcon className="h-5 w-5 mr-2" />
                Generate AI Summary
              </>
            )}
          </button>
          
          {(!notes.trim() && screenshots.length === 0) && (
            <p className="text-sm text-gray-500 mt-2">
              Add meeting notes or screenshots to enable AI summary generation
            </p>
          )}
        </div>
      )}

      {/* Loading State */}
      {isGenerating && (
        <div className="bg-white rounded-lg p-6 text-center">
          <div className="flex items-center justify-center mb-4">
            <ArrowPathIcon className="h-8 w-8 text-blue-600 animate-spin mr-3" />
            <span className="text-lg font-medium text-gray-800">AI Processing...</span>
          </div>
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex items-center justify-center">
              <ClockIcon className="h-4 w-4 mr-2" />
              Analyzing meeting notes and visual content
            </div>
            <div>Reviewing previous email communications with {customerName}</div>
            <div>Applying meeting pattern recognition</div>
            <div>Generating contextual summary and recommendations</div>
          </div>
        </div>
      )}

      {/* Generated Summary */}
      {generatedSummary && (
        <div className="bg-white rounded-lg p-4 border border-green-200">
          <div className="flex items-center mb-3">
            <CheckCircleIcon className="h-5 w-5 text-green-600 mr-2" />
            <span className="font-medium text-green-800">AI Summary Generated</span>
          </div>
          
          <div className="prose prose-sm max-w-none">
            <div className="whitespace-pre-wrap text-gray-800 bg-gray-50 p-4 rounded-md border">
              {generatedSummary}
            </div>
          </div>
          
          <div className="mt-4 flex justify-between items-center">
            <div className="flex items-center text-sm text-gray-600">
              <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
              Review and edit before sharing
            </div>
            
            <div className="flex space-x-2">
              <button
                onClick={() => {
                  setGeneratedSummary('');
                  generateAISummary();
                }}
                className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200"
              >
                Regenerate
              </button>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(generatedSummary);
                }}
                className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded-md hover:bg-green-200"
              >
                Copy to Clipboard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
