'use client';

import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { meetingApi } from '@/lib/api';
import { mockApi } from '@/lib/mockApi';
import { detectLanguage, getTextDirection, languageNames } from '@/lib/i18n';
import { AISummary } from './AISummary';
import type { Meeting } from '@/types';
import {
  CalendarIcon,
  ClockIcon,
  UserGroupIcon,
  DocumentTextIcon,
  PhotoIcon,
  PencilIcon,
  TrashIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

interface MeetingCardProps {
  meeting: Meeting;
  onEdit: (meeting: Meeting) => void;
}

export function MeetingCard({ meeting, onEdit }: MeetingCardProps) {
  const queryClient = useQueryClient();
  const [expanded, setExpanded] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showAISummary, setShowAISummary] = useState(false);

  const deleteMutation = useMutation({
    mutationFn: async (meetingId: string) => {
      try {
        return await meetingApi.delete(meetingId);
      } catch (error) {
        console.log('Backend not available, using mock data');
        return await mockApi.meetings.delete(meetingId);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meetings'] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      setShowDeleteConfirm(false);
    },
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleDelete = () => {
    deleteMutation.mutate(meeting.id);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
      {/* Meeting Header */}
      <div className="p-4">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {meeting.title}
            </h3>
            
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-3">
              <span className="flex items-center">
                <CalendarIcon className="h-4 w-4 mr-1" />
                {formatDate(meeting.meeting_date)}
              </span>
              <span className="flex items-center">
                <ClockIcon className="h-4 w-4 mr-1" />
                {formatTime(meeting.meeting_date)} ({meeting.duration || 45} min)
              </span>
              {meeting.participants && meeting.participants.length > 0 && (
                <span className="flex items-center">
                  <UserGroupIcon className="h-4 w-4 mr-1" />
                  {meeting.participants.length} participant{meeting.participants.length !== 1 ? 's' : ''}
                </span>
              )}
              {meeting.screenshots && meeting.screenshots.length > 0 && (
                <span className="flex items-center">
                  <PhotoIcon className="h-4 w-4 mr-1" />
                  {meeting.screenshots.length} screenshot{meeting.screenshots.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>

            {/* Quick preview of notes */}
            {meeting.notes && (
              <div className="mb-3">
                <p 
                  className="text-gray-700 text-sm line-clamp-2"
                  style={{ direction: getTextDirection(meeting.detected_language || detectLanguage(meeting.notes)) }}
                >
                  {meeting.notes}
                </p>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center space-x-2 ml-4">
            <button
              onClick={() => setShowAISummary(!showAISummary)}
              className="p-2 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-md"
              title="AI Summary"
            >
              <SparklesIcon className="h-4 w-4" />
            </button>
            <button
              onClick={() => onEdit(meeting)}
              className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-md"
              title="Edit meeting"
            >
              <PencilIcon className="h-4 w-4" />
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md"
              title="Delete meeting"
            >
              <TrashIcon className="h-4 w-4" />
            </button>
            <button
              onClick={() => setExpanded(!expanded)}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-md"
              title={expanded ? "Collapse details" : "Expand details"}
            >
              {expanded ? (
                <ChevronUpIcon className="h-4 w-4" />
              ) : (
                <ChevronDownIcon className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div className="border-t border-gray-200 p-4 space-y-4">
          {/* Participants */}
          {meeting.participants && meeting.participants.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
                <UserGroupIcon className="h-4 w-4 mr-1" />
                Participants
              </h4>
              <div className="flex flex-wrap gap-2">
                {meeting.participants.map((participant: string, index: number) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                  >
                    {participant}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Full Notes */}
          {meeting.notes && (
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center justify-between">
                <span className="flex items-center">
                  <DocumentTextIcon className="h-4 w-4 mr-1" />
                  Meeting Notes
                </span>
                {(() => {
                  const detectedLang = meeting.detected_language || detectLanguage(meeting.notes);
                  const languageName = languageNames[detectedLang as keyof typeof languageNames] || detectedLang.toUpperCase();
                  return (
                    <span className="text-xs text-gray-500 flex items-center">
                      🌐 {languageName}
                    </span>
                  );
                })()}
              </h4>
              <p 
                className="text-gray-700 whitespace-pre-wrap text-sm bg-gray-50 p-3 rounded-md"
                style={{ direction: getTextDirection(meeting.detected_language || detectLanguage(meeting.notes)) }}
              >
                {meeting.notes}
              </p>
            </div>
          )}

          {/* Action Items */}
          {meeting.action_items && meeting.action_items.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">
                Action Items
              </h4>
              <ul className="space-y-1">
                {meeting.action_items.map((item: string, index: number) => (
                  <li key={index} className="flex items-start text-sm text-gray-700">
                    <span className="text-blue-600 mr-2">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Next Steps */}
          {meeting.next_steps && (
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">
                Next Steps
              </h4>
              <p className="text-gray-700 text-sm bg-yellow-50 p-3 rounded-md border-l-4 border-yellow-400">
                {meeting.next_steps}
              </p>
            </div>
          )}

          {/* Screenshots */}
          {meeting.screenshots && meeting.screenshots.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
                <PhotoIcon className="h-4 w-4 mr-1" />
                Screenshots ({meeting.screenshots.length})
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {meeting.screenshots.map((screenshot: string | File, index: number) => (
                  <div key={index} className="relative">
                    <img
                      src={typeof screenshot === 'string' ? screenshot : URL.createObjectURL(screenshot)}
                      alt={`Screenshot ${index + 1}`}
                      className="w-full h-20 object-cover rounded-md border cursor-pointer hover:opacity-75"
                      onClick={() => {
                        // Open in new tab for full view
                        const img = new Image();
                        img.src = typeof screenshot === 'string' ? screenshot : URL.createObjectURL(screenshot);
                        const newWindow = window.open();
                        newWindow?.document.write(img.outerHTML);
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* AI Summary Section */}
      {showAISummary && (
        <div className="border-t border-gray-200 p-4">
          <AISummary
            meetingId={meeting.id}
            customerId={meeting.customer_id}
            customerName={meeting.customer?.name || 'Customer'}
            notes={meeting.notes || ''}
            screenshots={meeting.screenshots || []}
          />
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Delete Meeting
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete &quot;{meeting.title}&quot;? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
