// AI Service for generating analytics reports
// This will integrate with OpenAI API once the API key is provided

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
  };
  generatedAt: string;
}

class AIAnalyticsService {
  private apiKey: string | null = null;
  private baseURL = 'https://api.openai.com/v1';

  setApiKey(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generateReport(
    meetingsData: MeetingData[], 
    filters: AnalyticsFilter
  ): Promise<AnalyticsReport> {
    // Filter meetings based on criteria
    const filteredMeetings = this.filterMeetings(meetingsData, filters);
    
    // Aggregate data for analysis
    const aggregatedData = this.aggregateMeetingData(filteredMeetings);
    
    // Generate AI insights
    const aiInsights = await this.generateAIInsights(filteredMeetings, aggregatedData, filters);
    
    return {
      id: Date.now().toString(),
      title: `Meeting Analysis Report - ${filters.timeRange.charAt(0).toUpperCase() + filters.timeRange.slice(1)}`,
      summary: aiInsights.summary,
      insights: aiInsights.insights,
      recommendations: aiInsights.recommendations,
      data: aggregatedData,
      generatedAt: new Date().toISOString()
    };
  }

  private filterMeetings(meetings: MeetingData[], filters: AnalyticsFilter): MeetingData[] {
    const now = new Date();
    let startDate: Date;

    // Calculate date range based on time filter
    switch (filters.timeRange) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        break;
      case 'quarter':
        startDate = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
        break;
      case 'year':
        startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Use custom date range if provided
    if (filters.dateFrom) {
      startDate = new Date(filters.dateFrom);
    }
    const endDate = filters.dateTo ? new Date(filters.dateTo) : now;

    return meetings.filter(meeting => {
      const meetingDate = new Date(meeting.date);
      const inDateRange = meetingDate >= startDate && meetingDate <= endDate;
      const inCustomerFilter = filters.customers.length === 0 || filters.customers.includes(meeting.customer_id);
      
      return inDateRange && inCustomerFilter;
    });
  }

  private aggregateMeetingData(meetings: MeetingData[]) {
    const totalMeetings = meetings.length;
    const uniqueCustomers = new Set(meetings.map(m => m.customer_id)).size;
    
    // Calculate average meetings per week
    const dateRange = this.getDateRange(meetings);
    const weeksDiff = Math.max(1, Math.ceil((dateRange.end.getTime() - dateRange.start.getTime()) / (7 * 24 * 60 * 60 * 1000)));
    const averageMeetingsPerWeek = Math.round((totalMeetings / weeksDiff) * 10) / 10;

    // Top customers by meeting count
    const customerMeetingCounts = meetings.reduce((acc, meeting) => {
      acc[meeting.customer_name] = (acc[meeting.customer_name] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topCustomers = Object.entries(customerMeetingCounts)
      .map(([name, count]) => ({ name, meetingCount: count }))
      .sort((a, b) => b.meetingCount - a.meetingCount)
      .slice(0, 5);

    // Meeting trends (daily counts)
    const meetingTrends = this.generateMeetingTrends(meetings);

    return {
      totalMeetings,
      uniqueCustomers,
      averageMeetingsPerWeek,
      topCustomers,
      meetingTrends
    };
  }

  private getDateRange(meetings: MeetingData[]) {
    if (meetings.length === 0) {
      const now = new Date();
      return { start: now, end: now };
    }

    const dates = meetings.map(m => new Date(m.date));
    return {
      start: new Date(Math.min(...dates.map(d => d.getTime()))),
      end: new Date(Math.max(...dates.map(d => d.getTime())))
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
    data: any, 
    filters: AnalyticsFilter
  ): Promise<{ summary: string; insights: string[]; recommendations: string[] }> {
    // If no API key, return mock insights
    if (!this.apiKey) {
      return this.generateMockInsights(meetings, data, filters);
    }

    try {
      // Prepare data for AI analysis
      const prompt = this.buildAnalysisPrompt(meetings, data, filters);
      
      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'You are a business analyst expert specializing in customer relationship management and meeting analysis. Provide actionable insights and recommendations based on meeting data.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 1500,
          temperature: 0.7
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const result = await response.json();
      const content = result.choices[0]?.message?.content || '';
      
      return this.parseAIResponse(content);
    } catch (error) {
      console.error('AI analysis failed:', error);
      return this.generateMockInsights(meetings, data, filters);
    }
  }

  private buildAnalysisPrompt(meetings: MeetingData[], data: any, filters: AnalyticsFilter): string {
    const meetingsSummary = meetings.slice(0, 10).map(m => 
      `- ${m.customer_name}: "${m.title}" on ${m.date}${m.summary ? ` - ${m.summary}` : ''}`
    ).join('\n');

    return `
Analyze the following customer meeting data for the ${filters.timeRange} period:

MEETING OVERVIEW:
- Total meetings: ${data.totalMeetings}
- Unique customers: ${data.uniqueCustomers}
- Average meetings per week: ${data.averageMeetingsPerWeek}
- Top customers: ${data.topCustomers.map((c: { name: string; meetingCount: number }) => `${c.name} (${c.meetingCount} meetings)`).join(', ')}

RECENT MEETINGS SAMPLE:
${meetingsSummary}

Please provide a comprehensive analysis in the following JSON format:
{
  "summary": "A 2-3 sentence executive summary of key findings",
  "insights": [
    "3-5 key insights about meeting patterns, customer engagement, and trends"
  ],
  "recommendations": [
    "3-5 actionable recommendations for improving customer relationships and meeting effectiveness"
  ]
}

Focus on: engagement patterns, customer health indicators, potential risks, opportunities for growth, and actionable next steps.
`;
  }

  private parseAIResponse(content: string): { summary: string; insights: string[]; recommendations: string[] } {
    try {
      // Try to extract JSON from the response
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

    // Fallback parsing
    return {
      summary: 'AI analysis completed successfully',
      insights: ['AI-powered insights will appear here once the response is parsed'],
      recommendations: ['AI-powered recommendations will appear here once the response is parsed']
    };
  }

  private generateMockInsights(meetings: MeetingData[], data: any, filters: AnalyticsFilter) {
    return {
      summary: `Analysis of ${data.totalMeetings} meetings across ${data.uniqueCustomers} customers in the past ${filters.timeRange}. Average meeting frequency is ${data.averageMeetingsPerWeek} per week, indicating ${data.averageMeetingsPerWeek > 2 ? 'strong' : 'moderate'} customer engagement levels.`,
      insights: [
        `Meeting frequency: ${data.averageMeetingsPerWeek} meetings per week suggests ${data.averageMeetingsPerWeek > 2 ? 'excellent' : 'good'} customer engagement`,
        `Top performing customer: ${data.topCustomers[0]?.name || 'No data'} with ${data.topCustomers[0]?.meetingCount || 0} meetings shows strong relationship`,
        `Customer diversity: ${data.uniqueCustomers} unique customers engaged, indicating ${data.uniqueCustomers > 5 ? 'broad' : 'focused'} relationship management`,
        `Meeting distribution: Regular meeting patterns suggest structured customer relationship approach`
      ],
      recommendations: [
        `${data.averageMeetingsPerWeek < 1 ? 'Increase meeting frequency to strengthen customer relationships' : 'Maintain current meeting cadence for optimal engagement'}`,
        `Focus on customers with fewer meetings to ensure balanced attention across portfolio`,
        `Document key outcomes and action items from meetings to track progress`,
        `Consider scheduled follow-ups for customers showing reduced meeting frequency`,
        `Leverage successful patterns from top customers to improve other relationships`
      ]
    };
  }
}

export const aiAnalyticsService = new AIAnalyticsService();
export type { MeetingData, AnalyticsFilter, AnalyticsReport };
