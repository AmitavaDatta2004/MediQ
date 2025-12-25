'use server';
/**
 * @fileOverview This file defines a Genkit flow for reading a prescription and checking it against a pharmacy's inventory.
 *
 * - readPrescriptionAndCheckInventory - A function that takes a prescription and returns a list of medicines with their inventory status.
 */

import { ai } from '@/ai/genkit';
import { ReadPrescriptionInputSchema, ReadPrescriptionOutputSchema, type ReadPrescriptionInput, type ReadPrescriptionOutput } from '@/ai/schemas';
import { z } from 'genkit';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, getApps } from 'firebase-admin/app';

// Initialize Firebase Admin SDK if it hasn't been already.
if (!getApps().length) {
  initializeApp();
}
const db = getFirestore();

// Tool to get prescription details from Firestore
const getPrescriptionDetails = ai.defineTool(
  {
    name: 'getPrescriptionDetails',
    description: 'Fetches the details of a specific prescription from the database.',
    inputSchema: z.object({
      patientId: z.string().describe('The ID of the patient.'),
      prescriptionId: z.string().describe('The ID of the prescription to fetch.'),
    }),
    outputSchema: z.any(),
  },
  async ({ patientId, prescriptionId }) => {
    const docRef = db.doc(`patients/${patientId}/prescriptions/${prescriptionId}`);
    const docSnap = await docRef.get();
    if (!docSnap.exists) {
      throw new Error('Prescription not found.');
    }
    return docSnap.data();
  }
);

// Tool to get inventory details from Firestore
const getInventoryDetails = ai.defineTool(
  {
    name: 'getInventoryDetails',
    description: "Fetches the entire inventory for a given medicine store.",
    inputSchema: z.object({
      storeId: z.string().describe("The ID of the medicine store."),
    }),
    outputSchema: z.any(),
  },
  async ({ storeId }) => {
    const snapshot = await db.collection(`medicine_stores/${storeId}/inventory`).get();
    if (snapshot.empty) {
      return [];
    }
    return snapshot.docs.map(doc => doc.data());
  }
);

const prompt = ai.definePrompt({
  name: 'readPrescriptionPrompt',
  input: { schema: ReadPrescriptionInputSchema },
  output: { schema: ReadPrescriptionOutputSchema },
  tools: [getPrescriptionDetails, getInventoryDetails],
  prompt: `You are an expert pharmacy assistant AI. Your task is to digitize a prescription and check it against the pharmacy's inventory.

**Instructions:**
1.  **Fetch Data:** Use the provided tools to get the prescription details and the store's full inventory list.
2.  **Analyze & Match:** For each medicine in the prescription, intelligently search the inventory. A match might not be exact (e.g., "Crocin 500mg" in prescription vs. "Crocin Advance" in inventory). Use the medicine name as the primary matching key.
3.  **Determine Status:** For each medicine, determine its inventory status:
    *   'Available': If stock is 20 or more.
    *   'Low Stock': If stock is between 1 and 19.
    *   'Out of Stock': If stock is 0.
    *   'Unknown': If you cannot find a match in the inventory.
4.  **Format Output:** Return a structured JSON object containing the list of all medicines from the prescription, each with its determined 'inventoryStatus'.`,
});

export async function readPrescriptionAndCheckInventory(
  input: ReadPrescriptionInput
): Promise<ReadPrescriptionOutput> {
  const { output } = await prompt(input);
  return output!;
}
