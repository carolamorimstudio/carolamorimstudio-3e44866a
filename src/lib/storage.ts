import { User, TimeSlot, Appointment } from '@/types';

const USERS_KEY = 'carol_studio_users';
const TIMESLOTS_KEY = 'carol_studio_timeslots';
const APPOINTMENTS_KEY = 'carol_studio_appointments';
const CURRENT_USER_KEY = 'carol_studio_current_user';

// Initialize with admin user
export const initializeStorage = () => {
  const users = getUsers();
  if (users.length === 0) {
    const adminUser: User = {
      id: '1',
      name: 'Administrador',
      email: 'admin@carolamorimstudio.com',
      phone: '',
      password: 'admin123',
      type: 'admin'
    };
    localStorage.setItem(USERS_KEY, JSON.stringify([adminUser]));
  }
};

export const getUsers = (): User[] => {
  const data = localStorage.getItem(USERS_KEY);
  return data ? JSON.parse(data) : [];
};

export const saveUser = (user: User): void => {
  const users = getUsers();
  users.push(user);
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

export const updateUser = (userId: string, updates: Partial<User>): void => {
  const users = getUsers();
  const index = users.findIndex(u => u.id === userId);
  if (index !== -1) {
    users[index] = { ...users[index], ...updates };
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }
};

export const deleteUser = (userId: string): void => {
  const users = getUsers().filter(u => u.id !== userId);
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

export const findUserByEmail = (email: string): User | undefined => {
  return getUsers().find(u => u.email === email);
};

export const getCurrentUser = (): User | null => {
  const data = localStorage.getItem(CURRENT_USER_KEY);
  return data ? JSON.parse(data) : null;
};

export const setCurrentUser = (user: User | null): void => {
  if (user) {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(CURRENT_USER_KEY);
  }
};

export const getTimeSlots = (): TimeSlot[] => {
  const data = localStorage.getItem(TIMESLOTS_KEY);
  return data ? JSON.parse(data) : [];
};

export const saveTimeSlot = (slot: TimeSlot): void => {
  const slots = getTimeSlots();
  slots.push(slot);
  localStorage.setItem(TIMESLOTS_KEY, JSON.stringify(slots));
};

export const updateTimeSlot = (slotId: string, updates: Partial<TimeSlot>): void => {
  const slots = getTimeSlots();
  const index = slots.findIndex(s => s.id === slotId);
  if (index !== -1) {
    slots[index] = { ...slots[index], ...updates };
    localStorage.setItem(TIMESLOTS_KEY, JSON.stringify(slots));
  }
};

export const deleteTimeSlot = (slotId: string): void => {
  const slots = getTimeSlots().filter(s => s.id !== slotId);
  localStorage.setItem(TIMESLOTS_KEY, JSON.stringify(slots));
};

export const getAppointments = (): Appointment[] => {
  const data = localStorage.getItem(APPOINTMENTS_KEY);
  return data ? JSON.parse(data) : [];
};

export const saveAppointment = (appointment: Appointment): void => {
  const appointments = getAppointments();
  appointments.push(appointment);
  localStorage.setItem(APPOINTMENTS_KEY, JSON.stringify(appointments));
};

export const updateAppointment = (appointmentId: string, updates: Partial<Appointment>): void => {
  const appointments = getAppointments();
  const index = appointments.findIndex(a => a.id === appointmentId);
  if (index !== -1) {
    appointments[index] = { ...appointments[index], ...updates };
    localStorage.setItem(APPOINTMENTS_KEY, JSON.stringify(appointments));
  }
};

export const deleteAppointment = (appointmentId: string): void => {
  const appointments = getAppointments().filter(a => a.id !== appointmentId);
  localStorage.setItem(APPOINTMENTS_KEY, JSON.stringify(appointments));
};
