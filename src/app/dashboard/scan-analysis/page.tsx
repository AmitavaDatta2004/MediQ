'use client';
import React, { useState } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import { getStorage, ref, uploadString, getDownloadURL } from "firebase/storage";
import { useToast } from '@/hooks/use-toast';
import { analyzeMedicalDocumentAction, processMedicalImageAction } from '@/app/actions';
import type { ScanImage, UploadedFile } from '@/lib/types';
import { UploadCloud, Loader2, ScanEye, FileText, Wand2, Download, ShieldCheck, Save } from 'lucide-react';
import { ImageAnnotator } from '@/components/image-annotator';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import type { TextAnalysisOutput } from '@/ai/schemas';

export default function ScanAnalysisPage() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<string>('');
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const analysisResultsRef = React.useRef<HTMLDivElement>(null);


  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !user) return;
    const file = e.target.files[0];
    
    setIsUploading(true);
    setProcessingStatus('Uploading & Preprocessing...');

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64DataUrl = reader.result as string;
      
      const fileId = Date.now().toString();
      const newFile: UploadedFile = {
        id: fileId,
        name: file.name,
        type: file.type,
        date: new Date().toISOString(),
        previewUrl: base64DataUrl,
        scanId: uuidv4()
      };
      setFiles(prev => [newFile, ...prev]);

      try {
        setProcessingStatus('Uploading to secure storage...');
        const storage = getStorage();
        
        // This is a temporary upload to a processing location
        const tempUploadRef = ref(storage, `patients/${user.uid}/uploads/${newFile.scanId}_original_${file.name}`);
        const uploadSnapshot = await uploadString(tempUploadRef, base64DataUrl, 'data_url');
        const tempOriginalImageUrl = await getDownloadURL(uploadSnapshot.ref);

        setProcessingStatus('Denoising & Cropping...');
        const processedResult = await processMedicalImageAction({ imageUrl: tempOriginalImageUrl });
        const processedDataUrl = processedResult.analyzedImageUrl;
        
        setFiles(prev => prev.map(f => f.id === fileId ? { ...f, processedUrl: processedDataUrl } : f));

        setProcessingStatus('Analyzing Scan...');
        const textResult = await analyzeMedicalDocumentAction({ imageUrl: tempOriginalImageUrl, scanType: 'X-ray' });
        
        setFiles(prev => prev.map(f => f.id === fileId ? { ...f, analysisResult: textResult } : f));
        
        toast({ title: "Analysis Complete", description: "Review the analysis and save it to the patient record." });

      } catch (error) {
        console.error("Analysis pipeline failed", error);
        toast({ variant: 'destructive', title: 'Analysis Failed', description: 'An unexpected error occurred.'})
        // Clean up failed file from UI
        setFiles(prev => prev.filter(f => f.id !== fileId));
      } finally {
        setIsUploading(false);
        setProcessingStatus('');
      }
    };
    reader.readAsDataURL(file);
  };
  
  const handleSaveScan = async (file: UploadedFile) => {
    if (!file.previewUrl || !file.processedUrl || !file.analysisResult || !user) {
        toast({ variant: 'destructive', title: 'Save Error', description: 'Missing data to save the scan.' });
        return;
    }
    
    setIsSaving(true);
    toast({ title: 'Saving Scan to Record...' });

    try {
        const storage = getStorage();

        // 1. Upload original image
        const originalImageRef = ref(storage, `patients/${user.uid}/scan_images/${file.scanId}_original.jpg`);
        await uploadString(originalImageRef, file.previewUrl, 'data_url');
        const originalImageUrl = await getDownloadURL(originalImageRef);
        
        // 2. Upload processed image
        const analyzedImageRef = ref(storage, `patients/${user.uid}/scan_images/${file.scanId}_analyzed.jpg`);
        await uploadString(analyzedImageRef, file.processedUrl, 'data_url');
        const finalAnalyzedImageUrl = await getDownloadURL(analyzedImageRef);
        
        // 3. Save the final record to Firestore
        const scanCollectionRef = collection(firestore, `patients/${user.uid}/scan_images`);
        const finalScanData: ScanImage = {
              id: file.scanId,
              patientId: user.uid,
              uploadDate: new Date().toISOString(),
              scanType: 'X-ray', // Or detect from UI
              imageUrl: originalImageUrl,
              analyzedImageUrl: finalAnalyzedImageUrl,
              aiAnalysis: file.analysisResult
        };
        await addDoc(scanCollectionRef, finalScanData);

        toast({ title: "Scan Saved", description: "The scan and its analysis are now part of your permanent record." });

        // Optionally remove from the UI after saving
        setFiles(prev => prev.filter(f => f.id !== file.id));

    } catch (error) {
        console.error("Failed to save scan:", error);
        toast({ variant: 'destructive', title: 'Save Failed', description: 'Could not save the scan to your records.' });
    } finally {
        setIsSaving(false);
    }
  }

  const downloadAnnotatedImage = async (file: UploadedFile) => {
    const imageUrl = file.processedUrl || file.previewUrl;
    if (!imageUrl || !file.analysisResult) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      
      ctx.drawImage(img, 0, 0);

      ctx.lineWidth = 5;
      ctx.strokeStyle = '#ef4444';
      ctx.font = 'bold 24px Inter, sans-serif';

      const findings = file.analysisResult?.findings || [];
      findings.forEach((finding, idx) => {
        if (finding.box_2d) {
           const { ymin, xmin, ymax, xmax } = finding.box_2d;
           const x = xmin * img.width;
           const y = ymin * img.height;
           const w = (xmax - xmin) * img.width;
           const h = (ymax - ymin) * img.height;
           ctx.strokeRect(x, y, w, h);
           const label = `${idx + 1}: ${finding.label}`;
           const textMetrics = ctx.measureText(label);
           ctx.fillStyle = 'rgba(0,0,0,0.7)';
           ctx.fillRect(x, y - 30, textMetrics.width + 10, 30);
           ctx.fillStyle = '#ffffff';
           ctx.fillText(label, x + 5, y - 8);
        }
      });

      const link = document.createElement('a');
      link.download = `processed-analysis-${file.name}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    };
    img.crossOrigin = "anonymous";
    img.src = imageUrl;
  };

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-500">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Medical Scan Analysis</h2>
        <p className="text-gray-500 text-lg">Upload X-rays, MRI scans, or medical documents for instant AI analysis.</p>
      </div>
      
      <Card className="relative overflow-hidden border-2 border-dashed border-primary/20 bg-white hover:border-primary/40 hover:bg-primary/5 transition-all duration-300 group cursor-pointer shadow-sm hover:shadow-md">
         <input type="file" id="fileUpload" className="hidden" accept="image/*,.pdf" onChange={handleFileUpload} disabled={isUploading || isSaving} />
         <label htmlFor="fileUpload" className="cursor-pointer flex flex-col items-center justify-center w-full h-full p-12">
            {isUploading ? (
              <div className="flex flex-col items-center py-6">
                <div className="relative">
                  <div className="w-20 h-20 border-4 border-primary/10 border-t-primary rounded-full animate-spin"></div>
                  <Loader2 className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 text-primary animate-pulse" />
                </div>
                <span className="mt-6 text-xl font-semibold text-primary/80 animate-pulse">{processingStatus}</span>
                <p className="text-sm text-primary/60 mt-2">This usually takes 5-10 seconds</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4">
                 <div className="w-24 h-24 bg-primary/5 rounded-full flex items-center justify-center group-hover:scale-110 group-hover:bg-primary/10 transition-all duration-300">
                   <UploadCloud className="w-12 h-12 text-primary/70" />
                 </div>
                 <div className="text-center space-y-1">
                   <h3 className="text-2xl font-bold text-gray-900">Click to upload scan</h3>
                   <p className="text-gray-500 font-medium">Supported formats: JPG, PNG, PDF</p>
                 </div>
                 <div className="mt-4 flex gap-8 text-sm text-gray-400">
                    <span className="flex items-center gap-1"><ShieldCheck className="w-4 h-4" /> HIPAA Compliant</span>
                    <span className="flex items-center gap-1"><Wand2 className="w-4 h-4" /> AI Enhanced</span>
                 </div>
              </div>
            )}
         </label>
      </Card>

      <div className="space-y-10">
         {files.map(file => (
           <Card key={file.id} className="overflow-hidden shadow-xl shadow-gray-200/50 border border-gray-100 transition-all hover:shadow-2xl hover:shadow-gray-200/60">
              <CardHeader className="flex flex-col md:flex-row md:items-center justify-between p-6 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100 gap-4">
                 <div className="flex items-center gap-5">
                    <div className="p-4 bg-white rounded-2xl shadow-sm border border-gray-100 text-primary">
                      {file.type.includes('image') ? <ScanEye className="w-8 h-8" /> : <FileText className="w-8 h-8" />}
                    </div>
                    <div>
                       <h4 className="text-xl font-bold text-gray-900 leading-tight">{file.name}</h4>
                       <p className="text-sm text-gray-500 mt-1 font-medium">{new Date(file.date).toLocaleString(undefined, { dateStyle: 'long', timeStyle: 'short' })}</p>
                    </div>
                 </div>
                 <div className="flex items-center gap-3">
                    {file.processedUrl && (
                      <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 border-indigo-100 shadow-sm">
                        <Wand2 className="w-4 h-4 mr-2" /> AI Enhanced
                      </Badge>
                    )}
                    <Badge variant={file.analysisResult ? 'default' : 'outline'} className={`uppercase tracking-wide shadow-sm ${file.analysisResult ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                      {file.analysisResult ? 'Analyzed' : 'Pending'}
                    </Badge>
                    {file.analysisResult && (
                        <Button size="sm" onClick={() => handleSaveScan(file)} disabled={isSaving}>
                            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                             Save to Records
                        </Button>
                    )}
                 </div>
              </CardHeader>

              <CardContent className="p-6 md:p-10 space-y-12">
                {file.type.includes('image') && (
                  <div className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-8 items-center">
                      <div className="space-y-3 group">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Input Source</h3>
                            <Badge variant="outline">Raw</Badge>
                        </div>
                        <div className="relative aspect-[4/3] bg-gray-100 rounded-2xl overflow-hidden border border-gray-200 shadow-inner">
                          {file.previewUrl ? (
                            <img src={file.previewUrl} alt="Original" className="w-full h-full object-contain mix-blend-multiply opacity-80 group-hover:opacity-100 transition-opacity duration-300" />
                          ) : <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm font-medium">No Preview</div>}
                        </div>
                      </div>

                      <div className="flex justify-center">
                        <div className="bg-gray-50 p-3 rounded-full border border-gray-200 text-gray-400 rotate-90 md:rotate-0">
                            <Wand2 className="w-6 h-6 text-primary" />
                        </div>
                      </div>

                      <div className="space-y-3 group">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xs font-bold text-primary uppercase tracking-wider">AI Processed Image</h3>
                            <Badge variant="secondary" className='bg-primary/10 text-primary'>Denoised & Cropped</Badge>
                        </div>
                        <div className="relative aspect-[4/3] bg-gray-900 rounded-2xl overflow-hidden border-2 border-primary/20 shadow-lg ring-4 ring-primary/5">
                          {file.processedUrl ? (
                            <img src={file.processedUrl} alt="Processed" className="w-full h-full object-contain" />
                          ) : (
                             <div className="w-full h-full flex flex-col items-center justify-center text-gray-500 gap-2">
                                <ScanEye className="w-8 h-8 opacity-50" />
                                <span className="text-sm font-medium">Processing...</span>
                             </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none"></div>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div className="bg-gray-900 rounded-3xl p-1 shadow-2xl overflow-hidden border border-gray-800">
                        <div className="bg-gray-800/50 px-6 py-4 flex items-center justify-between border-b border-gray-700/50">
                             <div className="flex items-center gap-3">
                                <div className="p-2 bg-primary/10 rounded-lg text-primary/70">
                                   <ScanEye className="w-5 h-5" />
                                </div>
                                <div>
                                    <h5 className="text-white font-bold">Interactive Analysis</h5>
                                    <p className="text-gray-400 text-xs">Hover over regions to see details</p>
                                </div>
                             </div>
                             <button 
                              onClick={() => downloadAnnotatedImage(file)}
                              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-bold transition-all border border-white/5 backdrop-blur-sm"
                            >
                              <Download className="w-3.5 h-3.5" /> Export Analysis
                           </button>
                        </div>
                        
                        <div className="min-h-[500px] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                             {(file.processedUrl || file.previewUrl) ? (
                                    <ImageAnnotator imageUrl={file.processedUrl || file.previewUrl || ''} findings={file.analysisResult?.findings || []} />
                                ) : (
                                    <div className="text-gray-500 flex flex-col items-center">
                                        <Loader2 className="w-8 h-8 animate-spin mb-2" />
                                        Waiting for analysis data...
                                    </div>
                                )}
                        </div>
                    </div>

                  </div>
                )}

                {file.analysisResult && (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-8 border-t border-gray-100">
                        <div className="lg:col-span-1 space-y-6">
                             <div>
                                <CardTitle className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-primary" /> AI Summary
                                </CardTitle>
                                <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 text-gray-700 leading-relaxed text-sm shadow-inner">
                                    {file.analysisResult.summary}
                                </div>
                             </div>
                             
                             <Card className="bg-amber-50 p-4 rounded-xl border-amber-100 text-amber-900 text-xs flex gap-3">
                                <Wand2 className="w-5 h-5 shrink-0 text-amber-600" />
                                <p className="font-medium">{file.analysisResult.disclaimer || "This is an AI-generated analysis and is not a substitute for professional medical advice."}</p>
                             </Card>
                        </div>

                        <div className="lg:col-span-2">
                            <CardTitle className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                                <ScanEye className="w-4 h-4 text-primary" /> Detailed Findings
                            </CardTitle>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {file.analysisResult.findings && file.analysisResult.findings.length > 0 ? (
                                    file.analysisResult.findings.map((finding, idx) => (
                                        <Card key={idx} className="p-5 shadow-sm hover:shadow-md hover:border-primary/30 transition-all group">
                                            <CardHeader className='p-0 flex-row items-start justify-between mb-3'>
                                                <div className="flex items-center gap-3">
                                                    <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                                                        {idx + 1}
                                                    </span>
                                                    <span className="font-bold text-gray-900 group-hover:text-primary transition-colors">{finding.label}</span>
                                                </div>
                                                <Badge variant="outline" className={`text-[10px] font-bold uppercase tracking-wide border ${
                                                    finding.confidence.toLowerCase().includes('high') 
                                                    ? 'bg-red-50 text-red-700 border-red-100' 
                                                    : 'bg-yellow-50 text-yellow-700 border-yellow-100'
                                                }`}>
                                                    {finding.confidence}
                                                </Badge>
                                            </CardHeader>
                                            <CardContent className="p-0">
                                            <p className="text-gray-600 text-sm leading-relaxed border-t border-gray-50 pt-3 mt-1">
                                                {finding.explanation}
                                            </p>
                                            </CardContent>
                                        </Card>
                                    ))
                                ) : (
                                    <Card className="col-span-2 p-8 border-dashed border-gray-300 text-center">
                                        <ScanEye className="w-10 h-10 text-green-500 mx-auto mb-3 opacity-50" />
                                        <p className="text-gray-500 font-medium">No specific anomalies detected in the AI analysis.</p>
                                    </Card>
                                )}
                            </div>
                        </div>
                     </div>
                )}
              </CardContent>
           </Card>
         ))}
      </div>
    </div>
  );
}
