'use client';

import { useState, useEffect } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { customerApi, type Customer } from '@/lib/api';
import { mockApi } from '@/lib/mockApi';
import { Task } from '@/types';
import { CustomerCard } from '@/components/CustomerCard';
import { CustomerModal } from '@/components/CustomerModal';
import TasksOverview from '@/components/TasksOverview';
import { Header } from '@/components/Header';
import { exportCustomersToFile, importCustomersFromFile } from '@/lib/fileStorage';
import { 
  PlusIcon, 
  MagnifyingGlassIcon, 
  ArrowDownTrayIcon, 
  ArrowUpTrayIcon,
  ChartBarIcon,
  UsersIcon,
  CalendarIcon,
  ExclamationTriangleIcon,
  CurrencyDollarIcon,
  FaceSmileIcon,
  ClipboardDocumentListIcon,
  CheckCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

interface CustomerStats {
  totalCustomers: number;
  totalARR: number;
  avgMeetingsPerCustomer: number;
  totalMeetings: number;
  atRiskCustomers: number;
  satisfiedCustomers: number;
  recentMeetings: number;
}

export default function Home() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | undefined>(undefined);
  const [currentView, setCurrentView] = useState<'customers' | 'tasks'>('customers');
  const [stats, setStats] = useState<CustomerStats>({
    totalCustomers: 0,
    totalARR: 0,
    avgMeetingsPerCustomer: 0,
    totalMeetings: 0,
    atRiskCustomers: 0,
    satisfiedCustomers: 0,
    recentMeetings: 0
  });

  // Use mock API for development when backend is not available
  const { data: customers, isLoading, error } = useQuery({
    queryKey: ['customers', search],
    queryFn: async () => {
      try {
        return await customerApi.getAll({ search: search || undefined });
      } catch (error) {
        console.log('Backend not available, using mock data');
        return await mockApi.customers.getAll({ search: search || undefined });
      }
    },
  });

  const filteredCustomers = customers?.data || [];

  // Fetch all tasks
  const { data: allTasks, isLoading: isTasksLoading } = useQuery({
    queryKey: ['all-tasks'],
    queryFn: async () => {
      return await mockApi.tasks.getAll();
    },
  });

  // Calculate statistics
  useEffect(() => {
    if (filteredCustomers.length > 0) {
      calculateStats(filteredCustomers);
    }
  }, [filteredCustomers]);

  const calculateStats = (customers: Customer[]) => {
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

    // Count manually marked at-risk customers
    const atRiskCustomers = customers.filter(customer => customer.is_at_risk === true).length;
    
    // Count manually marked satisfied customers
    const satisfiedCustomers = customers.filter(customer => customer.is_satisfied === true).length;

    setStats({
      totalCustomers,
      totalARR,
      avgMeetingsPerCustomer,
      totalMeetings,
      atRiskCustomers,
      satisfiedCustomers,
      recentMeetings
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (customerId: string) => {
      try {
        return await customerApi.delete(customerId);
      } catch (error) {
        console.log('Backend not available, using mock data');
        return await mockApi.customers.delete(customerId);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });

  const handleEdit = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowEditModal(true);
  };

  const handleDelete = (customerId: string) => {
    deleteMutation.mutate(customerId);
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setSelectedCustomer(undefined);
  };

  const handleExport = () => {
    if (filteredCustomers.length > 0) {
      exportCustomersToFile(filteredCustomers);
    }
  };

  const handleImport = async () => {
    try {
      const importedCustomers = await importCustomersFromFile();
      
      // Save imported customers to localStorage via mockApi
      localStorage.setItem('customers_mock_data', JSON.stringify(importedCustomers));
      
      // Refresh the data
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      
      alert(`Successfully imported ${importedCustomers.length} customers!`);
    } catch (error) {
      alert('Failed to import customers: ' + (error as Error).message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Overview */}
        <div className="mb-8">
          <div className="flex items-center mb-6">
            <div className="p-2.5 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg mr-3">
              <ChartBarIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Dashboard Overview</h2>
              <p className="text-gray-600 dark:text-gray-400">Monitor your customer relationships and business metrics</p>
            </div>
          </div>
          
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-8">
            {/* Total Customers */}
            <div className="group bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-sm hover:shadow-xl border border-gray-200/50 dark:border-gray-700/50 p-6 transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-2">Total Customers</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.totalCustomers}</p>
                </div>
                <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg group-hover:shadow-blue-500/25 transition-all duration-300 group-hover:scale-110">
                  <UsersIcon className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>

            {/* Total ARR */}
            <div className="group bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-sm hover:shadow-xl border border-gray-200/50 dark:border-gray-700/50 p-6 transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-green-600 dark:text-green-400 uppercase tracking-wider mb-2">Total ARR</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{formatCurrency(stats.totalARR)}</p>
                </div>
                <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg group-hover:shadow-green-500/25 transition-all duration-300 group-hover:scale-110">
                  <CurrencyDollarIcon className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>

            {/* Total Meetings */}
            <div className="group bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-sm hover:shadow-xl border border-gray-200/50 dark:border-gray-700/50 p-6 transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wider mb-2">Total Meetings</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.totalMeetings}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Avg: {stats.avgMeetingsPerCustomer}</p>
                </div>
                <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg group-hover:shadow-purple-500/25 transition-all duration-300 group-hover:scale-110">
                  <CalendarIcon className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>

            {/* At Risk Customers */}
            <div className="group bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-sm hover:shadow-xl border border-gray-200/50 dark:border-gray-700/50 p-6 transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-red-600 dark:text-red-400 uppercase tracking-wider mb-2">At Risk</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.atRiskCustomers}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Manual marking</p>
                </div>
                <div className="p-3 bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-lg group-hover:shadow-red-500/25 transition-all duration-300 group-hover:scale-110">
                  <ExclamationTriangleIcon className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>

            {/* Satisfied Customers */}
            <div className="group bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-sm hover:shadow-xl border border-gray-200/50 dark:border-gray-700/50 p-6 transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-2">Satisfied</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.satisfiedCustomers}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Happy customers</p>
                </div>
                <div className="p-3 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl shadow-lg group-hover:shadow-emerald-500/25 transition-all duration-300 group-hover:scale-110">
                  <FaceSmileIcon className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-8">
          <div className="flex items-center justify-center">
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-2 shadow-sm border border-gray-200/50 dark:border-gray-700/50">
              <div className="flex space-x-2">
                <button
                  onClick={() => setCurrentView('customers')}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                    currentView === 'customers'
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg transform scale-105'
                      : 'text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                  }`}
                >
                  <UsersIcon className="w-5 h-5" />
                  Customers
                </button>
                <button
                  onClick={() => setCurrentView('tasks')}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                    currentView === 'tasks'
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg transform scale-105'
                      : 'text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                  }`}
                >
                  <ClipboardDocumentListIcon className="w-5 h-5" />
                  Tasks
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Customer Management Section */}
        {currentView === 'customers' && (
          <div>
            <div className="mb-4">
              <div className="flex items-center mb-4">
                <UsersIcon className="h-6 w-6 text-blue-600 dark:text-blue-400 mr-2" />
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{t('customers.title')}</h2>
              </div>
            </div>
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
              <div className="flex-1 max-w-lg">
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search customers, contacts, emails, or phone numbers..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Search by customer name, contact name, email, phone, or title
                </p>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={handleExport}
                  disabled={filteredCustomers.length === 0}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ArrowDownTrayIcon className="h-5 w-5" />
                  Export
                </button>
                
                <button
                  onClick={handleImport}
                  className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 flex items-center gap-2"
                >
                  <ArrowUpTrayIcon className="h-5 w-5" />
                  Import
                </button>
                
                <button
                  onClick={() => setShowAddModal(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center gap-2"
                >
                  <PlusIcon className="h-5 w-5" />
                  {t('action.addCustomer')}
                </button>
              </div>
            </div>

            {/* Customer Grid */}
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm animate-pulse">
                    <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto mb-4"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mx-auto"></div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <p className="text-red-600 dark:text-red-400">{t('error.generic')}</p>
              </div>
            ) : filteredCustomers.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-24 h-24 mx-auto mb-4 text-gray-300 dark:text-gray-600">
                  <svg fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                  {search ? 'No customers found' : t('empty.customers')}
                </h3>
                {!search && (
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
                  >
                    {t('action.addCustomer')}
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredCustomers.map((customer: Customer) => (
                  <CustomerCard 
                    key={customer.id} 
                    customer={customer} 
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tasks Overview Section */}
        {currentView === 'tasks' && (
          <TasksOverview allTasks={allTasks?.data || []} customers={filteredCustomers} isLoading={isTasksLoading} />
        )}
      </main>

      {/* Add Customer Modal */}
      {showAddModal && (
        <CustomerModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
        />
      )}

      {/* Edit Customer Modal */}
      {showEditModal && selectedCustomer && (
        <CustomerModal
          isOpen={showEditModal}
          onClose={handleCloseEditModal}
          customer={selectedCustomer}
        />
      )}
    </div>
  );
}
