

export type ClinicalExamination = {
  id: string;
  date: string;
  chiefComplaint: string[];
  medicalHistory?: string;
  dentalHistory?: string;
  observationNotes?: string;
};

export type AssignedTreatment = {
  id: string; 
  treatmentId: string; 
  name: string;
  cost: number;
  dateAdded: string;
  tooth?: string;
  multiplyCost?: boolean;
  discountType?: 'Amount' | 'Percentage';
  discountValue?: number;
  discountAmount?: number;
};

export type Prescription = {
  id: string;
  date: string;
  notes: string;
  dateAdded: string;
};

export type ToothExamination = {
  id: string;
  tooth: number | string;
  date: string;
  dentalExamination: string;
  investigation?: string;
  diagnosis: string;
}

export type Patient = {
  id: string;
  name: string;
  dob?: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  email?: string;
  phone: string;
  status: 'Active' | 'Inactive';
  lastVisit: string;
  address: string;
  registrationNumber?: string;
  assignedTreatments?: AssignedTreatment[];
  payments?: Payment[];
  discounts?: Discount[];
  prescriptions?: Prescription[];
  clinicalExaminations?: ClinicalExamination[];
  toothExaminations?: ToothExamination[];
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
  createdAt?: any;
};

export type Payment = {
  amount: number;
  date: string;
  method: 'Cash' | 'Bank Transfer';
  dateAdded: string;
};

export type Discount = {
  id: string;
  reason: string;
  type: 'Amount' | 'Percentage';
  value: number; // The raw value (e.g., 10 for 10% or 100 for 100 Rs)
  amount: number; // The calculated discount amount in currency
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

export type ChiefComplaint = {
  id: string;
  name: string;
  createdAt?: any;
};

export type DentalExamination = {
  id: string;
  name: string;
  createdAt?: any;
};

    
