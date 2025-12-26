'use server';
/**
 * @fileOverview This file defines the core Genkit flow for the Disease Prediction System.
 *
 * - predictDiseaseFromPatientData - A function that orchestrates fetching patient data and running the prediction model.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, getApps } from 'firebase-admin/app';
import { DiseasePredictionInputSchema, DiseasePredictionOutputSchema, type DiseasePredictionInput, type DiseasePredictionOutput } from '@/ai/schemas';

// Initialize Firebase Admin SDK if it hasn't been already.
if (!getApps().length) {
  initializeApp();
}
const db = getFirestore();

// Tool to get the main patient profile document
const getPatientProfile = ai.defineTool(
  {
    name: 'getPatientProfile',
    description: "Fetches a patient's core profile data (demographics, vitals).",
    inputSchema: z.object({ patientId: z.string().describe('The ID of the patient.') }),
    outputSchema: z.any(),
  },
  async ({ patientId }) => {
    const docRef = db.doc(`patients/${patientId}`);
    const docSnap = await docRef.get();
    if (!docSnap.exists) {
      throw new Error('Patient profile not found.');
    }
    return docSnap.data();
  }
);

// Generic tool to get data from any of a patient's sub-collections
const getPatientSubCollection = ai.defineTool(
  {
    name: 'getPatientSubCollection',
    description: "Fetches all records from a patient's health sub-collection (e.g., medical_reports, appointments).",
    inputSchema: z.object({
        patientId: z.string().describe('The ID of the patient.'),
        collectionName: z.enum([
            'medical_reports', 
            'scan_images', 
            'appointments', 
            'prescriptions', 
            'allergies', 
            'chronic_conditions'
        ]).describe("The name of the sub-collection to fetch.")
    }),
    outputSchema: z.any(),
  },
  async ({ patientId, collectionName }) => {
    const snapshot = await db.collection(`patients/${patientId}/${collectionName}`).get();
    if (snapshot.empty) {
      return [];
    }
    return snapshot.docs.map(doc => doc.data());
  }
);


const prompt = ai.definePrompt({
  name: 'diseasePredictionPrompt',
  input: { schema: DiseasePredictionInputSchema },
  output: { schema: DiseasePredictionOutputSchema },
  tools: [getPatientProfile, getPatientSubCollection],
  prompt: `You are MediQuest AI, an advanced medical assistant. Your task is to perform a comprehensive health analysis for a patient based on the data provided and, if necessary, by fetching additional data from their record.

**Data Provided Directly:**
- Symptoms: {{symptoms}}
- Chronic Illnesses/Family History: {{chronicHistory}}
- Current Medications/Allergies: {{medicationAllergies}}
- Recent Surgeries/Vaccinations: {{recentProcedures}}
- Lifestyle Factors: {{lifestyle}}
- Sleep Pattern: {{sleep}}

**CRITICAL INSTRUCTIONS:**
1.  **Prioritize Provided Data**: Start your analysis using the symptoms and health answers provided above.
2.  **Gather Additional Data (If Needed)**: If the provided information is insufficient, use the \`getPatientProfile\` and \`getPatientSubCollection\` tools to gather a more complete health picture. You are encouraged to fetch 'medical_reports', 'scan_images', 'prescriptions', 'allergies', and 'chronic_conditions' to cross-reference and enrich your analysis.
3.  **Synthesize and Analyze**: Analyze all available data—symptoms, medical history, lab reports, scan findings, medications, and lifestyle factors.
4.  **Perform Core Tasks**: Based on your synthesis, perform the following tasks:
    *   **Health Risk Score**: Calculate a hypothetical 'Health Risk Score' from 0-100, where 100 is perfect health and 0 is critical.
    *   **Summary**: Write a concise summary of the patient's current health status based on the symptoms.
    *   **Risk Factors**: Identify the top 3 most significant risk factors.
    *   **Recommendations**: Provide 3 actionable, evidence-based health recommendations.
    *   **Specialist**: Recommend the single most appropriate medical specialist type (e.g., "Cardiologist", "Neurologist", "General Physician").
    *   **Urgency Level**: Estimate the urgency for a consultation: 'Low', 'Moderate', 'High', or 'Emergency'.
5.  **Format Output**: Your final response MUST be ONLY the raw JSON object conforming to the specified output schema. Do not include any other text or markdown.`,
});

export async function predictDiseaseFromPatientData(
  input: DiseasePredictionInput
): Promise<DiseasePredictionOutput> {
  const { output } = await prompt(input);
  return output!;
}
