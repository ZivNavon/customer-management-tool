'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { customerApi, type Customer } from '@/lib/api';
import { CustomerCard } from '@/components/CustomerCard';
import { CustomerModal } from '@/components/CustomerModal';
import { Header } from '@/components/Header';
import { PlusIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

export default function Home() {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  const { data: customers, isLoading, error } = useQuery({
    queryKey: ['customers', search],
    queryFn: () => customerApi.getAll({ search: search || undefined }),
  });

  const filteredCustomers = customers?.data || [];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div className="flex-1 max-w-lg">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder={t('Search customers...')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center gap-2"
          >
            <PlusIcon className="h-5 w-5" />
            {t('action.addCustomer')}
          </button>
        </div>

        {/* Customer Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-white rounded-lg p-6 shadow-sm animate-pulse">
                <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-4"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2 mx-auto"></div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-600">{t('error.generic')}</p>
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-24 h-24 mx-auto mb-4 text-gray-300">
              <svg fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {search ? 'No customers found' : t('empty.customers')}
            </h3>
            {!search && (
              <button
                onClick={() => setShowAddModal(true)}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                {t('action.addCustomer')}
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredCustomers.map((customer: Customer) => (
              <CustomerCard key={customer.id} customer={customer} />
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
    </div>
  );
}
