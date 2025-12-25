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
    expiryDate: z.string().describe("Suggest a reasonable expiry date in YYYY-MM-DD format, typically 2 years from today."),
    stock: z.number().describe("Provide a reasonable starting stock number, like 100 or 200.")
});
export type GenerateMedicineDetailsOutput = z.infer<typeof GenerateMedicineDetailsOutputSchema>;

export const TextAnalysisInputSchema = z.object({
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
export type TextAnalysisInput = z.infer<typeof TextAnalysisInputSchema>;

export const TextAnalysisOutputSchema = z.object({
    summary: z.string().describe("A comprehensive summary of the scan, explaining what the image shows in simple terms. If it's impossible to make a diagnosis from a single image, state that clearly."),
    criticalFindings: z.string().optional().describe("Any findings that require immediate medical attention. If none, this can be omitted."),
    keyFindings: z.string().optional().describe("Important, non-critical observations, measurements, or identified structures."),
    healthIssues: z.string().optional().describe("Identified health concerns or conditions suggested by the scan."),
    recommendedSpecialists: z.string().optional().describe("Types of medical professionals to consult based on the findings (e.g., Neurologist, Cardiologist)."),
    recommendedMedications: z.string().optional().describe("AI-suggested medications or treatments based on the findings. This is not medical advice."),
    urgencyClassification: z.enum(['Emergency', 'Urgent', 'Routine', 'Normal']).describe('The urgency classification of the scan based on the anomalies detected.'),
});
export type TextAnalysisOutput = z.infer<typeof TextAnalysisOutputSchema>;


export const ImageAnalysisInputSchema = z.object({
  scanDataUri: z.string().describe("The original medical scan as a data URI."),
  analysis: TextAnalysisOutputSchema.describe("The text-based analysis of the scan, which will be used to guide the image marking process."),
});
export type ImageAnalysisInput = z.infer<typeof ImageAnalysisInputSchema>;

export const ImageAnalysisOutputSchema = z.object({
  analyzedImageUrl: z.string().describe("A data URI of the analyzed image. This image should have any detected anomalies clearly marked with squares or outlines, based on the provided analysis. It should be the same size as the input image."),
});
export type ImageAnalysisOutput = z.infer<typeof ImageAnalysisOutputSchema>;
