'use server';

import { summarizeMedicalReport, type SummarizeMedicalReportInput } from '@/ai/flows/summarize-medical-report';
import { analyzeMedicalDocumentAction as analyzeMedicalDocumentFlow, processMedicalImageAction as processMedicalImageFlow, type TextAnalysisInput } from '@/ai/flows/analyze-scan-for-anomalies';
import { generateMedicineDetails } from '@/ai/flows/generate-medicine-details';
import type { GenerateMedicineDetailsInput, ImageAnalysisOutput, TextAnalysisOutput } from '@/ai/schemas';
import { readPrescriptionAndCheckInventory, type ReadPrescriptionInput } from '@/ai/flows/read-prescription-and-check-inventory';

export async function summarizeMedicalReportAction(input: SummarizeMedicalReportInput) {
    // In a real app, you'd add user authentication/authorization checks here.
    return await summarizeMedicalReport(input);
}

export async function analyzeMedicalDocumentAction(input: TextAnalysisInput): Promise<TextAnalysisOutput> {
    // In a real app, you'd add user authentication/authorization checks here.
    return await analyzeMedicalDocumentFlow(input);
}

export async function processMedicalImageAction(input: TextAnalysisInput): Promise<ImageAnalysisOutput> {
    return await processMedicalImageFlow(input);
}

export async function generateMedicineDetailsAction(input: GenerateMedicineDetailsInput) {
    return await generateMedicineDetails(input);
}

export async function readPrescriptionAndCheckInventoryAction(input: ReadPrescriptionInput) {
    return await readPrescriptionAndCheckInventory(input);
}
