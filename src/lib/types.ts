

export type AssignedTreatment = {
  id: string;
  name: string;
  description: string;
  amount: number;
  dateAdded: string;
  tooth?: number; // Optional tooth number
};

export type Patient = {
  id: string;
  name: string;
  dob?: string;
  email?: string;
  phone: string;
  status: 'Active' | 'Inactive';
  lastVisit: string;
  address: string;
  medicalHistory?: string;
  registrationNumber?: string;
  assignedTreatments?: AssignedTreatment[];
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
  status?: 'Scheduled' | 'Completed';
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
  method: 'Cash' | 'Bank Transfer';
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

export type Doctor = {
  id: string;
  name: string;
  specialization: string;
  phone: string;
  email?: string;
  createdAt?: any;
};

export type StaffMember = {
  id: string;
  name: string;
  role: string;
  phone: string;
  email?: string;
  createdAt?: any;
};

export type StockItem = {
  id: string;
  name: string;
  category: string;
  quantity: number;
  reorderLevel: number;
  supplier?: string;
  lastUpdatedAt?: any;
  createdAt?: any;
};
