'use client';

import { useState, useEffect } from 'react';
import { PlusIcon, CheckIcon, PencilIcon, TrashIcon, CalendarIcon, ClockIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { Task } from '../types';

interface SimpleTasksProps {
  tasks: Task[];
  onTaskCreate: (title: string, dueDate?: string) => void;
  onTaskComplete: (taskId: string) => void;
  onTaskEdit: (task: Task) => void;
  onTaskDelete: (taskId: string) => void;
  onTaskUpdate?: (taskId: string, updates: Partial<Task>) => void;
}

export default function SimpleTasks({ 
  tasks, 
  onTaskCreate, 
  onTaskComplete, 
  onTaskEdit, 
  onTaskDelete,
  onTaskUpdate
}: SimpleTasksProps) {
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  const handlePriorityChange = (taskId: string, newPriority: 'low' | 'medium' | 'high') => {
    if (onTaskUpdate) {
      onTaskUpdate(taskId, { priority: newPriority });
    }
    setOpenDropdownId(null);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (openDropdownId) {
        setOpenDropdownId(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [openDropdownId]);
  const [showNewTask, setShowNewTask] = useState(false);
  const [newTaskDueDate, setNewTaskDueDate] = useState('');

  const activeTasks = tasks.filter(task => task.status !== 'completed');
  const completedTasks = tasks.filter(task => task.status === 'completed');

  const handleAddTask = () => {
    if (newTaskTitle.trim()) {
      onTaskCreate(newTaskTitle.trim(), newTaskDueDate || undefined);
      setNewTaskTitle('');
      setNewTaskDueDate('');
      setShowNewTask(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddTask();
    } else if (e.key === 'Escape') {
      setShowNewTask(false);
      setNewTaskTitle('');
      setNewTaskDueDate('');
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

  // Sort active tasks by priority: expired/overdue first, then high, medium, low
  const sortedActiveTasks = [...activeTasks].sort((a, b) => {
    const aIsOverdue = isOverdue(a.due_date);
    const bIsOverdue = isOverdue(b.due_date);
    
    // Overdue tasks always come first
    if (aIsOverdue && !bIsOverdue) return -1;
    if (!aIsOverdue && bIsOverdue) return 1;
    
    // If both are overdue or both are not overdue, sort by priority
    const priorityOrder = { high: 1, medium: 2, low: 3 };
    const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder] || 4;
    const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder] || 4;
    
    return aPriority - bPriority;
  });

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

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'High Priority';
      case 'medium':
        return 'Medium Priority';
      case 'low':
        return 'Low Priority';
      default:
        return 'No Priority';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-600 overflow-visible min-h-[300px]">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-600">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Tasks</h3>
          <div className="text-sm text-gray-500">
            {sortedActiveTasks.length} active, {completedTasks.length} completed
          </div>
        </div>
      </div>

      <div className="p-4 space-y-3 overflow-visible min-h-[250px]">
        {/* Add Task Button/Input */}
        {!showNewTask ? (
          <button
            onClick={() => setShowNewTask(true)}
            className="w-full flex items-center gap-3 text-left p-3 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors group"
          >
            <PlusIcon className="w-5 h-5 text-blue-500 group-hover:text-blue-600" />
            <span>Add a task</span>
          </button>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full border-2 border-gray-300 flex-shrink-0"></div>
              <input
                type="text"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Title"
                className="flex-1 text-gray-900 dark:text-white bg-transparent border-none outline-none placeholder-gray-500"
                autoFocus
              />
            </div>
            
            {/* Due Date Input */}
            <div className="ml-8 flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-gray-400" />
              <input
                type="date"
                value={newTaskDueDate}
                onChange={(e) => setNewTaskDueDate(e.target.value)}
                onKeyDown={handleKeyPress}
                className="text-sm text-gray-600 dark:text-gray-400 bg-transparent border-none outline-none"
              />
            </div>

            {/* Action Buttons */}
            <div className="ml-8 flex items-center gap-2">
              <button
                onClick={handleAddTask}
                disabled={!newTaskTitle.trim()}
                className="px-3 py-1 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add
              </button>
              <button
                onClick={() => {
                  setShowNewTask(false);
                  setNewTaskTitle('');
                  setNewTaskDueDate('');
                }}
                className="px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Active Tasks */}
        {sortedActiveTasks.map((task) => (
          <div key={task.id} className="group flex items-start gap-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg">
            <button
              onClick={() => onTaskComplete(task.id)}
              className="w-5 h-5 rounded-full border-2 border-gray-300 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-400 flex-shrink-0 mt-0.5 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
            >
            </button>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-gray-900 dark:text-white">{task.title}</span>
                {/* Priority Dropdown - moved here next to title */}
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
                    <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-600 py-1 z-[100] min-w-[80px]">
                      {(['low', 'medium', 'high'] as const).map((priority) => (
                        <button
                          key={priority}
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePriorityChange(task.id, priority);
                          }}
                          className={`block w-full text-left px-3 py-1 text-xs hover:bg-gray-100 dark:hover:bg-gray-700 ${
                            task.priority === priority 
                              ? priority === 'high' 
                                ? 'text-red-700 bg-red-50 dark:text-red-300 dark:bg-red-900/20' 
                                : priority === 'medium' 
                                  ? 'text-yellow-700 bg-yellow-50 dark:text-yellow-300 dark:bg-yellow-900/20' 
                                  : 'text-green-700 bg-green-50 dark:text-green-300 dark:bg-green-900/20'
                              : 'text-gray-700 dark:text-gray-300'
                          }`}
                        >
                          {priority}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
              {task.description && (
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">{task.description}</div>
              )}
              
              <div className="flex items-center gap-4 mt-1">
                {task.due_date && (
                  <div className={`text-xs flex items-center gap-1 ${
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

            {/* Action Buttons */}
            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
              <button
                onClick={() => onTaskEdit(task)}
                className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 rounded"
                title="Edit task"
              >
                <PencilIcon className="w-4 h-4" />
              </button>
              <button
                onClick={() => onTaskDelete(task.id)}
                className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded"
                title="Delete task"
              >
                <TrashIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}

        {/* Completed Tasks */}
        {completedTasks.length > 0 && (
          <div className="pt-3 border-t border-gray-200 dark:border-gray-600">
            <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
              Completed ({completedTasks.length})
            </h4>
            {completedTasks.slice(0, 3).map((task) => (
              <div key={task.id} className="group flex items-start gap-3 p-2 opacity-60 hover:opacity-80">
                <button
                  onClick={() => onTaskComplete(task.id)}
                  className="w-5 h-5 rounded-full bg-green-500 text-white flex items-center justify-center flex-shrink-0 mt-0.5"
                >
                  <CheckIcon className="w-3 h-3" />
                </button>
                
                <div className="flex-1 min-w-0">
                  <div className="text-gray-600 dark:text-gray-400 line-through">{task.title}</div>
                  {task.completed_at && (
                    <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      Completed {new Date(task.completed_at).toLocaleDateString()}
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => onTaskDelete(task.id)}
                    className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded"
                    title="Delete task"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
            
            {completedTasks.length > 3 && (
              <div className="text-xs text-gray-400 dark:text-gray-500 text-center mt-2">
                +{completedTasks.length - 3} more completed tasks
              </div>
            )}
          </div>
        )}

        {/* Empty State */}
        {activeTasks.length === 0 && completedTasks.length === 0 && !showNewTask && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <ClockIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No tasks yet</p>
            <p className="text-sm">Add a task to get started</p>
          </div>
        )}
      </div>
    </div>
  );
}
