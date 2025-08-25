// AI Service for generating analytics reports
// Enhanced AI Analytics with multi-provider support and customer-specific insights
import { settingsManager, type AIProvider } from './settingsManager';

interface MeetingData {
  id: string;
  customer_id: string;
  customer_name: string;
  title: string;
  date: string;
  duration?: number;
  summary?: string;
  notes?: string;
  outcome?: string;
}

interface TaskData {
  id: string;
  customer_id: string;
  customer_name?: string;
  title: string;
  description?: string;
  due_date?: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in_progress' | 'completed';
  created_at: string;
  completed_at?: string;
  source?: 'manual' | 'meeting_next_steps';
}

interface AnalyticsFilter {
  timeRange: 'week' | 'month' | 'quarter' | 'year';
  customers: string[];
  dateFrom?: string;
  dateTo?: string;
}

interface AnalyticsReport {
  id: string;
  title: string;
  summary: string;
  insights: string[];
  recommendations: string[];
  data: {
    totalMeetings: number;
    uniqueCustomers: number;
    averageMeetingsPerWeek: number;
    topCustomers: { name: string; meetingCount: number }[];
    meetingTrends: { date: string; count: number }[];
    totalTasks: number;
    completedTasks: number;
    taskCompletionRate: number;
    tasksByPriority: { priority: string; count: number }[];
    overdueTasks: number;
  };
  generatedAt: string;
}

class AIAnalyticsService {
  private apiKey: string | null = null;
  private provider: AIProvider = 'openai';
  private openaiBaseURL = 'https://api.openai.com/v1';

  setApiKey(apiKey: string) {
    this.apiKey = apiKey;
  }

  setProvider(provider: AIProvider) {
    this.provider = provider;
  }

  private getProviderSettings() {
    const settings = settingsManager.getSettings();
    return {
      provider: settings.provider,
      apiKey: settings.provider === 'openai' ? settings.openaiApiKey : settings.geminiApiKey
    };
  }

  async generateReport(
    meetingsData: MeetingData[], 
    tasksData: TaskData[],
    filters: AnalyticsFilter
  ): Promise<AnalyticsReport> {
    const filteredMeetings = this.filterMeetings(meetingsData, filters);
    const filteredTasks = this.filterTasks(tasksData, filters);
    
    const aggregatedData = this.aggregateMeetingData(filteredMeetings);
    const aggregatedTaskData = this.aggregateTaskData(filteredTasks);
    const combinedData = { ...aggregatedData, ...aggregatedTaskData };
    
    const aiInsights = await this.generateAIInsights(filteredMeetings, filteredTasks, combinedData, filters);
    
    const report: AnalyticsReport = {
      id: `report-${Date.now()}`,
      title: `Analytics Report - ${filters.timeRange.charAt(0).toUpperCase() + filters.timeRange.slice(1)}`,
      summary: aiInsights.summary,
      insights: aiInsights.insights,
      recommendations: aiInsights.recommendations,
      data: combinedData,
      generatedAt: new Date().toISOString()
    };

    return report;
  }

  private filterMeetings(meetings: MeetingData[], filters: AnalyticsFilter): MeetingData[] {
    const now = new Date();
    let startDate: Date;

    switch (filters.timeRange) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'quarter':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case 'year':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    const endDate = filters.dateTo ? new Date(filters.dateTo) : now;
    if (filters.dateFrom) {
      startDate = new Date(filters.dateFrom);
    }

    return meetings.filter(meeting => {
      const meetingDate = new Date(meeting.date);
      const inDateRange = meetingDate >= startDate && meetingDate <= endDate;
      const inCustomerFilter = filters.customers.length === 0 || filters.customers.includes(meeting.customer_id);
      
      return inDateRange && inCustomerFilter;
    });
  }

  private filterTasks(tasks: TaskData[], filters: AnalyticsFilter): TaskData[] {
    const now = new Date();
    let startDate: Date;

    switch (filters.timeRange) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'quarter':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case 'year':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    const endDate = filters.dateTo ? new Date(filters.dateTo) : now;
    if (filters.dateFrom) {
      startDate = new Date(filters.dateFrom);
    }

    return tasks.filter(task => {
      const taskDate = new Date(task.created_at);
      const inDateRange = taskDate >= startDate && taskDate <= endDate;
      const inCustomerFilter = filters.customers.length === 0 || filters.customers.includes(task.customer_id);
      
      return inDateRange && inCustomerFilter;
    });
  }

  private aggregateMeetingData(meetings: MeetingData[]) {
    const totalMeetings = meetings.length;
    const uniqueCustomers = new Set(meetings.map(m => m.customer_id)).size;
    
    const timeSpanDays = totalMeetings > 0 
      ? Math.max(1, Math.ceil((new Date().getTime() - new Date(Math.min(...meetings.map(m => new Date(m.date).getTime()))).getTime()) / (1000 * 60 * 60 * 24)))
      : 7;
    const averageMeetingsPerWeek = Math.round((totalMeetings / timeSpanDays * 7) * 10) / 10;

    const customerCounts = meetings.reduce((acc, meeting) => {
      const customerName = meeting.customer_name;
      acc[customerName] = (acc[customerName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topCustomers = Object.entries(customerCounts)
      .map(([name, count]) => ({ name, meetingCount: count }))
      .sort((a, b) => b.meetingCount - a.meetingCount)
      .slice(0, 5);

    const meetingTrends = this.generateMeetingTrends(meetings);

    return {
      totalMeetings,
      uniqueCustomers,
      averageMeetingsPerWeek,
      topCustomers,
      meetingTrends
    };
  }

  private aggregateTaskData(tasks: TaskData[]) {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const taskCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    const tasksByPriority = ['high', 'medium', 'low'].map(priority => ({
      priority,
      count: tasks.filter(t => t.priority === priority).length
    }));

    const now = new Date();
    const overdueTasks = tasks.filter(task => {
      return task.status !== 'completed' && 
             task.due_date && 
             new Date(task.due_date) < now;
    }).length;

    return {
      totalTasks,
      completedTasks,
      taskCompletionRate,
      tasksByPriority,
      overdueTasks
    };
  }

  private generateMeetingTrends(meetings: MeetingData[]) {
    const dailyCounts = meetings.reduce((acc, meeting) => {
      const date = new Date(meeting.date).toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(dailyCounts)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  private async generateAIInsights(
    meetings: MeetingData[], 
    tasks: TaskData[],
    data: any, 
    filters: AnalyticsFilter
  ): Promise<{ summary: string; insights: string[]; recommendations: string[] }> {
    const providerSettings = this.getProviderSettings();
    
    if (!providerSettings.apiKey) {
      return this.generateStructuredInsights(meetings, tasks, data, filters);
    }

    try {
      const prompt = this.buildAnalysisPrompt(meetings, tasks, data, filters);
      
      let response;
      if (providerSettings.provider === 'gemini') {
        response = await this.callGeminiAPI(prompt, providerSettings.apiKey);
      } else {
        response = await this.callOpenAIAPI(prompt, providerSettings.apiKey);
      }
      
      return response;
    } catch (error) {
      console.error('AI API call failed, falling back to structured insights:', error);
      return this.generateStructuredInsights(meetings, tasks, data, filters);
    }
  }

  private generateStructuredInsights(
    meetings: MeetingData[], 
    tasks: TaskData[],
    data: any, 
    filters: AnalyticsFilter
  ): { summary: string; insights: string[]; recommendations: string[] } {
    const customerMeetings = new Map<string, MeetingData[]>();
    meetings.forEach(meeting => {
      if (!customerMeetings.has(meeting.customer_id)) {
        customerMeetings.set(meeting.customer_id, []);
      }
      customerMeetings.get(meeting.customer_id)!.push(meeting);
    });

    const customerTasks = new Map<string, TaskData[]>();
    tasks.forEach(task => {
      if (!customerTasks.has(task.customer_id)) {
        customerTasks.set(task.customer_id, []);
      }
      customerTasks.get(task.customer_id)!.push(task);
    });

    const customerInsights: string[] = [];
    const customerRecommendations: string[] = [];

    customerMeetings.forEach((customerMeetingList, customerId) => {
      const customerName = customerMeetingList[0]?.customer_name || `Customer ${customerId}`;
      const customerTaskList = customerTasks.get(customerId) || [];
      
      if (customerMeetingList.length > 0) {
        const insight = this.generateCustomerSpecificInsight(customerName, customerMeetingList, customerTaskList);
        if (insight) customerInsights.push(insight);
        
        const recommendation = this.generateCustomerSpecificRecommendation(customerName, customerMeetingList, customerTaskList);
        if (recommendation) customerRecommendations.push(recommendation);
      }
    });

    const generalInsights = this.generateGeneralInsights(meetings, tasks, data);
    const generalRecommendations = this.generateGeneralRecommendations(meetings, tasks, data);

    const allInsights = [...customerInsights, ...generalInsights];
    const allRecommendations = [...customerRecommendations, ...generalRecommendations];

    const summary = this.generateProfessionalSummary(meetings, tasks, data, filters);

    return {
      summary,
      insights: allInsights,
      recommendations: allRecommendations
    };
  }

  private generateCustomerSpecificInsight(
    customerName: string, 
    meetings: MeetingData[], 
    tasks: TaskData[]
  ): string | null {
    if (meetings.length === 0) return null;

    const meetingCount = meetings.length;
    const latestMeeting = meetings.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
    const openTasks = tasks.filter(t => t.status !== 'completed').length;
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const highPriorityTasks = tasks.filter(t => t.priority === 'high' && t.status !== 'completed').length;

    let insight = `${customerName}: `;
    
    if (meetingCount === 1) {
      insight += `התקיימה פגישה אחת ב-${new Date(latestMeeting.date).toLocaleDateString('he-IL')}.`;
    } else {
      insight += `התקיימו ${meetingCount} פגישות, האחרונה ב-${new Date(latestMeeting.date).toLocaleDateString('he-IL')}.`;
    }

    if (tasks.length > 0) {
      if (openTasks > 0 && completedTasks > 0) {
        insight += ` הושלמו ${completedTasks} משימות, ${openTasks} משימות עדיין פתוחות.`;
      } else if (openTasks > 0) {
        insight += ` ${openTasks} משימות פתוחות.`;
      } else if (completedTasks > 0) {
        insight += ` כל ${completedTasks} המשימות הושלמו.`;
      }

      if (highPriorityTasks > 0) {
        insight += ` ${highPriorityTasks} משימות בעדיפות גבוהה דורשות טיפול.`;
      }
    }

    return insight;
  }

  private generateCustomerSpecificRecommendation(
    customerName: string, 
    meetings: MeetingData[], 
    tasks: TaskData[]
  ): string | null {
    if (meetings.length === 0) return null;

    const openTasks = tasks.filter(t => t.status !== 'completed');
    const highPriorityTasks = openTasks.filter(t => t.priority === 'high');
    const overdueTasks = openTasks.filter(t => t.due_date && new Date(t.due_date) < new Date());

    let recommendation = `${customerName}: `;

    if (overdueTasks.length > 0) {
      recommendation += `מיידי - טיפול ב-${overdueTasks.length} משימות באיחור.`;
    } else if (highPriorityTasks.length > 0) {
      recommendation += `מעקב צמוד אחר ${highPriorityTasks.length} משימות בעדיפות גבוהה.`;
    } else if (openTasks.length > 0) {
      recommendation += `המשך מעקב אחר ${openTasks.length} משימות פתוחות.`;
    } else if (tasks.length === 0) {
      recommendation += `הגדר משימות מעקב בהתבסס על תוצאות הפגישה.`;
    } else {
      return null;
    }

    return recommendation;
  }

  private generateGeneralInsights(meetings: MeetingData[], tasks: TaskData[], data: any): string[] {
    const insights: string[] = [];

    if (data.uniqueCustomers > 1) {
      const customerMeetingCounts = new Map<string, number>();
      meetings.forEach(m => {
        customerMeetingCounts.set(m.customer_id, (customerMeetingCounts.get(m.customer_id) || 0) + 1);
      });

      const activeCounts = Array.from(customerMeetingCounts.values());
      const avgMeetingsPerCustomer = activeCounts.reduce((a, b) => a + b, 0) / activeCounts.length;
      
      if (avgMeetingsPerCustomer > 2) {
        insights.push(`רמת מעורבות גבוהה: ממוצע ${Math.round(avgMeetingsPerCustomer * 10) / 10} פגישות לכל לקוח פעיל.`);
      }

      const customerTaskCompletion = new Map<string, { total: number; completed: number }>();
      tasks.forEach(t => {
        if (!customerTaskCompletion.has(t.customer_id)) {
          customerTaskCompletion.set(t.customer_id, { total: 0, completed: 0 });
        }
        const stats = customerTaskCompletion.get(t.customer_id)!;
        stats.total++;
        if (t.status === 'completed') stats.completed++;
      });

      if (customerTaskCompletion.size > 1) {
        const completionRates = Array.from(customerTaskCompletion.values())
          .map(stats => stats.total > 0 ? stats.completed / stats.total : 0);
        const avgCompletionRate = completionRates.reduce((a, b) => a + b, 0) / completionRates.length;
        
        if (avgCompletionRate > 0.8) {
          insights.push(`ביצועים מצוינים: שיעור השלמת משימות ממוצע של ${Math.round(avgCompletionRate * 100)}%.`);
        } else if (avgCompletionRate < 0.5) {
          insights.push(`הזדמנות לשיפור: שיעור השלמת משימות נמוך (${Math.round(avgCompletionRate * 100)}%).`);
        }
      }
    }

    return insights;
  }

  private generateGeneralRecommendations(meetings: MeetingData[], tasks: TaskData[], data: any): string[] {
    const recommendations: string[] = [];

    if (data.overdueTasks > 0) {
      recommendations.push(`מערכתי: יצירת תהליך מעקב שבועי למשימות באיחור (${data.overdueTasks} משימות).`);
    }

    if (data.taskCompletionRate < 70 && tasks.length > 5) {
      recommendations.push(`תהליכים: שיפור תהליכי מעקב משימות - שיעור השלמה נוכחי ${data.taskCompletionRate}%.`);
    }

    const highPriorityTasks = tasks.filter(t => t.priority === 'high' && t.status !== 'completed').length;
    if (highPriorityTasks > 3) {
      recommendations.push(`עדיפויות: סיקור שבועי למשימות בעדיפות גבוהה (${highPriorityTasks} משימות).`);
    }

    return recommendations;
  }

  private generateProfessionalSummary(meetings: MeetingData[], tasks: TaskData[], data: any, filters: AnalyticsFilter): string {
    const timeRangeHebrew = {
      week: 'השבוע',
      month: 'החודש',
      quarter: 'הרבעון',
      year: 'השנה'
    }[filters.timeRange] || 'התקופה';

    const customerNames = Array.from(new Set(meetings.map(m => m.customer_name))).slice(0, 3);
    const customerText = customerNames.length > 0 
      ? customerNames.length === 1 
        ? `עם ${customerNames[0]}`
        : customerNames.length === 2
        ? `עם ${customerNames.join(' ו-')}`
        : `עם ${customerNames.slice(0, -1).join(', ')} ו-${customerNames[customerNames.length - 1]}`
      : '';

    let summary = `ב${timeRangeHebrew} התקיימו ${data.totalMeetings} פגישות ${customerText}.`;

    if (data.totalTasks > 0) {
      summary += ` נוצרו ${data.totalTasks} משימות, מתוכן הושלמו ${data.completedTasks} (${data.taskCompletionRate}%).`;
    }

    if (data.overdueTasks > 0) {
      summary += ` ${data.overdueTasks} משימות באיחור דורשות טיפול מיידי.`;
    }

    return summary;
  }

  private async callOpenAIAPI(prompt: string, apiKey: string): Promise<{ summary: string; insights: string[]; recommendations: string[] }> {
    const response = await fetch(`${this.openaiBaseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a business analyst expert. Return responses in Hebrew for Hebrew content.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 1000,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const result = await response.json();
    const content = result.choices[0]?.message?.content || '';
    
    return this.parseAIResponse(content);
  }

  private async callGeminiAPI(prompt: string, apiKey: string): Promise<{ summary: string; insights: string[]; recommendations: string[] }> {
    try {
      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const content = response.text();
      
      return this.parseAIResponse(content);
    } catch (error: any) {
      console.error('Gemini API error:', error);
      throw new Error(`Gemini API error: ${error.message || 'Unknown error'}`);
    }
  }

  private parseAIResponse(content: string): { summary: string; insights: string[]; recommendations: string[] } {
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          summary: parsed.summary || 'AI analysis completed',
          insights: Array.isArray(parsed.insights) ? parsed.insights : ['AI insights generated'],
          recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : ['AI recommendations provided']
        };
      }
    } catch (error) {
      console.error('Failed to parse AI response:', error);
    }

    return {
      summary: 'AI analysis completed successfully',
      insights: ['AI-powered insights will appear here once the response is parsed'],
      recommendations: ['AI-powered recommendations will appear here once the response is parsed']
    };
  }

  private buildAnalysisPrompt(meetings: MeetingData[], tasks: TaskData[], data: any, filters: AnalyticsFilter): string {
    return `Analyze the following customer meeting and task data. Provide insights in Hebrew.

Meetings: ${meetings.length}
Tasks: ${tasks.length}
Time period: ${filters.timeRange}

Meeting details:
${meetings.map(m => `- ${m.customer_name}: ${m.title} on ${m.date}`).join('\n')}

Task details:
${tasks.map(t => `- ${t.customer_name}: ${t.title} (${t.status}, ${t.priority})`).join('\n')}

Provide analysis in this format:
Summary: [Brief overview in Hebrew]
Insights: [List of specific insights]
Recommendations: [List of actionable recommendations]`;
  }
}

export const aiAnalyticsService = new AIAnalyticsService();
export type { MeetingData, TaskData, AnalyticsFilter, AnalyticsReport };
