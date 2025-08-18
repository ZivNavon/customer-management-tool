'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useTranslation } from 'react-i18next';
import { Customer } from '@/lib/api';
import { PencilIcon, TrashIcon, EnvelopeIcon, PhoneIcon } from '@heroicons/react/24/outline';

interface CustomerCardProps {
  customer: Customer;
  onEdit?: (customer: Customer) => void;
  onDelete?: (customerId: string) => void;
}

export function CustomerCard({ customer, onEdit, onDelete }: CustomerCardProps) {
  const { t } = useTranslation();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return t('Never');
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="group bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-sm hover:shadow-xl hover:shadow-gray-200/40 dark:hover:shadow-gray-900/40 transition-all duration-300 hover:-translate-y-1">
      <Link href={`/customers/${customer.id}`}>
        <div className="p-6 cursor-pointer">
          {/* Logo and Name */}
          <div className="flex items-center mb-6">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mr-4 flex-shrink-0 shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110">
              {customer.logo_url ? (
                <Image
                  src={customer.logo_url}
                  alt={customer.name}
                  width={56}
                  height={56}
                  className="w-14 h-14 rounded-2xl object-cover"
                  onError={(e) => {
                    // Hide the image and show fallback if there's an error
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const parent = target.parentElement;
                    if (parent) {
                      parent.innerHTML = `<span class="text-xl font-bold text-white">${customer.name.charAt(0).toUpperCase()}</span>`;
                    }
                  }}
                />
              ) : (
                <span className="text-xl font-bold text-white">
                  {customer.name.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {customer.name}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Customer since {new Date(customer.created_at || '').getFullYear() || 'Recently'}
              </p>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            {/* ARR */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-4 border border-green-200/50 dark:border-green-700/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-green-600 dark:text-green-400 uppercase tracking-wide">ARR</p>
                  <p className="text-lg font-bold text-green-700 dark:text-green-300">{formatCurrency(customer.arr_usd || 0)}</p>
                </div>
                <div className="w-8 h-8 bg-green-500/10 rounded-lg flex items-center justify-center">
                  <span className="text-green-600 dark:text-green-400">💰</span>
                </div>
              </div>
            </div>

            {/* Meetings */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-4 border border-blue-200/50 dark:border-blue-700/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wide">Meetings</p>
                  <p className="text-lg font-bold text-blue-700 dark:text-blue-300">{customer.meetings_count || 0}</p>
                </div>
                <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center">
                  <span className="text-blue-600 dark:text-blue-400">📅</span>
                </div>
              </div>
            </div>
          </div>

          {/* Last Meeting */}
          <div className="mb-6">
            <div className="bg-gray-50/70 dark:bg-gray-800/50 rounded-xl p-4 border border-gray-200/50 dark:border-gray-700/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">Last Meeting</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {formatDate(customer.last_meeting_date)}
                  </p>
                </div>
                <div className="w-8 h-8 bg-gray-500/10 rounded-lg flex items-center justify-center">
                  <span className="text-gray-600 dark:text-gray-400">🕒</span>
                </div>
              </div>
            </div>
          </div>

          {/* Contacts Preview */}
          {customer.contacts && customer.contacts.length > 0 && (
            <div className="mb-4">
              <span className="text-sm text-gray-500 block mb-2">Primary Contact</span>
              <div className="bg-gray-50 rounded-md p-3 border border-gray-200">
                <div className="font-medium text-gray-900 text-sm">{customer.contacts[0].name}</div>
                <div className="text-sm text-gray-600 mb-2">{customer.contacts[0].title}</div>
                
                {/* Contact Details */}
                <div className="space-y-1">
                  {customer.contacts[0].email && (
                    <div className="flex items-center text-xs">
                      <EnvelopeIcon className="h-3 w-3 mr-2 text-gray-400" />
                      <span className="text-gray-700 truncate" title={customer.contacts[0].email}>
                        {customer.contacts[0].email}
                      </span>
                    </div>
                  )}
                  {customer.contacts[0].phone && (
                    <div className="flex items-center text-xs">
                      <PhoneIcon className="h-3 w-3 mr-2 text-gray-400" />
                      <span className="text-gray-700">
                        {customer.contacts[0].phone}
                      </span>
                    </div>
                  )}
                </div>
                
                {/* Quick Action Buttons */}
                <div className="mt-2 flex space-x-2">
                  {customer.contacts?.[0]?.email && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        window.open(`mailto:${customer.contacts?.[0]?.email}`, '_blank');
                      }}
                      className="flex items-center px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                    >
                      <EnvelopeIcon className="h-3 w-3 mr-1" />
                      Email
                    </button>
                  )}
                  {customer.contacts?.[0]?.phone && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        window.open(`tel:${customer.contacts?.[0]?.phone}`, '_blank');
                      }}
                      className="flex items-center px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                    >
                      <PhoneIcon className="h-3 w-3 mr-1" />
                      Call
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="flex justify-between text-sm text-gray-500">
            <span>{customer.contacts_count || 0} contacts</span>
            <span>{customer.meetings_count || 0} meetings</span>
          </div>
        </div>
      </Link>

      {/* Action buttons */}
      <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 flex justify-end space-x-2">
        <button
          onClick={(e) => {
            e.preventDefault();
            onEdit?.(customer);
          }}
          className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
          title={t('action.edit')}
        >
          <PencilIcon className="h-4 w-4" />
        </button>
        <button
          onClick={(e) => {
            e.preventDefault();
            if (confirm(`Are you sure you want to delete ${customer.name}?`)) {
              onDelete?.(customer.id);
            }
          }}
          className="p-2 text-gray-400 hover:text-red-600 transition-colors"
          title={t('action.delete')}
        >
          <TrashIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
