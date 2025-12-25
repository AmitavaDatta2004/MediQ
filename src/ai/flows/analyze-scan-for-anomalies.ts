'use server';
/**
 * @fileOverview Analyzes medical images (X-ray, CT, MRI) to highlight potential anomalies.
 *
 * - analyzeScanForAnomalies - A function that analyzes medical images and provides a text assessment.
 * - generateAnalyzedImage - A function that generates an image with anomalies marked.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { ImageAnalysisInputSchema, ImageAnalysisOutputSchema, TextAnalysisInputSchema, TextAnalysisOutputSchema, type ImageAnalysisInput, type ImageAnalysisOutput, type TextAnalysisInput, type TextAnalysisOutput } from '../schemas';

export async function analyzeScanForAnomalies(
  input: TextAnalysisInput
): Promise<TextAnalysisOutput> {
  return textAnalysisFlow(input);
}

export async function generateAnalyzedImage(
    input: ImageAnalysisInput
): Promise<ImageAnalysisOutput> {
    return imageAnalysisFlow(input);
}

const textAnalysisPrompt = ai.definePrompt({
  name: 'textAnalysisPrompt',
  input: {schema: TextAnalysisInputSchema},
  output: {schema: TextAnalysisOutputSchema},
  prompt: `You are an expert AI radiologist. Analyze the provided medical scan ({{{scanType}}}) and return a detailed JSON report, but DO NOT generate an image.

**Instructions:**
1.  **Summarize:** Briefly explain what the scan shows in simple terms.
2.  **Findings:** Identify critical and key findings. If there are none, omit those fields.
3.  **Recommendations:** Suggest potential health issues, specialists, and medications based on the scan.
4.  **Classify:** Determine the urgency level.

**Patient Context:** {{{patientDetails}}}

**Scan Image:** {{media url=scanDataUri}}

Your response MUST be a JSON object conforming to the 'TextAnalysisOutputSchema'. You must not include the 'analyzedImageUrl' field.`,
});

const textAnalysisFlow = ai.defineFlow(
  {
    name: 'textAnalysisFlow',
    inputSchema: TextAnalysisInputSchema,
    outputSchema: TextAnalysisOutputSchema,
  },
  async input => {
    const {output} = await textAnalysisPrompt(input);
    return output!;
  }
);


const imageAnalysisPrompt = ai.definePrompt({
    name: 'imageAnalysisPrompt',
    input: {schema: ImageAnalysisInputSchema},
    output: {schema: ImageAnalysisOutputSchema},
    prompt: `You are an expert AI image processor for medical scans. Your task is to take a medical image and a text-based analysis of its anomalies, and then generate a NEW image that visually marks those anomalies.

**Instructions:**
1.  **Review Analysis:** Read the provided analysis to understand where the anomalies are located.
2.  **Mark Image:** Create a new image data URI (\`analyzedImageUrl\`). Draw clear boxes, circles, or outlines on this new image to highlight the specific areas mentioned in the analysis.
3.  **Maintain Integrity:** The output image must be the same size as the input image. If no anomalies were mentioned in the analysis, you should return the original image as a data URI.

**Analysis Details:**
\`\`\`json
{{{json analysis}}}
\`\`\`

**Original Scan Image:**
{{media url=scanDataUri}}

Your response MUST be a JSON object conforming to the 'ImageAnalysisOutputSchema'.`,
});


const imageAnalysisFlow = ai.defineFlow(
    {
        name: 'imageAnalysisFlow',
        inputSchema: ImageAnalysisInputSchema,
        outputSchema: ImageAnalysisOutputSchema,
    },
    async input => {
        const {output} = await imageAnalysisPrompt(input);
        return output!;
    }
);