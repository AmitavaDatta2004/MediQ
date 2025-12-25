'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Upload, Loader2, Image as ImageIcon, AlertCircle, ShieldCheck, CheckCircle, BrainCircuit, Bot, FileText, Pill, Users, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { analyzeScanForAnomaliesAction } from '@/app/actions';
import type { AnalyzeScanForAnomaliesOutput } from '@/ai/flows/analyze-scan-for-anomalies';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useUser, useFirestore } from '@/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import { getStorage, ref, uploadString, getDownloadURL } from "firebase/storage";
import { Progress } from '@/components/ui/progress';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Separator } from '@/components/ui/separator';

const placeholderImageUrl = "https://picsum.photos/seed/201/600/400";

type AnalysisStep = 
  | 'idle'
  | 'preprocessing'
  | 'analyzing'
  | 'detecting'
  | 'heatmap'
  | 'classifying'
  | 'complete'
  | 'error';

const analysisSteps: Record<AnalysisStep, { text: string; progress: number }> = {
    idle: { text: 'Ready for analysis', progress: 0 },
    preprocessing: { text: 'Preprocessing and validating image...', progress: 15 },
    analyzing: { text: 'Engaging Vision AI...', progress: 30 },
    detecting: { text: 'Detecting features and anomalies...', progress: 50 },
    heatmap: { text: 'Generating annotated image...', progress: 75 },
    classifying: { text: 'Performing risk and urgency classification...', progress: 90 },
    complete: { text: 'Analysis complete!', progress: 100 },
    error: { text: 'An error occurred.', progress: 100 },
}


export default function ScanAnalysisPage() {
  const [analysis, setAnalysis] = useState<AnalyzeScanForAnomaliesOutput | null>(null);
  const [currentStep, setCurrentStep] = useState<AnalysisStep>('idle');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [scanType, setScanType] = useState<'X-ray' | 'CT' | 'MRI' | ''>('');
  const [patientDetails, setPatientDetails] = useState('');
  const { toast } = useToast();
  const { user } = useUser();
  const firestore = useFirestore();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setAnalysis(null);
    setCurrentStep('idle');
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleAnalysis = async () => {
    if (!previewUrl || !scanType || !user) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please upload an image and select a scan type.",
      });
      return;
    }

    setAnalysis(null);
    setCurrentStep('preprocessing');
    
    try {
      await new Promise(res => setTimeout(res, 500));
      setCurrentStep('analyzing');
      const result = await analyzeScanForAnomaliesAction({
        scanDataUri: previewUrl,
        scanType,
        patientDetails,
      });
      setCurrentStep('detecting');
      await new Promise(res => setTimeout(res, 1000));
      setCurrentStep('heatmap');
      await new Promise(res => setTimeout(res, 1000));
      setCurrentStep('classifying');
      await new Promise(res => setTimeout(res, 500));
      
      setAnalysis(result);
      setCurrentStep('complete');

      const storage = getStorage();
      
      // 1. Upload original scan image
      const originalImageRef = ref(storage, `patients/${user.uid}/scan_images/${uuidv4()}_original`);
      const originalImageSnapshot = await uploadString(originalImageRef, previewUrl, 'data_url');
      const originalImageUrl = await getDownloadURL(originalImageSnapshot.ref);

      // 2. Upload analyzed image (with heatmap/markings)
      let analyzedImageUrl = originalImageUrl;
      if (result.analyzedImageUrl) {
        const analyzedImageRef = ref(storage, `patients/${user.uid}/scan_images/${uuidv4()}_analyzed`);
        const analyzedImageSnapshot = await uploadString(analyzedImageRef, result.analyzedImageUrl, 'data_url');
        analyzedImageUrl = await getDownloadURL(analyzedImageSnapshot.ref);
      }

      // 3. Save analysis to Firestore
        const scanId = uuidv4();
        const scanCollectionRef = collection(firestore, `patients/${user.uid}/scan_images`);
        await addDoc(scanCollectionRef, {
            id: scanId,
            patientId: user.uid,
            uploadDate: new Date().toISOString(),
            scanType,
            imageUrl: originalImageUrl, // The original, un-analyzed image
            analyzedImageUrl: analyzedImageUrl, // The image with AI markings
            aiAnalysis: {
                summary: result.summary,
                criticalFindings: result.criticalFindings || null,
                keyFindings: result.keyFindings || null,
                healthIssues: result.healthIssues || null,
                recommendedSpecialists: result.recommendedSpecialists || null,
                recommendedMedications: result.recommendedMedications || null,
                urgencyClassification: result.urgencyClassification,
            }
        });
      
      toast({
        title: "Analysis Complete & Saved",
        description: "Your scan has been analyzed and saved to your records.",
      });
    } catch (error) {
      setCurrentStep('error');
      console.error(error);
      toast({
        variant: "destructive",
        title: "Analysis Failed",
        description: "There was an error analyzing your scan. Please try again.",
      });
    }
  };
  
  const getUrgencyBadgeVariant = (urgency?: string) => {
    switch (urgency) {
      case 'Emergency':
      case 'Urgent':
        return 'destructive';
      case 'Routine':
        return 'secondary';
      default:
        return 'default';
    }
  }
  
  const isLoading = currentStep !== 'idle' && currentStep !== 'complete' && currentStep !== 'error';

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        {/* Left Column: Uploader and Preview */}
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Upload Medical Scan</CardTitle>
              <CardDescription>
                Upload an X-ray, CT, or MRI scan for anomaly detection.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
               <div className="relative aspect-video w-full flex items-center justify-center border-2 border-dashed border-muted-foreground/30 rounded-lg text-center overflow-hidden bg-muted/20">
                {previewUrl ? (
                  <Image src={previewUrl} alt="Scan preview" fill className="object-contain" />
                ) : (
                  <div className='p-8'>
                      <ImageIcon className="w-12 h-12 text-muted-foreground mx-auto" data-ai-hint="medical scan"/>
                      <p className="mt-2 text-sm text-muted-foreground">Image preview</p>
                  </div>
                )}
              </div>
              <Input id="scan-upload" type="file" onChange={handleFileChange} accept="image/*" disabled={isLoading} />
              
              <div className="space-y-2">
                  <Label htmlFor="scan-type">Scan Type</Label>
                  <Select onValueChange={(value) => setScanType(value as any)} value={scanType} disabled={isLoading}>
                      <SelectTrigger id="scan-type">
                          <SelectValue placeholder="Select scan type..." />
                      </SelectTrigger>
                      <SelectContent>
                          <SelectItem value="X-ray">X-ray</SelectItem>
                          <SelectItem value="CT">CT Scan</SelectItem>
                          <SelectItem value="MRI">MRI</SelectItem>
                      </SelectContent>
                  </Select>
              </div>
              
              <div className="space-y-2">
                  <Label htmlFor="patient-details">Patient Details (Optional)</Label>
                  <Textarea
                      id="patient-details"
                      placeholder="e.g., Age: 45, Male, History of..."
                      value={patientDetails}
                      onChange={(e) => setPatientDetails(e.target.value)}
                      disabled={isLoading}
                  />
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleAnalysis} disabled={isLoading || !previewUrl || !scanType} className="w-full">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  'Analyze Scan'
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* Right Column: Analysis Results */}
        <div className="min-h-full">
          {isLoading && (
              <Card className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-8">
                   <div className="w-full max-w-md space-y-4">
                      <div className="flex items-center gap-3 justify-center">
                          <Bot className="h-8 w-8 animate-pulse" />
                          <p className="text-lg font-medium">{analysisSteps[currentStep].text}</p>
                      </div>
                      <Progress value={analysisSteps[currentStep].progress} className="w-full" />
                  </div>
              </Card>
          )}

          {currentStep === 'complete' && analysis ? (
            <div className='animate-in fade-in-50 duration-500 space-y-6'>
              <Card>
                <CardHeader>
                    <CardTitle>Analysis Results</CardTitle>
                    <CardDescription>Comprehensive breakdown of your medical report.</CardDescription>
                </CardHeader>
                <CardFooter>
                    <Button variant="outline">
                        Download PDF Report
                    </Button>
                </CardFooter>
              </Card>

              <div className="grid grid-cols-2 gap-4">
                  <Card>
                      <CardHeader><CardTitle className="text-base">Original Scan</CardTitle></CardHeader>
                      <CardContent>
                          <Image src={previewUrl!} alt="Original Scan" width={400} height={300} className="rounded-md object-contain" />
                      </CardContent>
                  </Card>
                  <Card>
                      <CardHeader><CardTitle className="text-base">Analyzed Scan</CardTitle></CardHeader>
                      <CardContent>
                           <Image src={analysis.analyzedImageUrl} alt="Analyzed Scan" width={400} height={300} className="rounded-md object-contain" />
                      </CardContent>
                  </Card>
              </div>
              
              <Card>
                  <CardHeader>
                      <CardTitle className="text-xl">Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                      <p className="text-muted-foreground">{analysis.summary}</p>
                  </CardContent>
              </Card>

              <Accordion type="multiple" defaultValue={['criticalFindings', 'keyFindings']} className="w-full space-y-4">
                {analysis.criticalFindings && (
                    <Card className="bg-destructive/10 border-destructive/30">
                        <AccordionItem value="criticalFindings" className="border-0">
                            <AccordionTrigger className="p-6 text-lg font-semibold text-destructive hover:no-underline">
                                <div className="flex items-center gap-3">
                                    <AlertCircle /> Critical Findings
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="px-6 pb-6">
                                <p className="text-destructive/90">{analysis.criticalFindings}</p>
                            </AccordionContent>
                        </AccordionItem>
                    </Card>
                )}

                {analysis.keyFindings && (
                     <Card>
                        <AccordionItem value="keyFindings" className="border-0">
                            <AccordionTrigger className="p-6 text-lg font-semibold text-primary hover:no-underline">
                                <div className="flex items-center gap-3">
                                    <FileText /> Key Findings
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="px-6 pb-6">
                                <p className="text-muted-foreground">{analysis.keyFindings}</p>
                            </AccordionContent>
                        </AccordionItem>
                    </Card>
                )}

                {analysis.healthIssues && (
                     <Card>
                        <AccordionItem value="healthIssues" className="border-0">
                            <AccordionTrigger className="p-6 text-lg font-semibold text-amber-600 hover:no-underline">
                                <div className="flex items-center gap-3">
                                    <BrainCircuit /> Health Issues
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="px-6 pb-6">
                                <p className="text-muted-foreground">{analysis.healthIssues}</p>
                            </AccordionContent>
                        </AccordionItem>
                    </Card>
                )}
                 {analysis.recommendedSpecialists && (
                     <Card>
                        <AccordionItem value="recommendedSpecialists" className="border-0">
                            <AccordionTrigger className="p-6 text-lg font-semibold text-violet-600 hover:no-underline">
                                <div className="flex items-center gap-3">
                                    <Users /> Recommended Specialists
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="px-6 pb-6">
                                <p className="text-muted-foreground">{analysis.recommendedSpecialists}</p>
                            </AccordionContent>
                        </AccordionItem>
                    </Card>
                )}
                 {analysis.recommendedMedications && (
                     <Card>
                        <AccordionItem value="recommendedMedications" className="border-0">
                            <AccordionTrigger className="p-6 text-lg font-semibold text-green-600 hover:no-underline">
                                <div className="flex items-center gap-3">
                                    <Pill /> Recommended Medications
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="px-6 pb-6">
                                <p className="text-muted-foreground">{analysis.recommendedMedications}</p>
                            </AccordionContent>
                        </AccordionItem>
                    </Card>
                )}
              </Accordion>


            </div>
          ) : !isLoading && (
            <Card className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-8">
              <BrainCircuit className="w-16 h-16 mb-4 text-primary/30" />
              <h3 className="text-lg font-semibold">Your scan analysis will appear here</h3>
              <p className="text-sm">Upload a scan and click "Analyze Scan" to begin.</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
