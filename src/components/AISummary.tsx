'use client';

import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { penteraAI, type AIAnalysisResult } from '@/lib/penteraAI-server';
import { settingsManager } from '@/lib/settingsManager';
import Link from 'next/link';
import {
  SparklesIcon,
  DocumentTextIcon,
  PhotoIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  EnvelopeIcon,
  ListBulletIcon,
  LightBulbIcon,
  CogIcon
} from '@heroicons/react/24/outline';

interface AISummaryProps {
  meetingId: string;
  customerId: string;
  customerName: string;
  notes: string;
  screenshots: (File | string)[];
  onSummaryGenerated?: (summary: AIAnalysisResult) => void;
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
  const [analysisResult, setAnalysisResult] = useState<AIAnalysisResult | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showContext, setShowContext] = useState(false);
  const [error, setError] = useState<string>('');
  const [isConfigured, setIsConfigured] = useState(settingsManager.isConfigured());

  const generateAISummary = async () => {
    // Refresh configuration status
    setIsConfigured(settingsManager.isConfigured());
    
    if (!settingsManager.isConfigured()) {
      setError('Please configure your AI provider API key in Settings first.');
      return;
    }

    setIsGenerating(true);
    setError('');
    
    try {
      // Convert screenshots from mixed types to File objects
      const fileScreenshots = screenshots.filter((s): s is File => s instanceof File);
      
      const result = await penteraAI.generateMeetingSummary({
        meetingNotes: notes,
        screenshots: fileScreenshots,
        customerName,
        meetingType: 'consultation' // Can be made dynamic based on meeting type
      });
      
      setAnalysisResult(result);
      onSummaryGenerated?.(result);
      
    } catch (error) {
      console.error('Failed to generate AI summary:', error);
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('Failed to generate AI summary. Please try again.');
      }
    } finally {
      setIsGenerating(false);
    }
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

      {/* Configuration Check */}
      {!isConfigured && (
        <div className="mb-4 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
          <div className="flex items-start gap-3">
            <ExclamationTriangleIcon className="h-5 w-5 text-amber-600 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-medium text-amber-800 dark:text-amber-200 mb-1">
                AI Features Not Configured
              </h4>
              <p className="text-sm text-amber-700 dark:text-amber-300 mb-3">
                To use AI-powered meeting summaries, you need to configure your OpenAI API key.
              </p>
              <Link
                href="/settings"
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-600 text-white text-sm font-medium rounded-md hover:bg-amber-700 transition-colors"
              >
                <CogIcon className="h-4 w-4" />
                Go to Settings
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <div className="flex items-center">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-500 mr-2" />
            <span className="text-red-700 text-sm">{error}</span>
          </div>
        </div>
      )}

      {/* AI Context Information */}
      {showContext && (
        <div className="mb-4 p-3 bg-white rounded-md border border-gray-200">
          <h4 className="font-medium text-gray-800 mb-2">AI Context Sources:</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
            <div>
              <div className="font-medium text-blue-600 mb-1">� Cybersecurity Focus</div>
              <div className="text-gray-600">Pentera consultation context</div>
            </div>
            <div>
              <div className="font-medium text-green-600 mb-1">� Image Analysis</div>
              <div className="text-gray-600">Screenshot content analysis</div>
            </div>
            <div>
              <div className="font-medium text-purple-600 mb-1">🎯 Industry Expertise</div>
              <div className="text-gray-600">Penetration testing knowledge</div>
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
      {!analysisResult && isConfigured && (
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
              Analyzing meeting notes and screenshots
            </div>
            <div>Applying cybersecurity domain knowledge</div>
            <div>Anonymizing sensitive information</div>
            <div>Generating structured summary and email draft</div>
          </div>
        </div>
      )}

      {/* Generated Analysis Results */}
      {analysisResult && (
        <div className="space-y-4">
          <div className="flex items-center mb-3">
            <CheckCircleIcon className="h-5 w-5 text-green-600 mr-2" />
            <span className="font-medium text-green-800">AI Analysis Complete</span>
          </div>

          {/* Summary */}
          <div className="bg-white rounded-lg p-4 border border-blue-200">
            <div className="flex items-center mb-2">
              <DocumentTextIcon className="h-4 w-4 text-blue-600 mr-2" />
              <h4 className="font-medium text-blue-800">Meeting Summary</h4>
            </div>
            <div className="text-gray-700 text-sm bg-blue-50 p-3 rounded border">
              {analysisResult.summary}
            </div>
          </div>

          {/* Key Findings */}
          {analysisResult.keyFindings.length > 0 && (
            <div className="bg-white rounded-lg p-4 border border-orange-200">
              <div className="flex items-center mb-2">
                <LightBulbIcon className="h-4 w-4 text-orange-600 mr-2" />
                <h4 className="font-medium text-orange-800">Key Findings</h4>
              </div>
              <ul className="text-sm text-gray-700 space-y-1 bg-orange-50 p-3 rounded border">
                {analysisResult.keyFindings.map((finding, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-orange-500 mr-2">•</span>
                    {finding}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Action Items */}
          {analysisResult.actionItems.length > 0 && (
            <div className="bg-white rounded-lg p-4 border border-green-200">
              <div className="flex items-center mb-2">
                <ListBulletIcon className="h-4 w-4 text-green-600 mr-2" />
                <h4 className="font-medium text-green-800">Action Items</h4>
              </div>
              <ul className="text-sm text-gray-700 space-y-1 bg-green-50 p-3 rounded border">
                {analysisResult.actionItems.map((item, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-green-500 mr-2">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Technical Recommendations */}
          {analysisResult.technicalRecommendations.length > 0 && (
            <div className="bg-white rounded-lg p-4 border border-purple-200">
              <div className="flex items-center mb-2">
                <SparklesIcon className="h-4 w-4 text-purple-600 mr-2" />
                <h4 className="font-medium text-purple-800">Technical Recommendations</h4>
              </div>
              <ul className="text-sm text-gray-700 space-y-1 bg-purple-50 p-3 rounded border">
                {analysisResult.technicalRecommendations.map((rec, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-purple-500 mr-2">•</span>
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Email Draft */}
          <div className="bg-white rounded-lg p-4 border border-indigo-200">
            <div className="flex items-center mb-2">
              <EnvelopeIcon className="h-4 w-4 text-indigo-600 mr-2" />
              <h4 className="font-medium text-indigo-800">Hebrew Email Draft</h4>
            </div>
            <div className="text-sm text-gray-700 bg-indigo-50 p-3 rounded border whitespace-pre-wrap font-mono text-right" dir="rtl">
              {analysisResult.emailDraft}
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
                  setAnalysisResult(null);
                  generateAISummary();
                }}
                className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200"
              >
                Regenerate
              </button>
              <button
                onClick={() => {
                  const fullContent = `
MEETING SUMMARY:
${analysisResult.summary}

KEY FINDINGS:
${analysisResult.keyFindings.map(f => `• ${f}`).join('\n')}

ACTION ITEMS:
${analysisResult.actionItems.map(a => `• ${a}`).join('\n')}

TECHNICAL RECOMMENDATIONS:
${analysisResult.technicalRecommendations.map(r => `• ${r}`).join('\n')}

EMAIL DRAFT:
${analysisResult.emailDraft}
                  `;
                  navigator.clipboard.writeText(fullContent.trim());
                }}
                className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded-md hover:bg-green-200"
              >
                Copy All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
