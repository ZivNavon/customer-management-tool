import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Types
export interface Contact {
  id?: string;
  name: string;
  title: string;
  email: string;
  phone: string;
  notes: string;
}

export interface Customer {
  id: string;
  name: string;
  logo_url?: string;
  arr_usd: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  last_meeting_date?: string;
  contacts_count?: number;
  meetings_count?: number;
  is_at_risk?: boolean;
  is_satisfied?: boolean;
  renewal_date?: string;
  contacts?: Contact[];
  tasks?: Task[];
}

export interface Meeting {
  id: string;
  customer_id: string;
  meeting_date: string;
  title: string;
  raw_notes?: string;
  created_at: string;
  assets: MeetingAsset[];
  summaries: MeetingSummary[];
  email_drafts: EmailDraft[];
}

export interface MeetingAsset {
  id: string;
  kind: 'image' | 'file';
  file_url: string;
  file_name?: string;
  uploaded_at: string;
}

export interface MeetingSummary {
  id: string;
  version: number;
  language: string;
  summary_md: string;
  model: string;
  created_by_ai: boolean;
  created_at: string;
}

export interface EmailDraft {
  id: string;
  version: number;
  subject: string;
  body_html: string;
  to_emails: string[];
  cc_emails: string[];
  language: string;
  created_by_ai: boolean;
  created_at: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  due_date?: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in_progress' | 'completed';
  created_at: string;
  updated_at: string;
  completed_at?: string;
  customer_id: string;
  source?: 'manual' | 'meeting_next_steps';
  source_meeting_id?: string;
}

export interface User {
  id: string;
  email: string;
  display_name?: string;
  locale: string;
  timezone: string;
  role: string;
}

// API functions
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
};

export const customerApi = {
  getAll: (params?: { search?: string; limit?: number; offset?: number }) =>
    api.get('/customers', { params }),
  getById: (id: string) => api.get(`/customers/${id}`),
  create: (data: Omit<Customer, 'id' | 'created_at' | 'updated_at'>) =>
    api.post('/customers', data),
  update: (id: string, data: Partial<Customer>) =>
    api.put(`/customers/${id}`, data),
  delete: (id: string) => api.delete(`/customers/${id}`),
};

export const contactApi = {
  create: (customerId: string, data: Omit<Contact, 'id' | 'customer_id'>) =>
    api.post(`/customers/${customerId}/contacts`, data),
  update: (id: string, data: Partial<Contact>) =>
    api.put(`/contacts/${id}`, data),
  delete: (id: string) => api.delete(`/contacts/${id}`),
};

export const meetingApi = {
  getByCustomer: (customerId: string) =>
    api.get(`/customers/${customerId}/meetings`),
  getById: (id: string) => api.get(`/meetings/${id}`),
  create: (data: Record<string, unknown>) =>
    api.post(`/customers/${(data.customer_id as string)}/meetings`, data),
  update: (id: string, data: Record<string, unknown>) =>
    api.put(`/meetings/${id}`, data),
  delete: (id: string) => api.delete(`/meetings/${id}`),
  uploadAsset: (meetingId: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/meetings/${meetingId}/assets`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  generateSummary: (meetingId: string, language: string = 'en') =>
    api.post(`/meetings/${meetingId}/ai/summarize`, null, { params: { language } }),
  generateEmailDraft: (meetingId: string, language: string = 'en') =>
    api.post(`/meetings/${meetingId}/ai/draft-email`, null, { params: { language } }),
};

export const taskApi = {
  getByCustomer: (customerId: string) =>
    api.get(`/customers/${customerId}/tasks`),
  getById: (id: string) => api.get(`/tasks/${id}`),
  create: (data: Omit<Task, 'id' | 'created_at' | 'updated_at'>) =>
    api.post(`/customers/${data.customer_id}/tasks`, data),
  update: (id: string, data: Partial<Task>) =>
    api.put(`/tasks/${id}`, data),
  delete: (id: string) => api.delete(`/tasks/${id}`),
  createFromMeetingNextSteps: (meetingId: string, customerId: string, nextSteps: string) =>
    api.post(`/meetings/${meetingId}/create-tasks`, { customer_id: customerId, next_steps: nextSteps }),
  getCompleted: (customerId?: string) =>
    api.get('/tasks/completed', { params: customerId ? { customer_id: customerId } : {} }),
};

// Group customer actions into sub-actions
interface CustomerAction {
  customerId: string;
  actionId: string;
  description: string;
}

export function groupCustomerActions(actions: CustomerAction[]): { customerId: string; subActions: CustomerAction[] }[] {
  const groupedActions: Record<string, CustomerAction[]> = {};

  actions.forEach((action: CustomerAction) => {
    const customerId = action.customerId;
    if (!groupedActions[customerId]) {
      groupedActions[customerId] = [];
    }
    groupedActions[customerId].push(action);
  });

  return Object.entries(groupedActions).map(([customerId, subActions]) => ({
    customerId,
    subActions,
  }));
}
