import { Customer } from './api';

// Define proper types for API responses
interface Contact {
  id?: string;
  name: string;
  title: string;
  email: string;
  phone: string;
  notes: string;
}

interface CustomerCreateData {
  name: string;
  logo_url?: string;
  arr_usd: number;
  notes?: string;
  renewal_date?: string;
  last_meeting_date?: string;
  contacts?: Contact[];
}

interface Meeting {
  id: string;
  customer_id: string;
  title: string;
  meeting_date: string;
  duration: number;
  participants: string[];
  notes: string;
  action_items: string[];
  next_steps: string;
  screenshots: (File | string)[];
  created_at: string;
  updated_at: string;
}

// Storage keys for localStorage
const STORAGE_KEY = 'customers_mock_data';
const MEETINGS_STORAGE_KEY = 'meetings_mock_data';

// Meeting storage functions
const loadMeetings = (): Meeting[] => {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem(MEETINGS_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.warn('Failed to load meetings from localStorage:', error);
  }
  
  return [];
};

const saveMeetings = (meetings: Meeting[]) => {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(MEETINGS_STORAGE_KEY, JSON.stringify(meetings));
  } catch (error) {
    console.warn('Failed to save meetings to localStorage:', error);
  }
};

// Load customers from localStorage or use default data
const loadCustomers = (): Customer[] => {
  if (typeof window === 'undefined') return getDefaultCustomers();
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.warn('Failed to load customers from localStorage:', error);
  }
  
  const defaultCustomers = getDefaultCustomers();
  saveCustomers(defaultCustomers);
  return defaultCustomers;
};

// Save customers to localStorage
const saveCustomers = (customers: Customer[]) => {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(customers));
  } catch (error) {
    console.warn('Failed to save customers to localStorage:', error);
  }
};

// Default customer data
const getDefaultCustomers = (): Customer[] => [
  {
    id: '1',
    name: 'Acme Corp',
    logo_url: undefined,
    arr_usd: 120000,
    notes: 'Key client in healthcare sector',
    created_at: '2025-01-15T10:00:00Z',
    updated_at: '2025-01-15T10:00:00Z',
    last_meeting_date: '2024-06-15', // 7 months ago - should be red
    renewal_date: '2025-12-31', // Within 6 months - should show warning
    contacts_count: 3,
    meetings_count: 5,
    contacts: [
      {
        id: '1',
        name: 'John Smith',
        title: 'CEO',
        email: 'john.smith@acmecorp.com',
        phone: '+1-555-0101',
        notes: 'Main decision maker'
      },
      {
        id: '2',
        name: 'Sarah Johnson',
        title: 'CTO',
        email: 'sarah.j@acmecorp.com',
        phone: '+1-555-0102',
        notes: 'Technical contact'
      }
    ]
  },
  {
    id: '2', 
    name: 'TechStart Inc',
    logo_url: undefined,
    arr_usd: 85000,
    notes: 'Growing startup, potential for expansion',
    created_at: '2025-01-10T14:30:00Z',
    updated_at: '2025-01-10T14:30:00Z',
    last_meeting_date: '2024-09-15', // 4 months ago - should be orange
    renewal_date: '2025-08-17', // Expired (yesterday) - should show red
    contacts_count: 2,
    meetings_count: 3,
    contacts: [
      {
        id: '3',
        name: 'Mike Chen',
        title: 'Founder',
        email: 'mike@techstart.com',
        phone: '+1-555-0201',
        notes: 'Very responsive'
      }
    ]
  },
  {
    id: '3', 
    name: 'Potato Industries',
    logo_url: undefined,
    arr_usd: 45000,
    notes: 'Agricultural technology company',
    created_at: '2025-01-05T09:00:00Z',
    updated_at: '2025-01-05T09:00:00Z',
    last_meeting_date: undefined, // No meeting date - should be red
    renewal_date: '2026-06-30', // Beyond 6 months - no warning
    contacts_count: 1,
    meetings_count: 2,
    contacts: [
      {
        id: '4',
        name: 'John Potato',
        title: 'Head of Operations',
        email: 'john@potato-industries.com',
        phone: '+1-555-0301',
        notes: 'Handles all operational decisions'
      }
    ]
  }
];

// Initialize customers data and nextId
let mockCustomers = loadCustomers();
let mockMeetings = loadMeetings();
let nextId = Math.max(...mockCustomers.map(c => parseInt(c.id)), 3) + 1;
let nextMeetingId = Math.max(...mockMeetings.map(m => parseInt(m.id)), 0) + 1;

// Mock delay to simulate network request
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const mockApi = {
  customers: {
    getAll: async (params?: { search?: string; limit?: number; offset?: number }) => {
      await delay(500);
      let filteredCustomers = [...mockCustomers];
      
      if (params?.search) {
        const searchTerm = params.search.toLowerCase();
        filteredCustomers = filteredCustomers.filter(customer => {
          // Search in customer name
          if (customer.name.toLowerCase().includes(searchTerm)) {
            return true;
          }
          
          // Search in customer notes
          if (customer.notes?.toLowerCase().includes(searchTerm)) {
            return true;
          }
          
          // Search in contacts
          if (customer.contacts) {
            return customer.contacts.some(contact => 
              contact.name.toLowerCase().includes(searchTerm) ||
              contact.title.toLowerCase().includes(searchTerm) ||
              contact.email.toLowerCase().includes(searchTerm) ||
              contact.phone.includes(searchTerm) ||
              contact.notes.toLowerCase().includes(searchTerm)
            );
          }
          
          return false;
        });
      }
      
      const offset = params?.offset || 0;
      const limit = params?.limit || 50;
      const paginatedCustomers = filteredCustomers.slice(offset, offset + limit);
      
      return { data: paginatedCustomers };
    },

    getById: async (id: string) => {
      await delay(300);
      const customer = mockCustomers.find(c => c.id === id);
      if (!customer) {
        throw new Error('Customer not found');
      }
      return { data: customer };
    },

    create: async (data: CustomerCreateData) => {
      await delay(800);
      const newCustomer: Customer = {
        id: nextId.toString(),
        name: data.name,
        logo_url: data.logo_url,
        arr_usd: data.arr_usd,
        notes: data.notes || '',
        renewal_date: data.renewal_date,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_meeting_date: data.last_meeting_date,
        contacts_count: data.contacts?.length || 0,
        meetings_count: 0,
        contacts: data.contacts || []
      };
      
      mockCustomers.push(newCustomer);
      nextId++;
      saveCustomers(mockCustomers);
      
      return { data: newCustomer };
    },

    update: async (id: string, data: Partial<Customer>) => {
      await delay(600);
      const customerIndex = mockCustomers.findIndex(c => c.id === id);
      if (customerIndex === -1) {
        throw new Error('Customer not found');
      }
      
      mockCustomers[customerIndex] = {
        ...mockCustomers[customerIndex],
        ...data,
        updated_at: new Date().toISOString()
      };
      
      saveCustomers(mockCustomers);
      return { data: mockCustomers[customerIndex] };
    },

    delete: async (id: string) => {
      await delay(400);
      const customerIndex = mockCustomers.findIndex(c => c.id === id);
      if (customerIndex === -1) {
        throw new Error('Customer not found');
      }
      
      mockCustomers.splice(customerIndex, 1);
      saveCustomers(mockCustomers);
      return { data: { message: 'Customer deleted successfully' } };
    }
  },

  meetings: {
    list: async () => {
      await delay(200);
      return { data: mockMeetings };
    },

    getByCustomer: async (customerId: string) => {
      await delay(300);
      const customerMeetings = mockMeetings.filter(m => m.customer_id === customerId)
        .sort((a, b) => new Date(b.meeting_date).getTime() - new Date(a.meeting_date).getTime());
      return { data: customerMeetings };
    },

    getById: async (id: string) => {
      await delay(200);
      const meeting = mockMeetings.find(m => m.id === id);
      if (!meeting) {
        throw new Error('Meeting not found');
      }
      return { data: meeting };
    },

    create: async (data: Record<string, unknown>) => {
      await delay(800);
      const newMeeting: Meeting = {
        id: nextMeetingId.toString(),
        customer_id: data.customer_id as string,
        title: data.title as string,
        meeting_date: data.meeting_date as string,
        duration: (data.duration as number) || 60,
        participants: (data.participants as string[]) || [],
        notes: (data.notes as string) || '',
        action_items: (data.action_items as string[]) || [],
        next_steps: (data.next_steps as string) || '',
        screenshots: (data.screenshots as (string | File)[]) || [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      mockMeetings.push(newMeeting);
      nextMeetingId++;
      saveMeetings(mockMeetings);
      
      // Update customer meeting count and last meeting date
      const customerIndex = mockCustomers.findIndex(c => c.id === data.customer_id);
      if (customerIndex !== -1) {
        mockCustomers[customerIndex].meetings_count = (mockCustomers[customerIndex].meetings_count || 0) + 1;
        mockCustomers[customerIndex].last_meeting_date = data.meeting_date as string;
        saveCustomers(mockCustomers);
      }
      
      return { data: newMeeting };
    },

    update: async (id: string, data: Record<string, unknown>) => {
      await delay(700);
      const meetingIndex = mockMeetings.findIndex(m => m.id === id);
      if (meetingIndex === -1) {
        throw new Error('Meeting not found');
      }
      
      mockMeetings[meetingIndex] = {
        ...mockMeetings[meetingIndex],
        ...data,
        updated_at: new Date().toISOString()
      };
      
      saveMeetings(mockMeetings);
      return { data: mockMeetings[meetingIndex] };
    },

    delete: async (id: string) => {
      await delay(400);
      const meetingIndex = mockMeetings.findIndex(m => m.id === id);
      if (meetingIndex === -1) {
        throw new Error('Meeting not found');
      }
      
      const meeting = mockMeetings[meetingIndex];
      mockMeetings.splice(meetingIndex, 1);
      saveMeetings(mockMeetings);
      
      // Update customer meeting count
      const customerIndex = mockCustomers.findIndex(c => c.id === meeting.customer_id);
      if (customerIndex !== -1) {
        mockCustomers[customerIndex].meetings_count = Math.max((mockCustomers[customerIndex].meetings_count || 1) - 1, 0);
        
        // Update last meeting date to the most recent remaining meeting
        const remainingMeetings = mockMeetings
          .filter(m => m.customer_id === meeting.customer_id)
          .sort((a, b) => new Date(b.meeting_date).getTime() - new Date(a.meeting_date).getTime());
        
        mockCustomers[customerIndex].last_meeting_date = remainingMeetings.length > 0 
          ? remainingMeetings[0].meeting_date 
          : undefined;
        
        saveCustomers(mockCustomers);
      }
      
      return { data: { message: 'Meeting deleted successfully' } };
    }
  },

  // Utility functions for development
  utils: {
    clearAll: () => {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(MEETINGS_STORAGE_KEY);
        mockCustomers = getDefaultCustomers();
        mockMeetings = [];
        nextId = 3;
        nextMeetingId = 1;
      }
    },
    
    getStoredCount: () => ({ customers: mockCustomers.length, meetings: mockMeetings.length }),
    
    resetToDefaults: () => {
      const defaultCustomers = getDefaultCustomers();
      saveCustomers(defaultCustomers);
      mockCustomers = defaultCustomers;
      mockMeetings = [];
      saveMeetings(mockMeetings);
      nextId = 3;
      nextMeetingId = 1;
    }
  }
};
