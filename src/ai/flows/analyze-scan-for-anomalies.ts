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
    summary: z.string().describe("A comprehensive summary of the scan, explaining what the image shows in simple terms. If it's impossible to make a diagnosis from a single image, state that clearly."),
    criticalFindings: z.string().optional().describe("Any findings that require immediate medical attention. If none, this can be omitted."),
    keyFindings: z.string().optional().describe("Important, non-critical observations, measurements, or identified structures."),
    healthIssues: z.string().optional().describe("Identified health concerns or conditions suggested by the scan."),
    recommendedSpecialists: z.string().optional().describe("Types of medical professionals to consult based on the findings (e.g., Neurologist, Cardiologist)."),
    recommendedMedications: z.string().optional().describe("AI-suggested medications or treatments based on the findings. This is not medical advice."),
    analyzedImageUrl: z.string().describe("A data URI of the analyzed image. This image should have any detected anomalies clearly marked with squares or outlines. It should be the same size as the input image."),
    urgencyClassification: z.enum(['Emergency', 'Urgent', 'Routine', 'Normal']).describe('The urgency classification of the scan based on the anomalies detected.'),
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
  prompt: `You are a world-class AI radiologist. Your task is to analyze a medical scan image and provide a detailed, structured report in a format a patient can understand, while also being useful for a medical professional.

You will receive a medical image ({{{scanType}}}) and optional patient details.

**Analysis Steps:**
1.  **Summarize the Image:** Provide a clear, simple summary of what the scan shows. Explain the type of scan (MRI, CT, etc.) and what part of the body is being viewed. IMPORTANT: State clearly that a single image is not sufficient for a complete diagnosis.
2.  **Identify Findings:** Carefully examine the image for any abnormalities, points of interest, or significant markers.
3.  **Structure the Output:** Populate the JSON output with your findings.
    *   \`summary\`: Your detailed overview.
    *   \`criticalFindings\`: Note anything that looks like an emergency.
    *   \`keyFindings\`: Note any other important observations.
    *   \`healthIssues\`: List potential conditions suggested by the findings.
    *   \`recommendedSpecialists\`: Suggest the type of doctor to see.
    *   \`recommendedMedications\`: Suggest potential medications (with a disclaimer).
    *   \`urgencyClassification\`: Classify the scan's urgency.
4.  **Mark the Image:** Create and return a new image as a data URI in the 'analyzedImageUrl' field. This image MUST be the same dimensions as the input. On this image, draw clear boxes or outlines around any areas you refer to in your findings. If there are no specific findings to mark, return the original image.

**Patient Details:** {{{patientDetails}}}

**Scan Image:** {{media url=scanDataUri}}

Produce a JSON object that strictly conforms to the 'AnalyzeScanForAnomaliesOutputSchema'.`,
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
