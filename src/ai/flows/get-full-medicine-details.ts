
'use server';
/**
 * @fileOverview A Genkit flow to get comprehensive details for a given medicine.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import type { MedicineData } from '@/lib/medicine-types';

export const GetFullMedicineDetailsInputSchema = z.object({
  medicineName: z.string().describe('The name of the medicine to look up.'),
});
export type GetFullMedicineDetailsInput = z.infer<typeof GetFullMedicineDetailsInputSchema>;

// We can't use the full MedicineData type directly as Zod schema because it's complex.
// We'll define the output schema for the AI and then cast it.
const MedicineDataOutputSchema = z.any();

export async function getFullMedicineDetails(
  input: GetFullMedicineDetailsInput
): Promise<MedicineData> {
  return getFullMedicineDetailsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'getFullMedicineDetailsPrompt',
  input: { schema: GetFullMedicineDetailsInputSchema },
  output: { schema: MedicineDataOutputSchema },
  prompt: `
    You are an expert pharmacist and medical data analyst. For the medicine "{{medicineName}}", provide a comprehensive, structured JSON object with all details.
    Your response MUST be a raw JSON object conforming to the following TypeScript interface:

    export interface MedicineData {
      name: string;
      genericName: string;
      composition: {
        activeIngredients: string[];
        inactiveIngredients: string[];
        formulationType: string; // e.g., "Tablet", "Syrup", "Injection"
      };
      function: {
        primaryAction: string; // e.g., "Lowers blood pressure"
        mechanismOfAction: string;
        therapeuticClass: string; // e.g., "Statin", "Antibiotic"
      };
      diseases: string[]; // List of diseases it treats
      sideEffects: {
        common: string[];
        uncommon: string[];
        serious: string[];
      };
      instructions: {
        generalGuidelines: string;
        specialPrecautions: string;
        contraindicationGroups: string[]; // e.g., "Pregnant women", "Kidney patients"
      };
      dosage: {
        standardDose: {
          adult: string;
          pediatric: string;
          elderly: string;
        };
        maximumDailyDose: string;
        durationOfTreatment: string;
        timingConsiderations: string; // e.g., "With food", "Before sleeping"
        missedDose: string;
      };
      interactions: {
        drugInteractions: string[];
        foodInteractions: string[];
        conditions: string[]; // Medical conditions it interacts with
      };
      storage: {
        temperature: string; // e.g., "Room temperature (20-25°C)"
        specialConditions: string; // e.g., "Protect from light"
        expiryGuidelines: string;
      };
      price: {
        averageRetailPrice: string; // e.g., "$25 for 30 tablets"
        unitPrice: string; // e.g., "$0.83 per tablet"
      };
      substitutes: {
        name: string;
        genericName: string;
        price: string;
        comparisonNotes: string;
      }[];
      rating: number; // e.g., 4.5
      reviewCount: number; // e.g., 1250
      manufacturer: {
        name: string;
        country: string;
      };
      nearbyPharmacies: {
        location: string; // The user's location for context
        pharmacies: {
          name: string;
          address: string;
          contact: string;
        }[];
      };
    }

    Generate realistic but hypothetical data for all fields. For nearby pharmacies, assume the user is in "San Francisco, CA" and list 3 fictional pharmacies.
  `,
});

const getFullMedicineDetailsFlow = ai.defineFlow(
  {
    name: 'getFullMedicineDetailsFlow',
    inputSchema: GetFullMedicineDetailsInputSchema,
    outputSchema: MedicineDataOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    // The output is expected to be a JSON object matching MedicineData.
    // We cast it here. Add validation logic if needed.
    return output as MedicineData;
  }
);
