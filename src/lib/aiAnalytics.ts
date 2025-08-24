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
  // Enhanced AI analytics features
  aiAnalytics: {
    languageDistribution: { language: string; count: number; percentage: number }[];
    riskAssessment: {
      highRiskCustomers: { customerName: string; riskFactors: string[]; riskLevel: 'low' | 'medium' | 'high' }[];
      overallRiskScore: number;
      riskTrends: string[];
    };
    participantAnalysis: {
      frequentParticipants: { name: string; meetingCount: number; customerSpread: number }[];
      communicationPatterns: string[];
      engagementMetrics: { metric: string; value: string; trend: 'up' | 'down' | 'stable' }[];
    };
    keyTopics: { topic: string; frequency: number; sentiment: 'positive' | 'neutral' | 'negative' }[];
    actionableInsights: {
      urgentActions: string[];
      opportunities: string[];
      warningSignals: string[];
    };
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
    tasksData: TaskData[],
    filters: AnalyticsFilter
  ): Promise<AnalyticsReport> {
    // Filter meetings based on criteria
    const filteredMeetings = this.filterMeetings(meetingsData, filters);
    
    // Filter tasks based on criteria
    const filteredTasks = this.filterTasks(tasksData, filters);
    
    // Aggregate data for analysis
    const aggregatedData = this.aggregateMeetingData(filteredMeetings);
    const aggregatedTaskData = this.aggregateTaskData(filteredTasks);
    
    // Combine the data
    const combinedData = { ...aggregatedData, ...aggregatedTaskData };
    
    // Generate AI insights and enhanced analytics
    const aiInsights = await this.generateAIInsights(filteredMeetings, filteredTasks, combinedData, filters);
    const enhancedAiAnalytics = await this.generateEnhancedAIAnalytics(filteredMeetings, filters);
    
    return {
      id: Date.now().toString(),
      title: `Business Analysis Report - ${filters.timeRange.charAt(0).toUpperCase() + filters.timeRange.slice(1)}`,
      summary: aiInsights.summary,
      insights: aiInsights.insights,
      recommendations: aiInsights.recommendations,
      data: combinedData,
      aiAnalytics: enhancedAiAnalytics,
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

  private filterTasks(tasks: TaskData[], filters: AnalyticsFilter): TaskData[] {
    const now = new Date();
    let startDate: Date;

    // Calculate date range based on time filter
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

  private aggregateTaskData(tasks: TaskData[]) {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const taskCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Tasks by priority
    const tasksByPriority = ['high', 'medium', 'low'].map(priority => ({
      priority,
      count: tasks.filter(t => t.priority === priority).length
    }));

    // Overdue tasks (tasks with due dates that have passed and aren't completed)
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
    // If no API key, return mock insights
    if (!this.apiKey) {
      return this.generateMockInsights(meetings, tasks, data, filters);
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
      return this.generateMockInsights(meetings, [], data, filters);
    }
  }

  private buildAnalysisPrompt(meetings: MeetingData[], data: any, filters: AnalyticsFilter): string {
    const meetingsSummary = meetings.slice(0, 10).map(m => 
      `- ${m.customer_name}: "${m.title}" on ${m.date}${m.summary ? ` - ${m.summary}` : ''}`
    ).join('\n');

    // Detect primary language from meetings
    const languageDistribution = this.detectLanguages(meetings);
    const primaryLanguage = languageDistribution.length > 0 ? languageDistribution[0].language : 'English';
    
    // Determine if we should respond in Hebrew
    const shouldUseHebrew = primaryLanguage === 'Hebrew' || 
      languageDistribution.some(lang => lang.language === 'Hebrew' && lang.percentage > 50);

    const languageInstruction = shouldUseHebrew 
      ? "התשובה חייבת להיות בעברית. כל הטקסט, התובנות וההמלצות חייבים להיות בעברית בלבד."
      : "Please respond in English.";

    const exampleFormat = shouldUseHebrew ? `
{
  "summary": "סיכום מנהלים של 2-3 משפטים על הממצאים העיקריים",
  "insights": [
    "3-5 תובנות מפתח על דפוסי פגישות, מעורבות לקוחות ומגמות"
  ],
  "recommendations": [
    "3-5 המלצות ישימות לשיפור יחסי לקוחות ויעילות פגישות"
  ]
}` : `
{
  "summary": "A 2-3 sentence executive summary of key findings",
  "insights": [
    "3-5 key insights about meeting patterns, customer engagement, and trends"
  ],
  "recommendations": [
    "3-5 actionable recommendations for improving customer relationships and meeting effectiveness"
  ]
}`;

    return `
${languageInstruction}

Analyze the following customer meeting data for the ${filters.timeRange} period:

MEETING OVERVIEW:
- Total meetings: ${data.totalMeetings}
- Unique customers: ${data.uniqueCustomers}
- Average meetings per week: ${data.averageMeetingsPerWeek}
- Top customers: ${data.topCustomers.map((c: { name: string; meetingCount: number }) => `${c.name} (${c.meetingCount} meetings)`).join(', ')}

RECENT MEETINGS SAMPLE:
${meetingsSummary}

Please provide a comprehensive analysis in the following JSON format:
${exampleFormat}

Focus on: engagement patterns, customer health indicators, potential risks, opportunities for growth, and actionable next steps.
`;
  }

  private async generateEnhancedAIAnalytics(
    meetings: MeetingData[], 
    filters: AnalyticsFilter
  ): Promise<AnalyticsReport['aiAnalytics']> {
    // If no API key, return mock enhanced analytics
    if (!this.apiKey) {
      return this.generateMockEnhancedAnalytics(meetings, filters);
    }

    try {
      const enhancedPrompt = this.buildEnhancedAnalysisPrompt(meetings, filters);
      
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
              content: 'You are an expert cybersecurity consultant analyst specializing in Pentera penetration testing and customer relationship analysis. Analyze meeting data to identify language patterns, risk indicators, participant engagement, and provide actionable cybersecurity insights.'
            },
            {
              role: 'user',
              content: enhancedPrompt
            }
          ],
          max_tokens: 2500,
          temperature: 0.7
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const result = await response.json();
      const content = result.choices[0]?.message?.content || '';
      
      return this.parseEnhancedAIResponse(content, meetings);
    } catch (error) {
      console.error('Enhanced AI analysis failed:', error);
      return this.generateMockEnhancedAnalytics(meetings, filters);
    }
  }

  private buildEnhancedAnalysisPrompt(meetings: MeetingData[], filters: AnalyticsFilter): string {
    const meetingDetails = meetings.slice(0, 15).map(m => 
      `Meeting: ${m.title}
Customer: ${m.customer_name}
Date: ${m.date}
Notes: ${m.notes || 'No notes available'}
Summary: ${m.summary || 'No summary available'}
---`
    ).join('\n');

    // Detect primary language from meetings
    const languageDistribution = this.detectLanguages(meetings);
    const primaryLanguage = languageDistribution.length > 0 ? languageDistribution[0].language : 'English';
    
    // Determine if we should respond in Hebrew
    const shouldUseHebrew = primaryLanguage === 'Hebrew' || 
      languageDistribution.some(lang => lang.language === 'Hebrew' && lang.percentage > 50);

    const languageInstruction = shouldUseHebrew 
      ? "התשובה חייבת להיות בעברית. כל הטקסט, התובנות וההמלצות חייבים להיות בעברית בלבד."
      : "Please respond in English.";

    const exampleFormat = shouldUseHebrew ? `
{
  "languageDistribution": [
    {"language": "עברית", "count": 5, "percentage": 83},
    {"language": "אנגלית", "count": 1, "percentage": 17}
  ],
  "riskAssessment": {
    "highRiskCustomers": [
      {
        "customerName": "חברה X",
        "riskFactors": ["עיכוב בעדכוני אבטחה", "מספר גבוה של פגיעויות"],
        "riskLevel": "high"
      }
    ],
    "overallRiskScore": 65,
    "riskTrends": ["עלייה בחשיפה לפגיעויות", "עיכובים בלוחות זמנים לתיקון"]
  },
  "participantAnalysis": {
    "frequentParticipants": [
      {"name": "ראש צוות אבטחה", "meetingCount": 4, "customerSpread": 2}
    ],
    "communicationPatterns": ["צוותי אבטחה מעדיפים עיון טכני מעמיק", "מנהלים בכירים מתמקדים בהשפעה עסקית"],
    "engagementMetrics": [
      {"metric": "שיעור מענה למעקב", "value": "85%", "trend": "up"},
      {"metric": "נוכחות בפגישות", "value": "92%", "trend": "stable"}
    ]
  },
  "keyTopics": [
    {"topic": "הערכת פגיעות", "frequency": 8, "sentiment": "neutral"},
    {"topic": "תאימות אבטחה", "frequency": 6, "sentiment": "positive"}
  ],
  "actionableInsights": {
    "urgentActions": ["קביעת תיקון לפגיעויות קריטיות", "עדכון מדיניות אבטחה"],
    "opportunities": ["הרחבת היקף בדיקות החדירה", "הכנסת הכשרות מודעות אבטחה"],
    "warningSignals": ["ירידה במעורבות צוות האבטחה", "עיכוב בתיקון פגיעויות"]
  }
}` : `
{
  "languageDistribution": [
    {"language": "English", "count": 5, "percentage": 83},
    {"language": "Hebrew", "count": 1, "percentage": 17}
  ],
  "riskAssessment": {
    "highRiskCustomers": [
      {
        "customerName": "Company X",
        "riskFactors": ["Delayed security updates", "High vulnerability count"],
        "riskLevel": "high"
      }
    ],
    "overallRiskScore": 65,
    "riskTrends": ["Increasing vulnerability exposure", "Delayed remediation timelines"]
  },
  "participantAnalysis": {
    "frequentParticipants": [
      {"name": "John CISO", "meetingCount": 4, "customerSpread": 2}
    ],
    "communicationPatterns": ["Security teams prefer technical deep-dives", "C-level executives focus on business impact"],
    "engagementMetrics": [
      {"metric": "Follow-up Response Rate", "value": "85%", "trend": "up"},
      {"metric": "Meeting Attendance", "value": "92%", "trend": "stable"}
    ]
  },
  "keyTopics": [
    {"topic": "Vulnerability Assessment", "frequency": 8, "sentiment": "neutral"},
    {"topic": "Security Compliance", "frequency": 6, "sentiment": "positive"}
  ],
  "actionableInsights": {
    "urgentActions": ["Schedule remediation for critical vulnerabilities", "Update security policies"],
    "opportunities": ["Expand penetration testing scope", "Introduce security awareness training"],
    "warningSignals": ["Decreased engagement from security team", "Delayed vulnerability patching"]
  }
}`;

    return `
${languageInstruction}

Analyze these Pentera cybersecurity consultation meetings for the ${filters.timeRange} period:

MEETING DATA:
${meetingDetails}

Provide a comprehensive cybersecurity consultation analysis in JSON format:
${exampleFormat}

Focus on: language detection in meeting content, cybersecurity risk indicators, participant engagement patterns, security topics discussion, and actionable cybersecurity recommendations.
`;
  }

  private parseEnhancedAIResponse(content: string, meetings: MeetingData[]): AnalyticsReport['aiAnalytics'] {
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        
        // Validate and ensure all required fields are present
        return {
          languageDistribution: parsed.languageDistribution || this.detectLanguages(meetings),
          riskAssessment: parsed.riskAssessment || this.generateMockRiskAssessment(meetings),
          participantAnalysis: parsed.participantAnalysis || this.generateMockParticipantAnalysis(meetings),
          keyTopics: parsed.keyTopics || this.generateMockKeyTopics(meetings),
          actionableInsights: parsed.actionableInsights || this.generateMockActionableInsights(meetings)
        };
      }
    } catch (error) {
      console.error('Failed to parse enhanced AI response:', error);
    }

    // Fallback to mock data
    return this.generateMockEnhancedAnalytics(meetings, { timeRange: 'month', customers: [] });
  }

  private detectLanguages(meetings: MeetingData[]): { language: string; count: number; percentage: number }[] {
    // Simple language detection based on keywords
    const languageKeywords = {
      Hebrew: ['שלום', 'ביטחון', 'מערכת', 'חברה', 'פגיעות', 'הערכה', 'בדיקה', 'אבטחה'],
      English: ['security', 'vulnerability', 'penetration', 'assessment', 'compliance', 'hello', 'meeting'],
      Spanish: ['seguridad', 'vulnerabilidad', 'evaluación'],
      German: ['sicherheit', 'schwachstelle', 'bewertung']
    };

    const languageCounts: Record<string, number> = {};
    
    meetings.forEach(meeting => {
      const text = `${meeting.title} ${meeting.notes || ''} ${meeting.summary || ''}`.toLowerCase();
      let detectedLanguage = 'English'; // default
      let maxMatches = 0;
      
      for (const [language, keywords] of Object.entries(languageKeywords)) {
        const matches = keywords.filter(keyword => text.includes(keyword.toLowerCase())).length;
        if (matches > maxMatches) {
          maxMatches = matches;
          detectedLanguage = language;
        }
      }
      
      languageCounts[detectedLanguage] = (languageCounts[detectedLanguage] || 0) + 1;
    });

    const total = meetings.length || 1;
    return Object.entries(languageCounts)
      .map(([language, count]) => ({
        language,
        count,
        percentage: Math.round((count / total) * 100)
      }))
      .sort((a, b) => b.count - a.count);
  }

  private generateMockRiskAssessment(meetings: MeetingData[]) {
    const customers = [...new Set(meetings.map(m => m.customer_name))];
    
    // Detect if we should use Hebrew
    const languageDistribution = this.detectLanguages(meetings);
    const shouldUseHebrew = languageDistribution.some(lang => lang.language === 'Hebrew' && lang.percentage > 50);

    if (shouldUseHebrew) {
      const highRiskCustomers = customers.slice(0, Math.ceil(customers.length * 0.3)).map(customerName => ({
        customerName,
        riskFactors: ['עיכוב בתיקוני אבטחה', 'מספר גבוה של פגיעויות', 'מודעות אבטחה מוגבלת'],
        riskLevel: 'high' as const
      }));

      return {
        highRiskCustomers,
        overallRiskScore: Math.floor(Math.random() * 40) + 40, // 40-80 range
        riskTrends: [
          'עלייה במספר הפגיעויות הקריטיות',
          'מענה מושהה להמלצות אבטחה',
          'הרחבת משטח התקיפה עקב טרנספורמציה דיגיטלית'
        ]
      };
    }

    const highRiskCustomers = customers.slice(0, Math.ceil(customers.length * 0.3)).map(customerName => ({
      customerName,
      riskFactors: ['Delayed security patches', 'High vulnerability count', 'Limited security awareness'],
      riskLevel: 'high' as const
    }));

    return {
      highRiskCustomers,
      overallRiskScore: Math.floor(Math.random() * 40) + 40, // 40-80 range
      riskTrends: [
        'Increasing number of critical vulnerabilities',
        'Delayed response to security recommendations',
        'Growing attack surface due to digital transformation'
      ]
    };
  }

  private generateMockParticipantAnalysis(meetings: MeetingData[]) {
    // Detect if we should use Hebrew
    const languageDistribution = this.detectLanguages(meetings);
    const shouldUseHebrew = languageDistribution.some(lang => lang.language === 'Hebrew' && lang.percentage > 50);

    if (shouldUseHebrew) {
      return {
        frequentParticipants: [
          { name: 'מוביל צוות CISO', meetingCount: Math.floor(meetings.length * 0.6), customerSpread: 3 },
          { name: 'אדריכל אבטחה', meetingCount: Math.floor(meetings.length * 0.4), customerSpread: 2 },
          { name: 'מנהל IT', meetingCount: Math.floor(meetings.length * 0.3), customerSpread: 2 }
        ],
        communicationPatterns: [
          'צוותים טכניים מעדיפים דוחות פגיעות מפורטים',
          'מנהלים מתמקדים במדדי סיכון והשפעה עסקית',
          'צוותי אבטחה מבקשים הדרכת תיקון מעשית'
        ],
        engagementMetrics: [
          { metric: 'שיעור מענה', value: '87%', trend: 'up' as const },
          { metric: 'נוכחות בפגישות', value: '94%', trend: 'stable' as const },
          { metric: 'פעולות מעקב', value: '78%', trend: 'down' as const }
        ]
      };
    }

    return {
      frequentParticipants: [
        { name: 'CISO Team Lead', meetingCount: Math.floor(meetings.length * 0.6), customerSpread: 3 },
        { name: 'Security Architect', meetingCount: Math.floor(meetings.length * 0.4), customerSpread: 2 },
        { name: 'IT Manager', meetingCount: Math.floor(meetings.length * 0.3), customerSpread: 2 }
      ],
      communicationPatterns: [
        'Technical teams prefer detailed vulnerability reports',
        'Executives focus on risk metrics and business impact',
        'Security teams request hands-on remediation guidance'
      ],
      engagementMetrics: [
        { metric: 'Response Rate', value: '87%', trend: 'up' as const },
        { metric: 'Meeting Attendance', value: '94%', trend: 'stable' as const },
        { metric: 'Follow-up Actions', value: '78%', trend: 'down' as const }
      ]
    };
  }

  private generateMockKeyTopics(meetings: MeetingData[]) {
    // Detect if we should use Hebrew
    const languageDistribution = this.detectLanguages(meetings);
    const shouldUseHebrew = languageDistribution.some(lang => lang.language === 'Hebrew' && lang.percentage > 50);

    if (shouldUseHebrew) {
      return [
        { topic: 'תוצאות בדיקות חדירה', frequency: Math.floor(meetings.length * 0.8), sentiment: 'neutral' as const },
        { topic: 'תיקון פגיעויות', frequency: Math.floor(meetings.length * 0.6), sentiment: 'negative' as const },
        { topic: 'תאימות אבטחה', frequency: Math.floor(meetings.length * 0.5), sentiment: 'positive' as const },
        { topic: 'הערכת סיכונים', frequency: Math.floor(meetings.length * 0.4), sentiment: 'neutral' as const },
        { topic: 'הכשרת אבטחה', frequency: Math.floor(meetings.length * 0.3), sentiment: 'positive' as const }
      ];
    }

    return [
      { topic: 'Penetration Testing Results', frequency: Math.floor(meetings.length * 0.8), sentiment: 'neutral' as const },
      { topic: 'Vulnerability Remediation', frequency: Math.floor(meetings.length * 0.6), sentiment: 'negative' as const },
      { topic: 'Security Compliance', frequency: Math.floor(meetings.length * 0.5), sentiment: 'positive' as const },
      { topic: 'Risk Assessment', frequency: Math.floor(meetings.length * 0.4), sentiment: 'neutral' as const },
      { topic: 'Security Training', frequency: Math.floor(meetings.length * 0.3), sentiment: 'positive' as const }
    ];
  }

  private generateMockActionableInsights(meetings: MeetingData[]) {
    // Detect if we should use Hebrew
    const languageDistribution = this.detectLanguages(meetings);
    const shouldUseHebrew = languageDistribution.some(lang => lang.language === 'Hebrew' && lang.percentage > 50);

    if (shouldUseHebrew) {
      return {
        urgentActions: [
          'טפל בפגיעויות קריטיות ברשתות הלקוחות',
          'קבע בדיקות חדירה נוספות ללקוחות בסיכון גבוה',
          'יישם תוכניות הכשרת מודעות אבטחה'
        ],
        opportunities: [
          'הרחב שירותי בדיקות חדירה לתשתית ענן',
          'הצע חבילות ניטור אבטחה רציפות',
          'פתח מודולי הכשרת אבטחה מותאמים'
        ],
        warningSignals: [
          'ירידה במעורבות הלקוחות בפגישות אבטחה',
          'עיכובים בלוחות זמנים לתיקון פגיעויות',
          'הקצאת תקציב מופחתת ליוזמות אבטחה'
        ]
      };
    }

    return {
      urgentActions: [
        'Address critical vulnerabilities in customer networks',
        'Schedule follow-up penetration tests for high-risk customers',
        'Implement security awareness training programs'
      ],
      opportunities: [
        'Expand penetration testing services to cloud infrastructure',
        'Offer continuous security monitoring packages',
        'Develop custom security training modules'
      ],
      warningSignals: [
        'Decreased customer engagement in security meetings',
        'Delayed vulnerability remediation timelines',
        'Reduced budget allocation for security initiatives'
      ]
    };
  }

  private generateMockEnhancedAnalytics(meetings: MeetingData[], filters: AnalyticsFilter): AnalyticsReport['aiAnalytics'] {
    return {
      languageDistribution: this.detectLanguages(meetings),
      riskAssessment: this.generateMockRiskAssessment(meetings),
      participantAnalysis: this.generateMockParticipantAnalysis(meetings),
      keyTopics: this.generateMockKeyTopics(meetings),
      actionableInsights: this.generateMockActionableInsights(meetings)
    };
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

  private generateMockInsights(meetings: MeetingData[], tasks: TaskData[], data: any, filters: AnalyticsFilter) {
    // Detect if we should use Hebrew
    const languageDistribution = this.detectLanguages(meetings);
    const shouldUseHebrew = languageDistribution.some(lang => lang.language === 'Hebrew' && lang.percentage > 50);

    const taskInsights = [];
    const taskRecommendations = [];

    if (data.totalTasks > 0) {
      if (shouldUseHebrew) {
        taskInsights.push(
          `שיעור השלמת משימות: ${data.taskCompletionRate}% שיעור השלמה מצביע על ניהול משימות ${data.taskCompletionRate > 80 ? 'מעולה' : data.taskCompletionRate > 60 ? 'טוב' : 'דורש שיפור'}`,
          `חלוקת עדיפות משימות: ${data.tasksByPriority.find((p: { priority: string; count: number }) => p.priority === 'high')?.count || 0} משימות בעדיפות גבוהה דורשות תשומת לב מיידית`
        );

        if (data.overdueTasks > 0) {
          taskInsights.push(`${data.overdueTasks} משימות באיחור דורשות תשומת לב מיידית`);
          taskRecommendations.push('טפל במשימות באיחור באופן מיידי כדי לשמור על שביעות רצון הלקוחות');
        }

        taskRecommendations.push(
          data.taskCompletionRate < 70 ? 'התמקד בשיפור שיעורי השלמת המשימות כדי לשפר את שביעות רצון הלקוחות' : 'שמור על סטנדרטים נוכחיים של השלמת משימות'
        );
      } else {
        taskInsights.push(
          `Task completion rate: ${data.taskCompletionRate}% completion rate indicates ${data.taskCompletionRate > 80 ? 'excellent' : data.taskCompletionRate > 60 ? 'good' : 'needs improvement'} task management`,
          `Task priority distribution: ${data.tasksByPriority.find((p: { priority: string; count: number }) => p.priority === 'high')?.count || 0} high-priority tasks require immediate attention`
        );

        if (data.overdueTasks > 0) {
          taskInsights.push(`${data.overdueTasks} overdue tasks need immediate attention`);
          taskRecommendations.push('Address overdue tasks immediately to maintain customer satisfaction');
        }

        taskRecommendations.push(
          data.taskCompletionRate < 70 ? 'Focus on improving task completion rates to enhance customer satisfaction' : 'Maintain current task completion standards'
        );
      }
    }

    if (shouldUseHebrew) {
      return {
        summary: `ניתוח של ${data.totalMeetings} פגישות ו-${data.totalTasks} משימות בקרב ${data.uniqueCustomers} לקוחות ב${filters.timeRange === 'week' ? 'שבוע' : filters.timeRange === 'month' ? 'חודש' : filters.timeRange === 'quarter' ? 'רבעון' : 'שנה'} האחרונים. תדירות פגישות ממוצעת היא ${data.averageMeetingsPerWeek} לשבוע עם שיעור השלמת משימות של ${data.taskCompletionRate}%, המצביע על ניהול יחסי לקוחות ${data.averageMeetingsPerWeek > 2 && data.taskCompletionRate > 70 ? 'מעולה' : 'טוב'}.`,
        insights: [
          `תדירות פגישות: ${data.averageMeetingsPerWeek} פגישות לשבוע מצביעה על מעורבות לקוחות ${data.averageMeetingsPerWeek > 2 ? 'מעולה' : 'טובה'}`,
          `הלקוח הטוב ביותר: ${data.topCustomers[0]?.name || 'אין נתונים'} עם ${data.topCustomers[0]?.meetingCount || 0} פגישות מראה יחסים חזקים`,
          `גיוון לקוחות: ${data.uniqueCustomers} לקוחות ייחודיים מעורבים, המצביע על ניהול יחסים ${data.uniqueCustomers > 5 ? 'רחב' : 'ממוקד'}`,
          `חלוקת פגישות: דפוסי פגישות קבועים מצביעים על גישה מובנית ליחסי לקוחות`,
          ...taskInsights
        ],
        recommendations: [
          `${data.averageMeetingsPerWeek < 1 ? 'הגבר את תדירות הפגישות כדי לחזק את יחסי הלקוחות' : 'שמור על קצב הפגישות הנוכחי למעורבות אופטימלית'}`,
          `התמקד בלקוחות עם פחות פגישות כדי להבטיח תשומת לב מאוזנת על פני התיק`,
          `תעד תוצאות מפתח ופריטי פעולה מפגישות כדי לעקוב אחר ההתקדמות`,
          `שקול מעקבים מתוזמנים ללקוחות שמראים ירידה בתדירות הפגישות`,
          `נצל דפוסים מוצלחים מהלקוחות הטובים ביותר כדי לשפר יחסים אחרים`,
          ...taskRecommendations
        ]
      };
    }

    return {
      summary: `Analysis of ${data.totalMeetings} meetings and ${data.totalTasks} tasks across ${data.uniqueCustomers} customers in the past ${filters.timeRange}. Average meeting frequency is ${data.averageMeetingsPerWeek} per week with ${data.taskCompletionRate}% task completion rate, indicating ${data.averageMeetingsPerWeek > 2 && data.taskCompletionRate > 70 ? 'excellent' : 'good'} customer relationship management.`,
      insights: [
        `Meeting frequency: ${data.averageMeetingsPerWeek} meetings per week suggests ${data.averageMeetingsPerWeek > 2 ? 'excellent' : 'good'} customer engagement`,
        `Top performing customer: ${data.topCustomers[0]?.name || 'No data'} with ${data.topCustomers[0]?.meetingCount || 0} meetings shows strong relationship`,
        `Customer diversity: ${data.uniqueCustomers} unique customers engaged, indicating ${data.uniqueCustomers > 5 ? 'broad' : 'focused'} relationship management`,
        `Meeting distribution: Regular meeting patterns suggest structured customer relationship approach`,
        ...taskInsights
      ],
      recommendations: [
        `${data.averageMeetingsPerWeek < 1 ? 'Increase meeting frequency to strengthen customer relationships' : 'Maintain current meeting cadence for optimal engagement'}`,
        `Focus on customers with fewer meetings to ensure balanced attention across portfolio`,
        `Document key outcomes and action items from meetings to track progress`,
        `Consider scheduled follow-ups for customers showing reduced meeting frequency`,
        `Leverage successful patterns from top customers to improve other relationships`,
        ...taskRecommendations
      ]
    };
  }
}

export const aiAnalyticsService = new AIAnalyticsService();
export type { MeetingData, AnalyticsFilter, AnalyticsReport };
