import type { Patient, Doctor, Appointment, Prescription, MedicineOrder, Consent } from './types';

export const patient: Patient = {
  id: 'p001',
  name: 'Alex Doe',
  email: 'patient@mediquest.ai',
  avatarUrl: 'https://picsum.photos/seed/101/100/100',
  dob: '1990-05-15',
  bloodType: 'O+',
  allergies: ['Pollen', 'Penicillin'],
  chronicConditions: ['Asthma'],
};

export const doctors: Doctor[] = [
  {
    id: 'd001',
    name: 'Dr. Evelyn Reed',
    specialty: 'Cardiologist',
    avatarUrl: 'https://picsum.photos/seed/102/100/100',
    location: 'Springfield, IL',
    rating: 4.9,
    reviews: 215,
    availability: {
      '2024-08-10': ['09:00 AM', '10:00 AM', '02:00 PM'],
      '2024-08-11': ['09:30 AM', '11:00 AM'],
    },
  },
  {
    id: 'd002',
    name: 'Dr. Marcus Chen',
    specialty: 'Dermatologist',
    avatarUrl: 'https://picsum.photos/seed/103/100/100',
    location: 'Shelbyville, IL',
    rating: 4.8,
    reviews: 189,
    availability: {
      '2024-08-10': ['11:00 AM', '03:00 PM'],
      '2024-08-12': ['10:00 AM', '11:30 AM', '04:00 PM'],
    },
  },
  {
    id: 'd003',
    name: 'Dr. Sarah Jenkins',
    specialty: 'Pediatrician',
    avatarUrl: 'https://picsum.photos/seed/104/100/100',
    location: 'Springfield, IL',
    rating: 4.9,
    reviews: 302,
    availability: {
      '2024-08-11': ['09:00 AM', '09:30 AM', '10:00 AM'],
      '2024-08-13': ['02:00 PM', '02:30 PM'],
    },
  },
   {
    id: 'd004',
    name: 'Dr. Omar Hassan',
    specialty: 'Neurologist',
    avatarUrl: 'https://picsum.photos/seed/105/100/100',
    location: 'Capital City, IL',
    rating: 4.7,
    reviews: 150,
    availability: {
      '2024-08-12': ['09:00 AM', '11:00 AM', '01:00 PM'],
      '2024-08-14': ['10:00 AM', '12:00 PM'],
    },
  },
];

export const appointments: Appointment[] = [
  {
    id: 'a001',
    patientId: 'p001',
    doctorId: 'd001',
    date: '2024-08-10',
    time: '10:00 AM',
    status: 'Upcoming',
    reason: 'Annual Check-up',
  },
  {
    id: 'a002',
    patientId: 'p001',
    doctorId: 'd002',
    date: '2024-07-20',
    time: '02:00 PM',
    status: 'Completed',
    reason: 'Skin rash consultation',
  },
   {
    id: 'a003',
    patientId: 'p001',
    doctorId: 'd003',
    date: '2024-06-15',
    time: '11:00 AM',
    status: 'Completed',
    reason: 'Follow-up',
  },
];

export const prescriptions: Prescription[] = [
  {
    id: 'pr001',
    patientId: 'p001',
    doctorId: 'd002',
    date: '2024-07-20',
    medicines: [
      { name: 'Hydrocortisone Cream', dosage: 'Apply twice daily', frequency: '7 days' },
      { name: 'Cetirizine', dosage: '10mg', frequency: 'Once daily' },
    ],
  },
  {
    id: 'pr002',
    patientId: 'p001',
    doctorId: 'd001',
    date: '2024-05-10',
    medicines: [
      { name: 'Atorvastatin', dosage: '20mg', frequency: 'Once daily' },
    ],
  },
];

export const medicineOrders: MedicineOrder[] = [
  {
    id: 'mo001',
    prescriptionId: 'pr001',
    storeName: 'Springfield Pharmacy',
    status: 'Delivered',
    orderDate: '2024-07-21',
    estimatedDelivery: '2024-07-23',
  },
    {
    id: 'mo002',
    prescriptionId: 'pr002',
    storeName: 'Downtown Drugs',
    status: 'Shipped',
    orderDate: '2024-08-01',
    estimatedDelivery: '2024-08-04',
  },
];

export const consents: Consent[] = [
    {
        id: 'c001',
        doctorId: 'd001',
        patientId: 'p001',
        grantedDate: '2024-07-01',
        expiryDate: '2024-09-01',
        status: 'Active',
    },
    {
        id: 'c002',
        doctorId: 'd002',
        patientId: 'p001',
        grantedDate: '2024-06-15',
        expiryDate: '2024-07-15',
        status: 'Expired',
    },
];

export const getDoctorById = (id: string) => doctors.find(d => d.id === id);
export const getPatientById = (id: string) => patient.id === id ? patient : null;
