'use client';

import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useParams, useRouter } from 'next/navigation';
import { customerApi, meetingApi, type Customer } from '@/lib/api';
import { mockApi } from '@/lib/mockApi';
import { Header } from '@/components/Header';
import { MeetingModal } from '@/components/MeetingModal';
import { MeetingCard } from '@/components/MeetingCard';
import { ContactsModal } from '@/components/ContactsModal';
import { 
  PlusIcon, 
  ArrowLeftIcon, 
  CalendarIcon, 
  UserGroupIcon,
  PhoneIcon,
  EnvelopeIcon
} from '@heroicons/react/24/outline';

export default function CustomerDetailPage() {
  const { t } = useTranslation();
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const customerId = params.id as string;

  const [showMeetingModal, setShowMeetingModal] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<any>(undefined);
  const [showEditMeeting, setShowEditMeeting] = useState(false);
  const [showContactsModal, setShowContactsModal] = useState(false);

  // Fetch customer data
  const { data: customer, isLoading: customerLoading } = useQuery({
    queryKey: ['customer', customerId],
    queryFn: async () => {
      try {
        return await customerApi.getById(customerId);
      } catch (error) {
        console.log('Backend not available, using mock data');
        return await mockApi.customers.getById(customerId);
      }
    },
  });

  // Fetch customer meetings
  const { data: meetings, isLoading: meetingsLoading } = useQuery({
    queryKey: ['meetings', customerId],
    queryFn: async () => {
      try {
        return await meetingApi.getByCustomer(customerId);
      } catch (error) {
        console.log('Backend not available, using mock data');
        return await mockApi.meetings.getByCustomer(customerId);
      }
    },
  });

  const customerData = customer?.data;
  const meetingsData = meetings?.data || [];

  const handleEditMeeting = (meeting: any) => {
    setSelectedMeeting(meeting);
    setShowEditMeeting(true);
  };

  const handleCloseEditModal = () => {
    setShowEditMeeting(false);
    setSelectedMeeting(undefined);
  };

  if (customerLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
            <div className="h-32 bg-gray-200 rounded mb-6"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!customerData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Customer not found</h2>
            <button
              onClick={() => router.push('/')}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Back to customers
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <button
          onClick={() => router.push('/')}
          className="mb-6 flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeftIcon className="h-5 w-5 mr-2" />
          Back to customers
        </button>

        {/* Customer Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex items-start justify-between">
            <div className="flex items-center">
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mr-4">
                {customerData.logo_url ? (
                  <img
                    src={customerData.logo_url}
                    alt={customerData.name}
                    className="w-16 h-16 rounded-full object-cover"
                    onError={(e) => {
                      // Hide the image and show fallback if there's an error
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const parent = target.parentElement;
                      if (parent) {
                        parent.innerHTML = `<span class="text-2xl font-semibold text-gray-600">${customerData.name.charAt(0).toUpperCase()}</span>`;
                      }
                    }}
                  />
                ) : (
                  <span className="text-2xl font-semibold text-gray-600">
                    {customerData.name.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{customerData.name}</h1>
                <div className="flex items-center space-x-6 text-sm text-gray-600">
                  <span className="flex items-center">
                    <CalendarIcon className="h-4 w-4 mr-1" />
                    ARR: ${customerData.arr_usd.toLocaleString()}
                  </span>
                  <span className="flex items-center">
                    <UserGroupIcon className="h-4 w-4 mr-1" />
                    {customerData.contacts?.length || 0} contacts
                  </span>
                  <span className="flex items-center">
                    <CalendarIcon className="h-4 w-4 mr-1" />
                    {meetingsData.length} meetings
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Contacts Preview */}
          {customerData.contacts && customerData.contacts.length > 0 && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Key Contacts</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {customerData.contacts.slice(0, 6).map((contact: any, index: number) => (
                  <div key={index} className="bg-gray-50 rounded-md p-4 border border-gray-200">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 text-sm">{contact.name}</div>
                        <div className="text-sm text-gray-600">{contact.title}</div>
                      </div>
                    </div>
                    
                    {/* Contact Information */}
                    <div className="space-y-2">
                      {contact.email && (
                        <div className="flex items-center text-xs">
                          <EnvelopeIcon className="h-3 w-3 mr-2 text-gray-400 flex-shrink-0" />
                          <a
                            href={`mailto:${contact.email}`}
                            className="text-blue-600 hover:text-blue-700 hover:underline truncate"
                            title={contact.email}
                          >
                            {contact.email}
                          </a>
                        </div>
                      )}
                      {contact.phone && (
                        <div className="flex items-center text-xs">
                          <PhoneIcon className="h-3 w-3 mr-2 text-gray-400 flex-shrink-0" />
                          <a
                            href={`tel:${contact.phone}`}
                            className="text-green-600 hover:text-green-700 hover:underline"
                            title={contact.phone}
                          >
                            {contact.phone}
                          </a>
                        </div>
                      )}
                      {!contact.email && !contact.phone && (
                        <div className="text-xs text-gray-400 italic">
                          No contact info available
                        </div>
                      )}
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="mt-3 pt-2 border-t border-gray-200 flex space-x-2">
                      {contact.email && (
                        <button
                          onClick={() => window.open(`mailto:${contact.email}`, '_blank')}
                          className="flex-1 flex items-center justify-center px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
                        >
                          <EnvelopeIcon className="h-3 w-3 mr-1" />
                          Email
                        </button>
                      )}
                      {contact.phone && (
                        <button
                          onClick={() => window.open(`tel:${contact.phone}`, '_blank')}
                          className="flex-1 flex items-center justify-center px-2 py-1 text-xs bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors"
                        >
                          <PhoneIcon className="h-3 w-3 mr-1" />
                          Call
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Show all contacts button if there are more than 6 */}
              {customerData.contacts.length > 6 && (
                <div className="mt-4 text-center">
                  <button 
                    onClick={() => setShowContactsModal(true)}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    View all {customerData.contacts.length} contacts
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Customer Notes */}
          {customerData.notes && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Notes</h3>
              <p className="text-gray-600">{customerData.notes}</p>
            </div>
          )}
        </div>

        {/* Meetings Section */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">Meetings</h2>
              <button
                onClick={() => setShowMeetingModal(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center gap-2"
              >
                <PlusIcon className="h-5 w-5" />
                Add Meeting
              </button>
            </div>
          </div>

          {/* Meetings List */}
          <div className="p-6">
            {meetingsLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="bg-gray-100 rounded-lg p-4 animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : meetingsData.length === 0 ? (
              <div className="text-center py-12">
                <CalendarIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No meetings yet</h3>
                <p className="text-gray-600 mb-4">Get started by adding your first meeting with this customer.</p>
                <button
                  onClick={() => setShowMeetingModal(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  Add First Meeting
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {meetingsData.map((meeting: any) => (
                  <MeetingCard
                    key={meeting.id}
                    meeting={meeting}
                    onEdit={handleEditMeeting}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Add Meeting Modal */}
      {showMeetingModal && (
        <MeetingModal
          isOpen={showMeetingModal}
          onClose={() => setShowMeetingModal(false)}
          customerId={customerId}
          customerName={customerData.name}
        />
      )}

      {/* Edit Meeting Modal */}
      {showEditMeeting && selectedMeeting && (
        <MeetingModal
          isOpen={showEditMeeting}
          onClose={handleCloseEditModal}
          customerId={customerId}
          customerName={customerData.name}
          meeting={selectedMeeting}
        />
      )}

      {/* Contacts Modal */}
      {showContactsModal && (
        <ContactsModal
          isOpen={showContactsModal}
          onClose={() => setShowContactsModal(false)}
          contacts={customerData.contacts || []}
          customerName={customerData.name}
        />
      )}
    </div>
  );
}
