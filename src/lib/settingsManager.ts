// Utility functions for managing API keys and settings
export type AIProvider = 'openai' | 'gemini';

export interface AISettings {
  provider: AIProvider;
  openaiApiKey: string;
  geminiApiKey: string;
  isConfigured: boolean;
  lastTested?: string;
  usageStats?: {
    totalRequests: number;
    monthlySpend: number;
  };
}

const SETTINGS_KEY = 'aiSettings';

export class SettingsManager {
  private static instance: SettingsManager;

  public static getInstance(): SettingsManager {
    if (!SettingsManager.instance) {
      SettingsManager.instance = new SettingsManager();
    }
    return SettingsManager.instance;
  }

  // Get settings from localStorage
  public getSettings(): AISettings {
    if (typeof window === 'undefined') {
      return { provider: 'openai', openaiApiKey: '', geminiApiKey: '', isConfigured: false };
    }

    try {
      const saved = localStorage.getItem(SETTINGS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Ensure backward compatibility by adding missing fields
        return {
          provider: parsed.provider || 'openai',
          openaiApiKey: parsed.openaiApiKey || '',
          geminiApiKey: parsed.geminiApiKey || '',
          isConfigured: parsed.isConfigured || false,
          lastTested: parsed.lastTested,
          usageStats: parsed.usageStats
        };
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }

    return { provider: 'openai', openaiApiKey: '', geminiApiKey: '', isConfigured: false };
  }

  // Save settings to localStorage
  public saveSettings(settings: AISettings): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error('Failed to save settings:', error);
      throw new Error('Failed to save settings');
    }
  }

  // Get just the API key for the selected provider
  public getApiKey(): string {
    const settings = this.getSettings();
    return settings.provider === 'openai' ? settings.openaiApiKey : settings.geminiApiKey;
  }

  // Get API key for specific provider
  public getApiKeyForProvider(provider: AIProvider): string {
    const settings = this.getSettings();
    return provider === 'openai' ? settings.openaiApiKey : settings.geminiApiKey;
  }

  // Get current provider
  public getProvider(): AIProvider {
    const settings = this.getSettings();
    return settings.provider;
  }

  // Check if AI features are configured
  public isConfigured(): boolean {
    const settings = this.getSettings();
    const apiKey = settings.provider === 'openai' ? settings.openaiApiKey : settings.geminiApiKey;
    return settings.isConfigured && !!apiKey;
  }

  // Clear all settings
  public clearSettings(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(SETTINGS_KEY);
  }

  // Update usage stats
  public updateUsageStats(requests: number, spend: number): void {
    const settings = this.getSettings();
    settings.usageStats = {
      totalRequests: (settings.usageStats?.totalRequests || 0) + requests,
      monthlySpend: spend
    };
    this.saveSettings(settings);
  }
}

export const settingsManager = SettingsManager.getInstance();
