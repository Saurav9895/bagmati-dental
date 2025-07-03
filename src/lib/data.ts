import type { Patient, Appointment } from './types';

export const mockPatients: Patient[] = [
  { id: 'DF001', name: 'John Doe', dob: '1985-05-20', email: 'john.doe@example.com', phone: '123-456-7890', status: 'Active', lastVisit: '2024-06-15', address: '123 Main St, Anytown, USA', medicalHistory: 'Allergic to penicillin.' },
  { id: 'DF002', name: 'Jane Smith', dob: '1992-08-12', email: 'jane.smith@example.com', phone: '234-567-8901', status: 'Active', lastVisit: '2024-07-01', address: '456 Oak Ave, Somecity, USA', medicalHistory: 'None' },
  { id: 'DF003', name: 'Michael Johnson', dob: '1978-11-30', email: 'michael.j@example.com', phone: '345-678-9012', status: 'Active', lastVisit: '2024-05-10', address: '789 Pine Ln, Otherville, USA', medicalHistory: 'High blood pressure.' },
  { id: 'DF004', name: 'Emily Davis', dob: '2001-02-18', email: 'emily.davis@example.com', phone: '456-789-0123', status: 'Inactive', lastVisit: '2023-01-22', address: '101 Maple Dr, Newplace, USA' },
  { id: 'DF005', name: 'Chris Wilson', dob: '1995-07-25', email: 'chris.wilson@example.com', phone: '567-890-1234', status: 'Active', lastVisit: '2024-06-28', address: '212 Birch Rd, Townsville, USA', medicalHistory: 'Asthma.' },
];

export const mockAppointments: Appointment[] = [
  { id: 'APT001', patientName: 'John Doe', procedure: 'Routine Check-up', time: '10:00 AM', date: new Date().toISOString().split('T')[0], doctor: 'Dr. Adams' },
  { id: 'APT002', patientName: 'Jane Smith', procedure: 'Teeth Whitening', time: '11:30 AM', date: new Date().toISOString().split('T')[0], doctor: 'Dr. Bell' },
  { id: 'APT003', patientName: 'Chris Wilson', procedure: 'Cavity Filling', time: '02:00 PM', date: new Date().toISOString().split('T')[0], doctor: 'Dr. Adams' },
  { id: 'APT004', patientName: 'Michael Johnson', procedure: 'Root Canal', time: '09:00 AM', date: new Date(Date.now() + 86400000).toISOString().split('T')[0], doctor: 'Dr. Clark' },
  { id: 'APT005', patientName: 'Sarah Brown', procedure: 'Dental Implants Consultation', time: '03:30 PM', date: new Date(Date.now() + 86400000).toISOString().split('T')[0], doctor: 'Dr. Bell' },
];
