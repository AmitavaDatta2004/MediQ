
export type MedicineInfo = {
    name: string;
    strength: string;
    saltComposition: string;
    category: string;
    commonUses: string;
    safetyNotes: string;
    isPrescriptionRequired: boolean;
    storageType: 'Normal' | 'Cold';
};

export const medicinesDB: MedicineInfo[] = [
    {
        name: 'Paracetamol 500mg',
        strength: '500mg',
        saltComposition: 'Paracetamol',
        category: 'Analgesic & Antipyretic',
        commonUses: 'Used for pain relief and to reduce fever.',
        safetyNotes: 'Do not exceed the recommended dose. Liver damage can occur with overdose.',
        isPrescriptionRequired: false,
        storageType: 'Normal',
    },
    {
        name: 'Amoxicillin 250mg',
        strength: '250mg',
        saltComposition: 'Amoxicillin',
        category: 'Antibiotic',
        commonUses: 'Used to treat a wide variety of bacterial infections.',
        safetyNotes: 'Complete the full course of treatment. May cause stomach upset.',
        isPrescriptionRequired: true,
        storageType: 'Normal',
    },
    {
        name: 'Atorvastatin 10mg',
        strength: '10mg',
        saltComposition: 'Atorvastatin',
        category: 'Statin',
        commonUses: 'Used to lower cholesterol and triglycerides in the blood.',
        safetyNotes: 'Can cause muscle pain. Avoid grapefruit juice.',
        isPrescriptionRequired: true,
        storageType: 'Normal',
    },
    {
        name: 'Metformin 500mg',
        strength: '500mg',
        saltComposition: 'Metformin',
        category: 'Antidiabetic',
        commonUses: 'Used to treat type 2 diabetes.',
        safetyNotes: 'Take with meals to avoid stomach upset. Lactic acidosis is a rare but serious side effect.',
        isPrescriptionRequired: true,
        storageType: 'Normal',
    },
    {
        name: 'Cetirizine 10mg',
        strength: '10mg',
        saltComposition: 'Cetirizine',
        category: 'Antihistamine',
        commonUses: 'Used to relieve allergy symptoms such as watery eyes, runny nose, itching eyes/nose, sneezing, hives, and itching.',
        safetyNotes: 'May cause drowsiness.',
        isPrescriptionRequired: false,
        storageType: 'Normal',
    },
     {
        name: 'Insulin Glargine',
        strength: '100 units/mL',
        saltComposition: 'Insulin Glargine',
        category: 'Antidiabetic',
        commonUses: 'Long-acting insulin used to treat type 1 and type 2 diabetes.',
        safetyNotes: 'Requires injection. Store in a refrigerator. Do not freeze.',
        isPrescriptionRequired: true,
        storageType: 'Cold',
    },
];
