'use server';

import { summarizeMedicalReport, type SummarizeMedicalReportInput } from '@/ai/flows/summarize-medical-report';
import { analyzeScanForAnomaliesAction, generateAnalyzedImageAction, type TextAnalysisInput, type ImageAnalysisInput } from '@/ai/flows/analyze-scan-for-anomalies';
import { generateMedicineDetails } from '@/ai/flows/generate-medicine-details';
import type { GenerateMedicineDetailsInput } from '@/ai/schemas';
import { readPrescriptionAndCheckInventory, type ReadPrescriptionInput } from '@/ai/flows/read-prescription-and-check-inventory';

export async function summarizeMedicalReportAction(input: SummarizeMedicalReportInput) {
    // In a real app, you'd add user authentication/authorization checks here.
    return await summarizeMedicalReport(input);
}

export async function analyzeScanForAnomaliesAction(input: TextAnalysisInput) {
    // In a real app, you'd add user authentication/authorization checks here.
    return await analyzeScanForAnomaliesAction(input);
}

export async function generateAnalyzedImageAction(input: ImageAnalysisInput) {
    return await generateAnalyzedImageAction(input);
}

export async function generateMedicineDetailsAction(input: GenerateMedicineDetailsInput) {
    return await generateMedicineDetails(input);
}

export async function readPrescriptionAndCheckInventoryAction(input: ReadPrescriptionInput) {
    return await readPrescriptionAndCheckInventory(input);
}
