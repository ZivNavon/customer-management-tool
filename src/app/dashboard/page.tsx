'use client';

import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { customerApi } from '@/lib/api';
import { mockApi } from '@/lib/mockApi';
import { Header } from '@/components/Header';
import {
  ChartBarIcon,
  UsersIcon,
  CalendarIcon,
  ExclamationTriangleIcon,
  PhoneIcon,
  EnvelopeIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline';
import { 
  CheckCircleIcon, 
  ExclamationCircleIcon, 
  XCircleIcon 
} from '@heroicons/react/24/solid';

interface CustomerData {
  id: string;
  name: string;
  arr_usd: number;
  meetings_count: number;
  last_meeting_date?: string;
  logo?: string;
  contacts?: Array<{
    id: string;
    name: string;
    role: string;
    email: string;
    phone: string;
  }>;
}

interface CustomerStats {
  totalCustomers: number;
  totalARR: number;
  avgMeetingsPerCustomer: number;
  totalMeetings: number;
  atRiskCustomers: number;
  recentMeetings: number;
}

interface RiskAssessment {
  customerId: string;
  customerName: string;
  riskLevel: 'low' | 'medium' | 'high';
  riskScore: number;
  factors: string[];
  lastMeeting?: string;
  arr: number;
  meetingCount: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<CustomerStats>({
    totalCustomers: 0,
    totalARR: 0,
    avgMeetingsPerCustomer: 0,
    totalMeetings: 0,
    atRiskCustomers: 0,
    recentMeetings: 0
  });
  
  const [riskAssessments, setRiskAssessments] = useState<RiskAssessment[]>([]);

  // Fetch customers data
  const { data: customers } = useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      try {
        return await customerApi.getAll();
      } catch (error) {
        console.log('Backend not available, using mock data');
        return await mockApi.customers.getAll();
      }
    },
  });

  const customersData = useMemo(() => customers?.data || [], [customers?.data]);

  // Calculate statistics and risk assessments
  useEffect(() => {
    if (customersData.length > 0) {
      calculateStats(customersData);
      calculateRiskAssessments(customersData);
    }
  }, [customersData]);

  const calculateStats = (customers: CustomerData[]) => {
    const totalCustomers = customers.length;
    const totalARR = customers.reduce((sum, customer) => sum + (customer.arr_usd || 0), 0);
    const totalMeetings = customers.reduce((sum, customer) => sum + (customer.meetings_count || 0), 0);
    const avgMeetingsPerCustomer = totalCustomers > 0 ? Math.round(totalMeetings / totalCustomers * 10) / 10 : 0;
    
    // Recent meetings (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentMeetings = customers.filter(customer => {
      if (!customer.last_meeting_date) return false;
      const lastMeeting = new Date(customer.last_meeting_date);
      return lastMeeting >= thirtyDaysAgo;
    }).length;

    setStats({
      totalCustomers,
      totalARR,
      avgMeetingsPerCustomer,
      totalMeetings,
      atRiskCustomers: 0, // Will be calculated in risk assessment
      recentMeetings
    });
  };

  const calculateRiskAssessments = (customers: CustomerData[]) => {
    const assessments: RiskAssessment[] = customers.map(customer => {
      const factors: string[] = [];
      let riskScore = 0;

      // Factor 1: Last meeting date
      const daysSinceLastMeeting = customer.last_meeting_date 
        ? Math.floor((new Date().getTime() - new Date(customer.last_meeting_date).getTime()) / (1000 * 60 * 60 * 24))
        : 999;

      if (daysSinceLastMeeting > 90) {
        riskScore += 40;
        factors.push(`No meeting in ${daysSinceLastMeeting} days`);
      } else if (daysSinceLastMeeting > 60) {
        riskScore += 25;
        factors.push(`Last meeting ${daysSinceLastMeeting} days ago`);
      } else if (daysSinceLastMeeting > 30) {
        riskScore += 15;
        factors.push(`Last meeting ${daysSinceLastMeeting} days ago`);
      }

      // Factor 2: Meeting frequency
      const meetingCount = customer.meetings_count || 0;
      if (meetingCount === 0) {
        riskScore += 30;
        factors.push('No meetings recorded');
      } else if (meetingCount < 2) {
        riskScore += 20;
        factors.push('Low meeting frequency');
      }

      // Factor 3: ARR vs engagement
      const arr = customer.arr_usd || 0;
      if (arr > 100000 && meetingCount < 3) {
        riskScore += 25;
        factors.push('High value, low engagement');
      }

      // Factor 4: Contact information
      const hasContacts = customer.contacts && customer.contacts.length > 0;
      if (!hasContacts) {
        riskScore += 15;
        factors.push('No contact information');
      } else {
        const hasEmail = customer.contacts?.some((c) => c.email) || false;
        const hasPhone = customer.contacts?.some((c) => c.phone) || false;
        if (!hasEmail && !hasPhone) {
          riskScore += 10;
          factors.push('Limited contact methods');
        }
      }

      // Determine risk level
      let riskLevel: 'low' | 'medium' | 'high';
      if (riskScore >= 60) {
        riskLevel = 'high';
      } else if (riskScore >= 30) {
        riskLevel = 'medium';
      } else {
        riskLevel = 'low';
      }

      return {
        customerId: customer.id,
        customerName: customer.name,
        riskLevel,
        riskScore,
        factors,
        lastMeeting: customer.last_meeting_date,
        arr: customer.arr_usd || 0,
        meetingCount: customer.meetings_count || 0
      };
    }).sort((a, b) => b.riskScore - a.riskScore);

    setRiskAssessments(assessments);
    
    // Update at-risk customers count
    const atRiskCount = assessments.filter(a => a.riskLevel === 'high' || a.riskLevel === 'medium').length;
    setStats(prev => ({ ...prev, atRiskCustomers: atRiskCount }));
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  };

  const getRiskIcon = (level: 'low' | 'medium' | 'high') => {
    switch (level) {
      case 'low':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'medium':
        return <ExclamationCircleIcon className="h-5 w-5 text-yellow-500" />;
      case 'high':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
    }
  };

  const getRiskColor = (level: 'low' | 'medium' | 'high') => {
    switch (level) {
      case 'low':
        return 'bg-green-50 border-green-200';
      case 'medium':
        return 'bg-yellow-50 border-yellow-200';
      case 'high':
        return 'bg-red-50 border-red-200';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center">
            <ChartBarIcon className="h-8 w-8 text-blue-600 dark:text-blue-400 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Customer Dashboard</h1>
          </div>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Overview of customer engagement and account health</p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Customers */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <UsersIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Customers</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.totalCustomers}</p>
              </div>
            </div>
          </div>

          {/* Total ARR */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                <CurrencyDollarIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total ARR</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{formatCurrency(stats.totalARR)}</p>
              </div>
            </div>
          </div>

          {/* Total Meetings */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <CalendarIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Meetings</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.totalMeetings}</p>
                <p className="text-xs text-gray-500 dark:text-gray-500">Avg: {stats.avgMeetingsPerCustomer} per customer</p>
              </div>
            </div>
          </div>

          {/* At Risk Customers */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="p-3 bg-red-100 dark:bg-red-900 rounded-lg">
                <ExclamationTriangleIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">At Risk</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.atRiskCustomers}</p>
                <p className="text-xs text-gray-500 dark:text-gray-500">{stats.recentMeetings} recent meetings</p>
              </div>
            </div>
          </div>
        </div>

        {/* Risk Assessment Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Account Risk Assessment</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Customers ranked by engagement risk factors</p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Risk Level
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    ARR
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Meetings
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Last Meeting
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Risk Factors
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {riskAssessments.map((assessment) => {
                  const customer = customersData.find((c: CustomerData) => c.id === assessment.customerId);
                  return (
                    <tr key={assessment.customerId} className={getRiskColor(assessment.riskLevel)}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mr-3">
                            {customer?.logo_url ? (
                              <img
                                src={customer.logo_url}
                                alt={assessment.customerName}
                                className="w-8 h-8 rounded-full object-cover"
                              />
                            ) : (
                              <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">
                                {assessment.customerName.charAt(0).toUpperCase()}
                              </span>
                            )}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {assessment.customerName}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {getRiskIcon(assessment.riskLevel)}
                          <span className={`ml-2 text-sm font-medium capitalize ${
                            assessment.riskLevel === 'high' ? 'text-red-700 dark:text-red-400' :
                            assessment.riskLevel === 'medium' ? 'text-yellow-700 dark:text-yellow-400' :
                            'text-green-700 dark:text-green-400'
                          }`}>
                            {assessment.riskLevel}
                          </span>
                          <span className="ml-1 text-xs text-gray-500 dark:text-gray-400">
                            ({assessment.riskScore})
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {formatCurrency(assessment.arr)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {assessment.meetingCount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {formatDate(assessment.lastMeeting)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          {assessment.factors.slice(0, 2).map((factor, index) => (
                            <div key={index} className="mb-1">• {factor}</div>
                          ))}
                          {assessment.factors.length > 2 && (
                            <div className="text-gray-400 dark:text-gray-500">+{assessment.factors.length - 2} more</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex space-x-2">
                          {customer?.contacts?.[0]?.email && (
                            <button
                              onClick={() => window.open(`mailto:${customer.contacts[0].email}?subject=Follow-up with ${customer.name}`, '_blank')}
                              className="p-1 text-blue-600 hover:text-blue-700"
                              title="Send email"
                            >
                              <EnvelopeIcon className="h-4 w-4" />
                            </button>
                          )}
                          {customer?.contacts?.[0]?.phone && (
                            <button
                              onClick={() => window.open(`tel:${customer.contacts[0].phone}`, '_blank')}
                              className="p-1 text-green-600 hover:text-green-700"
                              title="Call"
                            >
                              <PhoneIcon className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            onClick={() => window.open(`/customers/${customer?.id}`, '_blank')}
                            className="p-1 text-purple-600 hover:text-purple-700"
                            title="View customer"
                          >
                            <CalendarIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
