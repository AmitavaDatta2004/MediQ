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
  prompt: `
    You are an expert medical imaging assistant. 
    Analyze the provided medical image (X-ray, MRI, CT, Skin Lesion, or Document).

    Tasks:
    1. Identify any visually suspicious regions, anomalies, or key medical text/values.
    2. If it is an image scan, estimate the bounding box coordinates for these regions.
    3. Provide a brief summary of findings.

    IMPORTANT: 
    - Coordinates must be normalized (0.0 to 1.0) in the order [ymin, xmin, ymax, xmax].
    - This is for educational/screening purposes only. Do not provide a definitive diagnosis.

    Return JSON matching this schema:
    {
      "summary": "string",
      "findings": [
        {
          "label": "string (e.g. 'Possible Nodule', 'Fracture', 'High Glucose Value')",
          "confidence": "string (e.g. 'High', 'Medium')",
          "explanation": "string",
          "box_2d": { "ymin": number, "xmin": number, "ymax": number, "xmax": number } // Optional if not applicable
        }
      ],
      "disclaimer": "string"
    }
  `,
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
