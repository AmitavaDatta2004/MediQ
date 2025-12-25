

export type UserRole = 'patient' | 'doctor' | 'medicine_store';

export type User = {
    id: string;
    email: string;
    role: UserRole;
};

export type Patient = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatarUrl?: string;
  dateOfBirth: string;
  height?: number;
  weight?: number;
  bloodGroup?: string;
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
  status: 'Upcoming' | 'Completed' | 'Cancelled';
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
};

export type ChronicCondition = {
    id: string;
    name: string;
};

export type MedicineStore = {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  ownerName?: string;
  licenseNumber?: string;
  licenseDocumentUrl?: string;
  licenseExpiryDate?: string;
  city?: string;
  state?: string;
  pincode?: string;
  openingTime?: string;
  closingTime?: string;
  workingDays?: string[];
  homeDelivery?: boolean;
  services?: {
    prescription?: boolean;
    otc?: boolean;
    generic?: boolean;
  }
};

export type MedicalReport = {
    id: string;
    patientId: string;
    uploadDate: string;
    reportType: string;
    fileUrl: string;
    aiSummary: string;
    aiPotentialIssues: string;
    aiNextSteps: string;
}

export type ScanImage = {
    id: string;
    patientId: string;
    uploadDate: string;
    scanType: 'X-ray' | 'CT' | 'MRI';
    imageUrl: string;
    aiAnalysis: {
        anomaliesDetected: boolean;
        anomalyReport: string;
        heatmapDataUri?: string;
        urgencyClassification: 'Emergency' | 'Urgent' | 'Routine' | 'Normal';
    }
}
