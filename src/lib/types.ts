






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

export type PrescribedMedicine = {
  name: string;
  dosage: string;
  frequency: string;
};

export type AnalyzedMedicine = PrescribedMedicine & {
  inventoryStatus: 'Available' | 'Low Stock' | 'Out of Stock' | 'Unknown';
};


export type Prescription = {
  id:string;
  patientId: string;
  doctorId: string;
  date: string;
  medicines: PrescribedMedicine[];
  notes?: string;
};

export type Order = {
  id: string;
  patientId: string;
  medicineStoreId: string;
  prescriptionId: string;
  orderDate: string;
  status: 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';
  medicines: AnalyzedMedicine[];
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

export type Medicine = {
    id: string;
    name: string;
    strength: string;
    saltComposition: string;
    category: string;
    isPrescriptionRequired: boolean;
    storageType: 'Normal' | 'Cold';
    commonUses: string;
    safetyNotes: string;
    stock: number;
    expiryDate: string;
    status?: 'In Stock' | 'Low Stock' | 'Out of Stock' | 'Near Expiry';
}

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
  analyzedImageUrl?: string;
  aiAnalysis: {
    summary: string;
    criticalFindings?: string;
    keyFindings?: string;
    healthIssues?: string;
    recommendedSpecialists?: string;
    recommendedMedications?: string;
    urgencyClassification: 'Emergency' | 'Urgent' | 'Routine' | 'Normal';
  };
};





