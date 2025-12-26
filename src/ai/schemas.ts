
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


const FindingSchema = z.object({
  label: z.string().describe("Short label for the finding (e.g., 'Possible Nodule', 'Fracture')."),
  confidence: z.string().describe("Confidence level ('High', 'Medium', 'Low')."),
  explanation: z.string().describe("Brief explanation of the finding."),
  box_2d: z.object({
      ymin: z.number(),
      xmin: z.number(),
      ymax: z.number(),
      xmax: z.number(),
  }).optional().describe("Normalized bounding box coordinates [ymin, xmin, ymax, xmax]."),
});

export const TextAnalysisInputSchema = z.object({
  imageUrl: z
    .string()
    .describe(
      "A medical image as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
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
    findings: z.array(FindingSchema).optional().describe("A list of all detected anomalies, including their bounding boxes."),
    criticalFindings: z.string().optional().describe("Any findings that require immediate medical attention. If none, this can be omitted."),
    keyFindings: z.string().optional().describe("Important, non-critical observations, measurements, or identified structures."),
    healthIssues: z.string().optional().describe("Identified health concerns or conditions suggested by the scan."),
    recommendedSpecialists: z.string().optional().describe("Types of medical professionals to consult based on the findings (e.g., Neurologist, Cardiologist)."),
    recommendedMedications: z.string().optional().describe("AI-suggested medications or treatments based on the findings. This is not medical advice."),
    urgencyClassification: z.enum(['Emergency', 'Urgent', 'Routine', 'Normal']).describe("The urgency classification of the scan based on the anomalies detected."),
    disclaimer: z.string().describe("A standard medical disclaimer.")
});
export type TextAnalysisOutput = z.infer<typeof TextAnalysisOutputSchema>;

export const ImageAnalysisInputSchema = z.object({
  imageUrl: z.string().describe("The public URL to the original medical scan."),
});
export type ImageAnalysisInput = z.infer<typeof ImageAnalysisInputSchema>;

export const ImageAnalysisOutputSchema = z.object({
  analyzedImageUrl: z.string().describe("A data URI of the newly generated image with anomalies marked on it."),
});
export type ImageAnalysisOutput = z.infer<typeof ImageAnalysisOutputSchema>;

export const ProcessImageOutputSchema = z.object({
    processedImageUrl: z.string().describe("A data URI of the denoised and cropped image."),
});


export const ReadPrescriptionInputSchema = z.object({
  storeId: z.string().describe("The ID of the medicine store."),
  patientId: z.string().describe("The ID of the patient."),
  prescriptionId: z.string().describe("The ID of the prescription."),
});
export type ReadPrescriptionInput = z.infer<typeof ReadPrescriptionInputSchema>;


export const AnalyzedMedicineSchema = z.object({
    name: z.string(),
    dosage: z.string(),
    frequency: z.string(),
    inventoryStatus: z.enum(['Available', 'Low Stock', 'Out of Stock', 'Unknown']),
});

export const ReadPrescriptionOutputSchema = z.object({
  medicines: z.array(AnalyzedMedicineSchema),
});
export type ReadPrescriptionOutput = z
  .infer<typeof ReadPrescriptionOutputSchema>;

export const DiseasePredictionInputSchema = z.object({
  patientId: z.string().describe("The ID of the patient to analyze."),
  symptoms: z.string().optional().describe("A comma-separated list of symptoms reported by the user."),
  chronicHistory: z.string().optional().describe("User's answer regarding chronic illnesses or family history."),
  medicationAllergies: z.string().optional().describe("User's answer regarding current medications or known allergies."),
  recentProcedures: z.string().optional().describe("User's answer regarding recent surgeries or vaccinations."),
  lifestyle: z.string().optional().describe("User's answer regarding lifestyle factors."),
  sleep: z.string().optional().describe("User's description of their sleep pattern."),
});
export type DiseasePredictionInput = z.infer<typeof DiseasePredictionInputSchema>;

export const DiseasePredictionOutputSchema = z.object({
  healthScore: z.number().describe("A hypothetical 'Health Risk Score' (0-100, where 100 is perfect health, 0 is critical)."),
  summary: z.string().describe("A concise summary of the patient's current health status."),
  riskFactors: z.array(z.string()).describe("The top 3 most significant risk factors identified."),
  recommendations: z.array(z.string()).describe("Three actionable, evidence-based health recommendations."),
  doctorSpecialty: z.string().describe("The single most appropriate medical specialist type to consult (e.g., 'Cardiologist', 'General Physician')."),
  urgency: z.enum(['Low', 'Moderate', 'High', 'Emergency']).describe("The estimated urgency level for a consultation."),
});
export type DiseasePredictionOutput = z.infer<typeof DiseasePredictionOutputSchema>;

export type Allergy = {
    id: string;
    name: string;
};

export type ChronicCondition = {
    id: string;
    name: string;
};
