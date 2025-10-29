export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  password: string;
  type: 'admin' | 'client';
}

export interface TimeSlot {
  id: string;
  date: string;
  time: string;
  status: 'available' | 'booked';
}

export interface Appointment {
  id: string;
  clientId: string;
  date: string;
  time: string;
  status: 'active' | 'cancelled';
  clientName?: string;
}
