'use client';

import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { 
  CalendarIcon, 
  UserIcon, 
  ChartBarIcon, 
  DocumentTextIcon,
  FunnelIcon,
  SparklesIcon,
  KeyIcon,
  CheckIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';
import { aiAnalyticsService, type AnalyticsFilter, type AnalyticsReport, type MeetingData } from '@/lib/aiAnalytics';
import { mockApi } from '@/lib/mockApi';
import { addSampleMeetingData } from '@/lib/sampleMeetings';
import { type Meeting, type Customer, type Task } from '@/types';
import { SettingsManager } from '@/lib/settingsManager';
import { Header } from '@/components/Header';

interface CustomerWithMeetings {
  customer: Customer;
  meetings: MeetingData[];
  meetingCount: number;
  lastMeetingDate: string;
  selected: boolean;
}

// Helper functions moved outside component to prevent recreating on every render
const filterMeetingsByTimeRange = (meetings: MeetingData[], filters: AnalyticsFilter): MeetingData[] => {
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
    return meetingDate >= startDate && meetingDate <= endDate;
  });
};

const groupMeetingsByCustomer = (meetings: MeetingData[], customers: any[]): CustomerWithMeetings[] => {
  const customerMap = new Map<string, CustomerWithMeetings>();

  // Initialize all customers
  customers.forEach(customer => {
    customerMap.set(customer.id, {
      customer,
      meetings: [],
      meetingCount: 0,
      lastMeetingDate: new Date(0).toISOString(),
      selected: false
    });
  });

  // Group meetings by customer
  meetings.forEach(meeting => {
    const existing = customerMap.get(meeting.customer_id);
    if (existing) {
      existing.meetings.push(meeting);
      existing.meetingCount++;
      
      // Update last meeting date
      const meetingDate = new Date(meeting.date);
      const currentLastDate = new Date(existing.lastMeetingDate);
      if (meetingDate > currentLastDate) {
        existing.lastMeetingDate = meeting.date;
      }
    }
  });

  // Return only customers with meetings, sorted by last meeting date
  return Array.from(customerMap.values())
    .filter(item => item.meetingCount > 0)
    .sort((a, b) => new Date(b.lastMeetingDate).getTime() - new Date(a.lastMeetingDate).getTime());
};

export default function AnalyticsPage() {
  const { t } = useTranslation();
  const [filters, setFilters] = useState<AnalyticsFilter>({
    timeRange: 'month',
    customers: []
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentReport, setCurrentReport] = useState<AnalyticsReport | null>(null);
  const [isAddingSampleData, setIsAddingSampleData] = useState(false);
  const [selectedCustomerIds, setSelectedCustomerIds] = useState<Set<string>>(new Set());

  // Fetch meetings data
  const { data: meetingsData = [], refetch: refetchMeetings } = useQuery({
    queryKey: ['meetings'],
    queryFn: async () => {
      try {
        const response = await mockApi.meetings.list();
        return response.data || [];
      } catch (error) {
        console.error('Failed to fetch meetings:', error);
        return [];
      }
    }
  });

  // Fetch customers data
  const { data: customersData = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      try {
        const response = await mockApi.customers.getAll();
        return response.data || [];
      } catch (error) {
        console.error('Failed to fetch customers:', error);
        return [];
      }
    }
  });

  // Fetch all tasks data
  const { data: allTasksData = [] } = useQuery({
    queryKey: ['allTasks'],
    queryFn: async () => {
      try {
        // Get all customers first, then fetch tasks for each
        const customersResponse = await mockApi.customers.getAll();
        const customers = customersResponse.data || [];
        
        const allTasks = [];
        for (const customer of customers) {
          try {
            const tasksResponse = await mockApi.tasks.getByCustomer(customer.id);
            const customerTasks = (tasksResponse.data || []).map((task: Task) => ({
              ...task,
              customer_name: customer.name
            }));
            allTasks.push(...customerTasks);
          } catch (error) {
            console.error(`Failed to fetch tasks for customer ${customer.id}:`, error);
          }
        }
        
        return allTasks;
      } catch (error) {
        console.error('Failed to fetch tasks:', error);
        return [];
      }
    }
  });

  // Transform meetings to the format expected by AI service
  const transformedMeetings: MeetingData[] = useMemo(() => meetingsData.map((meeting: any) => ({
    id: meeting.id || Date.now().toString(),
    customer_id: meeting.customer_id || meeting.customerId || '',
    customer_name: meeting.customer?.name || meeting.customerName || 'Unknown Customer',
    title: meeting.title || 'Untitled Meeting',
    date: meeting.meeting_date || meeting.date || new Date().toISOString(),
    duration: meeting.duration || 60,
    summary: meeting.description || meeting.summary || '',
    notes: meeting.notes || '',
    outcome: meeting.next_steps || meeting.outcome || ''
  })), [meetingsData]);

  // Memoize filtered and grouped customers to prevent infinite re-renders
  const customersWithMeetings = useMemo(() => {
    const filteredMeetings = filterMeetingsByTimeRange(transformedMeetings, filters);
    const grouped = groupMeetingsByCustomer(filteredMeetings, customersData);
    // Apply selection state
    return grouped.map(item => ({
      ...item,
      selected: selectedCustomerIds.has(item.customer.id)
    }));
  }, [transformedMeetings, customersData, filters.timeRange, filters.dateFrom, filters.dateTo, selectedCustomerIds]);

  const toggleCustomerSelection = (customerId: string) => {
    setSelectedCustomerIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(customerId)) {
        newSet.delete(customerId);
      } else {
        newSet.add(customerId);
      }
      return newSet;
    });
  };

  const getSelectedMeetings = (): MeetingData[] => {
    const selectedCustomerIds = customersWithMeetings
      .filter(item => item.selected)
      .map(item => item.customer.id);
    
    return transformedMeetings.filter(meeting => 
      selectedCustomerIds.includes(meeting.customer_id)
    );
  };

  // Initialize API key from centralized settings on mount
  useEffect(() => {
    const settingsManager = SettingsManager.getInstance();
    const settings = settingsManager.getSettings();
    if (settings.isConfigured && settings.openaiApiKey) {
      aiAnalyticsService.setApiKey(settings.openaiApiKey);
    }
  }, []);

  const handleGenerateReport = async () => {
    setIsGenerating(true);
    try {
      const selectedMeetings = getSelectedMeetings();
      console.log('Generating report with filters:', filters);
      console.log('Selected customers:', customersWithMeetings.filter(c => c.selected).map(c => c.customer.name));
      console.log('Selected meetings:', selectedMeetings.length);
      
      if (selectedMeetings.length === 0) {
        alert('Please select at least one customer to generate a report.');
        setIsGenerating(false);
        return;
      }
      
      const report = await aiAnalyticsService.generateReport(selectedMeetings, allTasksData, filters);
      setCurrentReport(report);
    } catch (error) {
      console.error('Failed to generate report:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAddSampleData = async () => {
    setIsAddingSampleData(true);
    try {
      await addSampleMeetingData();
      // Refetch meetings data
      await refetchMeetings();
    } catch (error) {
      console.error('Failed to add sample data:', error);
    } finally {
      setIsAddingSampleData(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20">
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            AI Analytics & Reports
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Generate intelligent insights from your customer meetings and data
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          {/* Filters Panel */}
          <div className="xl:col-span-1">
            <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-sm p-6">
              <div className="flex items-center mb-6">
                <FunnelIcon className="h-5 w-5 text-blue-600 mr-2" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Report Filters
                </h2>
              </div>

              {/* Time Range Filter */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Time Range
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(['week', 'month', 'quarter', 'year'] as const).map((range) => (
                    <button
                      key={range}
                      onClick={() => setFilters(prev => ({ ...prev, timeRange: range }))}
                      className={`px-3 py-2 text-sm rounded-lg font-medium transition-all duration-200 ${
                        filters.timeRange === range
                          ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      {range.charAt(0).toUpperCase() + range.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Date Range */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Custom Date Range (Optional)
                </label>
                <div className="space-y-3">
                  <input
                    type="date"
                    value={filters.dateFrom || ''}
                    onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="From Date"
                  />
                  <input
                    type="date"
                    value={filters.dateTo || ''}
                    onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="To Date"
                  />
                </div>
              </div>

              {/* Data Preview */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Available Data
                </label>
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 text-sm">
                  <div className="text-blue-700 dark:text-blue-300">
                    📊 {customersWithMeetings.length} customers with meetings
                  </div>
                  <div className="text-blue-700 dark:text-blue-300">
                    📅 {customersWithMeetings.reduce((sum, c) => sum + c.meetingCount, 0)} total meetings
                  </div>
                  {customersWithMeetings.length === 0 && (
                    <button
                      onClick={handleAddSampleData}
                      disabled={isAddingSampleData}
                      className="mt-2 text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                      {isAddingSampleData ? 'Adding...' : 'Add Sample Data'}
                    </button>
                  )}
                </div>
              </div>

              {/* Generate Button */}
              <button
                onClick={handleGenerateReport}
                disabled={isGenerating || customersWithMeetings.filter(c => c.selected).length === 0}
                className={`w-full flex items-center justify-center px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                  isGenerating || customersWithMeetings.filter(c => c.selected).length === 0
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg hover:shadow-xl'
                } text-white`}
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Generating...
                  </>
                ) : (
                  <>
                    <SparklesIcon className="h-4 w-4 mr-2" />
                    Generate AI Report ({customersWithMeetings.filter(c => c.selected).length} selected)
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Customer Selection */}
          <div className="xl:col-span-1">
            <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <UserGroupIcon className="h-5 w-5 text-purple-600 mr-2" />
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Select Customers
                  </h2>
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {filters.timeRange}
                </span>
              </div>

              {customersWithMeetings.length > 0 ? (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {customersWithMeetings.map((item) => (
                    <div
                      key={item.customer.id}
                      onClick={() => toggleCustomerSelection(item.customer.id)}
                      className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                        item.selected
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className={`w-3 h-3 rounded-full mr-3 ${
                            item.selected ? 'bg-blue-500' : 'bg-gray-300'
                          }`}></div>
                          <div>
                            <h3 className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                              {item.customer.name}
                            </h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {item.meetingCount} meeting{item.meetingCount !== 1 ? 's' : ''}
                            </p>
                          </div>
                        </div>
                        {item.selected && (
                          <CheckIcon className="h-4 w-4 text-blue-500" />
                        )}
                      </div>
                      
                      {/* Meeting details */}
                      <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                        <div>Last: {new Date(item.lastMeetingDate).toLocaleDateString()}</div>
                        <div className="mt-1">
                          {item.meetings.slice(0, 2).map((meeting, idx) => (
                            <div key={idx} className="truncate">
                              • {meeting.title}
                            </div>
                          ))}
                          {item.meetings.length > 2 && (
                            <div className="text-blue-600">
                              +{item.meetings.length - 2} more...
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <UserIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500 dark:text-gray-400 text-sm">
                    No customers with meetings in the selected {filters.timeRange}
                  </p>
                  <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">
                    Try a different time range or add sample data
                  </p>
                </div>
              )}

              {customersWithMeetings.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between text-xs">
                    <button
                      onClick={() => setSelectedCustomerIds(new Set(customersWithMeetings.map(c => c.customer.id)))}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      Select All
                    </button>
                    <button
                      onClick={() => setSelectedCustomerIds(new Set())}
                      className="text-gray-600 hover:text-gray-700"
                    >
                      Clear All
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Report Display */}
          <div className="xl:col-span-2">
            {currentReport ? (
              <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-sm p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center">
                    <DocumentTextIcon className="h-5 w-5 text-blue-600 mr-2" />
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {currentReport.title}
                    </h2>
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Generated {new Date(currentReport.generatedAt).toLocaleString()}
                  </span>
                </div>

                {/* Summary */}
                <div className="mb-6">
                  <h3 className="text-md font-medium text-gray-900 dark:text-gray-100 mb-3">
                    Executive Summary
                  </h3>
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                    <p className="text-gray-700 dark:text-gray-300">
                      {currentReport.summary}
                    </p>
                  </div>
                </div>

                {/* Insights */}
                <div className="mb-6">
                  <h3 className="text-md font-medium text-gray-900 dark:text-gray-100 mb-3">
                    Key Insights
                  </h3>
                  <div className="space-y-2">
                    {currentReport.insights.map((insight, index) => (
                      <div key={index} className="flex items-start bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
                        <ChartBarIcon className="h-4 w-4 text-green-600 mt-0.5 mr-2 flex-shrink-0" />
                        <span className="text-gray-700 dark:text-gray-300 text-sm">{insight}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recommendations */}
                <div className="mb-6">
                  <h3 className="text-md font-medium text-gray-900 dark:text-gray-100 mb-3">
                    Recommendations
                  </h3>
                  <div className="space-y-2">
                    {currentReport.recommendations.map((rec, index) => (
                      <div key={index} className="flex items-start bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3">
                        <SparklesIcon className="h-4 w-4 text-purple-600 mt-0.5 mr-2 flex-shrink-0" />
                        <span className="text-gray-700 dark:text-gray-300 text-sm">{rec}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Enhanced AI Analytics */}
                {currentReport.aiAnalytics && (
                  <>
                    {/* Language Distribution */}
                    <div className="mb-6">
                      <h3 className="text-md font-medium text-gray-900 dark:text-gray-100 mb-3">
                        🌍 Language Distribution
                      </h3>
                      <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-4">
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {currentReport.aiAnalytics.languageDistribution.map((lang, index) => (
                            <div key={index} className="text-center">
                              <div className="text-lg font-semibold text-indigo-600 dark:text-indigo-400">
                                {lang.percentage}%
                              </div>
                              <div className="text-sm text-gray-600 dark:text-gray-400">
                                {lang.language} ({lang.count} meetings)
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Risk Assessment */}
                    <div className="mb-6">
                      <h3 className="text-md font-medium text-gray-900 dark:text-gray-100 mb-3">
                        ⚠️ Risk Assessment
                      </h3>
                      <div className="space-y-4">
                        <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Overall Risk Score</span>
                            <span className={`text-lg font-bold ${
                              currentReport.aiAnalytics.riskAssessment.overallRiskScore > 70 ? 'text-red-600' :
                              currentReport.aiAnalytics.riskAssessment.overallRiskScore > 50 ? 'text-yellow-600' : 'text-green-600'
                            }`}>
                              {currentReport.aiAnalytics.riskAssessment.overallRiskScore}/100
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${
                                currentReport.aiAnalytics.riskAssessment.overallRiskScore > 70 ? 'bg-red-500' :
                                currentReport.aiAnalytics.riskAssessment.overallRiskScore > 50 ? 'bg-yellow-500' : 'bg-green-500'
                              }`}
                              style={{ width: `${currentReport.aiAnalytics.riskAssessment.overallRiskScore}%` }}
                            ></div>
                          </div>
                        </div>
                        
                        {currentReport.aiAnalytics.riskAssessment.highRiskCustomers.length > 0 && (
                          <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4">
                            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">High Risk Customers</h4>
                            <div className="space-y-2">
                              {currentReport.aiAnalytics.riskAssessment.highRiskCustomers.map((customer, index) => (
                                <div key={index} className="border-l-4 border-orange-500 pl-3">
                                  <div className="font-medium text-gray-800 dark:text-gray-200">{customer.customerName}</div>
                                  <div className="text-xs text-gray-600 dark:text-gray-400">
                                    {customer.riskFactors.join(', ')}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Participant Analysis */}
                    <div className="mb-6">
                      <h3 className="text-md font-medium text-gray-900 dark:text-gray-100 mb-3">
                        👥 Participant Analysis
                      </h3>
                      <div className="bg-cyan-50 dark:bg-cyan-900/20 rounded-lg p-4">
                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Frequent Participants</h4>
                            <div className="space-y-1">
                              {currentReport.aiAnalytics.participantAnalysis.frequentParticipants.map((participant, index) => (
                                <div key={index} className="text-sm text-gray-600 dark:text-gray-400">
                                  <span className="font-medium">{participant.name}</span> - {participant.meetingCount} meetings
                                </div>
                              ))}
                            </div>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Engagement Metrics</h4>
                            <div className="space-y-1">
                              {currentReport.aiAnalytics.participantAnalysis.engagementMetrics.map((metric, index) => (
                                <div key={index} className="flex items-center justify-between text-sm">
                                  <span className="text-gray-600 dark:text-gray-400">{metric.metric}</span>
                                  <div className="flex items-center">
                                    <span className="text-gray-800 dark:text-gray-200 mr-1">{metric.value}</span>
                                    <span className={`text-xs ${
                                      metric.trend === 'up' ? 'text-green-500' :
                                      metric.trend === 'down' ? 'text-red-500' : 'text-gray-500'
                                    }`}>
                                      {metric.trend === 'up' ? '↗️' : metric.trend === 'down' ? '↘️' : '➡️'}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Key Topics */}
                    <div className="mb-6">
                      <h3 className="text-md font-medium text-gray-900 dark:text-gray-100 mb-3">
                        🏷️ Key Discussion Topics
                      </h3>
                      <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-4">
                        <div className="grid md:grid-cols-2 gap-3">
                          {currentReport.aiAnalytics.keyTopics.map((topic, index) => (
                            <div key={index} className="flex items-center justify-between">
                              <span className="text-sm text-gray-700 dark:text-gray-300">{topic.topic}</span>
                              <div className="flex items-center">
                                <span className="text-xs text-gray-500 mr-2">{topic.frequency}x</span>
                                <span className={`text-xs px-2 py-1 rounded ${
                                  topic.sentiment === 'positive' ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100' :
                                  topic.sentiment === 'negative' ? 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100' :
                                  'bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-100'
                                }`}>
                                  {topic.sentiment}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Actionable Insights */}
                    <div className="mb-6">
                      <h3 className="text-md font-medium text-gray-900 dark:text-gray-100 mb-3">
                        🎯 Actionable Insights
                      </h3>
                      <div className="grid md:grid-cols-3 gap-4">
                        <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
                          <h4 className="text-sm font-medium text-red-700 dark:text-red-300 mb-2">🚨 Urgent Actions</h4>
                          <div className="space-y-1">
                            {currentReport.aiAnalytics.actionableInsights.urgentActions.map((action, index) => (
                              <div key={index} className="text-xs text-red-600 dark:text-red-400">• {action}</div>
                            ))}
                          </div>
                        </div>
                        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                          <h4 className="text-sm font-medium text-green-700 dark:text-green-300 mb-2">📈 Opportunities</h4>
                          <div className="space-y-1">
                            {currentReport.aiAnalytics.actionableInsights.opportunities.map((opportunity, index) => (
                              <div key={index} className="text-xs text-green-600 dark:text-green-400">• {opportunity}</div>
                            ))}
                          </div>
                        </div>
                        <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
                          <h4 className="text-sm font-medium text-yellow-700 dark:text-yellow-300 mb-2">⚠️ Warning Signals</h4>
                          <div className="space-y-1">
                            {currentReport.aiAnalytics.actionableInsights.warningSignals.map((warning, index) => (
                              <div key={index} className="text-xs text-yellow-600 dark:text-yellow-400">• {warning}</div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-sm p-12 text-center">
                <ChartBarIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                  No Report Generated Yet
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6">
                  Configure your filters and click "Generate AI Report" to create intelligent insights from your meeting data.
                </p>
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    💡 <strong>Coming Soon:</strong> AI-powered analysis of meeting patterns, customer engagement trends, and actionable recommendations.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
