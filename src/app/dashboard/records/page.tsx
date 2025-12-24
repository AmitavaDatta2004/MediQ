'use client';
import { useState } from 'react';
import { useCollection, useUser, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import type { MedicalReport, ScanImage } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { FileText, Image as ImageIcon, Download } from 'lucide-react';

export default function RecordsPage() {
    const { user } = useUser();
    const firestore = useFirestore();

    const reportsQuery = useMemoFirebase(() => {
        if (!user) return null;
        return query(collection(firestore, `patients/${user.uid}/medical_reports`), orderBy('uploadDate', 'desc'));
    }, [firestore, user]);

    const scansQuery = useMemoFirebase(() => {
        if (!user) return null;
        return query(collection(firestore, `patients/${user.uid}/scan_images`), orderBy('uploadDate', 'desc'));
    }, [firestore, user]);

    const { data: medicalReports, isLoading: reportsLoading } = useCollection<MedicalReport>(reportsQuery);
    const { data: scanImages, isLoading: scansLoading } = useCollection<ScanImage>(scansQuery);
    
    const isLoading = reportsLoading || scansLoading;

    if (isLoading) {
        return <div>Loading your health records...</div>
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight font-headline">My Health Records</h1>
                <p className="text-muted-foreground">A complete history of your uploaded reports and scans.</p>
            </div>
            <Tabs defaultValue="reports">
                <TabsList>
                    <TabsTrigger value="reports">Medical Reports</TabsTrigger>
                    <TabsTrigger value="scans">Scan Images</TabsTrigger>
                </TabsList>
                <TabsContent value="reports">
                    <Card>
                        <CardHeader>
                            <CardTitle>Medical Reports</CardTitle>
                            <CardDescription>All your uploaded and analyzed documents.</CardDescription>
                        </CardHeader>
                        <CardContent>
                             <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Report</TableHead>
                                        <TableHead>Uploaded On</TableHead>
                                        <TableHead>Summary</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {medicalReports?.map(report => (
                                        <TableRow key={report.id}>
                                            <TableCell className="font-medium flex items-center gap-2">
                                                <FileText className="h-5 w-5 text-primary" />
                                                <span>{report.reportType}</span>
                                            </TableCell>
                                            <TableCell>{new Date(report.uploadDate).toLocaleDateString()}</TableCell>
                                            <TableCell className="max-w-xs truncate">{report.aiSummary}</TableCell>
                                            <TableCell className="text-right">
                                                <Button asChild variant="outline" size="sm">
                                                    <Link href={report.fileUrl} target="_blank" rel="noopener noreferrer">
                                                        <Download className="mr-2 h-4 w-4" />
                                                        View
                                                    </Link>
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                            {medicalReports?.length === 0 && <p className="text-center text-muted-foreground py-8">No medical reports found.</p>}
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="scans">
                    <Card>
                        <CardHeader>
                            <CardTitle>Scan Images</CardTitle>
                            <CardDescription>All your uploaded and analyzed scans.</CardDescription>
                        </CardHeader>
                        <CardContent>
                             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {scanImages?.map(scan => (
                                    <Card key={scan.id}>
                                        <CardHeader>
                                            <div className="relative aspect-video w-full rounded-md overflow-hidden">
                                                <Image src={scan.imageUrl} alt={`Scan from ${new Date(scan.uploadDate).toLocaleDateString()}`} fill objectFit='cover' data-ai-hint="medical scan" />
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <CardTitle className="text-lg">{scan.scanType}</CardTitle>
                                            <CardDescription>Uploaded on {new Date(scan.uploadDate).toLocaleDateString()}</CardDescription>
                                            <div className="flex items-center justify-between mt-4">
                                                <span className="text-sm font-medium">Urgency:</span>
                                                <Badge variant={scan.aiAnalysis.urgencyClassification === 'Emergency' || scan.aiAnalysis.urgencyClassification === 'Urgent' ? 'destructive' : 'secondary'}>{scan.aiAnalysis.urgencyClassification}</Badge>
                                            </div>
                                             <p className="text-sm text-muted-foreground mt-2 line-clamp-3">{scan.aiAnalysis.anomalyReport}</p>
                                        </CardContent>
                                    </Card>
                                ))}
                             </div>
                             {scanImages?.length === 0 && <p className="text-center text-muted-foreground py-8">No scan images found.</p>}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
