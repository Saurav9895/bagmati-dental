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
  registrationNumber?: string;
  assignedTreatments?: {
    id: string;
    name: string;
    description: string;
    amount: number;
    dateAdded: string;
  }[];
};

export type Appointment = {
  id: string;
  patientName: string;
  procedure: string;
  time: string;
  date: string;
  doctor: string;
};

export type Treatment = {
  id: string;
  name: string;
  description: string;
  amount: number;
};
