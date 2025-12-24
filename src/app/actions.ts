'use server';

import { summarizeMedicalReport, type SummarizeMedicalReportInput } from '@/ai/flows/summarize-medical-report';
import { analyzeScanForAnomalies, type AnalyzeScanForAnomaliesInput } from '@/ai/flows/analyze-scan-for-anomalies';

export async function summarizeMedicalReportAction(input: SummarizeMedicalReportInput) {
    // In a real app, you'd add user authentication/authorization checks here.
    return await summarizeMedicalReport(input);
}

export async function analyzeScanForAnomaliesAction(input: AnalyzeScanForAnomaliesInput) {
    // In a real app, you'd add user authentication/authorization checks here.
    return await analyzeScanForAnomalies(input);
}
