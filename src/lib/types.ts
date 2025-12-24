
export type Patient = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatarUrl?: string;
  dateOfBirth: string;
};

export type Doctor = {
  id: string;
  name: string;
  firstName: string;
  lastName:string;
  specialty: string;
  avatarUrl?: string;
  location: string;
  rating: number;
  reviews: number;
};

export type Appointment = {
  id: string;
  patientId: string;
  doctorId: string;
  appointmentDateTime: string;
  notes?: string;
  reason?: string;
};

export type Prescription = {
  id:string;
  patientId: string;
  doctorId: string;
  date: string;
  medicines: {
    name: string;
    dosage: string;
    frequency: string;
  }[];
  notes?: string;
};

export type Order = {
  id: string;
  patientId: string;
  medicineStoreId: string;
  prescriptionId: string;
  orderDate: string;
  status: 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';
};

export type DataConsent = {
  id: string;
  doctorId: string;
  patientId: string;
  startDate: string;
  endDate: string;
  consentGiven: boolean;
};

export type Allergy = {
    id: string;
    name: string;
    reaction: string;
};

export type ChronicCondition = {
    id: string;
    name: string;
    diagnosisDate: string;
};

export type MedicineStore = {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
};

