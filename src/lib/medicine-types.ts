
export interface MedicineData {
  name: string;
  genericName: string;
  composition: {
    activeIngredients: string[];
    inactiveIngredients: string[];
    formulationType: string;
  };
  function: {
    primaryAction: string;
    mechanismOfAction: string;
    therapeuticClass: string;
  };
  diseases: string[];
  sideEffects: {
    common: string[];
    uncommon: string[];
    serious: string[];
  };
  instructions: {
    generalGuidelines: string;
    specialPrecautions: string;
    contraindicationGroups: string[];
  };
  dosage: {
    standardDose: {
      adult: string;
      pediatric: string;
      elderly: string;
    };
    maximumDailyDose: string;
    durationOfTreatment: string;
    timingConsiderations: string;
    missedDose: string;
  };
  interactions: {
    drugInteractions: string[];
    foodInteractions: string[];
    conditions: string[];
  };
  storage: {
    temperature: string;
    specialConditions: string;
    expiryGuidelines: string;
  };
  price: {
    averageRetailPrice: string;
    unitPrice: string;
  };
  substitutes: {
    name: string;
    genericName: string;
    price: string;
    comparisonNotes: string;
  }[];
  rating: number;
  reviewCount: number;
  manufacturer: {
    name: string;
    country: string;
  };
  nearbyPharmacies: {
    location: string;
    pharmacies: {
      name: string;
      address: string;
      contact: string;
    }[];
  };
}
