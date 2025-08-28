'use client';

import { useState, useEffect } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useParams, useRouter } from 'next/navigation';
import { customerApi, meetingApi } from '@/lib/api';
import { mockApi } from '@/lib/mockApi';
import { Header } from '@/components/Header';
import { MeetingModal } from '@/components/MeetingModal';
import { MeetingCard } from '@/components/MeetingCard';
import { ContactsModal } from '@/components/ContactsModal';
import TaskModal from '@/components/TaskModal';
import TaskCard from '@/components/TaskCard';
import SimpleTasks from '@/components/SimpleTasks';
import type { Meeting, Customer, Task } from '@/types';
import { 
  PlusIcon, 
  ArrowLeftIcon, 
  CalendarIcon, 
  UserGroupIcon,
  PhoneIcon,
  EnvelopeIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

export default function CustomerDetailPage() {
  const { t: _t } = useTranslation();
  const params = useParams();
  const router = useRouter();
  const _queryClient = useQueryClient();
  const customerId = params.id as string;

  const [showMeetingModal, setShowMeetingModal] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | undefined>(undefined);
  const [showEditMeeting, setShowEditMeeting] = useState(false);
  const [showContactsModal, setShowContactsModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [logoLoadError, setLogoLoadError] = useState(false);

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

  // Fetch customer tasks
  const { data: tasks, isLoading: tasksLoading } = useQuery({
    queryKey: ['tasks', customerId],
    queryFn: async () => {
      try {
        return await mockApi.tasks.getByCustomer(customerId);
      } catch (error) {
        console.log('Error fetching tasks:', error);
        return { data: [] };
      }
    },
  });

  const customerData = customer?.data;
  const meetingsData = meetings?.data || [];
  const tasksData = tasks?.data || [];

  // Mutation for updating customer satisfaction status
  const updateSatisfactionMutation = useMutation({
    mutationFn: async ({ customerId, field, value }: { customerId: string; field: 'is_satisfied' | 'is_at_risk'; value: boolean }) => {
      try {
        const updatedCustomer = await customerApi.update(customerId, { [field]: value });
        return updatedCustomer;
      } catch (error) {
        console.log('Backend not available, using mock data');
        return await mockApi.customers.update(customerId, { [field]: value });
      }
    },
    // Optimistic update for faster UI response
    onMutate: async ({ customerId, field, value }) => {
      // Cancel any outgoing refetches
      await _queryClient.cancelQueries({ queryKey: ['customer', customerId] });
      
      // Snapshot the previous value
      const previousCustomer = _queryClient.getQueryData(['customer', customerId]);
      
      // Optimistically update to the new value
      _queryClient.setQueryData(['customer', customerId], (old: any) => {
        if (old?.data) {
          return {
            ...old,
            data: {
              ...old.data,
              [field]: value
            }
          };
        }
        return old;
      });
      
      return { previousCustomer };
    },
    onError: (err, variables, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousCustomer) {
        _queryClient.setQueryData(['customer', customerId], context.previousCustomer);
      }
    },
    onSuccess: () => {
      // Invalidate all customer-related queries to update dashboard and other components
      _queryClient.invalidateQueries({ 
        predicate: (query) => query.queryKey[0] === 'customers' 
      });
    },
  });

  const handleSatisfactionChange = (field: 'is_satisfied' | 'is_at_risk', checked: boolean) => {
    if (customerId) {
      updateSatisfactionMutation.mutate({ 
        customerId, 
        field, 
        value: checked 
      });
    }
  };

  // Task mutations
  const createTaskMutation = useMutation({
    mutationFn: async (taskData: Omit<Task, 'id' | 'created_at' | 'updated_at'>) => {
      return await mockApi.tasks.create(taskData);
    },
    onSuccess: () => {
      _queryClient.invalidateQueries({ queryKey: ['tasks', customerId] });
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Omit<Task, 'id' | 'created_at'>> }) => {
      return await mockApi.tasks.update(id, updates);
    },
    onSuccess: () => {
      _queryClient.invalidateQueries({ queryKey: ['tasks', customerId] });
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      return await mockApi.tasks.delete(taskId);
    },
    onSuccess: () => {
      _queryClient.invalidateQueries({ queryKey: ['tasks', customerId] });
    },
  });

  // Task handlers
  const handleTaskSave = (taskData: Omit<Task, 'id' | 'created_at' | 'updated_at'>) => {
    if (selectedTask) {
      updateTaskMutation.mutate({ id: selectedTask.id, updates: taskData });
    } else {
      createTaskMutation.mutate(taskData);
    }
  };

  const handleSimpleTaskCreate = (title: string, dueDate?: string) => {
    const taskData = {
      title,
      description: '',
      due_date: dueDate,
      priority: 'medium' as const,
      status: 'pending' as const,
      customer_id: customerId,
      source: 'manual' as const
    };
    createTaskMutation.mutate(taskData);
  };

  const handleTaskEdit = (task: Task) => {
    setSelectedTask(task);
    setShowTaskModal(true);
  };

  const handleTaskDelete = (taskId: string) => {
    if (confirm('Are you sure you want to delete this task?')) {
      deleteTaskMutation.mutate(taskId);
    }
  };

  const handleTaskUpdate = (taskId: string, updates: Partial<Omit<Task, 'id' | 'created_at'>>) => {
    updateTaskMutation.mutate({ id: taskId, updates });
  };

  const handleTaskStatusChange = (taskId: string, status: Task['status']) => {
    updateTaskMutation.mutate({ 
      id: taskId, 
      updates: { 
        status,
        ...(status === 'completed' ? { completed_at: new Date().toISOString() } : {})
      } 
    });
  };

  const handleSimpleTaskComplete = (taskId: string) => {
    const task = tasksData.find(t => t.id === taskId);
    if (task) {
      const newStatus = task.status === 'completed' ? 'pending' : 'completed';
      handleTaskStatusChange(taskId, newStatus);
    }
  };

  const handleTaskModalClose = () => {
    setShowTaskModal(false);
    setSelectedTask(null);
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

  const handleEditMeeting = (meeting: Meeting) => {
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
              <div className="relative w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mr-4">
                {/* Status Ribbon on Logo */}
                {customerData.is_at_risk && (
                  <div className="absolute -top-1 -right-1 w-8 h-8 bg-gradient-to-br from-red-500 to-red-600 rounded-full shadow-lg flex items-center justify-center z-10 transform rotate-12">
                    <span className="text-white text-sm font-bold">!</span>
                  </div>
                )}
                
                {customerData.is_satisfied && !customerData.is_at_risk && (
                  <div className="absolute -top-1 -right-1 w-8 h-8 bg-gradient-to-br from-emerald-500 to-green-600 rounded-full shadow-lg flex items-center justify-center z-10 transform -rotate-12">
                    <span className="text-white text-sm font-bold">✓</span>
                  </div>
                )}
                
                {/* Renewal Warning Indicator - appears on left side */}
                {(isRenewalDueSoon(customerData.renewal_date) || isRenewalExpired(customerData.renewal_date)) && (
                  <div className={`absolute -top-1 -left-1 w-8 h-8 rounded-full shadow-lg flex items-center justify-center z-10 transform -rotate-12 ${
                    isRenewalExpired(customerData.renewal_date)
                      ? 'bg-gradient-to-br from-red-500 to-red-600'
                      : 'bg-gradient-to-br from-amber-500 to-orange-600'
                  }`}>
                    <CalendarIcon className="h-4 w-4 text-white" />
                  </div>
                )}
                
                {customerData.logo_url && !logoLoadError ? (
                  <img
                    src={customerData.logo_url}
                    alt={customerData.name}
                    className="w-16 h-16 rounded-full object-cover"
                    onError={() => setLogoLoadError(true)}
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
                  <span className="flex items-center">
                    <ClockIcon className="h-4 w-4 mr-1" />
                    {tasksData.length} tasks
                  </span>
                  {customerData.renewal_date && (
                    <span className={`flex items-center ${
                      isRenewalExpired(customerData.renewal_date) 
                        ? 'text-red-600 font-medium' 
                        : isRenewalDueSoon(customerData.renewal_date) 
                        ? 'text-amber-600 font-medium' 
                        : ''
                    }`}>
                      <CalendarIcon className="h-4 w-4 mr-1" />
                      Renewal: {new Date(customerData.renewal_date).toLocaleDateString()}
                      {isRenewalExpired(customerData.renewal_date) && (
                        <span className="ml-1 text-red-600">❌ EXPIRED</span>
                      )}
                      {isRenewalDueSoon(customerData.renewal_date) && !isRenewalExpired(customerData.renewal_date) && (
                        <span className="ml-1 text-amber-600">⚠️</span>
                      )}
                    </span>
                  )}
                </div>
                
                {/* Satisfaction Controls and Notes */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
                  {/* Satisfaction Controls */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Customer Status</label>
                    <div className="flex items-center space-x-6">
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={customerData.is_at_risk || false}
                          onChange={(e) => handleSatisfactionChange('is_at_risk', e.target.checked)}
                          className="w-4 h-4 text-red-600 bg-gray-100 border-gray-300 rounded focus:ring-red-500 focus:ring-2"
                        />
                        <span className="text-sm font-medium text-red-600">At Risk</span>
                      </label>
                      
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={customerData.is_satisfied || false}
                          onChange={(e) => handleSatisfactionChange('is_satisfied', e.target.checked)}
                          className="w-4 h-4 text-emerald-600 bg-gray-100 border-gray-300 rounded focus:ring-emerald-500 focus:ring-2"
                        />
                        <span className="text-sm font-medium text-emerald-600">Satisfied</span>
                      </label>
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Notes</label>
                    <p className="text-sm text-gray-600 bg-gray-50 rounded-md p-3 min-h-[2.5rem]">
                      {customerData.notes || 'No notes added yet...'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Contacts Preview */}
          {customerData.contacts && customerData.contacts.length > 0 && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Key Contacts</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {customerData.contacts.slice(0, 6).map((contact: NonNullable<Customer['contacts']>[number], index: number) => (
                  <div key={index} className="bg-gray-50 rounded-md p-4 border border-gray-200">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 text-sm">{contact.name}</div>
                        <div className="text-sm text-gray-600">{contact.role}</div>
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
        </div>

        {/* Tasks Section */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-visible border border-gray-200 dark:border-gray-600 min-h-[400px]">
          {/* Tasks List */}
          <div className="p-6 overflow-visible">
            <SimpleTasks
              tasks={tasksData || []}
              onTaskCreate={handleSimpleTaskCreate}
              onTaskEdit={handleTaskEdit}
              onTaskDelete={handleTaskDelete}
              onTaskComplete={handleSimpleTaskComplete}
              onTaskUpdate={handleTaskUpdate}
            />
          </div>
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
                {meetingsData.map((meeting: Meeting) => (
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

      {/* Task Modal */}
      {showTaskModal && (
        <TaskModal
          isOpen={showTaskModal}
          onClose={handleTaskModalClose}
          onSave={handleTaskSave}
          customerId={customerId}
          task={selectedTask}
          title={selectedTask ? 'Edit Task' : 'Add Task'}
        />
      )}
    </div>
  );
}
