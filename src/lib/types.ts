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
  payments?: Payment[];
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

export type Payment = {
  amount: number;
  date: string;
  method: 'Cash' | 'Card' | 'Bank Transfer' | 'Other';
  dateAdded: string;
};
