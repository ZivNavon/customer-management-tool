// Utility to add sample meeting data for testing analytics
import { mockApi } from './mockApi';

export const addSampleMeetingData = async () => {
  const sampleMeetings = [
    {
      customer_id: '1', // Acme Corp
      title: 'Q3 Business Review',
      meeting_date: '2025-08-15T10:00:00Z',
      duration: 90,
      participants: ['John Smith', 'Sarah Johnson'],
      notes: 'Discussed quarterly results and renewal timeline. Customer satisfied with service.',
      action_items: ['Send renewal proposal', 'Schedule technical review'],
      next_steps: 'Follow up on renewal pricing',
      screenshots: []
    },
    {
      customer_id: '1', // Acme Corp
      title: 'Technical Integration Check-in',
      meeting_date: '2025-08-10T14:00:00Z',
      duration: 60,
      participants: ['Mike Wilson'],
      notes: 'API integration going smoothly. Minor performance concerns addressed.',
      action_items: ['Optimize API response times', 'Provide documentation updates'],
      next_steps: 'Schedule follow-up in 2 weeks',
      screenshots: []
    },
    {
      customer_id: '2', // Tech Start Solutions
      title: 'Monthly Strategy Session',
      meeting_date: '2025-08-12T15:30:00Z',
      duration: 75,
      participants: ['Mike Chen'],
      notes: 'Discussed expansion plans and additional feature requirements.',
      action_items: ['Prepare feature roadmap', 'Cost analysis for expansion'],
      next_steps: 'Present options next week',
      screenshots: []
    },
    {
      customer_id: '4', // Potato Industries
      title: 'Onboarding Kickoff',
      meeting_date: '2025-08-08T09:00:00Z',
      duration: 120,
      participants: ['John Potato', 'Team'],
      notes: 'Initial setup and training session. Team engaged and positive.',
      action_items: ['Complete setup checklist', 'Schedule training sessions'],
      next_steps: 'Begin rollout phase',
      screenshots: []
    },
    {
      customer_id: '1', // Acme Corp
      title: 'Weekly Sync',
      meeting_date: '2025-07-20T11:00:00Z',
      duration: 30,
      participants: ['John Smith'],
      notes: 'Quick status update. All systems running well.',
      action_items: [],
      next_steps: 'Continue regular monitoring',
      screenshots: []
    },
    {
      customer_id: '2', // Tech Start Solutions
      title: 'Problem Resolution',
      meeting_date: '2025-07-25T16:00:00Z',
      duration: 45,
      participants: ['Mike Chen', 'Support Team'],
      notes: 'Resolved critical bug affecting customer workflows.',
      action_items: ['Deploy hotfix', 'Monitor for 48 hours'],
      next_steps: 'Post-resolution check-in',
      screenshots: []
    }
  ];

  try {
    for (const meeting of sampleMeetings) {
      await mockApi.meetings.create(meeting);
    }
    console.log('Sample meeting data added successfully');
  } catch (error) {
    console.error('Failed to add sample meeting data:', error);
  }
};

export const clearMeetingData = async () => {
  try {
    // Clear localStorage directly since there's no clearMeetings method
    if (typeof window !== 'undefined') {
      localStorage.removeItem('meetings_mock_data');
    }
    console.log('Meeting data cleared');
  } catch (error) {
    console.error('Failed to clear meeting data:', error);
  }
};
