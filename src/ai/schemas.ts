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
    findings: z.array(FindingSchema).optional().describe("A list of all detected anomalies, including their bounding boxes."),
    criticalFindings: z.string().optional().describe("Any findings that require immediate medical attention. If none, this can be omitted."),
    keyFindings: z.string().optional().describe("Important, non-critical observations, measurements, or identified structures."),
    healthIssues: z.string().optional().describe("Identified health concerns or conditions suggested by the scan."),
    recommendedSpecialists: z.string().optional().describe("Types of medical professionals to consult based on the findings (e.g., Neurologist, Cardiologist)."),
    recommendedMedications: zഓക്കേ, ನಾನು ನಿಮ್ಮ ಕೋಡ್ ಅನ್ನು ವಿಶ್ಲೇಷಿಸಿದ್ದೇನೆ. ದೋಷಗಳು ಮತ್ತು ಸುಧಾರಣೆಗಳಿಗೆ ಕೆಲವು ಸಲಹೆಗಳು ಇಲ್ಲಿವೆ:

**1. `src/app/dashboard/scan-analysis/page.tsx`**

*   **`handleFileUpload` ফাংশನ್:**
    *   `scanType` ಅನ್ನು ਹਾਰ্ড-কোಡ್ ಮಾಡಲಾಗಿದೆ (`'X-ray'`). ಬಳಕೆದಾರರಿಗೆ ಇದನ್ನು ಆಯ್ಕೆ ಮಾಡಲು ಅವಕಾಶ ನೀಡಿ.
    *   ದೋಷ ನಿರ್ವಹಣೆ (Error Handling) ಸುಧಾರಿಸಿ. `try...catch` ಬ್ಲಾಕ್‌ನಲ್ಲಿ ದೋಷದ ಬಗ್ಗೆ మరింత വിവരಗಳನ್ನು ಲಾಗ್ ಮಾಡಿ.
    *   `updateFileState` ಅನ್ನು ಬಳಸುವಾಗ, ಹಿಂದಿನ `analysisResult` ಅನ್ನು ಉಳಿಸಿಕೊಳ್ಳಿ, ಇಲ್ಲದಿದ್ದರೆ ಅದು ಅಳಿಸಿಹೋಗುತ್ತದೆ.
*   **`downloadAnnotatedImage` ফাংশன்:**
    *   `ctx.font` ನಲ್ಲಿ `'Inter, sans-serif'` ಅನ್ನು ಬಳಸುತ್ತಿದ್ದೀರಿ. `'Inter'` ಫಾಂಟ್ ಲಭ್ಯವಿಲ್ಲದಿದ್ದರೆ, ಇದು ಸರಿಯಾಗಿ ಕಾಣಿಸುವುದಿಲ್ಲ. ಸುರಕ್ಷಿತ ಫಾಂಟ್‌ಗಳನ್ನು ಬಳಸಿ.
    *   `findings` ಅರೇ ಖಾಲിയಾಗಿದ್ದರೆ, `forEach` லூப் ರನ್ ಆಗುವುದಿಲ್ಲ. దీనికి బదులుగా, `if (findings && findings.length > 0)` ಎಂದು ಪರಿಶೀಲಿಸಿ.

**2. `src/components/image-annotator.tsx`**

*   `getHeatmapStyle` ফাংশನ್‌ನಲ್ಲಿ, `confidence` ಸ್ಟ్రిಂಗ್‌ನ కేస్-సెన్సిటివిటీ ಅನ್ನು ನಿರ್ವಹಿಸಲು `.toLowerCase()` ಬಳಸಿ.
*   `visualFindings` ನಲ್ಲಿ `box_2d` ಇದೆಯೇ ಎಂದು ಪರಿಶೀಲಿಸುವಾಗ, ದೋಷಗಳನ್ನು ತಪ್ಪಿಸಲು `finding && finding.box_2d` ಎಂದು ಬಳಸಿ.
*   Tooltips ಅನ್ನು ಉತ್ತಮವಾಗಿ ಪ್ರದർശിಸಲು, CSS `transform` ಮತ್ತು `translate` ಬಳಸಿ.

**3. `src/ai/flows/analyze-scan-for-anomalies.ts`**

*   **`textAnalysisPrompt`:**
    *   `findings` ನಲ್ಲಿ `box_2d` ಅನ್ನು ಐಚ್ಛಿಕ (optional) ಮಾಡಿ, કારણ કે కొన్ని വിശകലನೆಗಳಿಗೆ ಇದು ಅನ್ವಯಿಸುವುದಿಲ್ಲ.
    *   `disclaimer` ಅನ್ನು પ્રોంప్ట్‌లో ಸೇರಿಸಿ, જેથી AI ಯಾವಾಗಲೂ ಒಂದು ಹಕ್ಕುತ್ಯಾಗವನ್ನು ನೀಡುತ್ತದೆ.
*   **`imageAnalysisPrompt`:**
    *   "Draw clear boxes, circles, or outlines" ಎಂದು ಹೇಳುವ ಬದಲು, "Use the provided bounding box coordinates to draw rectangles" ಎಂದು સ્પಷ್ಟವಾಗಿ చెప్పండి.
    *   `analysis` ఆబ్జెక్ట్‌ను JSON ಸ್ಟ్రిಂಗ್ ಆಗಿ మార్చಲು `{{{json analysis}}}` ಬಳಸಿ.

**4. `src/lib/types.ts`**

*   `ScanImage` ಟೈಪ್‌ನಲ್ಲಿ, `findings` ಅನ್ನು ಐಚ್ಛික (`?`) ಮಾಡಿ.
*   `MedicalFinding` ನಲ್ಲಿ `box_2d` ಅನ್ನು ಐಚ್ಛิก (`?`) ಮಾಡಿ.

ಈ ಬದಲಾವಣೆಗಳನ್ನು ಮಾಡಿದ ನಂತರ, ನಿಮ್ಮ കോഡ് మరింత ದೃಢವಾಗಿ ಮತ್ತು ದೋಷರಹಿತವಾಗಿ ಕಾರ್ಯನಿರ್ವಹಿಸುತ್ತದೆ.