'use server';
/**
 * @fileOverview This file defines a Genkit flow for generating structured medicine details from a name.
 *
 * - generateMedicineDetails - A function that takes a medicine name and returns structured details.
 */

import {ai} from '@/ai/genkit';
import { GenerateMedicineDetailsInputSchema, GenerateMedicineDetailsOutputSchema, type GenerateMedicineDetailsInput, type GenerateMedicineDetailsOutput } from '@/ai/schemas';

export async function generateMedicineDetails(
  input: GenerateMedicineDetailsInput
): Promise<GenerateMedicineDetailsOutput> {
  return generateMedicineDetailsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateMedicineDetailsPrompt',
  input: {schema: GenerateMedicineDetailsInputSchema},
  output: {schema: GenerateMedicineDetailsOutputSchema},
  prompt: `You are an expert pharmacist AI. Based on the medicine name "{{medicineName}}", provide a structured JSON object with its details.

Instructions:
1.  **Extract Details**: Determine the medicine's strength, salt composition, and category.
2.  **Regulatory Info**: Classify if it needs a prescription and its storage type.
3.  **Summarize**: Write a very brief summary of its common uses and any key safety notes.
4.  **Defaults**: Provide a reasonable default starting stock count (e.g., 100) and a sensible expiry date (e.g., 2 years from now in YYYY-MM-DD format).

Your response MUST be a JSON object conforming to the 'GenerateMedicineDetailsOutputSchema'.`,
});

const generateMedicineDetailsFlow = ai.defineFlow(
  {
    name: 'generateMedicineDetailsFlow',
    inputSchema: GenerateMedicineDetailsInputSchema,
    outputSchema: GenerateMedicineDetailsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
