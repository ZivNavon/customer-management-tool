// Quick test script to add sample meetings
import { mockApi } from './src/lib/mockApi.js';

const sampleMeetings = [
  {
    customer_id: '1',
    title: 'Quarterly Business Review',
    meeting_date: '2024-08-15T10:00:00.000Z',
    duration: 90,
    participants: ['John Smith (CEO)', 'Sarah Johnson (CTO)', 'Mike Davis (Sales)'],
    notes: 'Discussed Q3 performance and roadmap for Q4. Client is very happy with the current progress and wants to expand their usage. Key topics covered:\n\n1. Performance metrics review\n2. Feature requests discussion\n3. Contract renewal planning\n4. Technical integration updates',
    action_items: [
      'Prepare detailed Q4 roadmap presentation',
      'Schedule technical deep-dive session',
      'Send contract renewal proposal',
      'Set up dedicated slack channel'
    ],
    next_steps: 'Follow up with detailed proposal by end of week. Schedule technical session for next month.',
    screenshots: []
  },
  {
    customer_id: '1',
    title: 'Technical Integration Meeting',
    meeting_date: '2024-08-10T14:00:00.000Z',
    duration: 60,
    participants: ['Sarah Johnson (CTO)', 'David Wilson (Tech Lead)'],
    notes: 'Deep dive into API integration challenges and solutions. Reviewed current implementation and identified optimization opportunities.',
    action_items: [
      'Update API documentation',
      'Provide code samples for better integration',
      'Schedule follow-up in 2 weeks'
    ],
    next_steps: 'Implementation of recommended changes and testing phase.',
    screenshots: []
  },
  {
    customer_id: '2',
    title: 'Product Demo and Feedback',
    meeting_date: '2024-08-12T15:30:00.000Z',
    duration: 45,
    participants: ['Emily Brown (Product Manager)', 'Alex Thompson (Designer)'],
    notes: 'Demonstrated new features and collected valuable feedback for upcoming release.',
    action_items: [
      'Incorporate UI feedback',
      'Prepare beta version for testing'
    ],
    next_steps: 'Release beta version next week for client testing.',
    screenshots: []
  }
];

// Add meetings to mock data
console.log('Adding sample meetings...');
for (const meeting of sampleMeetings) {
  await mockApi.meetings.create(meeting);
  console.log(`Added meeting: ${meeting.title}`);
}
console.log('Done!');
