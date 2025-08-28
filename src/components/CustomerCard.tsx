'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Customer } from '@/lib/api';
import { PencilIcon, TrashIcon, EnvelopeIcon, PhoneIcon, CalendarIcon } from '@heroicons/react/24/outline';

interface CustomerCardProps {
  customer: Customer;
  onEdit?: (customer: Customer) => void;
  onDelete?: (customerId: string) => void;
}

export function CustomerCard({ customer, onEdit, onDelete }: CustomerCardProps) {
  const { t } = useTranslation();
  const [logoLoadError, setLogoLoadError] = useState(false);

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

  // Check if renewal is within 6 months (182 days)
  const isRenewalDueSoon = (renewalDate?: string) => {
    if (!renewalDate) return false;
    
    const today = new Date();
    const renewal = new Date(renewalDate);
    const sixMonthsFromNow = new Date();
    sixMonthsFromNow.setMonth(today.getMonth() + 6);
    
    return renewal <= sixMonthsFromNow && renewal >= today;
  };

  // Check if renewal date has passed
  const isRenewalExpired = (renewalDate?: string) => {
    if (!renewalDate) return false;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to start of day for accurate comparison
    const renewal = new Date(renewalDate);
    renewal.setHours(0, 0, 0, 0);
    
    return renewal < today;
  };

  // Get renewal status styling
  const getRenewalStatus = (renewalDate?: string) => {
    if (!renewalDate) return null;
    
    if (isRenewalExpired(renewalDate)) {
      return {
        containerClass: 'bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border-red-200/50 dark:border-red-700/50',
        textClass: 'text-red-600 dark:text-red-400',
        valueClass: 'text-red-900 dark:text-red-100',
        iconClass: 'bg-red-500/10',
        iconColorClass: 'text-red-600 dark:text-red-400'
      };
    }
    
    if (isRenewalDueSoon(renewalDate)) {
      return {
        containerClass: 'bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-amber-200/50 dark:border-amber-700/50',
        textClass: 'text-amber-600 dark:text-amber-400',
        valueClass: 'text-amber-900 dark:text-amber-100',
        iconClass: 'bg-amber-500/10',
        iconColorClass: 'text-amber-600 dark:text-amber-400'
      };
    }
    
    return {
      containerClass: 'bg-gray-50/70 dark:bg-gray-800/50 border-gray-200/50 dark:border-gray-700/50',
      textClass: 'text-gray-600 dark:text-gray-400',
      valueClass: 'text-gray-900 dark:text-gray-100',
      iconClass: 'bg-gray-500/10',
      iconColorClass: 'text-gray-600 dark:text-gray-400'
    };
  };

  // Check if last meeting is more than 3 months old
  const isMeetingOverdue3Months = (meetingDate?: string) => {
    if (!meetingDate) return true; // No meeting date means overdue
    
    const today = new Date();
    const meeting = new Date(meetingDate);
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(today.getMonth() - 3);
    
    return meeting <= threeMonthsAgo;
  };

  // Check if last meeting is more than 6 months old
  const isMeetingOverdue6Months = (meetingDate?: string) => {
    if (!meetingDate) return true; // No meeting date means severely overdue
    
    const today = new Date();
    const meeting = new Date(meetingDate);
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(today.getMonth() - 6);
    
    return meeting <= sixMonthsAgo;
  };

  // Get meeting status styling
  const getMeetingStatus = (meetingDate?: string) => {
    if (isMeetingOverdue6Months(meetingDate)) {
      return {
        containerClass: 'bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border-red-200/50 dark:border-red-700/50',
        textClass: 'text-red-600 dark:text-red-400',
        valueClass: 'text-red-900 dark:text-red-100',
        iconClass: 'bg-red-500/10',
        iconColorClass: 'text-red-600 dark:text-red-400'
      };
    }
    
    if (isMeetingOverdue3Months(meetingDate)) {
      return {
        containerClass: 'bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 border-orange-200/50 dark:border-orange-700/50',
        textClass: 'text-orange-600 dark:text-orange-400',
        valueClass: 'text-orange-900 dark:text-orange-100',
        iconClass: 'bg-orange-500/10',
        iconColorClass: 'text-orange-600 dark:text-orange-400'
      };
    }
    
    return {
      containerClass: 'bg-gray-50/70 dark:bg-gray-800/50 border-gray-200/50 dark:border-gray-700/50',
      textClass: 'text-gray-600 dark:text-gray-400',
      valueClass: 'text-gray-900 dark:text-gray-100',
      iconClass: 'bg-gray-500/10',
      iconColorClass: 'text-gray-600 dark:text-gray-400'
    };
  };

  return (
    <div className="group bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-sm hover:shadow-xl hover:shadow-gray-200/40 dark:hover:shadow-gray-900/40 transition-all duration-300 hover:-translate-y-1">
      <Link href={`/customers/${customer.id}`}>
        <div className="p-6 cursor-pointer">
          {/* Logo and Name */}
          <div className="flex items-center mb-6">
            <div className="relative w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mr-4 flex-shrink-0 shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110">
              {/* Status Ribbon on Logo */}
              {customer.is_at_risk && (
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-br from-red-500 to-red-600 rounded-full shadow-lg flex items-center justify-center z-10 transform rotate-12">
                  <span className="text-white text-xs font-bold">!</span>
                </div>
              )}
              
              {customer.is_satisfied && !customer.is_at_risk && (
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-br from-emerald-500 to-green-600 rounded-full shadow-lg flex items-center justify-center z-10 transform -rotate-12">
                  <span className="text-white text-xs font-bold">✓</span>
                </div>
              )}
              
              {/* Renewal Warning Indicator - appears on left side */}
              {(isRenewalDueSoon(customer.renewal_date) || isRenewalExpired(customer.renewal_date)) && (
                <div className={`absolute -top-1 -left-1 w-6 h-6 rounded-full shadow-lg flex items-center justify-center z-10 transform -rotate-12 ${
                  isRenewalExpired(customer.renewal_date)
                    ? 'bg-gradient-to-br from-red-500 to-red-600'
                    : 'bg-gradient-to-br from-amber-500 to-orange-600'
                }`}>
                  <CalendarIcon className="h-3 w-3 text-white" />
                </div>
              )}
              
              {customer.logo_url && !logoLoadError ? (
                <Image
                  src={customer.logo_url}
                  alt={customer.name}
                  width={56}
                  height={56}
                  className="w-14 h-14 rounded-2xl object-cover"
                  onError={() => setLogoLoadError(true)}
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
            <div className={`rounded-xl p-4 border h-16 ${getMeetingStatus(customer.last_meeting_date)?.containerClass}`}>
              <div className="flex items-center justify-between h-full">
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-medium uppercase tracking-wide ${getMeetingStatus(customer.last_meeting_date)?.textClass} truncate`}>
                    {isMeetingOverdue6Months(customer.last_meeting_date) 
                      ? 'MEETING OVERDUE' 
                      : isMeetingOverdue3Months(customer.last_meeting_date) 
                      ? 'MEETING DUE' 
                      : 'LAST MEETING'
                    }
                  </p>
                  <p className={`text-sm font-medium ${getMeetingStatus(customer.last_meeting_date)?.valueClass} truncate`}>
                    {formatDate(customer.last_meeting_date)}
                  </p>
                </div>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ml-2 ${getMeetingStatus(customer.last_meeting_date)?.iconClass}`}>
                  <span className={`text-sm ${getMeetingStatus(customer.last_meeting_date)?.iconColorClass}`}>🕒</span>
                </div>
              </div>
            </div>
          </div>

          {/* Renewal Date */}
          {customer.renewal_date && (
            <div className="mb-6">
              <div className={`rounded-xl p-4 border h-16 ${getRenewalStatus(customer.renewal_date)?.containerClass}`}>
                <div className="flex items-center justify-between h-full">
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-medium uppercase tracking-wide ${getRenewalStatus(customer.renewal_date)?.textClass} truncate`}>
                      {isRenewalExpired(customer.renewal_date) 
                        ? 'EXPIRED' 
                        : isRenewalDueSoon(customer.renewal_date) 
                        ? 'DUE SOON' 
                        : 'RENEWAL DATE'
                      }
                    </p>
                    <p className={`text-sm font-medium ${getRenewalStatus(customer.renewal_date)?.valueClass} truncate`}>
                      {formatDate(customer.renewal_date)}
                    </p>
                  </div>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ml-2 ${getRenewalStatus(customer.renewal_date)?.iconClass}`}>
                    <CalendarIcon className={`h-4 w-4 ${getRenewalStatus(customer.renewal_date)?.iconColorClass}`} />
                  </div>
                </div>
              </div>
            </div>
          )}

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
      <div className="px-6 py-3 bg-gray-50/70 dark:bg-gray-800/50 border-t border-gray-200/50 dark:border-gray-700/50">
        <div className="flex justify-end items-center">
          {/* Edit/Delete Actions */}
          <div className="flex space-x-2">
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
      </div>
    </div>
  );
}
