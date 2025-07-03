
'use client';

import * as React from 'react';
import type { Patient, Treatment } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, Phone, Calendar as CalendarIcon, MapPin, FileText, Heart, PlusCircle, Loader2, Trash2, CreditCard } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { addTreatmentToPatient, removeTreatmentFromPatient } from '@/app/actions/patients';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

type AssignedTreatment = Treatment & { dateAdded: string };

export function PatientDetailClient({ initialPatient, treatments }: { initialPatient: Patient, treatments: Treatment[] }) {
    const [patient, setPatient] = React.useState<Patient>(initialPatient);
    const [showTreatmentForm, setShowTreatmentForm] = React.useState(false);
    const [selectedTreatmentId, setSelectedTreatmentId] = React.useState<string | undefined>(undefined);
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    
    const [isAlertOpen, setIsAlertOpen] = React.useState(false);
    const [treatmentToDelete, setTreatmentToDelete] = React.useState<AssignedTreatment | null>(null);
    const [isDeleting, setIsDeleting] = React.useState(false);

    const { toast } = useToast();

    const totalAmount = React.useMemo(() => {
        if (!patient || !patient.assignedTreatments) {
        return 0;
        }
        return patient.assignedTreatments.reduce((total, treatment) => total + treatment.amount, 0);
    }, [patient]);

    const amountPaid = React.useMemo(() => {
        if (!patient || !patient.payments) {
            return 0;
        }
        return patient.payments.reduce((total, payment) => total + payment.amount, 0);
    }, [patient]);

    const balanceDue = totalAmount - amountPaid;

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
    
    const handleRemoveTreatmentClick = (treatment: AssignedTreatment) => {
        setTreatmentToDelete(treatment);
        setIsAlertOpen(true);
    };

    const confirmRemoveTreatment = async () => {
        if (!treatmentToDelete) return;
        
        setIsDeleting(true);
        try {
            const result = await removeTreatmentFromPatient(patient.id, treatmentToDelete);
            if (result.success && result.data) {
                setPatient(prev => ({...prev, ...(result.data as Partial<Patient>)}));
                toast({ title: "Treatment removed successfully!" });
            } else {
                 toast({ variant: 'destructive', title: 'Failed to remove treatment', description: result.error });
            }
        } catch (error) {
             toast({ variant: 'destructive', title: 'An unexpected error occurred', description: (error as Error).message });
        } finally {
            setIsDeleting(false);
            setIsAlertOpen(false);
            setTreatmentToDelete(null);
        }
    }


    return (
        <>
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
                                        {patient.assignedTreatments.map((t) => (
                                            <li key={t.dateAdded} className="flex justify-between items-center p-3 border rounded-md bg-card">
                                                <div className="flex-1">
                                                    <p className="font-medium">{t.name}</p>
                                                    <p className="text-xs text-muted-foreground">Added on: {new Date(t.dateAdded).toLocaleDateString()}</p>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <span className="font-semibold text-primary">${t.amount.toFixed(2)}</span>
                                                    <Button variant="ghost" size="icon" onClick={() => handleRemoveTreatmentClick(t)} disabled={isDeleting}>
                                                        <Trash2 className="h-4 w-4 text-destructive" />
                                                        <span className="sr-only">Remove treatment</span>
                                                    </Button>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-sm text-muted-foreground text-center py-4">No treatments assigned yet.</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                    
                    <Card className="md:col-span-2 lg:col-span-3">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <CreditCard className="h-5 w-5" />
                                Billing Summary
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                             <div>
                                <h4 className="font-semibold mb-2 text-base">Itemized Bill</h4>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Treatment</TableHead>
                                            <TableHead>Date Added</TableHead>
                                            <TableHead className="text-right">Amount</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {patient.assignedTreatments && patient.assignedTreatments.length > 0 ? (
                                            patient.assignedTreatments.map(treatment => (
                                                <TableRow key={treatment.dateAdded}>
                                                    <TableCell className="font-medium">{treatment.name}</TableCell>
                                                    <TableCell>{new Date(treatment.dateAdded).toLocaleDateString()}</TableCell>
                                                    <TableCell className="text-right">${treatment.amount.toFixed(2)}</TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={3} className="text-center h-24">No treatments assigned.</TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                            <Separator />
                            <div className="space-y-2 text-right font-medium">
                                <div className="flex justify-end items-center text-md">
                                    <span className="text-muted-foreground mr-4">Total Treatment Cost:</span>
                                    <span>${totalAmount.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-end items-center text-md">
                                    <span className="text-muted-foreground mr-4">Total Paid:</span>
                                    <span className="text-green-600">${amountPaid.toFixed(2)}</span>
                                </div>
                                <Separator className="my-2" />
                                <div className="flex justify-end items-center text-lg font-bold">
                                    <span className="text-muted-foreground mr-4">Balance Due:</span>
                                     {balanceDue <= 0 && totalAmount > 0 ? (
                                        <span className="text-green-600">Fully Paid</span>
                                    ) : (
                                        <span>${balanceDue.toFixed(2)}</span>
                                    )}
                                </div>
                            </div>
                            
                            <Separator />
                            
                            <div>
                                <h4 className="font-semibold mb-2 text-base">Payment History</h4>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Method</TableHead>
                                            <TableHead className="text-right">Amount</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {patient.payments && patient.payments.length > 0 ? (
                                            patient.payments.map(payment => (
                                                <TableRow key={payment.dateAdded}>
                                                    <TableCell>{new Date(payment.date).toLocaleDateString()}</TableCell>
                                                    <TableCell>{payment.method}</TableCell>
                                                    <TableCell className="text-right">${payment.amount.toFixed(2)}</TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={3} className="text-center h-24">No payments recorded yet.</TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>

                </div>
            </div>
            <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently remove the treatment `
                            {treatmentToDelete?.name}` from this patient's plan. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setTreatmentToDelete(null)}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmRemoveTreatment} disabled={isDeleting}>
                            {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Continue
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
