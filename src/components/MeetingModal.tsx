'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { meetingApi, customerApi } from '@/lib/api';
import { mockApi } from '@/lib/mockApi';
import { detectLanguage, getTextDirection, languageNames } from '@/lib/i18n';
import { AISummary } from './AISummary';
import type { Meeting } from '@/types';
import type { AIAnalysisResult } from '@/lib/penteraAI-server';
import {
  XMarkIcon,
  CloudArrowUpIcon,
  PhotoIcon,
  TrashIcon,
  CalendarIcon,
  ClockIcon,
  UserGroupIcon,
  DocumentTextIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

interface MeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerId: string;
  customerName: string;
  meeting?: Meeting;
}

interface MeetingFormData {
  title: string;
  date: string;
  time: string;
  duration: number;
  participants: string[];
  notes: string;
  action_items: string[];
  next_steps: string;
  screenshots: File[];
}

export function MeetingModal({ isOpen, onClose, customerId, customerName, meeting }: MeetingModalProps) {
  const { t: _t } = useTranslation();
  const queryClient = useQueryClient();
  const notesRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const generateDefaultTitle = (customerName: string, date: string) => {
    const meetingDate = new Date(date);
    const formattedDate = meetingDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    return `${customerName} / Pentera - ${formattedDate}`;
  };

  const [formData, setFormData] = useState<MeetingFormData>({
    title: generateDefaultTitle(customerName, new Date().toISOString().split('T')[0]),
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().split(' ')[0].slice(0, 5),
    duration: 60,
    participants: [],
    notes: '',
    action_items: [''],
    next_steps: '',
    screenshots: []
  });

  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [showAISummary, setShowAISummary] = useState(false);
  const [aiGeneratedSummary, setAiGeneratedSummary] = useState<any>(null); // Store full AI analysis result
  const [detectedLanguage, setDetectedLanguage] = useState<string>('en');

  // Fetch customer data to get contacts
  const { data: customer } = useQuery({
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

  const customerContacts = customer?.data?.contacts || [];

  // Load meeting data for editing
  useEffect(() => {
    if (meeting) {
      const meetingDate = new Date(meeting.meeting_date || meeting.date);
      const notes = meeting.notes || '';
      setFormData({
        title: meeting.title || generateDefaultTitle(customerName, meetingDate.toISOString().split('T')[0]),
        date: meetingDate.toISOString().split('T')[0],
        time: meetingDate.toTimeString().split(' ')[0].slice(0, 5),
        duration: meeting.duration || 60,
        participants: meeting.participants?.length ? meeting.participants : [],
        notes: notes,
        action_items: meeting.action_items?.length ? meeting.action_items : [''],
        next_steps: meeting.next_steps || '',
        screenshots: []
      });
      
      // Load existing AI summary if available
      if (meeting.ai_summary) {
        setAiGeneratedSummary(meeting.ai_summary);
      }
      
      // Set detected language from existing meeting or detect from notes
      if (meeting.detected_language) {
        setDetectedLanguage(meeting.detected_language);
      } else if (notes.trim()) {
        setDetectedLanguage(detectLanguage(notes));
      }
    }
  }, [meeting, customerName]);

  // Update title when date changes (only for new meetings)
  useEffect(() => {
    if (!meeting && formData.date) {
      const newTitle = generateDefaultTitle(customerName, formData.date);
      setFormData(prev => ({ ...prev, title: newTitle }));
    }
  }, [formData.date, customerName, meeting]);

  const addScreenshot = useCallback(async (file: File) => {
    const newFiles = [...formData.screenshots, file];
    setFormData(prev => ({ ...prev, screenshots: newFiles }));

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewImages(prev => [...prev, e.target?.result as string]);
    };
    reader.readAsDataURL(file);
  }, [formData.screenshots]);

  // Handle clipboard paste
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      if (!isOpen) return;
      
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.startsWith('image/')) {
          e.preventDefault();
          const file = item.getAsFile();
          if (file) {
            await addScreenshot(file);
          }
        }
      }
    };

    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [isOpen, addScreenshot]);

  const removeScreenshot = (index: number) => {
    const newFiles = formData.screenshots.filter((_, i) => i !== index);
    const newPreviews = previewImages.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, screenshots: newFiles }));
    setPreviewImages(newPreviews);
  };

  const createMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      try {
        return await meetingApi.create(data);
      } catch (error) {
        console.log('Backend not available, using mock data');
        return await mockApi.meetings.create(data);
      }
    },
    onSuccess: async (response, variables) => {
      queryClient.invalidateQueries({ queryKey: ['meetings', customerId] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      
      // Auto-create tasks from next steps if they exist
      const nextSteps = variables.next_steps as string;
      if (nextSteps && nextSteps.trim()) {
        try {
          await mockApi.tasks.createFromMeetingNextSteps(
            response.data.id, 
            customerId, 
            nextSteps
          );
          queryClient.invalidateQueries({ queryKey: ['tasks', customerId] });
        } catch (error) {
          console.log('Failed to create tasks from next steps:', error);
        }
      }
      
      onClose();
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      if (!meeting) throw new Error('No meeting to update');
      try {
        return await meetingApi.update(meeting.id, data);
      } catch (error) {
        console.log('Backend not available, using mock data');
        return await mockApi.meetings.update(meeting.id, data);
      }
    },
    onSuccess: async (response, variables) => {
      queryClient.invalidateQueries({ queryKey: ['meetings', customerId] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      
      // Auto-create tasks from next steps if they exist and it's a new next steps value
      const nextSteps = variables.next_steps as string;
      const oldNextSteps = meeting?.next_steps;
      if (nextSteps && nextSteps.trim() && nextSteps !== oldNextSteps) {
        try {
          await mockApi.tasks.createFromMeetingNextSteps(
            meeting!.id, 
            customerId, 
            nextSteps
          );
          queryClient.invalidateQueries({ queryKey: ['tasks', customerId] });
        } catch (error) {
          console.log('Failed to create tasks from next steps:', error);
        }
      }
      
      onClose();
      resetForm();
    },
  });

  const resetForm = () => {
    const currentDate = new Date().toISOString().split('T')[0];
    setFormData({
      title: generateDefaultTitle(customerName, currentDate),
      date: currentDate,
      time: new Date().toTimeString().split(' ')[0].slice(0, 5),
      duration: 60,
      participants: [],
      notes: '',
      action_items: [''],
      next_steps: '',
      screenshots: []
    });
    setPreviewImages([]);
    setShowAISummary(false);
    setAiGeneratedSummary(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveMemeting();
  };

  const saveMemeting = async () => {
    const meetingDateTime = new Date(`${formData.date}T${formData.time}`);
    
    // Filter out empty action items (participants are already clean)
    const cleanActionItems = formData.action_items.filter((item: string) => item.trim() !== '');

    const meetingData = {
      customer_id: customerId,
      title: formData.title,
      meeting_date: meetingDateTime.toISOString(),
      duration: formData.duration,
      participants: formData.participants, // Already clean, no need to filter
      notes: formData.notes,
      detected_language: detectedLanguage,
      action_items: cleanActionItems,
      next_steps: formData.next_steps,
      screenshots: formData.screenshots,
      // Include AI summary if generated
      ai_summary: aiGeneratedSummary ? {
        ...aiGeneratedSummary,
        generated_at: new Date().toISOString()
      } : undefined
    };

    if (meeting) {
      updateMutation.mutate(meetingData);
    } else {
      createMutation.mutate(meetingData);
    }
  };

  const saveMeetingWithAI = async (aiSummary: AIAnalysisResult) => {
    const meetingDateTime = new Date(`${formData.date}T${formData.time}`);
    
    // Filter out empty action items (participants are already clean)
    const cleanActionItems = formData.action_items.filter((item: string) => item.trim() !== '');

    const meetingData = {
      customer_id: customerId,
      title: formData.title,
      meeting_date: meetingDateTime.toISOString(),
      duration: formData.duration,
      participants: formData.participants, // Already clean, no need to filter
      notes: formData.notes, // Notes already include AI summary
      detected_language: detectedLanguage,
      action_items: cleanActionItems,
      next_steps: formData.next_steps,
      screenshots: formData.screenshots
    };

    if (meeting) {
      updateMutation.mutate(meetingData);
    } else {
      createMutation.mutate(meetingData);
    }
  };

  const addParticipantFromContact = (contact: { name: string; title: string }) => {
    const participantName = `${contact.name} (${contact.title})`;
    // Check if participant is already added
    if (!formData.participants.includes(participantName)) {
      setFormData(prev => ({
        ...prev,
        participants: [...prev.participants, participantName]
      }));
    }
  };

  const removeParticipant = (participantToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      participants: prev.participants.filter(p => p !== participantToRemove)
    }));
  };

  const addCustomParticipant = (name: string) => {
    if (name.trim() && !formData.participants.includes(name.trim())) {
      setFormData(prev => ({
        ...prev,
        participants: [...prev.participants, name.trim()]
      }));
    }
  };

  const addActionItem = () => {
    setFormData(prev => ({
      ...prev,
      action_items: [...prev.action_items, '']
    }));
  };

  const updateActionItem = (index: number, value: string) => {
    const newActionItems = [...formData.action_items];
    newActionItems[index] = value;
    setFormData(prev => ({ ...prev, action_items: newActionItems }));
  };

  const removeActionItem = (index: number) => {
    if (formData.action_items.length > 1) {
      const newActionItems = formData.action_items.filter((_, i) => i !== index);
      setFormData(prev => ({ ...prev, action_items: newActionItems }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">
              {meeting ? 'Edit Meeting' : 'Add New Meeting'} - {customerName}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Meeting Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Meeting Title *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter meeting title"
            />
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <CalendarIcon className="h-4 w-4 inline mr-1" />
                Date *
              </label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <ClockIcon className="h-4 w-4 inline mr-1" />
                Time *
              </label>
              <input
                type="time"
                required
                value={formData.time}
                onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Duration (minutes)
              </label>
              <input
                type="number"
                min="1"
                value={formData.duration}
                onChange={(e) => setFormData(prev => ({ ...prev, duration: Number(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Participants */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <UserGroupIcon className="h-4 w-4 inline mr-1" />
              Participants
            </label>
            
            {/* Selected Participants Display */}
            <div className="mb-3">
              <div className="min-h-[42px] w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
                {formData.participants.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {formData.participants.map((participant, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-md"
                      >
                        {participant}
                        <button
                          type="button"
                          onClick={() => removeParticipant(participant)}
                          className="ml-1 text-blue-600 hover:text-blue-800"
                        >
                          <XMarkIcon className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-gray-500 text-sm">No participants selected</span>
                )}
              </div>
            </div>

            {/* Add Custom Participant */}
            <div className="mb-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Add custom participant..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const input = e.target as HTMLInputElement;
                      addCustomParticipant(input.value);
                      input.value = '';
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={(e) => {
                    const input = (e.target as HTMLButtonElement).previousElementSibling as HTMLInputElement;
                    addCustomParticipant(input.value);
                    input.value = '';
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Add
                </button>
              </div>
            </div>

            {/* Contact Selection */}
            {customerContacts.length > 0 && (
              <div>
                <div className="text-sm text-gray-600 mb-2">Quick select from {customerName} contacts:</div>
                <div className="flex flex-wrap gap-2">
                  {customerContacts.map((contact: { name: string; title: string }, contactIndex: number) => {
                    const participantName = `${contact.name} (${contact.title})`;
                    const isSelected = formData.participants.includes(participantName);
                    return (
                      <button
                        key={contactIndex}
                        type="button"
                        onClick={() => addParticipantFromContact(contact)}
                        disabled={isSelected}
                        className={`inline-flex items-center px-3 py-2 text-sm rounded-md border transition-colors ${
                          isSelected
                            ? 'bg-green-100 text-green-800 border-green-300 cursor-not-allowed'
                            : 'bg-gray-100 hover:bg-blue-100 text-gray-700 hover:text-blue-700 border-gray-300 hover:border-blue-300'
                        }`}
                      >
                        <span className="font-medium">{contact.name}</span>
                        <span className="ml-1 text-gray-500">({contact.title})</span>
                        {isSelected && (
                          <span className="ml-1 text-green-600">✓</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Meeting Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <DocumentTextIcon className="h-4 w-4 inline mr-1" />
              Meeting Notes
            </label>
            <textarea
              ref={notesRef}
              value={formData.notes}
              onChange={(e) => {
                const newNotes = e.target.value;
                setFormData(prev => ({ ...prev, notes: newNotes }));
                
                // Detect language of notes content
                if (newNotes.trim()) {
                  const detected = detectLanguage(newNotes);
                  setDetectedLanguage(detected);
                }
              }}
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter meeting notes... (Tip: You can paste screenshots with Ctrl+V)"
              style={{ direction: getTextDirection(detectedLanguage) }}
            />
            {formData.notes.trim() && (
              <div className="mt-1 text-xs text-gray-500 flex items-center">
                <span className="inline-flex items-center px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700">
                  🌐 Detected: {languageNames[detectedLanguage as keyof typeof languageNames] || detectedLanguage.toUpperCase()}
                </span>
              </div>
            )}
          </div>

          {/* Screenshots */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <PhotoIcon className="h-4 w-4 inline mr-1" />
              Screenshots
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <CloudArrowUpIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">
                Drop screenshots here, paste with Ctrl+V, or click to browse
              </p>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  files.forEach(addScreenshot);
                }}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                Browse Files
              </button>
            </div>

            {/* Preview Screenshots */}
            {previewImages.length > 0 && (
              <div className="mt-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {previewImages.map((preview, index) => (
                  <div key={index} className="relative">
                    <img
                      src={preview}
                      alt={`Screenshot ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg border"
                    />
                    <button
                      type="button"
                      onClick={() => removeScreenshot(index)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* AI Summary Section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-700">
                <SparklesIcon className="h-4 w-4 inline mr-1" />
                AI Meeting Summary
              </label>
              <button
                type="button"
                onClick={() => setShowAISummary(!showAISummary)}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                {showAISummary ? 'Hide AI Summary' : 'Generate AI Summary'}
              </button>
            </div>
            
            {showAISummary && (
              <AISummary
                meetingId={meeting?.id || 'new'}
                customerId={customerId}
                customerName={customerName}
                notes={formData.notes}
                screenshots={formData.screenshots}
                onSummaryGenerated={setAiGeneratedSummary}
                onSave={saveMeetingWithAI}
                onNotesUpdate={(updatedNotes) => {
                  setFormData(prev => ({
                    ...prev,
                    notes: updatedNotes
                  }));
                  // Update the textarea value as well
                  if (notesRef.current) {
                    notesRef.current.value = updatedNotes;
                  }
                }}
              />
            )}
            
            {aiGeneratedSummary && !showAISummary && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-sm text-green-800">
                    <SparklesIcon className="h-4 w-4 mr-1" />
                    AI summary generated and ready for use
                    <button
                      type="button"
                      onClick={() => setShowAISummary(true)}
                      className="ml-2 text-green-600 hover:text-green-700 underline"
                    >
                      View
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      // Use the latest AI summary from state
                      if (aiGeneratedSummary) {
                        saveMeetingWithAI(aiGeneratedSummary);
                      } else {
                        saveMemeting();
                      }
                    }}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm font-medium"
                  >
                    Save Meeting with AI Summary
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Action Items */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Action Items
            </label>
            <div className="space-y-2">
              {formData.action_items.map((item, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={item}
                    onChange={(e) => updateActionItem(index, e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Action item"
                  />
                  {formData.action_items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeActionItem(index)}
                      className="px-3 py-2 text-red-600 hover:text-red-700"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addActionItem}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                + Add Action Item
              </button>
            </div>
          </div>

          {/* Next Steps */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Next Steps
            </label>
            <textarea
              value={formData.next_steps}
              onChange={(e) => setFormData(prev => ({ ...prev, next_steps: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="What are the next steps after this meeting?"
            />
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {createMutation.isPending || updateMutation.isPending
                ? (meeting ? 'Updating...' : 'Creating...')
                : (meeting ? 'Update Meeting' : 'Create Meeting')
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
