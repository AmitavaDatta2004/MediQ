
'use server';
/**
 * @fileOverview A Genkit flow to get comprehensive details for a given medicine.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import type { MedicineData } from '@/lib/medicine-types';
import { GetFullMedicineDetailsInputSchema, type GetFullMedicineDetailsInput } from '@/ai/schemas';

// Define the output schema for the structured data extraction tool.
const MedicineDataOutputSchema = z.any();

/**
 * A Genkit Tool that takes unstructured markdown text about a medicine
 * and extracts it into a structured MedicineData JSON object.
 */
const extractMedicineDataTool = ai.defineTool(
  {
    name: 'extractMedicineDataTool',
    description: 'Extracts medicine data from markdown text into a structured JSON object.',
    inputSchema: z.object({
      markdownText: z.string().describe('The markdown text containing medicine details.'),
    }),
    outputSchema: MedicineDataOutputSchema,
  },
  async ({ markdownText }) => {
    // This is a nested AI call focused solely on data extraction.
    const extractionPrompt = `You are a data extraction specialist. Convert the following markdown text into a single, raw JSON object that strictly follows the MedicineData TypeScript interface.

Do not add any commentary. Your entire output must be the JSON object.

Markdown:
${markdownText}

JSON Output:
`;
    const { text } = await ai.generate({
      prompt: extractionPrompt,
      model: 'googleai/gemini-2.5-flash',
      config: {
        responseMimeType: 'application/json',
      },
    });

    try {
        const cleanedText = text.replace(/```json\n|```/g, '').trim();
        return JSON.parse(cleanedText);
    } catch (e) {
        console.error("Failed to parse extracted JSON:", e);
        throw new Error("Could not parse medicine data from markdown.");
    }
  }
);


const getFullMedicineDetailsFlow = ai.defineFlow(
  {
    name: 'getFullMedicineDetailsFlow',
    inputSchema: GetFullMedicineDetailsInputSchema,
    outputSchema: MedicineDataOutputSchema,
    tools: [extractMedicineDataTool], // Make the tool available to the flow
  },
  async ({ medicineName }) => {
    // Step 1: Generate a comprehensive description in simple markdown.
    const generationPrompt = `
      You are an expert pharmacist and medical data analyst. For the medicine "${medicineName}", generate a comprehensive but easy-to-read summary in markdown format.

      Include the following sections with realistic, hypothetical data:
      - **Generic Name**:
      - **Composition**: (Active/Inactive Ingredients, Formulation Type)
      - **Function**: (Primary Action, Mechanism, Therapeutic Class)
      - **Diseases Treated**: (A list of conditions)
      - **Side Effects**: (Categorized into Common, Uncommon, Serious)
      - **Instructions**: (General guidelines, precautions, contraindications)
      - **Dosage**: (Adult, Pediatric, Elderly, Max Dose, Duration, Timing)
      - **Interactions**: (Drug, Food, and Condition interactions)
      - **Storage**: (Temperature, Special Conditions, Expiry Guidelines)
      - **Price**: (Average Retail and Unit Price)
      - **Substitutes**: (List 2-3 alternatives with names, prices, and notes)
      - **Rating**: (A score out of 5 and a review count)
      - **Manufacturer**: (Name and Country)
      - **Nearby Pharmacies**: (Assume user is in "San Francisco, CA" and list 3 fictional pharmacies with address and contact)
    `;

    const { text } = await ai.generate({
      prompt: generationPrompt,
    });
    
    const markdownDetails = text;

    // Step 2: Use the tool to extract the generated markdown into structured JSON.
    const structuredData = await extractMedicineDataTool({ markdownText: markdownDetails });

    return structuredData;
  }
);


export async function getFullMedicineDetails(
  input: GetFullMedicineDetailsInput
): Promise<MedicineData> {
  const result = await getFullMedicineDetailsFlow(input);
  return result as MedicineData;
}
