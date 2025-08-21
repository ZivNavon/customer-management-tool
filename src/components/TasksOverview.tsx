'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { mockApi } from '@/lib/mockApi';
import { Task } from '@/types';
import { Customer } from '@/lib/api';
import { 
  ClipboardDocumentListIcon,
  UserIcon,
  CalendarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  ChevronRightIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';

interface TasksOverviewProps {
  allTasks: Task[];
  customers: Customer[];
  isLoading: boolean;
}

interface CustomerWithTasks {
  customer: Customer;
  activeTasks: Task[];
  completedTasks: Task[];
  overdueTasks: Task[];
}

export default function TasksOverview({ allTasks, customers, isLoading }: TasksOverviewProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [searchTasks, setSearchTasks] = useState('');
  const [completingTaskIds, setCompletingTaskIds] = useState<Set<string>>(new Set());
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  // Task completion mutation
  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Omit<Task, 'id' | 'created_at'>> }) => {
      return await mockApi.tasks.update(id, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-tasks'] });
      // Refresh customers data to update task counts
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });

  // Handle task completion
  const handleTaskComplete = (e: React.MouseEvent, taskId: string) => {
    e.stopPropagation(); // Prevent navigation to customer page
    
    // Add task to completing set
    setCompletingTaskIds(prev => new Set(prev).add(taskId));
    
    updateTaskMutation.mutate({ 
      id: taskId, 
      updates: { 
        status: 'completed',
        completed_at: new Date().toISOString()
      } 
    }, {
      onSettled: () => {
        // Remove task from completing set when done
        setCompletingTaskIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(taskId);
          return newSet;
        });
      }
    });
  };

  // Handle priority update
  const handlePriorityChange = (taskId: string, newPriority: 'low' | 'medium' | 'high') => {
    updateTaskMutation.mutate({ 
      id: taskId, 
      updates: { priority: newPriority } 
    });
    setOpenDropdownId(null); // Close dropdown after selection
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setOpenDropdownId(null);
    };

    if (openDropdownId) {
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [openDropdownId]);

  // Priority order for sorting (higher number = higher priority)
  const getPriorityOrder = (priority: string) => {
    switch (priority) {
      case 'high': return 3;
      case 'medium': return 2;
      case 'low': return 1;
      default: return 0;
    }
  };

  // Group tasks by customer
  const customersWithTasks: CustomerWithTasks[] = customers
    .map(customer => {
      const customerTasks = allTasks.filter(task => task.customer_id === customer.id);
      
      // Sort active tasks by: 1) overdue first, 2) then by priority (high to low), 3) then by due date
      const activeTasks = customerTasks
        .filter(task => task.status !== 'completed')
        .sort((a, b) => {
          // First check if tasks are overdue (overdue tasks always come first)
          const aOverdue = a.due_date && new Date(a.due_date) < new Date();
          const bOverdue = b.due_date && new Date(b.due_date) < new Date();
          if (aOverdue && !bOverdue) return -1;
          if (!aOverdue && bOverdue) return 1;
          
          // Then sort by priority (high to low)
          const priorityDiff = getPriorityOrder(b.priority) - getPriorityOrder(a.priority);
          if (priorityDiff !== 0) return priorityDiff;
          
          // Then by due date (earliest first)
          if (a.due_date && b.due_date) {
            return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
          }
          if (a.due_date && !b.due_date) return -1;
          if (!a.due_date && b.due_date) return 1;
          
          // Finally by creation date (newest first)
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });
      
      const completedTasks = customerTasks.filter(task => task.status === 'completed');
      const overdueTasks = activeTasks.filter(task => {
        if (!task.due_date) return false;
        return new Date(task.due_date) < new Date() && new Date(task.due_date).toDateString() !== new Date().toDateString();
      });

      return {
        customer,
        activeTasks,
        completedTasks,
        overdueTasks
      };
    })
    .filter(item => item.activeTasks.length > 0) // Only show customers with active tasks
    .filter(item => {
      if (!searchTasks) return true;
      const searchLower = searchTasks.toLowerCase();
      return (
        item.customer.name.toLowerCase().includes(searchLower) ||
        item.activeTasks.some(task => 
          task.title.toLowerCase().includes(searchLower) ||
          task.description?.toLowerCase().includes(searchLower)
        )
      );
    })
    .sort((a, b) => {
      // First sort by overdue tasks
      if (a.overdueTasks.length !== b.overdueTasks.length) {
        return b.overdueTasks.length - a.overdueTasks.length;
      }
      
      // Then sort by highest priority task
      const aHighestPriority = Math.max(...a.activeTasks.map(task => getPriorityOrder(task.priority)));
      const bHighestPriority = Math.max(...b.activeTasks.map(task => getPriorityOrder(task.priority)));
      if (aHighestPriority !== bHighestPriority) {
        return bHighestPriority - aHighestPriority;
      }
      
      // Then by number of high priority tasks
      const aHighPriorityCount = a.activeTasks.filter(task => task.priority === 'high').length;
      const bHighPriorityCount = b.activeTasks.filter(task => task.priority === 'high').length;
      if (aHighPriorityCount !== bHighPriorityCount) {
        return bHighPriorityCount - aHighPriorityCount;
      }
      
      // Finally by total number of active tasks
      return b.activeTasks.length - a.activeTasks.length;
    });

  const totalActiveTasks = allTasks.filter(task => task.status !== 'completed').length;
  const totalOverdueTasks = allTasks.filter(task => {
    if (task.status === 'completed' || !task.due_date) return false;
    return new Date(task.due_date) < new Date() && new Date(task.due_date).toDateString() !== new Date().toDateString();
  }).length;

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-500';
      case 'medium':
        return 'bg-yellow-500';
      case 'low':
        return 'bg-green-500';
      default:
        return 'bg-gray-400';
    }
  };

  const formatDueDate = (dateString?: string) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  const isOverdue = (dateString?: string) => {
    if (!dateString) return false;
    return new Date(dateString) < new Date() && new Date(dateString).toDateString() !== new Date().toDateString();
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center mb-6">
          <ClipboardDocumentListIcon className="h-6 w-6 text-blue-600 dark:text-blue-400 mr-2" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Tasks Overview</h2>
        </div>
        
        {/* Loading skeleton */}
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 animate-pulse">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
              </div>
              <div className="space-y-2">
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 overflow-visible">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <ClipboardDocumentListIcon className="h-6 w-6 text-blue-600 dark:text-blue-400 mr-2" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Tasks Overview</h2>
        </div>
        
        {/* Quick Stats */}
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <ClockIcon className="w-4 h-4 text-blue-500" />
            <span className="text-gray-600 dark:text-gray-400">{totalActiveTasks} Active</span>
          </div>
          {totalOverdueTasks > 0 && (
            <div className="flex items-center gap-2">
              <ExclamationTriangleIcon className="w-4 h-4 text-red-500" />
              <span className="text-red-600 dark:text-red-400">{totalOverdueTasks} Overdue</span>
            </div>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="max-w-lg">
        <div className="relative">
          <ClipboardDocumentListIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search tasks or customers..."
            value={searchTasks}
            onChange={(e) => setSearchTasks(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
          />
        </div>
      </div>

      {/* Tasks by Customer */}
      {customersWithTasks.length === 0 ? (
        <div className="text-center py-12">
          <ClipboardDocumentListIcon className="w-24 h-24 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            {searchTasks ? 'No matching tasks found' : 'No active tasks'}
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {searchTasks ? 'Try adjusting your search terms' : 'All tasks are completed or none have been created yet.'}
          </p>
        </div>
      ) : (
        <div className="space-y-6 overflow-visible">
          {customersWithTasks.map(({ customer, activeTasks, overdueTasks }) => (
            <div 
              key={customer.id}
              className="group bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-sm hover:shadow-xl border border-gray-200/50 dark:border-gray-700/50 transition-all duration-300 hover:-translate-y-1 overflow-visible min-h-[200px]"
            >
              {/* Customer Header */}
              <div 
                className="p-6 border-b border-gray-200 dark:border-gray-600 cursor-pointer"
                onClick={() => router.push(`/customers/${customer.id}`)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      {customer.logo_url ? (
                        <img 
                          src={customer.logo_url} 
                          alt={customer.name}
                          className="w-12 h-12 rounded-full object-cover ring-2 ring-blue-100 dark:ring-blue-900"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center ring-2 ring-blue-100 dark:ring-blue-900">
                          <UserIcon className="w-6 h-6 text-white" />
                        </div>
                      )}
                      {overdueTasks.length > 0 && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                          <span className="text-xs font-bold text-white">{overdueTasks.length}</span>
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{customer.name}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {activeTasks.length} active task{activeTasks.length !== 1 ? 's' : ''}
                        {overdueTasks.length > 0 && (
                          <span className="ml-2 text-red-600 dark:text-red-400 font-medium">
                            • {overdueTasks.length} overdue
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <ChevronRightIcon className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors" />
                </div>
              </div>

              {/* Tasks List */}
              <div className="p-6 space-y-3 overflow-visible min-h-[200px]">
                {activeTasks.slice(0, 5).map((task) => (
                  <div 
                    key={task.id}
                    className={`flex items-start gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg transition-colors ${
                      task.priority === 'high' ? 'border-l-4 border-red-500 bg-red-50/50 dark:bg-red-900/10' : 
                      task.priority === 'medium' ? 'border-l-4 border-yellow-500 bg-yellow-50/50 dark:bg-yellow-900/10' :
                      'border-l-4 border-transparent'
                    }`}
                  >
                    <button
                      onClick={(e) => handleTaskComplete(e, task.id)}
                      disabled={completingTaskIds.has(task.id)}
                      className="w-5 h-5 rounded-full border-2 border-gray-300 dark:border-gray-600 hover:border-green-500 dark:hover:border-green-400 flex-shrink-0 mt-0.5 hover:bg-green-50 dark:hover:bg-green-900/20 transition-all duration-200 flex items-center justify-center disabled:opacity-50 hover:scale-110 task-complete-btn"
                      title="Mark as complete"
                    >
                      {completingTaskIds.has(task.id) ? (
                        <div className="w-3 h-3 border border-gray-400 border-t-green-500 rounded-full animate-spin"></div>
                      ) : (
                        <CheckCircleIcon className="w-3 h-3 text-gray-400 hover:text-green-500 opacity-0 hover:opacity-100 transition-all duration-200" />
                      )}
                    </button>
                    
                    <div 
                      className="flex-1 min-w-0 cursor-pointer"
                      onClick={() => router.push(`/customers/${customer.id}`)}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`font-medium ${
                          task.priority === 'high' ? 'text-red-900 dark:text-red-100' :
                          task.priority === 'medium' ? 'text-yellow-900 dark:text-yellow-100' :
                          'text-gray-900 dark:text-white'
                        }`}>{task.title}</span>
                        
                        {/* Inline Priority Dropdown */}
                        <div className="relative">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenDropdownId(openDropdownId === task.id ? null : task.id);
                            }}
                            className="flex items-center gap-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded px-1 py-0.5 transition-colors"
                          >
                            <div 
                              className={`w-2 h-2 rounded-full ${getPriorityColor(task.priority)} flex-shrink-0`}
                            />
                            <ChevronDownIcon className="w-3 h-3 text-gray-400" />
                          </button>

                          {openDropdownId === task.id && (
                            <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1 z-[100] min-w-[100px]">
                              {(['low', 'medium', 'high'] as const).map((priority) => (
                                <button
                                  key={priority}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handlePriorityChange(task.id, priority);
                                  }}
                                  className={`w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                                    priority === task.priority ? 'bg-gray-50 dark:bg-gray-700' : ''
                                  }`}
                                >
                                  <div className={`w-2 h-2 rounded-full ${getPriorityColor(priority)}`} />
                                  <span className="text-sm capitalize">{priority}</span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {task.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">{task.description}</p>
                      )}
                      
                      {task.due_date && (
                        <div className={`text-xs mt-2 flex items-center gap-1 ${
                          isOverdue(task.due_date) 
                            ? 'text-red-600 dark:text-red-400 font-medium' 
                            : 'text-gray-500 dark:text-gray-400'
                        }`}>
                          <CalendarIcon className="w-3 h-3" />
                          {formatDueDate(task.due_date)}
                          {isOverdue(task.due_date) && <span className="ml-1">⚠️</span>}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                
                {activeTasks.length > 5 && (
                  <div className="text-center pt-3 border-t border-gray-200 dark:border-gray-600">
                    <button
                      onClick={() => router.push(`/customers/${customer.id}`)}
                      className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
                    >
                      View all {activeTasks.length} tasks →
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
