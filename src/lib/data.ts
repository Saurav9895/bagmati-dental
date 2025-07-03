import type { Appointment } from './types';

export const mockAppointments: Appointment[] = [
  { id: 'APT001', patientName: 'John Doe', procedure: 'Routine Check-up', time: '10:00 AM', date: new Date().toISOString().split('T')[0], doctor: 'Dr. Adams' },
  { id: 'APT002', patientName: 'Jane Smith', procedure: 'Teeth Whitening', time: '11:30 AM', date: new Date().toISOString().split('T')[0], doctor: 'Dr. Bell' },
  { id: 'APT003', patientName: 'Chris Wilson', procedure: 'Cavity Filling', time: '02:00 PM', date: new Date().toISOString().split('T')[0], doctor: 'Dr. Adams' },
  { id: 'APT004', patientName: 'Michael Johnson', procedure: 'Root Canal', time: '09:00 AM', date: new Date(Date.now() + 86400000).toISOString().split('T')[0], doctor: 'Dr. Clark' },
  { id: 'APT005', patientName: 'Sarah Brown', procedure: 'Dental Implants Consultation', time: '03:30 PM', date: new Date(Date.now() + 86400000).toISOString().split('T')[0], doctor: 'Dr. Bell' },
];
