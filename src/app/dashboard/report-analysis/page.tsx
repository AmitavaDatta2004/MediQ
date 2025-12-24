'use client';
import { useState } from 'react';
import { Upload, Loader2, FileText, AlertTriangle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { summarizeMedicalReportAction } from '@/app/actions';
import type { SummarizeMedicalReportOutput } from '@/ai/flows/summarize-medical-report';
import { Separator } from '@/components/ui/separator';

export default function ReportAnalysisPage() {
  const [report, setReport] = useState<SummarizeMedicalReportOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [fileName, setFileName] = useState('');
  const { toast } = useToast();

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setReport(null);
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUri = e.target?.result as string;
      try {
        const result = await summarizeMedicalReportAction({ reportDataUri: dataUri });
        setReport(result);
        toast({
          title: "Analysis Complete",
          description: "Your medical report has been successfully analyzed.",
        });
      } catch (error) {
        console.error(error);
        toast({
          variant: "destructive",
          title: "Analysis Failed",
          description: "There was an error analyzing your report. Please try again.",
        });
      } finally {
        setIsLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="grid gap-6 md:grid-cols-3">
      <div className="md:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle>Upload Medical Report</CardTitle>
            <CardDescription>
              Upload a PDF or image of your medical report to get a simplified explanation.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <label htmlFor="report-upload" className="flex flex-col items-center justify-center border-2 border-dashed border-muted-foreground/30 rounded-lg p-8 text-center cursor-pointer hover:bg-muted/50 transition-colors">
                <Upload className="w-12 h-12 text-muted-foreground" />
                <p className="mt-4 text-sm text-muted-foreground">Drag & drop or click to upload</p>
                 <Input id="report-upload" type="file" className="hidden" onChange={handleFileChange} accept="image/*,application/pdf" disabled={isLoading} />
              </label>
              {fileName && <p className="text-sm text-center text-muted-foreground">File: {fileName}</p>}
              {isLoading && (
                <div className="flex items-center justify-center gap-2 text-muted-foreground">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Analyzing report...</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="md:col-span-2">
        <Card className="min-h-[500px]">
          <CardHeader>
            <CardTitle>AI-Generated Summary</CardTitle>
            <CardDescription>
              This is an AI-powered summary and should not replace professional medical advice.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {report ? (
              <div className="space-y-6">
                <div>
                  <h3 className="flex items-center gap-2 font-semibold text-lg"><FileText className="w-5 h-5 text-primary" />Summary</h3>
                  <p className="text-muted-foreground mt-2 prose-sm">{report.summary}</p>
                </div>
                <Separator/>
                <div>
                  <h3 className="flex items-center gap-2 font-semibold text-lg"><AlertTriangle className="w-5 h-5 text-destructive" />Potential Issues</h3>
                  <p className="text-muted-foreground mt-2 prose-sm">{report.potentialIssues}</p>
                </div>
                <Separator/>
                <div>
                  <h3 className="flex items-center gap-2 font-semibold text-lg"><ArrowRight className="w-5 h-5 text-accent" />Next Steps</h3>
                  <p className="text-muted-foreground mt-2 prose-sm">{report.nextSteps}</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-8">
                <FileText className="w-16 h-16 mb-4" />
                <h3 className="text-lg font-semibold">Your analysis will appear here</h3>
                <p className="text-sm">Upload a medical report to get started.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
