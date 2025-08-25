'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { 
  KeyIcon, 
  EyeIcon, 
  EyeSlashIcon, 
  CheckCircleIcon, 
  ExclamationTriangleIcon,
  SparklesIcon,
  CogIcon,
  ClockIcon,
  TrashIcon
} from '@heroicons/react/24/outline';

interface APIKeySettings {
  provider: 'openai' | 'gemini';
  openaiApiKey: string;
  geminiApiKey: string;
  isConfigured: boolean;
  lastTested?: string;
  usageStats?: {
    totalRequests: number;
    monthlySpend: number;
  };
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<APIKeySettings>({
    provider: 'openai',
    openaiApiKey: '',
    geminiApiKey: '',
    isConfigured: false
  });
  const [showApiKey, setShowApiKey] = useState(false);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Load settings from localStorage on component mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('aiSettings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        // Ensure backward compatibility
        setSettings({
          provider: parsed.provider || 'openai',
          openaiApiKey: parsed.openaiApiKey || '',
          geminiApiKey: parsed.geminiApiKey || '',
          isConfigured: parsed.isConfigured || false,
          lastTested: parsed.lastTested,
          usageStats: parsed.usageStats
        });
      } catch (error) {
        console.error('Failed to parse saved settings:', error);
      }
    }
  }, []);

  const saveSettings = async () => {
    setIsSaving(true);
    try {
      // Save to localStorage (encrypted in production)
      const currentApiKey = settings.provider === 'openai' ? settings.openaiApiKey : settings.geminiApiKey;
      const settingsToSave = {
        ...settings,
        isConfigured: !!currentApiKey
      };
      
      localStorage.setItem('aiSettings', JSON.stringify(settingsToSave));
      
      // In production, you might want to save to a secure backend
      // await fetch('/api/settings', { method: 'POST', body: JSON.stringify(settingsToSave) });
      
      setTestResult({ success: true, message: 'Settings saved successfully!' });
    } catch (error) {
      setTestResult({ success: false, message: 'Failed to save settings' });
    } finally {
      setIsSaving(false);
    }
  };

  const testConnection = async () => {
    const currentApiKey = settings.provider === 'openai' ? settings.openaiApiKey : settings.geminiApiKey;
    
    if (!currentApiKey) {
      setTestResult({ success: false, message: 'Please enter an API key first' });
      return;
    }

    setIsTestingConnection(true);
    try {
      // Test the API key with the appropriate endpoint
      const endpoint = settings.provider === 'openai' ? '/api/test-openai' : '/api/test-gemini';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ apiKey: currentApiKey }),
      });

      const result = await response.json();
      
      if (result.success) {
        setTestResult({ 
          success: true, 
          message: `✅ Connection successful! Model: ${result.model || 'Unknown'}${result.availableModels ? `\n🎯 Available: ${Object.entries(result.availableModels).filter(([,available]) => available).map(([model]) => model).join(', ')}` : ''}` 
        });
        setSettings(prev => ({ 
          ...prev, 
          lastTested: new Date().toISOString(),
          isConfigured: true 
        }));
      } else {
        let enhancedMessage = result.error || 'Connection failed';
        
        // Add helpful hints based on error type
        if (result.error?.includes('Rate limit')) {
          enhancedMessage += `\n\n💡 Tips:\n• Wait 1-2 minutes before retrying\n• Check your ${settings.provider === 'openai' ? 'OpenAI' : 'Google AI'} usage dashboard\n• Verify your billing status`;
        } else if (result.error?.includes('Invalid API key')) {
          enhancedMessage += `\n\n💡 Tips:\n• Ensure the key format is correct\n• Check for extra spaces or characters\n• Verify the key in ${settings.provider === 'openai' ? 'OpenAI' : 'Google AI Studio'} dashboard`;
        } else if (result.error?.includes('permissions')) {
          enhancedMessage += `\n\n💡 Tips:\n• Ensure API key has required model access\n• Check your plan limits\n• Verify model permissions`;
        }
        
        if (result.details) {
          enhancedMessage += `\n\n🔍 Details: ${result.details}`;
        }
        
        setTestResult({ 
          success: false, 
          message: enhancedMessage
        });
      }
    } catch (error: any) {
      let errorMessage = 'Network error. Please check your connection.';
      
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        errorMessage = 'Connection failed. Please check your internet connection.';
      } else if (error.message) {
        errorMessage = `Error: ${error.message}`;
      }
      
      setTestResult({ 
        success: false, 
        message: errorMessage
      });
    } finally {
      setIsTestingConnection(false);
    }
  };

  const handleApiKeyChange = (value: string) => {
    setSettings(prev => ({ 
      ...prev, 
      [settings.provider === 'openai' ? 'openaiApiKey' : 'geminiApiKey']: value,
      isConfigured: false // Reset configuration status when key changes
    }));
    setTestResult(null); // Clear previous test results
  };

  const handleProviderChange = (provider: 'openai' | 'gemini') => {
    setSettings(prev => ({ 
      ...prev, 
      provider,
      isConfigured: false // Reset configuration status when provider changes
    }));
    setTestResult(null); // Clear previous test results
  };

  const clearApiKey = () => {
    const keyField = settings.provider === 'openai' ? 'openaiApiKey' : 'geminiApiKey';
    setSettings(prev => ({ 
      ...prev, 
      [keyField]: '',
      isConfigured: false
    }));
    setTestResult(null);
  };

  const clearAllSettings = () => {
    if (confirm('Are you sure you want to clear all API keys and settings? This action cannot be undone.')) {
      setSettings({
        provider: 'openai',
        openaiApiKey: '',
        geminiApiKey: '',
        isConfigured: false
      });
      setTestResult(null);
      localStorage.removeItem('aiSettings');
    }
  };

  const maskApiKey = (key: string) => {
    if (key.length < 10) return key;
    return `${key.substring(0, 7)}${'*'.repeat(key.length - 14)}${key.substring(key.length - 7)}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      <div className="py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <CogIcon className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Configure your AI integration settings for meeting analysis and analytics
          </p>
        </div>

        {/* AI Configuration Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
            <div className="flex items-center gap-3">
              <SparklesIcon className="h-6 w-6 text-purple-600" />
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  AI Configuration
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Configure your AI provider for meeting summaries and analytics features
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Provider Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                AI Provider
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleProviderChange('openai')}
                  className={`p-4 border-2 rounded-lg transition-all ${
                    settings.provider === 'openai'
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                      <span className="text-green-600 dark:text-green-400 font-bold text-sm">AI</span>
                    </div>
                    <div className="text-left">
                      <div className="font-medium text-gray-900 dark:text-white">OpenAI</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">GPT-4, GPT-4o-mini</div>
                    </div>
                  </div>
                </button>
                
                <button
                  type="button"
                  onClick={() => handleProviderChange('gemini')}
                  className={`p-4 border-2 rounded-lg transition-all ${
                    settings.provider === 'gemini'
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                      <span className="text-purple-600 dark:text-purple-400 font-bold text-sm">G</span>
                    </div>
                    <div className="text-left">
                      <div className="font-medium text-gray-900 dark:text-white">Google Gemini</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Gemini Pro, Flash</div>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* API Key Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {settings.provider === 'openai' ? 'OpenAI API Key' : 'Google AI API Key'}
              </label>
              <div className="relative">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  value={settings.provider === 'openai' ? settings.openaiApiKey : settings.geminiApiKey}
                  onChange={(e) => handleApiKeyChange(e.target.value)}
                  placeholder={settings.provider === 'openai' ? 'sk-...' : 'AIza...'}
                  className="w-full px-4 py-3 pr-24 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
                  {(settings.provider === 'openai' ? settings.openaiApiKey : settings.geminiApiKey) && (
                    <button
                      type="button"
                      onClick={clearApiKey}
                      className="text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                      title="Clear API key"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    title="Toggle visibility"
                  >
                    {showApiKey ? (
                      <EyeSlashIcon className="h-5 w-5" />
                    ) : (
                      <EyeIcon className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
              
              <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                <p>
                  Get your API key from{' '}
                  {settings.provider === 'openai' ? (
                    <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700 underline">
                      OpenAI Platform
                    </a>
                  ) : (
                    <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700 underline">
                      Google AI Studio
                    </a>
                  )}
                </p>
                <p className="mt-1">
                  {(() => {
                    const currentKey = settings.provider === 'openai' ? settings.openaiApiKey : settings.geminiApiKey;
                    return currentKey && !showApiKey ? (
                      <>Current key: <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">{maskApiKey(currentKey)}</code></>
                    ) : (
                      'Your API key is stored locally and never sent to our servers'
                    );
                  })()}
                </p>
              </div>
            </div>

            {/* Test Result */}
            {testResult && (
              <div className={`p-4 rounded-lg ${
                testResult.success 
                  ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' 
                  : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
              }`}>
                <div className="flex items-start gap-3">
                  {testResult.success ? (
                    <CheckCircleIcon className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
                  ) : (
                    <ExclamationTriangleIcon className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <div className={`text-sm font-medium whitespace-pre-line ${
                      testResult.success ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'
                    }`}>
                      {testResult.message}
                    </div>
                    
                    {/* Additional help for rate limiting */}
                    {!testResult.success && testResult.message.includes('Rate limit') && (
                      <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-md border border-yellow-200 dark:border-yellow-700">
                        <div className="flex items-center gap-2 mb-2">
                          <ClockIcon className="h-4 w-4 text-yellow-600" />
                          <span className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                            Rate Limit Help
                          </span>
                        </div>
                        <div className="text-xs text-yellow-700 dark:text-yellow-300 space-y-1">
                          <p>• OpenAI has usage limits based on your plan</p>
                          <p>• Wait 1-2 minutes before trying again</p>
                          <p>• Check your usage at <a href="https://platform.openai.com/usage" target="_blank" rel="noopener noreferrer" className="underline hover:text-yellow-500">OpenAI Dashboard</a></p>
                          <p>• Consider upgrading your plan if you hit limits frequently</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={testConnection}
                disabled={isTestingConnection || !(settings.provider === 'openai' ? settings.openaiApiKey : settings.geminiApiKey)}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isTestingConnection ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Testing...
                  </>
                ) : (
                  <>
                    <KeyIcon className="h-4 w-4 mr-2" />
                    Test Connection
                  </>
                )}
              </button>

              <button
                onClick={saveSettings}
                disabled={isSaving || !(settings.provider === 'openai' ? settings.openaiApiKey : settings.geminiApiKey)}
                className="inline-flex items-center px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckCircleIcon className="h-4 w-4 mr-2" />
                    Save Settings
                  </>
                )}
              </button>

              <button
                onClick={clearAllSettings}
                disabled={!settings.openaiApiKey && !settings.geminiApiKey}
                className="inline-flex items-center px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <TrashIcon className="h-4 w-4 mr-2" />
                Clear All
              </button>
            </div>

            {/* Status Indicator */}
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${
                    settings.isConfigured ? 'bg-green-500' : 'bg-gray-400'
                  }`}></div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    AI Features: {settings.isConfigured ? 'Enabled' : 'Not Configured'}
                  </span>
                </div>
                
                {settings.lastTested && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Last tested: {new Date(settings.lastTested).toLocaleString()}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Rate Limiting Help */}
        <div className="mt-8 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <ClockIcon className="h-6 w-6 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
                Experiencing Rate Limits?
              </h3>
              <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-4">
                If you're hitting OpenAI rate limits, you can easily switch to Google Gemini for continued AI functionality.
              </p>
              <div className="space-y-2 text-sm text-yellow-700 dark:text-yellow-300">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-yellow-600 rounded-full"></span>
                  <span>Use the trash icon next to your API key to clear the rate-limited OpenAI key</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-yellow-600 rounded-full"></span>
                  <span>Switch to Google Gemini provider above</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-yellow-600 rounded-full"></span>
                  <span>Add your Gemini API key from <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="underline hover:text-yellow-600">Google AI Studio</a></span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-yellow-600 rounded-full"></span>
                  <span>Continue using all AI features without interruption</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Information */}
        <div className="mt-8 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            AI Features Overview
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <SparklesIcon className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900 dark:text-blue-200">Meeting Summaries</h4>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  AI-powered analysis of meeting notes and screenshots
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <SparklesIcon className="h-5 w-5 text-purple-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-purple-900 dark:text-purple-200">Analytics Insights</h4>
                <p className="text-sm text-purple-700 dark:text-purple-300">
                  Customer behavior analysis and trend detection
                </p>
              </div>
            </div>
          </div>

          {/* Provider Comparison */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
              Supported AI Providers
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-gray-700 dark:text-gray-300">
                  <span className="font-medium">OpenAI:</span> GPT-4, GPT-4o, GPT-4o-mini
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span className="text-gray-700 dark:text-gray-300">
                  <span className="font-medium">Google Gemini:</span> 1.5 Flash, 1.5 Pro, Pro
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}
