'use server';
/**
 * @fileOverview A Genkit flow to get comprehensive details for a given medicine.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import type { MedicineData } from '@/lib/medicine-types';
import { GetFullMedicineDetailsInputSchema, type GetFullMedicineDetailsInput } from '@/ai/schemas';
import { getMedicineDetailsPrompt } from '@/ai/prompts';

// Define the output schema for the structured data extraction.
const MedicineDataOutputSchema = z.any();

const getFullMedicineDetailsFlow = ai.defineFlow(
  {
    name: 'getFullMedicineDetailsFlow',
    inputSchema: GetFullMedicineDetailsInputSchema,
    outputSchema: MedicineDataOutputSchema,
  },
  async ({ medicineName, language, location }) => {
    // Generate the detailed prompt using the new prompt function
    const generationPrompt = getMedicineDetailsPrompt(medicineName, language, location);

    // Make a single, direct call to the AI, configured to return JSON
    const { text } = await ai.generate({
      prompt: generationPrompt,
      model: 'googleai/gemini-2.5-flash',
      config: {
        responseMimeType: 'application/json',
      },
    });

    try {
        // Clean the raw text output to ensure it's valid JSON
        const cleanedText = text.replace(/```json\n|```/g, '').trim();
        const parsedData = JSON.parse(cleanedText);
        return parsedData;
    } catch (e) {
        console.error("Failed to parse extracted JSON:", e);
        throw new Error("Could not parse medicine data from the AI response.");
    }
  }
);


export async function getFullMedicineDetails(
  input: GetFullMedicineDetailsInput
): Promise<MedicineData> {
  const result = await getFullMedicineDetailsFlow(input);
  // We cast it here. Add validation logic if needed in the future.
  return result as MedicineData;
}
