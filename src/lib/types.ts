
export type Patient = {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  dob: string;
  bloodType: string;
  allergies: string[];
  chronicConditions: string[];
};

export type Doctor = {
  id: string;
  name: string;
  specialty: string;
  avatarUrl: string;
  location: string;
  rating: number;
  reviews: number;
  availability: Record<string, string[]>; // date -> [time slots]
};

export type Appointment = {
  id: string;
  patientId: string;
  doctorId: string;
  date: string;
  time: string;
  status: 'Upcoming' | 'Completed' | 'Cancelled';
  reason: string;
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
};

export type MedicineOrder = {
  id: string;
  prescriptionId: string;
  storeName: string;
  status: 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';
  orderDate: string;
  estimatedDelivery: string;
};

export type Consent = {
  id: string;
  doctorId: string;
  patientId: string;
  grantedDate: string;
  expiryDate: string;
  status: 'Active' | 'Expired' | 'Revoked';
};
