'use server';
/**
 * @fileOverview This file defines a Genkit flow for generating structured medicine details from a name.
 *
 * - generateMedicineDetails - A function that takes a medicine name and returns structured details.
 * - GenerateMedicineDetailsInput - The input type for the generateMedicineDetails function.
 * - GenerateMedicineDetailsOutput - The return type for the generateMedicineDetails function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

export const GenerateMedicineDetailsInputSchema = z.object({
  medicineName: z.string().describe('The name of the medicine to look up.'),
});
export type GenerateMedicineDetailsInput = z.infer<typeof GenerateMedicineDetailsInputSchema>;

export const GenerateMedicineDetailsOutputSchema = z.object({
    name: z.string().describe("The trade name of the medicine."),
    strength: z.string().describe("The strength of the medicine, e.g., '500mg' or '10mg/5ml'."),
    saltComposition: z.string().describe("The active chemical ingredients, e.g., 'Paracetamol'."),
    category: z.string().describe("Medical category, e.g., 'Analgesic', 'Antibiotic', 'Antihistamine'."),
    isPrescriptionRequired: z.boolean().describe("Whether a doctor's prescription is required to purchase this medicine."),
    storageType: z.enum(['Normal', 'Cold']).describe("The required storage condition, 'Cold' for refrigeration, 'Normal' for room temperature."),
    commonUses: z.string().describe("A brief, one-sentence summary of what the medicine is commonly used for."),
    safetyNotes: z.string().describe("Any important safety warnings, common side effects, or contraindications."),
    expiryDate: z.string().format("date").describe("Suggest a reasonable expiry date in YYYY-MM-DD format, typically 2 years from today."),
    stock: z.number().describe("Provide a reasonable starting stock number, like 100 or 200.")
});
export type GenerateMedicineDetailsOutput = z.infer<typeof GenerateMedicineDetailsOutputSchema>;

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
