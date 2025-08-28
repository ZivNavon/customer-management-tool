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
import { Header } from '@/components/Header';
import { MarkdownText } from '@/lib/markdownProcessor';

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
  const [apiKey, setApiKey] = useState('');
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [isAddingSampleData, setIsAddingSampleData] = useState(false);
  const [selectedCustomerIds, setSelectedCustomerIds] = useState<Set<string>>(new Set());

  // Helper function to detect if content is primarily Hebrew
  const detectPrimaryLanguage = (content: string): 'he' | 'en' => {
    const hebrewPattern = /[\u0590-\u05FF]/g;
    const hebrewMatches = content.match(hebrewPattern);
    const hebrewCount = hebrewMatches ? hebrewMatches.length : 0;
    const totalChars = content.replace(/\s/g, '').length;
    
    return hebrewCount / totalChars > 0.3 ? 'he' : 'en'; // More than 30% Hebrew = Hebrew content
  };

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
  const transformedMeetings: MeetingData[] = useMemo(() => {
    console.log('🔍 Raw meetings data:', meetingsData);
    console.log('🔍 Raw customers data:', customersData);
    
    return meetingsData.map((meeting: any) => {
      // Try to find customer name from customers data first
      const customer = customersData?.find(c => c.id === meeting.customer_id || c.id === meeting.customerId);
      let customerName = 'Unknown Customer';
      
      if (customer?.name) {
        customerName = customer.name;
      } else if (meeting.customer?.name) {
        customerName = meeting.customer.name;
      } else if (meeting.customerName) {
        customerName = meeting.customerName;
      } else if (meeting.customer_id || meeting.customerId) {
        customerName = `Customer ${meeting.customer_id || meeting.customerId}`;
      }
      
      console.log(`🔍 Meeting ${meeting.id}: customer_id=${meeting.customer_id}, found customer:`, customer, 'name:', customerName);
      
      return {
        id: meeting.id || Date.now().toString(),
        customer_id: meeting.customer_id || meeting.customerId || '',
        customer_name: customerName,
        title: meeting.title || 'Untitled Meeting',
        date: meeting.meeting_date || meeting.date || new Date().toISOString(),
        duration: meeting.duration || 60,
        summary: meeting.description || meeting.summary || '',
        notes: meeting.notes || '',
        outcome: meeting.next_steps || meeting.outcome || ''
      };
    });
  }, [meetingsData, customersData]);

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

  const handleSetApiKey = () => {
    if (apiKey.trim()) {
      aiAnalyticsService.setApiKey(apiKey.trim());
      setShowApiKeyInput(false);
      localStorage.setItem('openai_api_key', apiKey.trim());
    }
  };

  // Load API key from localStorage on mount
  useEffect(() => {
    const savedApiKey = localStorage.getItem('openai_api_key');
    if (savedApiKey) {
      setApiKey(savedApiKey);
      aiAnalyticsService.setApiKey(savedApiKey);
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

              {/* API Key Configuration */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    OpenAI API Key
                  </label>
                  <button
                    onClick={() => setShowApiKeyInput(!showApiKeyInput)}
                    className="text-xs text-blue-600 hover:text-blue-700 flex items-center"
                  >
                    <KeyIcon className="h-3 w-3 mr-1" />
                    {apiKey ? 'Update' : 'Configure'}
                  </button>
                </div>
                
                {showApiKeyInput ? (
                  <div className="space-y-3">
                    <input
                      type="password"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="sk-..."
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                    <div className="flex space-x-2">
                      <button
                        onClick={handleSetApiKey}
                        className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setShowApiKeyInput(false)}
                        className="px-3 py-1 bg-gray-300 text-gray-700 rounded text-xs hover:bg-gray-400"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                    {apiKey ? (
                      <span className="text-green-600 dark:text-green-400">✓ API Key configured</span>
                    ) : (
                      <span className="text-orange-600 dark:text-orange-400">⚠️ No API key - using mock data</span>
                    )}
                  </div>
                )}
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

                {(() => {
                  // Detect the primary language from the report content
                  const reportContent = `${currentReport.summary} ${currentReport.insights.join(' ')} ${currentReport.recommendations.join(' ')}`;
                  const isHebrew = detectPrimaryLanguage(reportContent) === 'he';

                  return (
                    <>
                      {/* Executive Summary */}
                      <div className="mb-6">
                        <h3 className={`text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center ${isHebrew ? 'flex-row-reverse justify-end' : 'justify-start'}`} dir={isHebrew ? 'rtl' : 'ltr'}>
                          <DocumentTextIcon className={`h-6 w-6 text-blue-600 dark:text-blue-400 ${isHebrew ? 'ml-2' : 'mr-2'}`} />
                          {isHebrew ? 'סיכום כללי' : 'Executive Summary'}
                        </h3>
                        <div className={`bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-900/30 dark:via-indigo-900/30 dark:to-purple-900/30 rounded-xl p-6 border border-blue-200/60 dark:border-blue-700/60 shadow-lg ${isHebrew ? 'text-right' : 'text-left'}`} dir={isHebrew ? 'rtl' : 'ltr'}>
                          <div className="text-gray-700 dark:text-gray-300 mb-6 leading-relaxed text-base">
                            <MarkdownText 
                              className="text-gray-700 dark:text-gray-300 leading-relaxed text-base"
                              dir={isHebrew ? 'rtl' : 'ltr'}
                            >
                              {currentReport.summary}
                            </MarkdownText>
                          </div>
                          
                          {/* Professional Meeting Breakdown */}
                          <div className="border-t border-blue-200/50 dark:border-blue-700/50 pt-6 mt-6">
                            <h4 className={`font-semibold text-base text-blue-900 dark:text-blue-100 mb-4 flex items-center ${isHebrew ? 'flex-row-reverse justify-end' : 'justify-start'}`}>
                              <ChartBarIcon className={`h-5 w-5 text-blue-600 dark:text-blue-400 ${isHebrew ? 'ml-2' : 'mr-2'}`} />
                              {isHebrew ? 'פירוט פגישות ולקוחות' : 'Meeting & Customer Details'}
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-6">
                              <div className={`bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-4 border border-blue-100/80 dark:border-blue-800/50 shadow-md hover:shadow-lg transition-all duration-200 ${isHebrew ? 'text-right' : 'text-left'}`}>
                                <div className={`flex items-center ${isHebrew ? 'flex-row-reverse justify-start' : 'justify-between'} mb-3`}>
                                  <span className="font-semibold text-gray-900 dark:text-gray-100">
                                    {isHebrew ? 'סה"כ פגישות' : 'Total Meetings'}
                                  </span>
                                  <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                    {currentReport.data.totalMeetings}
                                  </span>
                                </div>
                                <div className="text-xs text-gray-600 dark:text-gray-400 bg-blue-50 dark:bg-blue-900/20 rounded-lg px-3 py-2">
                                  {isHebrew ? `עם ${currentReport.data.uniqueCustomers} לקוחות שונים` : `with ${currentReport.data.uniqueCustomers} unique customers`}
                                </div>
                              </div>
                              
                              <div className={`bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-4 border border-blue-100/80 dark:border-blue-800/50 shadow-md hover:shadow-lg transition-all duration-200 ${isHebrew ? 'text-right' : 'text-left'}`}>
                                <div className={`flex items-center ${isHebrew ? 'flex-row-reverse justify-start' : 'justify-between'} mb-3`}>
                                  <span className="font-semibold text-gray-900 dark:text-gray-100">
                                    {isHebrew ? 'ממוצע שבועי' : 'Weekly Average'}
                                  </span>
                                  <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                                    {Math.round(currentReport.data.averageMeetingsPerWeek * 10) / 10}
                                  </span>
                                </div>
                                <div className="text-xs text-gray-600 dark:text-gray-400 bg-green-50 dark:bg-green-900/20 rounded-lg px-3 py-2">
                                  {isHebrew ? 'פגישות בשבוע' : 'meetings per week'}
                                </div>
                              </div>
                            </div>
                            
                            {/* Top Customers with Multiple Meetings */}
                            {currentReport.data.topCustomers && currentReport.data.topCustomers.length > 0 && (
                              <div className={`${isHebrew ? 'text-right' : 'text-left'}`}>
                                <h5 className="font-semibold text-sm text-gray-900 dark:text-gray-100 mb-3 flex items-center">
                                  <UserGroupIcon className={`h-4 w-4 text-purple-600 dark:text-purple-400 ${isHebrew ? 'ml-2' : 'mr-2'}`} />
                                  {isHebrew ? 'לקוחות פעילים' : 'Active Customers'}
                                </h5>
                                <div className={`flex flex-wrap gap-3 ${isHebrew ? 'justify-end' : 'justify-start'}`}>
                                  {currentReport.data.topCustomers.slice(0, 5).map((customer, index) => (
                                    <span 
                                      key={index}
                                      className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold bg-gradient-to-r from-purple-100 via-pink-100 to-rose-100 dark:from-purple-900/40 dark:via-pink-900/40 dark:to-rose-900/40 text-purple-800 dark:text-purple-200 border border-purple-200/60 dark:border-purple-700/60 shadow-lg hover:shadow-xl transition-all duration-200`}
                                    >
                                      <UserIcon className={`h-4 w-4 ${isHebrew ? 'ml-2' : 'mr-2'}`} />
                                      {customer.name}
                                      {customer.meetingCount > 1 && (
                                        <span className={`${isHebrew ? 'mr-2' : 'ml-2'} px-2 py-1 bg-purple-200 dark:bg-purple-700 rounded-full text-xs font-bold shadow-md`}>
                                          {customer.meetingCount}
                                        </span>
                                      )}
                                    </span>
                                  ))}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400 mt-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg px-3 py-2">
                                  {isHebrew 
                                    ? `${currentReport.data.topCustomers.filter(c => c.meetingCount > 1).length} לקוחות עם מספר פגישות`
                                    : `${currentReport.data.topCustomers.filter(c => c.meetingCount > 1).length} customers with multiple meetings`
                                  }
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Task Management & Progress Tracking */}
                      <div className="mb-6">
                        <h3 className={`text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 ${isHebrew ? 'text-right' : 'text-left'}`} dir={isHebrew ? 'rtl' : 'ltr'}>
                          {isHebrew ? 'ניהול משימות והתקדמות' : 'Task Management & Progress'}
                        </h3>
                        <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 ${isHebrew ? 'dir-rtl' : ''}`}>
                          <div className={`bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 dark:from-emerald-900/30 dark:via-green-900/30 dark:to-teal-900/30 rounded-xl p-5 border border-emerald-200/60 dark:border-emerald-700/60 shadow-lg hover:shadow-xl transition-all duration-300 ${isHebrew ? 'text-right' : 'text-left'}`} dir={isHebrew ? 'rtl' : 'ltr'}>
                            <div className={`flex items-center ${isHebrew ? 'flex-row-reverse justify-start' : 'justify-between'} mb-3`}>
                              <span className="text-sm font-semibold text-emerald-800 dark:text-emerald-200">
                                {isHebrew ? 'משימות הושלמו' : 'Tasks Completed'}
                              </span>
                              <div className="flex items-center">
                                <CheckIcon className="h-5 w-5 text-emerald-600 dark:text-emerald-400 mr-2" />
                                <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                                  {currentReport.data.completedTasks || 0}
                                </span>
                              </div>
                            </div>
                            <div className="text-xs text-emerald-700 dark:text-emerald-300 bg-emerald-100/50 dark:bg-emerald-800/30 rounded-lg px-3 py-2">
                              {currentReport.data.taskCompletionRate 
                                ? `${Math.round(currentReport.data.taskCompletionRate)}% ${isHebrew ? 'שיעור השלמה' : 'completion rate'}`
                                : isHebrew ? 'אין נתונים' : 'No data available'
                              }
                            </div>
                          </div>
                          
                          <div className={`bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 dark:from-amber-900/30 dark:via-yellow-900/30 dark:to-orange-900/30 rounded-xl p-5 border border-amber-200/60 dark:border-amber-700/60 shadow-lg hover:shadow-xl transition-all duration-300 ${isHebrew ? 'text-right' : 'text-left'}`} dir={isHebrew ? 'rtl' : 'ltr'}>
                            <div className={`flex items-center ${isHebrew ? 'flex-row-reverse justify-start' : 'justify-between'} mb-3`}>
                              <span className="text-sm font-semibold text-amber-800 dark:text-amber-200">
                                {isHebrew ? 'משימות פתוחות' : 'Open Tasks'}
                              </span>
                              <div className="flex items-center">
                                <CalendarIcon className="h-5 w-5 text-amber-600 dark:text-amber-400 mr-2" />
                                <span className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                                  {(currentReport.data.totalTasks || 0) - (currentReport.data.completedTasks || 0)}
                                </span>
                              </div>
                            </div>
                            <div className="text-xs text-amber-700 dark:text-amber-300 bg-amber-100/50 dark:bg-amber-800/30 rounded-lg px-3 py-2">
                              {isHebrew ? 'דורשות מעקב' : 'require follow-up'}
                            </div>
                          </div>
                          
                          <div className={`bg-gradient-to-br from-red-50 via-pink-50 to-rose-50 dark:from-red-900/30 dark:via-pink-900/30 dark:to-rose-900/30 rounded-xl p-5 border border-red-200/60 dark:border-red-700/60 shadow-lg hover:shadow-xl transition-all duration-300 ${isHebrew ? 'text-right' : 'text-left'}`} dir={isHebrew ? 'rtl' : 'ltr'}>
                            <div className={`flex items-center ${isHebrew ? 'flex-row-reverse justify-start' : 'justify-between'} mb-3`}>
                              <span className="text-sm font-semibold text-red-800 dark:text-red-200">
                                {isHebrew ? 'משימות באיחור' : 'Overdue Tasks'}
                              </span>
                              <div className="flex items-center">
                                <div className="h-5 w-5 bg-red-500 rounded-full flex items-center justify-center mr-2">
                                  <span className="text-white font-bold text-xs">!</span>
                                </div>
                                <span className="text-2xl font-bold text-red-600 dark:text-red-400">
                                  {currentReport.data.overdueTasks || 0}
                                </span>
                              </div>
                            </div>
                            <div className="text-xs text-red-700 dark:text-red-300 bg-red-100/50 dark:bg-red-800/30 rounded-lg px-3 py-2">
                              {isHebrew ? 'דורשות טיפול מיידי' : 'need immediate attention'}
                            </div>
                          </div>
                        </div>
                        
                        {/* Task Priority Breakdown */}
                        {currentReport.data.tasksByPriority && currentReport.data.tasksByPriority.length > 0 && (
                          <div className={`bg-gradient-to-br from-slate-50 via-gray-50 to-zinc-50 dark:from-slate-900/40 dark:via-gray-900/40 dark:to-zinc-900/40 rounded-xl p-5 border border-slate-200/60 dark:border-slate-700/60 shadow-lg ${isHebrew ? 'text-right' : 'text-left'}`} dir={isHebrew ? 'rtl' : 'ltr'}>
                            <h4 className={`font-semibold text-base text-gray-900 dark:text-gray-100 mb-4 flex items-center ${isHebrew ? 'flex-row-reverse justify-end' : 'justify-start'}`}>
                              <ChartBarIcon className={`h-5 w-5 text-gray-600 dark:text-gray-400 ${isHebrew ? 'ml-2' : 'mr-2'}`} />
                              {isHebrew ? 'פילוח לפי עדיפות' : 'Priority Breakdown'}
                            </h4>
                            <div className={`flex flex-wrap gap-3 ${isHebrew ? 'justify-end' : 'justify-start'}`} dir={isHebrew ? 'rtl' : 'ltr'}>
                              {currentReport.data.tasksByPriority.map((item, index) => {
                                const priorityColors = {
                                  high: 'bg-gradient-to-r from-red-100 to-red-200 dark:from-red-900/40 dark:to-red-800/40 text-red-800 dark:text-red-200 border-red-300 dark:border-red-600/50 shadow-red-200/50',
                                  medium: 'bg-gradient-to-r from-yellow-100 to-amber-200 dark:from-yellow-900/40 dark:to-amber-800/40 text-yellow-800 dark:text-yellow-200 border-yellow-300 dark:border-yellow-600/50 shadow-yellow-200/50',
                                  low: 'bg-gradient-to-r from-green-100 to-emerald-200 dark:from-green-900/40 dark:to-emerald-800/40 text-green-800 dark:text-green-200 border-green-300 dark:border-green-600/50 shadow-green-200/50'
                                };
                                const priorityLabels = {
                                  high: isHebrew ? 'גבוהה' : 'High',
                                  medium: isHebrew ? 'בינונית' : 'Medium',
                                  low: isHebrew ? 'נמוכה' : 'Low'
                                };
                                return (
                                  <span 
                                    key={index}
                                    className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold border shadow-lg hover:shadow-xl transition-all duration-200 ${priorityColors[item.priority as keyof typeof priorityColors] || 'bg-gray-100 text-gray-800'}`}
                                    dir={isHebrew ? 'rtl' : 'ltr'}
                                  >
                                    <div className={`w-2 h-2 rounded-full ${isHebrew ? 'ml-2' : 'mr-2'} ${
                                      item.priority === 'high' ? 'bg-red-500' :
                                      item.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                                    }`} />
                                    {priorityLabels[item.priority as keyof typeof priorityLabels] || item.priority}: 
                                    <span className={`font-bold ${isHebrew ? 'mr-1' : 'ml-1'}`}>{item.count}</span>
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Open Tasks Details */}
                      <div className="mb-6">
                        <h3 className={`text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center ${isHebrew ? 'flex-row-reverse justify-end' : 'justify-start'}`} dir={isHebrew ? 'rtl' : 'ltr'}>
                          <CalendarIcon className={`h-6 w-6 text-orange-600 dark:text-orange-400 ${isHebrew ? 'ml-2' : 'mr-2'}`} />
                          {isHebrew ? 'משימות פתוחות בפירוט' : 'Open Tasks Details'}
                        </h3>
                        <div className={`bg-gradient-to-br from-orange-50 via-amber-50 to-red-50 dark:from-orange-900/30 dark:via-amber-900/30 dark:to-red-900/30 rounded-xl p-6 border border-orange-200/60 dark:border-orange-700/60 shadow-lg ${isHebrew ? 'text-right' : 'text-left'}`} dir={isHebrew ? 'rtl' : 'ltr'}>
                          {allTasksData && allTasksData.length > 0 ? (
                            <div className="space-y-4">
                              {allTasksData
                                .filter(task => task.status !== 'completed')
                                .slice(0, 10)
                                .map((task, index) => (
                                <div key={task.id} className={`bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl p-4 border border-orange-100/80 dark:border-orange-800/50 shadow-md hover:shadow-lg transition-all duration-200 ${isHebrew ? 'text-right' : 'text-left'}`} dir={isHebrew ? 'rtl' : 'ltr'}>
                                  <div className={`flex items-start ${isHebrew ? 'flex-row-reverse' : ''} space-x-3 ${isHebrew ? 'space-x-reverse' : ''}`}>
                                    <div className="flex-1">
                                      <div className={`flex items-center gap-3 mb-3 ${isHebrew ? 'flex-row-reverse' : ''}`}>
                                        <div className={`w-3 h-3 rounded-full shadow-lg ${
                                          task.priority === 'high' ? 'bg-red-500 shadow-red-200' :
                                          task.priority === 'medium' ? 'bg-yellow-500 shadow-yellow-200' : 'bg-green-500 shadow-green-200'
                                        }`} />
                                        <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-base">
                                          {task.title}
                                        </h4>
                                        <span className={`px-3 py-1 rounded-full text-xs font-semibold shadow-lg ${
                                          task.priority === 'high' ? 'bg-gradient-to-r from-red-100 to-red-200 dark:from-red-900/40 dark:to-red-800/40 text-red-800 dark:text-red-200 border border-red-300 dark:border-red-600/50' :
                                          task.priority === 'medium' ? 'bg-gradient-to-r from-yellow-100 to-amber-200 dark:from-yellow-900/40 dark:to-amber-800/40 text-yellow-800 dark:text-yellow-200 border border-yellow-300 dark:border-yellow-600/50' :
                                          'bg-gradient-to-r from-green-100 to-emerald-200 dark:from-green-900/40 dark:to-emerald-800/40 text-green-800 dark:text-green-200 border border-green-300 dark:border-green-600/50'
                                        }`}>
                                          {task.priority === 'high' ? (isHebrew ? 'גבוהה' : 'High') :
                                           task.priority === 'medium' ? (isHebrew ? 'בינונית' : 'Medium') :
                                           (isHebrew ? 'נמוכה' : 'Low')}
                                        </span>
                                      </div>
                                      {task.description && (
                                        <p className={`text-sm text-gray-600 dark:text-gray-400 mb-3 leading-relaxed bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 ${isHebrew ? 'text-right' : 'text-left'}`} dir={isHebrew ? 'rtl' : 'ltr'}>
                                          {task.description}
                                        </p>
                                      )}
                                      <div className={`flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 ${isHebrew ? 'flex-row-reverse' : ''}`}>
                                        {task.customer_name && (
                                          <span className={`flex items-center bg-blue-50 dark:bg-blue-900/30 px-3 py-1 rounded-full border border-blue-200 dark:border-blue-700/50 ${isHebrew ? 'flex-row-reverse' : ''}`}>
                                            <UserIcon className={`h-4 w-4 text-blue-600 dark:text-blue-400 ${isHebrew ? 'ml-1' : 'mr-1'}`} />
                                            <span className="font-medium text-blue-800 dark:text-blue-200">
                                              {task.customer_name}
                                            </span>
                                          </span>
                                        )}
                                        {task.due_date && (
                                          <span className={`flex items-center bg-purple-50 dark:bg-purple-900/30 px-3 py-1 rounded-full border border-purple-200 dark:border-purple-700/50 ${isHebrew ? 'flex-row-reverse' : ''}`}>
                                            <CalendarIcon className={`h-4 w-4 text-purple-600 dark:text-purple-400 ${isHebrew ? 'ml-1' : 'mr-1'}`} />
                                            <span className="font-medium text-purple-800 dark:text-purple-200">
                                              {new Date(task.due_date).toLocaleDateString(isHebrew ? 'he-IL' : 'en-US')}
                                            </span>
                                          </span>
                                        )}
                                        <span className={`px-3 py-1 rounded-full font-medium ${
                                          task.status === 'in_progress' ? 'bg-gradient-to-r from-blue-100 to-indigo-200 dark:from-blue-900/40 dark:to-indigo-800/40 text-blue-800 dark:text-blue-200 border border-blue-300 dark:border-blue-600/50' :
                                          'bg-gradient-to-r from-gray-100 to-slate-200 dark:from-gray-700 dark:to-slate-700 text-gray-800 dark:text-gray-200 border border-gray-300 dark:border-gray-600/50'
                                        }`}>
                                          {task.status === 'in_progress' ? (isHebrew ? 'בביצוע' : 'In Progress') :
                                           task.status === 'pending' ? (isHebrew ? 'ממתין' : 'Pending') :
                                           task.status}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                              {allTasksData.filter(task => task.status !== 'completed').length > 10 && (
                                <div className={`text-center text-base text-gray-600 dark:text-gray-400 bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-800/50 dark:to-slate-800/50 rounded-xl p-4 border border-gray-200 dark:border-gray-700/50 ${isHebrew ? 'text-right' : 'text-center'}`}>
                                  <span className="font-semibold">
                                    {isHebrew 
                                      ? `ועוד ${allTasksData.filter(task => task.status !== 'completed').length - 10} משימות פתוחות...`
                                      : `And ${allTasksData.filter(task => task.status !== 'completed').length - 10} more open tasks...`
                                    }
                                  </span>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className={`text-center py-12 ${isHebrew ? 'text-right' : 'text-center'}`}>
                              <CheckIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                              <div className="text-lg font-medium text-gray-500 dark:text-gray-400">
                                {isHebrew ? 'אין משימות פתוחות' : 'No open tasks found'}
                              </div>
                              <div className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                                {isHebrew ? 'כל המשימות הושלמו בהצלחה!' : 'All tasks have been completed successfully!'}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Key Insights */}
                      <div className="mb-6">
                        <h3 className={`text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center ${isHebrew ? 'flex-row-reverse justify-end' : 'justify-start'}`} dir={isHebrew ? 'rtl' : 'ltr'}>
                          <ChartBarIcon className={`h-6 w-6 text-green-600 dark:text-green-400 ${isHebrew ? 'ml-2' : 'mr-2'}`} />
                          {isHebrew ? 'תובנות מפתח' : 'Key Insights'}
                        </h3>
                        <div className="space-y-4">
                          {(() => {
                            // For Hebrew (RTL), we want the visual order to be 2,1 then 4,3
                            // So we need to reorder the insights array for RTL display
                            const insights = currentReport.insights;
                            let displayInsights = insights;
                            
                            if (isHebrew && insights.length > 1) {
                              displayInsights = [];
                              for (let i = 0; i < insights.length; i += 2) {
                                if (i + 1 < insights.length) {
                                  // Add the second item first, then the first item (for RTL visual order)
                                  displayInsights.push(insights[i + 1]);
                                  displayInsights.push(insights[i]);
                                } else {
                                  // If odd number, add the last item
                                  displayInsights.push(insights[i]);
                                }
                              }
                            }
                            
                            return displayInsights.map((insight, displayIndex) => {
                              // Calculate the original index for numbering
                              let originalIndex;
                              if (isHebrew && insights.length > 1) {
                                const pairIndex = Math.floor(displayIndex / 2);
                                const isFirstInPair = displayIndex % 2 === 0;
                                if (isFirstInPair) {
                                  // This is the "second" item in the original order (displayed first in RTL)
                                  originalIndex = pairIndex * 2 + 1;
                                } else {
                                  // This is the "first" item in the original order (displayed second in RTL)
                                  originalIndex = pairIndex * 2;
                                }
                              } else {
                                originalIndex = displayIndex;
                              }
                              
                              // Split insight by customer if it contains multiple customer references
                              const lines = insight.split('\n').filter(line => line.trim());
                              
                              return (
                                <div key={displayIndex} className={`bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-green-900/30 dark:via-emerald-900/30 dark:to-teal-900/30 rounded-xl p-5 border border-green-200/60 dark:border-green-700/60 shadow-lg hover:shadow-xl transition-all duration-300 ${isHebrew ? 'text-right' : 'text-left'}`} dir={isHebrew ? 'rtl' : 'ltr'}>
                                  <div className={`flex items-start ${isHebrew ? 'flex-row-reverse' : ''}`}>
                                    <div className={`flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-green-100 to-emerald-200 dark:from-green-800/60 dark:to-emerald-800/60 flex items-center justify-center shadow-lg ${isHebrew ? 'ml-4' : 'mr-4'}`}>
                                      <ChartBarIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
                                    </div>
                                    <div className="flex-1">
                                      <div className={`text-sm font-semibold text-green-800 dark:text-green-200 mb-3 ${isHebrew ? 'text-right' : 'text-left'}`}>
                                        {isHebrew ? `תובנה ${originalIndex + 1}` : `Insight ${originalIndex + 1}`}
                                      </div>
                                      <div className="space-y-2">
                                        {lines.length > 1 ? (
                                          lines.map((line, lineIndex) => (
                                            <div key={lineIndex} className={`text-sm text-gray-700 dark:text-gray-300 leading-relaxed bg-white/60 dark:bg-gray-800/60 rounded-lg p-3 border border-green-100 dark:border-green-800/50 ${isHebrew ? 'text-right' : 'text-left'}`} dir={isHebrew ? 'rtl' : 'ltr'}>
                                              <MarkdownText 
                                                className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed"
                                                dir={isHebrew ? 'rtl' : 'ltr'}
                                              >
                                                {line.trim()}
                                              </MarkdownText>
                                            </div>
                                          ))
                                        ) : (
                                          <div className={`text-sm text-gray-700 dark:text-gray-300 leading-relaxed ${isHebrew ? 'text-right' : 'text-left'}`} dir={isHebrew ? 'rtl' : 'ltr'}>
                                            <MarkdownText 
                                              className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed"
                                              dir={isHebrew ? 'rtl' : 'ltr'}
                                            >
                                              {insight}
                                            </MarkdownText>
                                          </div>
                                        )}
                                      </div>
                                      <div className={`mt-3 flex items-center ${isHebrew ? 'flex-row-reverse' : ''}`}>
                                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-green-100 to-emerald-200 dark:from-green-800/50 dark:to-emerald-800/50 text-green-800 dark:text-green-200 border border-green-300 dark:border-green-600/50 shadow-md`}>
                                          {isHebrew ? 'תובנה חשובה' : 'Key Insight'}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            });
                          })()}
                        </div>
                      </div>

                      {/* Action Items & Recommendations */}
                      <div>
                        <h3 className={`text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center ${isHebrew ? 'flex-row-reverse justify-end' : 'justify-start'}`} dir={isHebrew ? 'rtl' : 'ltr'}>
                          <SparklesIcon className={`h-6 w-6 text-purple-600 dark:text-purple-400 ${isHebrew ? 'ml-2' : 'mr-2'}`} />
                          {isHebrew ? 'פעולות מומלצות' : 'Action Items & Recommendations'}
                        </h3>
                        <div className="space-y-4">
                          {(() => {
                            // Group recommendations by matching customer name (fallback to General)
                            const grouped: Record<string, string[]> = {};
                            const normalize = (s: string) => (
                              (s || '')
                                .toString()
                                .toLowerCase()
                                .replace(/[^a-z0-9\u0590-\u05FF]+/g, ' ')
                                .trim()
                            );

                            let currentGroup: string | null = null;

                            for (const recRaw of currentReport.recommendations) {
                              const rec = (recRaw || '').toString().trim();
                              if (!rec) continue;
                              const recNorm = normalize(rec);

                              // Detect header-like entries that are just a customer name (e.g. "MOE:" or ":Ivory")
                              const headerMatch = customersData.find(c => {
                                const nameNorm = normalize(c?.name || '');
                                if (!nameNorm) return false;
                                if (recNorm === nameNorm) return true;
                                if (recNorm === `${nameNorm}`) return true;
                                // allow trailing or leading colon/space
                                if (recNorm === `${nameNorm}:` || recNorm === `:${nameNorm}`) return true;
                                // short lines that include name only
                                const words = recNorm.split(' ').filter(Boolean);
                                if (words.length <= 3 && words.includes(nameNorm)) return true;
                                return false;
                              });

                              if (headerMatch) {
                                currentGroup = headerMatch.name;
                                if (!grouped[currentGroup]) grouped[currentGroup] = [];
                                continue; // header entry, don't add as action
                              }

                              // Try to find inline match inside the recommendation
                              let match = customersData.find(c => recNorm.includes(normalize(c?.name || '')));

                              // If no inline match, use currentGroup if set
                              if (!match && currentGroup) {
                                match = customersData.find(c => c.name === currentGroup);
                              }

                              const key = match ? match.name : (isHebrew ? 'כללי' : 'General');
                              if (!grouped[key]) grouped[key] = [];
                              grouped[key].push(rec);
                            }

                            // Deduplicate and trim
                            Object.keys(grouped).forEach(k => {
                              const seen = new Set<string>();
                              grouped[k] = grouped[k]
                                .map(r => r.trim())
                                .filter(r => {
                                  const kk = r.toLowerCase();
                                  if (seen.has(kk)) return false;
                                  seen.add(kk);
                                  return true;
                                });
                            });

                            // Ensure selected customers appear even if they have no recommendations
                            try {
                              const selectedNames = customersWithMeetings.filter(c => c.selected).map(c => c.customer.name);
                              selectedNames.forEach(name => { if (!grouped[name]) grouped[name] = []; });

                              // Render selected customers first, then the rest
                              const renderOrder = Array.from(new Set([...selectedNames, ...Object.keys(grouped)]));

                              return renderOrder.map((groupName, gIndex) => {
                                const recs = grouped[groupName] || [];
                                return (
                                  <div key={gIndex} className={`bg-gradient-to-br from-purple-50 via-violet-50 to-indigo-50 dark:from-purple-900/30 dark:via-violet-900/30 dark:to-indigo-900/30 rounded-xl p-5 border border-purple-200/60 dark:border-purple-700/60 shadow-lg hover:shadow-xl transition-all duration-300 ${isHebrew ? 'text-right' : 'text-left'}`} dir={isHebrew ? 'rtl' : 'ltr'}>
                                    <div className={`flex items-center justify-between mb-3 ${isHebrew ? 'flex-row-reverse' : ''}`}>
                                      <div className="flex items-center gap-3">
                                        <div className={`flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-purple-100 to-violet-200 dark:from-purple-800/60 dark:to-violet-800/60 flex items-center justify-center shadow-lg`}> 
                                          <SparklesIcon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                                        </div>
                                        <div className={`text-sm font-semibold text-purple-800 dark:text-purple-200 ${isHebrew ? 'text-right' : 'text-left'}`}>{groupName}</div>
                                      </div>
                                    </div>

                                    <ol className={`list-decimal list-inside space-y-3 ${isHebrew ? 'text-right' : 'text-left'}`}> 
                                      {recs.map((rec, idx) => (
                                        <li key={idx} className="bg-white/60 dark:bg-gray-800/60 rounded-lg p-3 border border-purple-100 dark:border-purple-800/50">
                                          <MarkdownText className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed" dir={isHebrew ? 'rtl' : 'ltr'}>
                                            {rec}
                                          </MarkdownText>
                                        </li>
                                      ))}
                                    </ol>
                                  </div>
                                );
                              });
                            } catch (e) {
                              // Fallback to previous behavior on any runtime issue
                              return Object.entries(grouped).map(([groupName, recs], gIndex) => (
                                <div key={gIndex} className={`bg-gradient-to-br from-purple-50 via-violet-50 to-indigo-50 dark:from-purple-900/30 dark:via-violet-900/30 dark:to-indigo-900/30 rounded-xl p-5 border border-purple-200/60 dark:border-purple-700/60 shadow-lg hover:shadow-xl transition-all duration-300 ${isHebrew ? 'text-right' : 'text-left'}`} dir={isHebrew ? 'rtl' : 'ltr'}>
                                  <div className={`flex items-center justify-between mb-3 ${isHebrew ? 'flex-row-reverse' : ''}`}>
                                    <div className="flex items-center gap-3">
                                      <div className={`flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-purple-100 to-violet-200 dark:from-purple-800/60 dark:to-violet-800/60 flex items-center justify-center shadow-lg`}> 
                                        <SparklesIcon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                                      </div>
                                      <div className={`text-sm font-semibold text-purple-800 dark:text-purple-200 ${isHebrew ? 'text-right' : 'text-left'}`}>{groupName}</div>
                                    </div>
                                  </div>

                                  <ol className={`list-decimal list-inside space-y-3 ${isHebrew ? 'text-right' : 'text-left'}`}> 
                                    {recs.map((rec, idx) => (
                                      <li key={idx} className="bg-white/60 dark:bg-gray-800/60 rounded-lg p-3 border border-purple-100 dark:border-purple-800/50">
                                        <MarkdownText className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed" dir={isHebrew ? 'rtl' : 'ltr'}>
                                          {rec}
                                        </MarkdownText>
                                      </li>
                                    ))}
                                  </ol>
                                </div>
                              ));
                            }
                          })()}
                        </div>
                      </div>
                    </>
                  );
                })()}
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
