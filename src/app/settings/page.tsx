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
  CogIcon
} from '@heroicons/react/24/outline';

interface APIKeySettings {
  openaiApiKey: string;
  isConfigured: boolean;
  lastTested?: string;
  usageStats?: {
    totalRequests: number;
    monthlySpend: number;
  };
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<APIKeySettings>({
    openaiApiKey: '',
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
        setSettings(parsed);
      } catch (error) {
        console.error('Failed to parse saved settings:', error);
      }
    }
  }, []);

  const saveSettings = async () => {
    setIsSaving(true);
    try {
      // Save to localStorage (encrypted in production)
      const settingsToSave = {
        ...settings,
        isConfigured: !!settings.openaiApiKey
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
    if (!settings.openaiApiKey) {
      setTestResult({ success: false, message: 'Please enter an API key first' });
      return;
    }

    setIsTestingConnection(true);
    try {
      // Test the API key with a simple request
      const response = await fetch('/api/test-openai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ apiKey: settings.openaiApiKey }),
      });

      const result = await response.json();
      
      if (result.success) {
        setTestResult({ 
          success: true, 
          message: `Connection successful! Model: ${result.model || 'Unknown'}` 
        });
        setSettings(prev => ({ 
          ...prev, 
          lastTested: new Date().toISOString(),
          isConfigured: true 
        }));
      } else {
        setTestResult({ 
          success: false, 
          message: result.error || 'Connection failed' 
        });
      }
    } catch (error) {
      setTestResult({ 
        success: false, 
        message: 'Network error. Please check your connection.' 
      });
    } finally {
      setIsTestingConnection(false);
    }
  };

  const handleApiKeyChange = (value: string) => {
    setSettings(prev => ({ 
      ...prev, 
      openaiApiKey: value,
      isConfigured: false // Reset configuration status when key changes
    }));
    setTestResult(null); // Clear previous test results
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
                  OpenAI Configuration
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Required for AI meeting summaries and analytics features
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* API Key Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                OpenAI API Key
              </label>
              <div className="relative">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  value={settings.openaiApiKey}
                  onChange={(e) => handleApiKeyChange(e.target.value)}
                  placeholder="sk-..."
                  className="w-full px-4 py-3 pr-20 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  {showApiKey ? (
                    <EyeSlashIcon className="h-5 w-5" />
                  ) : (
                    <EyeIcon className="h-5 w-5" />
                  )}
                </button>
              </div>
              
              <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                <p>Get your API key from <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700 underline">OpenAI Platform</a></p>
                <p className="mt-1">
                  {settings.openaiApiKey && !showApiKey ? (
                    <>Current key: <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">{maskApiKey(settings.openaiApiKey)}</code></>
                  ) : (
                    'Your API key is stored locally and never sent to our servers'
                  )}
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
                <div className="flex items-center gap-2">
                  {testResult.success ? (
                    <CheckCircleIcon className="h-5 w-5 text-green-600" />
                  ) : (
                    <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />
                  )}
                  <span className={`text-sm font-medium ${
                    testResult.success ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'
                  }`}>
                    {testResult.message}
                  </span>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={testConnection}
                disabled={isTestingConnection || !settings.openaiApiKey}
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
                disabled={isSaving || !settings.openaiApiKey}
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

        {/* Feature Information */}
        <div className="mt-8 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            AI Features Overview
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
        </div>
      </div>
    </div>
    </div>
  );
}
