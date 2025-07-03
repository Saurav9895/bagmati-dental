export type Patient = {
  id: string;
  name: string;
  dob: string;
  email: string;
  phone: string;
  status: 'Active' | 'Inactive';
  lastVisit: string;
  address: string;
  medicalHistory?: string;
};

export type Appointment = {
  id: string;
  patientName: string;
  procedure: string;
  time: string;
  date: string;
  doctor: string;
};
