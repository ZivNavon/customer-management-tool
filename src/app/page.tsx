'use client';

import { useState, useEffect, useMemo } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { customerApi, type Customer } from '@/lib/api';
import { mockApi } from '@/lib/mockApi';
import { CustomerCard } from '@/components/CustomerCard';
import { CustomerModal } from '@/components/CustomerModal';
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
  CurrencyDollarIcon
} from '@heroicons/react/24/outline';

interface CustomerStats {
  totalCustomers: number;
  totalARR: number;
  avgMeetingsPerCustomer: number;
  totalMeetings: number;
  atRiskCustomers: number;
  recentMeetings: number;
}

export default function Home() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | undefined>(undefined);
  const [stats, setStats] = useState<CustomerStats>({
    totalCustomers: 0,
    totalARR: 0,
    avgMeetingsPerCustomer: 0,
    totalMeetings: 0,
    atRiskCustomers: 0,
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

    // Calculate at-risk customers (no meeting in 60+ days or low engagement)
    const atRiskCustomers = customers.filter(customer => {
      const daysSinceLastMeeting = customer.last_meeting_date 
        ? Math.floor((new Date().getTime() - new Date(customer.last_meeting_date).getTime()) / (1000 * 60 * 60 * 24))
        : 999;
      
      return daysSinceLastMeeting > 60 || (customer.meetings_count || 0) < 2;
    }).length;

    setStats({
      totalCustomers,
      totalARR,
      avgMeetingsPerCustomer,
      totalMeetings,
      atRiskCustomers,
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Overview */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <ChartBarIcon className="h-6 w-6 text-blue-600 dark:text-blue-400 mr-2" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Overview</h2>
          </div>
          
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {/* Total Customers */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <UsersIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="ml-3">
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Total Customers</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{stats.totalCustomers}</p>
                </div>
              </div>
            </div>

            {/* Total ARR */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                  <CurrencyDollarIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div className="ml-3">
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Total ARR</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{formatCurrency(stats.totalARR)}</p>
                </div>
              </div>
            </div>

            {/* Total Meetings */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                  <CalendarIcon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="ml-3">
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Total Meetings</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{stats.totalMeetings}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-500">Avg: {stats.avgMeetingsPerCustomer}</p>
                </div>
              </div>
            </div>

            {/* At Risk Customers */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center">
                <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
                  <ExclamationTriangleIcon className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
                <div className="ml-3">
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-400">At Risk</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{stats.atRiskCustomers}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-500">{stats.recentMeetings} recent</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Customer Management Section */}
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
