export interface Meeting {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  meeting_date: string;
  duration?: number;
  participants: string[];
  screenshots: (string | File)[];
  customerName: string;
  customerId: string;
  customer_id: string;
  notes?: string;
  detected_language?: string;
  action_items?: string[];
  next_steps?: string;
  customer?: {
    name: string;
  };
}

export interface Customer {
  id: string;
  name: string;
  logo?: string;
  logo_url?: string;
  arr_usd: number;
  notes?: string;
  meetings_count?: number;
  last_meeting_date?: string;
  is_at_risk?: boolean;
  is_satisfied?: boolean;
  renewal_date?: string;
  created_at: string;
  updated_at: string;
  contacts?: Array<{
    id: string;
    name: string;
    role: string;
    title?: string;
    email: string;
    phone: string;
    notes?: string;
  }>;
  tasks?: Task[];
}

export interface Contact {
  id?: string;
  name: string;
  title: string;
  role?: string;
  email: string;
  phone: string;
  notes?: string;
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
