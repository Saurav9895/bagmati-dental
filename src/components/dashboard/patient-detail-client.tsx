
'use client';

import * as React from 'react';
import type { Patient, Treatment } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, Phone, Calendar as CalendarIcon, MapPin, FileText, Heart, PlusCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { addTreatmentToPatient } from '@/app/actions/patients';

export function PatientDetailClient({ initialPatient, treatments }: { initialPatient: Patient, treatments: Treatment[] }) {
    const [patient, setPatient] = React.useState<Patient>(initialPatient);
    const [showTreatmentForm, setShowTreatmentForm] = React.useState(false);
    const [selectedTreatmentId, setSelectedTreatmentId] = React.useState<string | undefined>(undefined);
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const { toast } = useToast();

    const handleAddTreatment = async () => {
        if (!selectedTreatmentId) {
            toast({ variant: 'destructive', title: 'Please select a treatment.' });
            return;
        }
        const selectedTreatment = treatments.find(t => t.id === selectedTreatmentId);
        if (!selectedTreatment) {
            toast({ variant: 'destructive', title: 'Selected treatment not found.' });
            return;
        }

        setIsSubmitting(true);
        try {
            const result = await addTreatmentToPatient(patient.id, selectedTreatment);
            
            if (result.success && result.data) {
                // The result.data from the server action might not be a full Patient object
                // It's better to cast it to a partial and merge with existing state
                const updatedPatient = { ...patient, ...(result.data as Partial<Patient>) };
                setPatient(updatedPatient);
                toast({ title: "Treatment added successfully!" });
                setShowTreatmentForm(false);
                setSelectedTreatmentId(undefined); 
            } else {
                toast({ variant: 'destructive', title: 'Failed to add treatment', description: result.error });
            }
        } catch (error) {
             toast({ variant: 'destructive', title: 'An unexpected error occurred', description: (error as Error).message });
        } finally {
            setIsSubmitting(false);
        }
    };


    return (
        <div className="space-y-6">
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold font-headline">{patient.name}</h1>
                    <p className="text-muted-foreground">
                        Patient Details {patient.registrationNumber && `- Registration #${patient.registrationNumber}`}
                    </p>
                </div>
                <Button asChild variant="outline">
                    <Link href="/dashboard/patients">Back to List</Link>
                </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Contact Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 text-sm">
                        <div className="flex items-center gap-4">
                            <Mail className="h-5 w-5 text-muted-foreground" />
                            <span>{patient.email}</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <Phone className="h-5 w-5 text-muted-foreground" />
                            <span>{patient.phone}</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <MapPin className="h-5 w-5 text-muted-foreground" />
                            <span>{patient.address}</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <CalendarIcon className="h-5 w-5 text-muted-foreground" />
                            <span>Date of Birth: {new Date(patient.dob).toLocaleDateString()}</span>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Status</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 text-sm">
                        <div className="flex items-center gap-2">
                            <span className={`h-2 w-2 rounded-full ${patient.status === 'Active' ? 'bg-green-500' : 'bg-gray-500'}`}></span>
                            <span>{patient.status}</span>
                        </div>
                        <p className="text-muted-foreground">Last Visit: {new Date(patient.lastVisit).toLocaleDateString()}</p>
                    </CardContent>
                </Card>

                <Card className="md:col-span-2 lg:col-span-3">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            Medical History
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                            {patient.medicalHistory || 'No medical history provided.'}
                        </p>
                    </CardContent>
                </Card>

                <Card className="md:col-span-2 lg:col-span-3">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Heart className="h-5 w-5" />
                            Treatment Plan
                        </CardTitle>
                        {patient.registrationNumber && (
                          <CardDescription>Registration Number: <span className="font-semibold text-primary">{patient.registrationNumber}</span></CardDescription>
                        )}
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="add-treatment-checkbox"
                                checked={showTreatmentForm}
                                onCheckedChange={(checked) => setShowTreatmentForm(Boolean(checked))}
                            />
                            <label htmlFor="add-treatment-checkbox" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                Proceed with new treatment
                            </label>
                        </div>

                        {showTreatmentForm && (
                            <div className="p-4 border rounded-lg space-y-4 bg-muted/50">
                                <Select onValueChange={setSelectedTreatmentId} value={selectedTreatmentId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a treatment to add" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {treatments.map(t => (
                                            <SelectItem key={t.id} value={t.id}>{t.name} - ${t.amount.toFixed(2)}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Button onClick={handleAddTreatment} disabled={isSubmitting || !selectedTreatmentId}>
                                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
                                    Add Treatment to Plan
                                </Button>
                            </div>
                        )}

                        <div>
                            <h4 className="font-semibold mb-2 text-base">Assigned Treatments</h4>
                            {patient.assignedTreatments && patient.assignedTreatments.length > 0 ? (
                                <ul className="space-y-2">
                                    {patient.assignedTreatments.map((t, index) => (
                                        <li key={`${t.id}-${index}`} className="flex justify-between items-center p-3 border rounded-md bg-card">
                                            <div>
                                                <p className="font-medium">{t.name}</p>
                                                <p className="text-xs text-muted-foreground">Added on: {new Date(t.dateAdded).toLocaleDateString()}</p>
                                            </div>
                                            <span className="font-semibold text-primary">${t.amount.toFixed(2)}</span>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-sm text-muted-foreground text-center py-4">No treatments assigned yet.</p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
