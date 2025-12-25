'use server';
/**
 * @fileOverview This file contains Genkit flows for a multi-step medical scan analysis.
 *
 * - processMedicalImageAction: Denoise and crop the input image.
 * - analyzeMedicalDocumentAction: Analyze the processed image for anomalies and findings.
 */

import {ai} from '@/ai/genkit';
import {
  ImageAnalysisInputSchema,
  ImageAnalysisOutputSchema,
  ProcessImageOutputSchema,
  TextAnalysisInputSchema,
  TextAnalysisOutputSchema,
  type ImageAnalysisInput,
  type ImageAnalysisOutput,
  type TextAnalysisInput,
  type TextAnalysisOutput,
} from '@/ai/schemas';

/**
 * Flow to enhance a medical image: denoise, improve contrast, and crop.
 */
export async function processMedicalImageAction(
  input: ImageAnalysisInput
): Promise<ImageAnalysisOutput> {
  const {media} = await ai.generate({
    model: 'googleai/gemini-2.5-flash-image-preview',
    prompt: [
      {media: {url: input.imageUrl}},
      {text: `Enhance this medical scan: remove noise/grain, improve contrast, and crop exactly to the main anatomical region of interest (e.g., the lung, bone, or organ). Maintain medical accuracy. Do not add non-existent features.`},
    ],
    config: {
      responseModalities: ['IMAGE'],
    },
  });

  if (!media?.url) {
    throw new Error('Could not process medical image');
  }

  return {analyzedImageUrl: media.url};
}

const textAnalysisPrompt = ai.definePrompt({
  name: 'textAnalysisPrompt',
  input: {schema: TextAnalysisInputSchema},
  output: {schema: TextAnalysisOutputSchema},
  prompt: `You are an expert AI radiologist. Analyze the provided medical scan ({{{scanType}}}) and return a detailed JSON report.

**Instructions:**
1.  **Summarize:** Briefly explain what the scan shows in simple terms. If it's impossible to make a diagnosis from a single image, state that clearly.
2.  **Findings:** Identify critical and key findings, including their label, confidence, a brief explanation, and bounding box coordinates [ymin, xmin, ymax, xmax]. If there are no findings, return an empty array for 'findings'.
3.  **Recommendations:** Suggest potential health issues, specialists, and medications based on the scan.
4.  **Classify:** Determine the urgency level.
5.  **Disclaimer**: Add a standard medical disclaimer: "This is an AI-generated analysis and is not a substitute for professional medical advice. Consult a licensed radiologist for an accurate diagnosis."

**Patient Context:** {{{patientDetails}}}
**Scan Image:** {{media url=imageUrl}}

Your response MUST be a JSON object conforming to the 'TextAnalysisOutputSchema'.`,
});

/**
 * Flow to analyze a medical scan and extract structured text data about findings.
 */
export async function analyzeMedicalDocumentAction(
  input: TextAnalysisInput
): Promise<TextAnalysisOutput> {
  const {output} = await textAnalysisPrompt(input);
  return output!;
}
