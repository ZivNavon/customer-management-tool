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
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md dark:hover:shadow-gray-700/50 transition-shadow duration-200">
      <Link href={`/customers/${customer.id}`}>
        <div className="p-6 cursor-pointer">
          {/* Logo and Name */}
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
              {customer.logo_url ? (
                <Image
                  src={customer.logo_url}
                  alt={customer.name}
                  width={48}
                  height={48}
                  className="w-12 h-12 rounded-full object-cover"
                  onError={(e) => {
                    // Hide the image and show fallback if there's an error
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const parent = target.parentElement;
                    if (parent) {
                      parent.innerHTML = `<span class="text-lg font-semibold text-gray-600 dark:text-gray-300">${customer.name.charAt(0).toUpperCase()}</span>`;
                    }
                  }}
                />
              ) : (
                <span className="text-lg font-semibold text-gray-600 dark:text-gray-300">
                  {customer.name.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 truncate">
                {customer.name}
              </h3>
            </div>
          </div>

          {/* ARR */}
          <div className="mb-3">
            <span className="text-sm text-gray-500 dark:text-gray-400">{t('customer.arr')}</span>
            <div className="text-lg font-semibold text-green-600 dark:text-green-400">
              {formatCurrency(customer.arr_usd)}
            </div>
          </div>

          {/* Last Meeting */}
          <div className="mb-4">
            <span className="text-sm text-gray-500 dark:text-gray-400">{t('customer.lastMeeting')}</span>
            <div className="text-sm text-gray-900 dark:text-gray-100">
              {formatDate(customer.last_meeting_date)}
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
                  {customer.contacts[0].email && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        window.open(`mailto:${customer.contacts[0].email}`, '_blank');
                      }}
                      className="flex items-center px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                    >
                      <EnvelopeIcon className="h-3 w-3 mr-1" />
                      Email
                    </button>
                  )}
                  {customer.contacts[0].phone && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        window.open(`tel:${customer.contacts[0].phone}`, '_blank');
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
