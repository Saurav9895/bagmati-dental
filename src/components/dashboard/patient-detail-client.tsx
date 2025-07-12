
'use client';

import * as React from 'react';
import type { Patient, Treatment, Appointment, AssignedTreatment } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, Phone, Calendar as CalendarIcon, MapPin, FileText, Heart, PlusCircle, Loader2, Trash2, CreditCard, Edit } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { addTreatmentToPatient, removeTreatmentFromPatient } from '@/app/actions/patients';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { addAppointment, updateAppointment } from '@/app/actions/appointments';
import { format } from 'date-fns';
import { Badge } from '../ui/badge';
import { ToothChart } from './tooth-chart';

const appointmentSchema = z.object({
    procedure: z.string().min(2, "Procedure must be at least 2 characters."),
    date: z.string().refine((val) => !isNaN(Date.parse(val)), "Invalid date."),
    time: z.string().min(1, "Time is required."),
    doctor: z.string().min(2, "Doctor's name must be at least 2 characters."),
    description: z.string().optional(),
});
type AppointmentFormValues = z.infer<typeof appointmentSchema>;


const formatTime12h = (time24h: string): string => {
    if (!time24h) return '';
    const [hours, minutes] = time24h.split(':');
    const h = parseInt(hours, 10);
    const m = parseInt(minutes, 10);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 || 12;
    return `${hour12}:${String(m).padStart(2, '0')} ${ampm}`;
};

export function PatientDetailClient({ initialPatient, treatments, appointments: initialAppointments }: { initialPatient: Patient, treatments: Treatment[], appointments: Appointment[] }) {
    const [patient, setPatient] = React.useState<Patient>(initialPatient);
    const [appointments, setAppointments] = React.useState<Appointment[]>(initialAppointments);
    
    const [selectedTreatmentId, setSelectedTreatmentId] = React.useState<string | undefined>(undefined);
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    
    const [isAlertOpen, setIsAlertOpen] = React.useState(false);
    const [treatmentToDelete, setTreatmentToDelete] = React.useState<AssignedTreatment | null>(null);
    const [isDeleting, setIsDeleting] = React.useState(false);

    const [isAppointmentDialogOpen, setIsAppointmentDialogOpen] = React.useState(false);
    const [isSubmittingAppointment, setIsSubmittingAppointment] = React.useState(false);
    const [editingAppointment, setEditingAppointment] = React.useState<Appointment | null>(null);
    
    const [isTreatmentDialogOpen, setIsTreatmentDialogOpen] = React.useState(false);
    const [selectedTooth, setSelectedTooth] = React.useState<number | null>(null);

    const { toast } = useToast();

    const appointmentForm = useForm<AppointmentFormValues>({
        resolver: zodResolver(appointmentSchema),
        defaultValues: {
            procedure: '',
            date: format(new Date(), 'yyyy-MM-dd'),
            time: '',
            doctor: '',
            description: '',
        },
    });

    const handleAppointmentSubmit = async (data: AppointmentFormValues) => {
        setIsSubmittingAppointment(true);
        let result;
        if (editingAppointment) {
            result = await updateAppointment(editingAppointment.id, data);
        } else {
            result = await addAppointment({
                ...data,
                patientId: patient.id,
                patientName: patient.name,
            });
        }

        if (result.success && result.data) {
            let newAppointments;
            if (editingAppointment) {
                newAppointments = appointments.map(a => a.id === editingAppointment.id ? { ...a, ...result.data! } : a);
                toast({ title: "Appointment updated successfully!" });
            } else {
                newAppointments = [result.data, ...appointments];
                toast({ title: "Appointment added successfully!" });
            }

            newAppointments.sort((a, b) => {
                const dateA = new Date(a.date).getTime();
                const dateB = new Date(b.date).getTime();
                if (dateB !== dateA) {
                    return dateB - dateA;
                }
                return a.time.localeCompare(b.time);
            });
            setAppointments(newAppointments);
            setIsAppointmentDialogOpen(false);
            setEditingAppointment(null);
            appointmentForm.reset();
        } else {
            toast({ variant: 'destructive', title: `Failed to ${editingAppointment ? 'update' : 'add'} appointment`, description: result.error });
        }
        setIsSubmittingAppointment(false);
    };
    
    const handleNewAppointmentClick = () => {
        setEditingAppointment(null);
        appointmentForm.reset({
            procedure: '',
            date: format(new Date(), 'yyyy-MM-dd'),
            time: '',
            doctor: '',
            description: '',
        });
        setIsAppointmentDialogOpen(true);
    };

    const handleEditAppointmentClick = (appointment: Appointment) => {
        setEditingAppointment(appointment);
        appointmentForm.reset({
            procedure: appointment.procedure,
            date: format(new Date(appointment.date), 'yyyy-MM-dd'),
            time: appointment.time,
            doctor: appointment.doctor,
            description: appointment.description || '',
        });
        setIsAppointmentDialogOpen(true);
    };

    const totalAmount = React.useMemo(() => {
        if (!patient || !patient.assignedTreatments) return 0;
        return patient.assignedTreatments.reduce((total, treatment) => total + treatment.amount, 0);
    }, [patient]);

    const amountPaid = React.useMemo(() => {
        if (!patient || !patient.payments) return 0;
        return patient.payments.reduce((total, payment) => total + payment.amount, 0);
    }, [patient]);

    const totalDiscount = React.useMemo(() => {
        if (!patient || !patient.discounts) return 0;
        return patient.discounts.reduce((total, discount) => total + discount.amount, 0);
    }, [patient]);

    const balanceDue = totalAmount - amountPaid - totalDiscount;

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
            // Determine the correct price
            const toothSpecificPrice = selectedTooth ? selectedTreatment.prices?.[selectedTooth] : undefined;
            const priceToApply = toothSpecificPrice ?? selectedTreatment.defaultAmount;

            const treatmentWithPrice = { ...selectedTreatment, amount: priceToApply };

            const result = await addTreatmentToPatient(patient.id, treatmentWithPrice, selectedTooth ?? undefined);
            
            if (result.success && result.data) {
                const updatedPatient = { ...patient, ...(result.data as Partial<Patient>) };
                setPatient(updatedPatient);
                toast({ title: "Treatment added successfully!" });
                setIsTreatmentDialogOpen(false);
                setSelectedTreatmentId(undefined);
                setSelectedTooth(null);
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
    
    const onToothClick = (toothNumber: number) => {
        setSelectedTooth(toothNumber);
        setIsTreatmentDialogOpen(true);
    }
    
    const assignedTreatmentsByTooth = React.useMemo(() => {
        const map = new Map<number, AssignedTreatment[]>();
        if (patient.assignedTreatments) {
            for (const treatment of patient.assignedTreatments) {
                if (treatment.tooth) {
                    if (!map.has(treatment.tooth)) {
                        map.set(treatment.tooth, []);
                    }
                    map.get(treatment.tooth)!.push(treatment);
                }
            }
        }
        return map;
    }, [patient.assignedTreatments]);


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
                                <span>{patient.email || 'N/A'}</span>
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
                                <span>Date of Birth: {patient.dob ? new Date(patient.dob).toLocaleDateString() : 'N/A'}</span>
                            </div>
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
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div className="flex items-center gap-2">
                                <CalendarIcon className="h-5 w-5" />
                                <CardTitle>Appointment History</CardTitle>
                            </div>
                            <Button variant="outline" size="sm" onClick={handleNewAppointmentClick}>
                                <PlusCircle className="mr-2 h-4 w-4" />
                                New Appointment
                            </Button>
                        </CardHeader>
                        <CardContent>
                            {appointments && appointments.length > 0 ? (
                                <div className="space-y-4">
                                    {appointments.map((appt) => (
                                        <div key={appt.id} className="p-3 border rounded-md bg-card shadow-sm">
                                            <div className="flex justify-between items-start gap-4">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <p className="font-semibold">{appt.procedure}</p>
                                                        {appt.status === 'Completed' ? (
                                                            <Badge variant="secondary">Completed</Badge>
                                                        ) : (
                                                            <Badge variant="outline">Scheduled</Badge>
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-muted-foreground">
                                                        {new Date(appt.date).toLocaleDateString()} with {appt.doctor}
                                                    </p>
                                                </div>
                                                <div className="flex items-center">
                                                    <p className="text-sm font-medium text-muted-foreground shrink-0 pr-2">{formatTime12h(appt.time)}</p>
                                                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEditAppointmentClick(appt)}>
                                                        <Edit className="h-4 w-4" />
                                                        <span className="sr-only">Edit appointment</span>
                                                    </Button>
                                                </div>
                                            </div>
                                            {appt.description && (
                                                <div className="mt-3 pt-3 border-t">
                                                    <p className="text-sm font-semibold mb-1">Notes / Prescription:</p>
                                                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{appt.description}</p>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground text-center py-4">No appointment history found.</p>
                            )}
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
                            <div>
                                <h4 className="font-semibold mb-2 text-base">Dental Chart</h4>
                                <CardDescription className="mb-4">Click on a tooth to assign a treatment.</CardDescription>
                                <ToothChart onToothClick={onToothClick} assignedTreatments={assignedTreatmentsByTooth} />
                            </div>

                            <div>
                                <h4 className="font-semibold mb-2 text-base">Assigned Treatments</h4>
                                {patient.assignedTreatments && patient.assignedTreatments.length > 0 ? (
                                    <ul className="space-y-2">
                                        {patient.assignedTreatments.map((t) => (
                                            <li key={t.dateAdded} className="flex justify-between items-center p-3 border rounded-md bg-card">
                                                <div className="flex-1">
                                                    <p className="font-medium">{t.name} {t.tooth && `(Tooth #${t.tooth})`}</p>
                                                    <p className="text-xs text-muted-foreground">Added on: {new Date(t.dateAdded).toLocaleDateString()}</p>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <span className="font-semibold text-primary">Rs. {t.amount.toFixed(2)}</span>
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
                                            <TableHead>Tooth #</TableHead>
                                            <TableHead>Date Added</TableHead>
                                            <TableHead className="text-right">Amount</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {patient.assignedTreatments && patient.assignedTreatments.length > 0 ? (
                                            patient.assignedTreatments.map(treatment => (
                                                <TableRow key={treatment.dateAdded}>
                                                    <TableCell className="font-medium">{treatment.name}</TableCell>
                                                    <TableCell>{treatment.tooth || 'N/A'}</TableCell>
                                                    <TableCell>{new Date(treatment.dateAdded).toLocaleDateString()}</TableCell>
                                                    <TableCell className="text-right">Rs. {treatment.amount.toFixed(2)}</TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={4} className="text-center h-24">No treatments assigned.</TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                            <Separator />
                            <div className="space-y-2 text-right font-medium">
                                <div className="flex justify-end items-center text-md">
                                    <span className="text-muted-foreground mr-4">Total Treatment Cost:</span>
                                    <span>Rs. {totalAmount.toFixed(2)}</span>
                                </div>
                                 <div className="flex justify-end items-center text-md">
                                    <span className="text-muted-foreground mr-4">Total Discount:</span>
                                    <span className="text-destructive">-Rs. {totalDiscount.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-end items-center text-md">
                                    <span className="text-muted-foreground mr-4">Total Paid:</span>
                                    <span className="text-green-600">Rs. {amountPaid.toFixed(2)}</span>
                                </div>
                                <Separator className="my-2" />
                                <div className="flex justify-end items-center text-lg font-bold">
                                    <span className="text-muted-foreground mr-4">Balance Due:</span>
                                     {balanceDue <= 0 && totalAmount > 0 ? (
                                        <span className="text-green-600">Fully Paid</span>
                                    ) : (
                                        <span>Rs. {balanceDue.toFixed(2)}</span>
                                    )}
                                </div>
                            </div>
                            
                            <Separator />
                             <div>
                                <h4 className="font-semibold mb-2 text-base">Applied Discounts</h4>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Reason</TableHead>
                                            <TableHead>Date Added</TableHead>
                                            <TableHead className="text-right">Amount</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {patient.discounts && patient.discounts.length > 0 ? (
                                            patient.discounts.map(discount => (
                                                <TableRow key={discount.dateAdded}>
                                                    <TableCell className="font-medium">{discount.reason}</TableCell>
                                                    <TableCell>{new Date(discount.dateAdded).toLocaleDateString()}</TableCell>
                                                    <TableCell className="text-right">-Rs. {discount.amount.toFixed(2)}</TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={3} className="text-center h-24">No discounts applied.</TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
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
                                                    <TableCell className="text-right">Rs. {payment.amount.toFixed(2)}</TableCell>
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
             <Dialog open={isAppointmentDialogOpen} onOpenChange={setIsAppointmentDialogOpen}>
                <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>{editingAppointment ? 'Edit' : 'New'} Appointment for {patient.name}</DialogTitle>
                        <DialogDescription>
                            Fill out the form below to {editingAppointment ? 'update the' : 'schedule a new'} appointment.
                        </DialogDescription>
                    </DialogHeader>
                    <Form {...appointmentForm}>
                        <form onSubmit={appointmentForm.handleSubmit(handleAppointmentSubmit)} className="space-y-4 py-4">
                            <FormField control={appointmentForm.control} name="procedure" render={({ field }) => (
                                <FormItem>
                                <FormLabel>Procedure</FormLabel>
                                <FormControl><Input placeholder="e.g., Routine Check-up" {...field} /></FormControl>
                                <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={appointmentForm.control} name="doctor" render={({ field }) => (
                                <FormItem>
                                <FormLabel>Doctor</FormLabel>
                                <FormControl><Input placeholder="Doctor's name" {...field} /></FormControl>
                                <FormMessage />
                                </FormItem>
                            )} />
                            <div className="grid grid-cols-2 gap-4">
                                <FormField control={appointmentForm.control} name="date" render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Date</FormLabel>
                                    <FormControl><Input type="date" {...field} /></FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )} />
                                <FormField control={appointmentForm.control} name="time" render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Time</FormLabel>
                                    <FormControl><Input type="time" {...field} /></FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )} />
                            </div>
                            <FormField
                                control={appointmentForm.control}
                                name="description"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Description (Notes, etc.)</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Optional notes for the appointment..." {...field} value={field.value || ''} />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                            )} />
                            <DialogFooter>
                                <Button type="submit" disabled={isSubmittingAppointment}>
                                    {isSubmittingAppointment ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                    Save Appointment
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>
            <Dialog open={isTreatmentDialogOpen} onOpenChange={(open) => { if(!open) { setSelectedTooth(null); setSelectedTreatmentId(undefined); } setIsTreatmentDialogOpen(open); }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Assign Treatment to Tooth #{selectedTooth}</DialogTitle>
                        <DialogDescription>Select a treatment to assign to this tooth.</DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                         <Select onValueChange={setSelectedTreatmentId} value={selectedTreatmentId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a treatment to add" />
                            </SelectTrigger>
                            <SelectContent>
                                {treatments.map(t => (
                                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Button onClick={handleAddTreatment} disabled={isSubmitting || !selectedTreatmentId} className="w-full">
                            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
                            Assign Treatment
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
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
