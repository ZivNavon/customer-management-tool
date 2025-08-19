'use client';

import { useState } from 'react';
import { CalendarDaysIcon, FlagIcon, PencilIcon, TrashIcon, CheckIcon } from '@heroicons/react/24/outline';
import { Task } from '../types';

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onStatusChange: (taskId: string, status: Task['status']) => void;
}

export default function TaskCard({ task, onEdit, onDelete, onStatusChange }: TaskCardProps) {
  const [isUpdating, setIsUpdating] = useState(false);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'in_progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'pending': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return '🔴';
      case 'medium': return '🟡';
      case 'low': return '🟢';
      default: return '🟡';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return '✅';
      case 'in_progress': return '🔄';
      case 'pending': return '⏳';
      default: return '⏳';
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const isOverdue = () => {
    if (!task.due_date || task.status === 'completed') return false;
    return new Date(task.due_date) < new Date();
  };

  const handleStatusToggle = async () => {
    if (isUpdating) return;
    
    setIsUpdating(true);
    try {
      const newStatus = task.status === 'completed' ? 'pending' : 'completed';
      await onStatusChange(task.id, newStatus);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this task?')) {
      onDelete(task.id);
    }
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl border-2 transition-all duration-300 hover:shadow-lg ${
      task.status === 'completed' ? 'opacity-75 border-green-200' : 'border-gray-200 dark:border-gray-600'
    } ${isOverdue() ? 'border-red-300 bg-red-50 dark:bg-red-900/20' : ''}`}>
      
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className={`font-semibold text-lg leading-tight ${
              task.status === 'completed' ? 'line-through text-gray-500' : 'text-gray-900 dark:text-white'
            }`}>
              {task.title}
            </h3>
            
            {task.description && (
              <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm leading-relaxed">
                {task.description}
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1 ml-3">
            <button
              onClick={handleStatusToggle}
              disabled={isUpdating}
              className={`p-2 rounded-lg transition-all transform hover:scale-110 ${
                task.status === 'completed'
                  ? 'bg-green-100 text-green-600 hover:bg-green-200'
                  : 'bg-gray-100 text-gray-600 hover:bg-green-100 hover:text-green-600'
              } ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''}`}
              title={task.status === 'completed' ? 'Mark as pending' : 'Mark as completed'}
            >
              <CheckIcon className="w-4 h-4" />
            </button>
            
            <button
              onClick={() => onEdit(task)}
              className="p-2 rounded-lg text-blue-600 hover:bg-blue-100 transition-all transform hover:scale-110"
              title="Edit task"
            >
              <PencilIcon className="w-4 h-4" />
            </button>
            
            <button
              onClick={handleDelete}
              className="p-2 rounded-lg text-red-600 hover:bg-red-100 transition-all transform hover:scale-110"
              title="Delete task"
            >
              <TrashIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Task Metadata */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          {/* Priority Badge */}
          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(task.priority)}`}>
            <span>{getPriorityIcon(task.priority)}</span>
            {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
          </span>

          {/* Status Badge */}
          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(task.status)}`}>
            <span>{getStatusIcon(task.status)}</span>
            {task.status.replace('_', ' ').charAt(0).toUpperCase() + task.status.replace('_', ' ').slice(1)}
          </span>

          {/* Source Badge */}
          {task.source === 'meeting_next_steps' && (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200">
              📝 From Meeting
            </span>
          )}
        </div>

        {/* Due Date */}
        {task.due_date && (
          <div className={`flex items-center gap-2 text-sm ${
            isOverdue() 
              ? 'text-red-600 font-medium' 
              : task.status === 'completed'
                ? 'text-gray-400'
                : 'text-gray-600 dark:text-gray-400'
          }`}>
            <CalendarDaysIcon className="w-4 h-4" />
            <span>Due: {formatDate(task.due_date)}</span>
            {isOverdue() && <span className="text-red-500 font-bold">⚠️ OVERDUE</span>}
          </div>
        )}

        {/* Completed Date */}
        {task.status === 'completed' && task.completed_at && (
          <div className="flex items-center gap-2 text-sm text-green-600 mt-2">
            <CheckIcon className="w-4 h-4" />
            <span>Completed: {formatDate(task.completed_at)}</span>
          </div>
        )}

        {/* Created Date */}
        <div className="text-xs text-gray-400 mt-2">
          Created: {formatDate(task.created_at)}
        </div>
      </div>
    </div>
  );
}
