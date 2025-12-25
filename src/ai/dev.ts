import { config } from 'dotenv';
config();

import '@/ai/flows/summarize-medical-report.ts';
import '@/ai/flows/analyze-scan-for-anomalies.ts';
import '@/ai/flows/generate-medicine-details.ts';
