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
  discounts?: Discount[];
  createdAt?: any;
};

export type Appointment = {
  id: string;
  patientId: string;
  patientName: string;
  procedure: string;
  time: string;
  date: string;
  doctor: string;
  description?: string;
  createdAt?: any;
};

export type Treatment = {
  id:string;
  name: string;
  description: string;
  amount: number;
  createdAt?: any;
};

export type Payment = {
  amount: number;
  date: string;
  method: 'Cash' | 'Card' | 'Bank Transfer' | 'Other';
  dateAdded: string;
};

export type Discount = {
  reason: string;
  amount: number;
  dateAdded: string;
};

export type Expense = {
    id: string;
    name: string;
    category: 'Equipment' | 'Supplies' | 'Utilities' | 'Salaries' | 'Rent' | 'Other';
    amount: number;
    date: string;
    createdAt?: any;
};
