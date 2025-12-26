'use server';

import { summarizeMedicalReport, type SummarizeMedicalReportInput } from '@/ai/flows/summarize-medical-report';
import { analyzeMedicalDocumentAction as analyzeMedicalDocumentFlow, processMedicalImageAction as processMedicalImageFlow, type TextAnalysisInput, type ImageAnalysisInput } from '@/ai/flows/analyze-scan-for-anomalies';
import { generateMedicineDetails } from '@/ai/flows/generate-medicine-details';
import type { GenerateMedicineDetailsInput, DiseasePredictionInput } from '@/ai/schemas';
import { readPrescriptionAndCheckInventory, type ReadPrescriptionInput } from '@/ai/flows/read-prescription-and-check-inventory';
import { predictDiseaseFromPatientData } from '@/ai/flows/predict-disease';

export async function summarizeMedicalReportAction(input: SummarizeMedicalReportInput) {
    // In a real app, you'd add user authentication/authorization checks here.
    return await summarizeMedicalReport(input);
}

export async function analyzeMedicalDocumentAction(input: TextAnalysisInput) {
    // In a real app, you'd add user authentication/authorization checks here.
    return await analyzeMedicalDocumentFlow(input);
}

export async function processMedicalImageAction(input: ImageAnalysisInput) {
    return await processMedicalImageFlow(input);
}

export async function generateMedicineDetailsAction(input: GenerateMedicineDetailsInput) {
    return await generateMedicineDetails(input);
}

export async function readPrescriptionAndCheckInventoryAction(input: ReadPrescriptionInput) {
    return await readPrescriptionAndCheckInventory(input);
}

export async function predictDiseaseAction(input: DiseasePredictionInput) {
    return await predictDiseaseFromPatientData(input);
}
