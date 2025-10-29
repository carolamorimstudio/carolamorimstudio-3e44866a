export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  password: string;
  type: 'admin' | 'client';
}

export interface Service {
  id: string;
  name: string;
  description: string;
  price: string;
}

export interface TimeSlot {
  id: string;
  serviceId: string;
  date: string;
  time: string;
  status: 'available' | 'booked';
}

export interface Appointment {
  id: string;
  clientId: string;
  serviceId: string;
  serviceName?: string;
  date: string;
  time: string;
  status: 'active' | 'cancelled';
  clientName?: string;
}
