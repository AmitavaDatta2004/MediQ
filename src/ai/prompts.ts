
export const getMedicineDetailsPrompt = (medicineName: string, language: string, location: string) => `
Provide detailed, factual medical reference information about "${medicineName}" in JSON format. Follow these guidelines strictly:

1. Use only verified medical references and pharmacological databases
2. Include complete information for all fields
3. Maintain consistent formatting
4. Use standard medical terminology
5. Include dosage units and measurements
6. Provide specific, quantifiable information where applicable
7. Include **pharmacy names** in "${location}".

Return the data in the following exact structure, ensuring the content is provided in "${language}":

{
  "name": "${medicineName}",
  "genericName": "Complete chemical/generic name with standard nomenclature",
  "composition": {
    "activeIngredients": [
      "Each ingredient with exact quantity and unit (e.g., '500mg Paracetamol')"
    ],
    "inactiveIngredients": [
      "List of excipients and other ingredients"
    ],
    "formulationType": "Specific form (tablet/capsule/syrup/etc) with complete details"
  },
  "function": {
    "primaryAction": "Main therapeutic action",
    "mechanismOfAction": "How the medicine works in the body",
    "therapeuticClass": "Medicine classification/category"
  },
  "diseases": [
    "Primary indication with specific condition details",
    "Secondary indications with specific condition details"
  ],
  "sideEffects": {
    "common": [
      "Frequent side effects (>1% occurrence) with occurrence rates"
    ],
    "uncommon": [
      "Less frequent side effects (0.1-1% occurrence)"
    ],
    "serious": [
      "Severe adverse effects requiring immediate medical attention"
    ]
  },
  "instructions": {
    "generalGuidelines": "Basic usage instructions",
    "specialPrecautions": "Specific warnings and precautions",
    "contraindicationGroups": [
      "Groups who should not take this medicine"
    ]
  },
  "dosage": {
    "standardDose": {
      "adult": "Standard adult dosing with frequency",
      "pediatric": "Age-specific pediatric dosing if applicable",
      "elderly": "Modified dosing for elderly if applicable"
    },
    "maximumDailyDose": "Maximum safe daily dose with units",
    "durationOfTreatment": "Recommended duration of use",
    "timingConsiderations": "Specific timing (with/without food, time of day)",
    "missedDose": "Instructions for missed dose scenarios"
  },
  "interactions": {
    "drugInteractions": [
      "Specific medications that interact"
    ],
    "foodInteractions": [
      "Foods/beverages to avoid"
    ],
    "conditions": [
      "Medical conditions affecting usage"
    ]
  },
  "storage": {
    "temperature": "Specific temperature range",
    "specialConditions": "Light/moisture considerations",
    "expiryGuidelines": "Typical shelf life and expiry indicators. Specifically address whether the medicine is safe to take if it has been expired for one month. Also provide guidelines for what to do if it has been expired for longer, or if the packaging has been opened."
  },
  "price": {
    "averageRetailPrice": "Average retail price range in INR",
    "unitPrice": "Price per unit/tablet/dose in INR"
  },
  "substitutes": [
    {
      "name": "Alternative medicine name",
      "genericName": "Generic name of alternative",
      "price": "Price range of alternative",
      "comparisonNotes": "Brief comparison with main medicine"
    }
  ],
  "rating": "Average user rating (0-5)",
  "reviewCount": "Number of verified reviews",
  "manufacturer": {
    "name": "Manufacturing company name",
    "country": "Country of origin"
  },
  "nearbyPharmacies": {
    "location": "${location}",
    "pharmacies": [
      {
        "name": "Pharmacy Name 1",
        "address": "Complete address",
        "contact": "Phone number",
      },
      {
        "name": "Pharmacy Name 2",
        "address": "Complete address",
        "contact": "Phone number",
      },
      {
        "name": "Pharmacy Name 3",
        "address": "Complete address",
        "contact": "Phone number",
      },
      {
        "name": "Pharmacy Name 4",
        "address": "Complete address",
        "contact": "Phone number",
      },
      {
        "name": "Pharmacy Name 5",
        "address": "Complete address",
        "contact": "Phone number",
      }
    ]
  }
}

Important Notes:
1. All fields must be filled with accurate, factual information
2. Use "Not available" for truly unknown information
3. Include units for all measurements
4. Maintain consistent formatting throughout
5. Include only medically verified information
6. Exclude any harmful, dangerous, or inappropriate content
7. Use standard medical terminology
8. Include numerical values where applicable (dosages, percentages, etc)
9. Keep descriptions clear and concise
10. Use proper medical units (mg, ml, etc)
11. Ensure all content is translated into "${language}" correctly and contextually.`;
