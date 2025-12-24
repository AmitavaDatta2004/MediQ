'use server';
/**
 * @fileOverview Analyzes medical images (X-ray, CT, MRI) to highlight potential anomalies.
 *
 * - analyzeScanForAnomalies - A function that analyzes medical images and provides an assessment.
 * - AnalyzeScanForAnomaliesInput - The input type for the analyzeScanForAnomalies function.
 * - AnalyzeScanForAnomaliesOutput - The return type for the analyzeScanForAnomalies function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeScanForAnomaliesInputSchema = z.object({
  scanDataUri: z
    .string()
    .describe(
      "A medical image (X-ray, CT, MRI) as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  scanType: z.enum(['X-ray', 'CT', 'MRI']).describe('The type of medical scan.'),
  patientDetails: z
    .string()
    .optional()
    .describe('Optional details about the patient, such as age and medical history.'),
});
export type AnalyzeScanForAnomaliesInput = z.infer<typeof AnalyzeScanForAnomaliesInputSchema>;

const AnalyzeScanForAnomaliesOutputSchema = z.object({
  anomaliesDetected: z
    .boolean()
    .describe('Whether or not any anomalies were detected in the scan.'),
  anomalyReport: z
    .string()
    .describe('A detailed report of the anomalies detected, if any.'),
  heatmapDataUri: z
    .string()
    .optional()
    .describe(
      'A data URI containing heatmap visualization of potential anomalies, if any are detected.'
    ),
  urgencyClassification: z
    .enum(['Emergency', 'Urgent', 'Routine', 'Normal'])
    .describe('The urgency classification of the scan based on the anomalies detected.'),
});
export type AnalyzeScanForAnomaliesOutput = z.infer<typeof AnalyzeScanForAnomaliesOutputSchema>;

export async function analyzeScanForAnomalies(
  input: AnalyzeScanForAnomaliesInput
): Promise<AnalyzeScanForAnomaliesOutput> {
  return analyzeScanForAnomaliesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeScanForAnomaliesPrompt',
  input: {schema: AnalyzeScanForAnomaliesInputSchema},
  output: {schema: AnalyzeScanForAnomaliesOutputSchema},
  prompt: `You are an AI assistant specializing in analyzing medical images.

You will receive a medical image ({{{scanType}}}) and your task is to identify any potential anomalies or areas of concern.

Based on your analysis, provide a detailed report of the anomalies detected (if any) and classify the urgency of the scan.

Patient Details: {{{patientDetails}}}

Scan Image: {{media url=scanDataUri}}

Output should be formatted as a JSON object that conforms to AnalyzeScanForAnomaliesOutputSchema. Be as detailed as possible in the anomalyReport field.

If no anomalies are detected, set anomaliesDetected to false, provide a report stating "No anomalies detected", and set urgencyClassification to "Normal".

If anomalies are detected, then heatmapDataUri should also be returned, providing a URL to a heatmap visualization highlighting these anomalies.
`,
});

const analyzeScanForAnomaliesFlow = ai.defineFlow(
  {
    name: 'analyzeScanForAnomaliesFlow',
    inputSchema: AnalyzeScanForAnomaliesInputSchema,
    outputSchema: AnalyzeScanForAnomaliesOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
