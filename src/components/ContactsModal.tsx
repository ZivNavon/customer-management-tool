'use client';

import React from 'react';
import {
  XMarkIcon,
  EnvelopeIcon,
  PhoneIcon,
  UserIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline';

interface Contact {
  id?: string;
  name: string;
  title: string;
  email: string;
  phone: string;
  notes?: string;
}

interface ContactsModalProps {
  isOpen: boolean;
  onClose: () => void;
  contacts: Contact[];
  customerName: string;
}

export function ContactsModal({ isOpen, onClose, contacts, customerName }: ContactsModalProps) {
  if (!isOpen) return null;

  const handleEmailAll = () => {
    const emails = contacts
      .filter(contact => contact.email)
      .map(contact => contact.email)
      .join(',');
    
    if (emails) {
      window.open(`mailto:${emails}?subject=Meeting with ${customerName}`, '_blank');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <BuildingOfficeIcon className="h-6 w-6 text-gray-600 mr-2" />
              <h2 className="text-xl font-semibold text-gray-900">
                {customerName} Contacts ({contacts.length})
              </h2>
            </div>
            <div className="flex items-center space-x-3">
              {contacts.some(c => c.email) && (
                <button
                  onClick={handleEmailAll}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                >
                  <EnvelopeIcon className="h-4 w-4 mr-2" />
                  Email All
                </button>
              )}
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>

        {/* Contacts List */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {contacts.map((contact, index) => (
              <div key={contact.id || index} className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow">
                {/* Contact Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                      <UserIcon className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{contact.name}</h3>
                      <p className="text-sm text-gray-600">{contact.title}</p>
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="space-y-3">
                  {contact.email && (
                    <div className="flex items-start">
                      <EnvelopeIcon className="h-4 w-4 text-gray-400 mr-3 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <a
                          href={`mailto:${contact.email}`}
                          className="text-blue-600 hover:text-blue-700 hover:underline text-sm break-all"
                          title={contact.email}
                        >
                          {contact.email}
                        </a>
                      </div>
                    </div>
                  )}

                  {contact.phone && (
                    <div className="flex items-center">
                      <PhoneIcon className="h-4 w-4 text-gray-400 mr-3 flex-shrink-0" />
                      <a
                        href={`tel:${contact.phone}`}
                        className="text-green-600 hover:text-green-700 hover:underline text-sm"
                        title={contact.phone}
                      >
                        {contact.phone}
                      </a>
                    </div>
                  )}

                  {contact.notes && (
                    <div className="pt-2 border-t border-gray-200">
                      <p className="text-sm text-gray-600 italic">{contact.notes}</p>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="mt-4 flex space-x-2">
                  {contact.email && (
                    <button
                      onClick={() => window.open(`mailto:${contact.email}?subject=Meeting with ${customerName}`, '_blank')}
                      className="flex-1 flex items-center justify-center px-3 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors text-sm"
                    >
                      <EnvelopeIcon className="h-4 w-4 mr-1" />
                      Email
                    </button>
                  )}
                  {contact.phone && (
                    <button
                      onClick={() => window.open(`tel:${contact.phone}`, '_blank')}
                      className="flex-1 flex items-center justify-center px-3 py-2 bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors text-sm"
                    >
                      <PhoneIcon className="h-4 w-4 mr-1" />
                      Call
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Empty State */}
          {contacts.length === 0 && (
            <div className="text-center py-12">
              <UserIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No contacts found</h3>
              <p className="text-gray-600">No contacts have been added for this customer yet.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
          <div className="flex justify-between items-center text-sm text-gray-600">
            <span>
              {contacts.length} contact{contacts.length !== 1 ? 's' : ''} • 
              {contacts.filter(c => c.email).length} with email • 
              {contacts.filter(c => c.phone).length} with phone
            </span>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
