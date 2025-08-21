// Utility functions for managing API keys and settings
export interface AISettings {
  openaiApiKey: string;
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
      return { openaiApiKey: '', isConfigured: false };
    }

    try {
      const saved = localStorage.getItem(SETTINGS_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }

    return { openaiApiKey: '', isConfigured: false };
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

  // Get just the API key
  public getApiKey(): string {
    const settings = this.getSettings();
    return settings.openaiApiKey || '';
  }

  // Check if AI features are configured
  public isConfigured(): boolean {
    const settings = this.getSettings();
    return settings.isConfigured && !!settings.openaiApiKey;
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
