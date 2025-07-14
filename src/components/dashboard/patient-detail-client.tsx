

'use client';

import * as React from 'react';
import type { Patient, Treatment, Appointment, AssignedTreatment, Prescription, ChiefComplaint, ClinicalExamination, DentalExamination } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, Phone, Calendar as CalendarIcon, MapPin, FileText, Heart, PlusCircle, Loader2, Trash2, CreditCard, Edit, User as UserIcon, ScrollText, Upload, Check, ClipboardPlus, History, X, Search, ChevronsUpDown } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { addTreatmentToPatient, removeTreatmentFromPatient, addPrescriptionToPatient } from '@/app/actions/patients';
import { addClinicalExaminationToPatient, removeClinicalExaminationFromPatient } from '@/app/actions/clinical-examinations';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { addAppointment, updateAppointment } from '@/app/actions/appointments';
import { format } from 'date-fns';
import { Badge } from '../ui/badge';
import { ToothChart, COLOR_PALETTE, PrimaryToothChart } from './tooth-chart';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '../ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '../ui/command';
import { Label } from '@/components/ui/label';
import { addChiefComplaint } from '@/app/actions/examinations';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';


const appointmentSchema = z.object({
    procedure: z.string().min(2, "Procedure must be at least 2 characters."),
    date: z.string().refine((val) => !isNaN(Date.parse(val)), "Invalid date."),
    time: z.string().min(1, "Time is required."),
    doctor: z.string().min(2, "Doctor's name must be at least 2 characters."),
    description: z.string().optional(),
});
type AppointmentFormValues = z.infer<typeof appointmentSchema>;

const prescriptionSchema = z.object({
  notes: z.string().min(2, "Prescription notes must be at least 2 characters."),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), "Invalid date."),
});
type PrescriptionFormValues = z.infer<typeof prescriptionSchema>

const newComplaintSchema = z.object({
    name: z.string().min(2, "Complaint name must be at least 2 characters."),
});
type NewComplaintFormValues = z.infer<typeof newComplaintSchema>;

const clinicalExaminationSchema = z.object({
    chiefComplaint: z.array(z.string()).min(1, { message: 'At least one chief complaint is required.' }),
    medicalHistory: z.string().optional(),
    dentalHistory: z.string().optional(),
    observationNotes: z.string().optional(),
});
type ClinicalExaminationFormValues = z.infer<typeof clinicalExaminationSchema>;

const toothExaminationSchema = z.object({
  dentalExaminationId: z.string().min(1, 'Please select a dental examination.'),
  investigation: z.string().optional(),
  diagnosisId: z.string().min(1, 'Please select a diagnosis.'),
});
type ToothExaminationFormValues = z.infer<typeof toothExaminationSchema>;


const formatTime12h = (time24h: string): string => {
    if (!time24h) return '';
    const [hours, minutes] = time24h.split(':');
    const h = parseInt(hours, 10);
    const m = parseInt(minutes, 10);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 || 12;
    return `${hour12}:${String(m).padStart(2, '0')} ${ampm}`;
};

interface PatientDetailClientProps {
    initialPatient: Patient;
    treatments: Treatment[];
    appointments: Appointment[];
    chiefComplaints: ChiefComplaint[];
    dentalExaminations: DentalExamination[];
}

export function PatientDetailClient({ initialPatient, treatments, appointments: initialAppointments, chiefComplaints: initialChiefComplaints, dentalExaminations }: PatientDetailClientProps) {
    const [patient, setPatient] = React.useState<Patient>(initialPatient);
    const [appointments, setAppointments] = React.useState<Appointment[]>(initialAppointments);
    const [chiefComplaints, setChiefComplaints] = React.useState<ChiefComplaint[]>(initialChiefComplaints);
    
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    
    const [isAlertOpen, setIsAlertOpen] = React.useState(false);
    const [treatmentToDelete, setTreatmentToDelete] = React.useState<AssignedTreatment | null>(null);
    const [isDeleting, setIsDeleting] = React.useState(false);

    const [isAppointmentDialogOpen, setIsAppointmentDialogOpen] = React.useState(false);
    const [isSubmittingAppointment, setIsSubmittingAppointment] = React.useState(false);
    const [editingAppointment, setEditingAppointment] = React.useState<Appointment | null>(null);
    
    const [isToothExamDialogOpen, setIsToothExamDialogOpen] = React.useState(false);
    const [selectedTooth, setSelectedTooth] = React.useState<number | string | null>(null);
    
    const [isPrescriptionDialogOpen, setIsPrescriptionDialogOpen] = React.useState(false);
    const [isSubmittingPrescription, setIsSubmittingPrescription] = React.useState(false);

    const [isExaminationDialogOpen, setIsExaminationDialogOpen] = React.useState(false);
    const [examinationToDelete, setExaminationToDelete] = React.useState<ClinicalExamination | null>(null);
    const [showPrimaryTeeth, setShowPrimaryTeeth] = React.useState(false);


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

    const prescriptionForm = useForm<PrescriptionFormValues>({
        resolver: zodResolver(prescriptionSchema),
        defaultValues: {
            notes: '',
            date: format(new Date(), 'yyyy-MM-dd'),
        },
    });

    const clinicalExaminationForm = useForm<ClinicalExaminationFormValues>({
        resolver: zodResolver(clinicalExaminationSchema),
        defaultValues: {
            chiefComplaint: [],
            medicalHistory: '',
            dentalHistory: '',
            observationNotes: '',
        },
    });

    const toothExaminationForm = useForm<ToothExaminationFormValues>({
        resolver: zodResolver(toothExaminationSchema),
        defaultValues: {
            dentalExaminationId: '',
            investigation: '',
            diagnosisId: '',
        }
    });
    
    const handleClinicalExaminationSubmit = async (data: ClinicalExaminationFormValues) => {
        setIsSubmitting(true);
        const payload = { ...data, date: new Date().toISOString() };
        const result = await addClinicalExaminationToPatient(patient.id, payload);

        if (result.success && result.data) {
            setPatient(prev => ({ ...prev, ...(result.data as Partial<Patient>) }));
            toast({ title: 'Examination record saved successfully!' });
            setIsExaminationDialogOpen(false);
            clinicalExaminationForm.reset({ chiefComplaint: [], medicalHistory: '', dentalHistory: '', observationNotes: '' });
        } else {
            toast({ variant: 'destructive', title: 'Failed to save examination', description: result.error });
        }
        setIsSubmitting(false);
    };

    const handleConfirmDeleteExamination = async () => {
        if (!examinationToDelete) return;
        setIsDeleting(true);
        const result = await removeClinicalExaminationFromPatient(patient.id, examinationToDelete.id);
        if (result.success && result.data) {
            setPatient(prev => ({...prev, ...(result.data as Partial<Patient>)}));
            toast({ title: "Examination record deleted." });
        } else {
            toast({ variant: 'destructive', title: 'Failed to delete record', description: result.error });
        }
        setIsDeleting(false);
        setExaminationToDelete(null);
    };

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

    const handlePrescriptionSubmit = async (data: PrescriptionFormValues) => {
        setIsSubmittingPrescription(true);
        const result = await addPrescriptionToPatient(patient.id, data);

        if (result.success && result.data) {
            const updatedPatient = { ...patient, ...(result.data as Partial<Patient>) };
            setPatient(updatedPatient);
            toast({ title: "Prescription added successfully!" });
            setIsPrescriptionDialogOpen(false);
            prescriptionForm.reset({ notes: '', date: format(new Date(), 'yyyy-MM-dd') });
        } else {
            toast({ variant: 'destructive', title: 'Failed to add prescription', description: result.error });
        }
        setIsSubmittingPrescription(false);
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
        return patient.assignedTreatments.reduce((total, treatment) => total + (treatment.amount || 0), 0);
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

    const handleToothExaminationSubmit = async (data: ToothExaminationFormValues) => {
        if (!data.diagnosisId) {
            toast({ variant: 'destructive', title: 'Please select a diagnosis.' });
            return;
        }

        const selectedTreatment = treatments.find(t => t.id === data.diagnosisId);
        if (!selectedTreatment) {
            toast({ variant: 'destructive', title: 'Selected diagnosis not found.' });
            return;
        }

        const selectedExamination = dentalExaminations.find(e => e.id === data.dentalExaminationId);
        if (!selectedExamination) {
            toast({ variant: 'destructive', title: 'Selected dental examination not found.' });
            return;
        }
        
        const investigationNote = data.investigation ? `\nInvestigation: ${data.investigation}` : '';
        const treatmentDescription = `Dental Examination: ${selectedExamination.name}${investigationNote}`;

        setIsSubmitting(true);
        try {
            const treatmentWithPrice: AssignedTreatment = { 
                ...selectedTreatment, 
                amount: selectedTreatment.defaultAmount || 0,
                description: treatmentDescription,
                dateAdded: new Date().toISOString(),
            };

            const result = await addTreatmentToPatient(patient.id, treatmentWithPrice, selectedTooth ?? undefined);
            
            if (result.success && result.data) {
                const updatedPatient = { ...patient, ...(result.data as Partial<Patient>) };
                setPatient(updatedPatient);
                toast({ title: "Treatment added successfully!" });
                setIsToothExamDialogOpen(false);
                setSelectedTooth(null);
                toothExaminationForm.reset();
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
    
    const onToothClick = (tooth: number | string) => {
        setSelectedTooth(tooth);
        setIsToothExamDialogOpen(true);
    }
    
    const assignedTreatmentsByTooth = React.useMemo(() => {
        const map = new Map<number | string, AssignedTreatment[]>();
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
    
    const treatedTeeth = React.useMemo(() => Array.from(assignedTreatmentsByTooth.keys()), [assignedTreatmentsByTooth]);

    const handleNewComplaintSubmit = async (complaintName: string) => {
        const result = await addChiefComplaint({ name: complaintName });
        if (result.success && result.data) {
            const newComplaint = result.data;
            setChiefComplaints(prev => [...prev, newComplaint].sort((a, b) => a.name.localeCompare(b.name)));
            
            toast({ title: 'New complaint added!' });
            return newComplaint;
        } else {
            toast({ variant: 'destructive', title: 'Failed to add complaint', description: result.error });
            return null;
        }
    };

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

                <Card>
                    <CardHeader>
                        <CardTitle>Contact Information</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
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
                        <div className="flex items-center gap-4">
                            <UserIcon className="h-5 w-5 text-muted-foreground" />
                            <span>Age: {patient.age || 'N/A'}</span>
                        </div>
                            <div className="flex items-center gap-4">
                            <UserIcon className="h-5 w-5 text-muted-foreground" />
                            <span>Gender: {patient.gender || 'N/A'}</span>
                        </div>
                    </CardContent>
                </Card>

                <Tabs defaultValue="examination" className="w-full">
                     <TabsList className="grid w-full grid-cols-3 border-b p-0 h-auto bg-transparent rounded-none">
                        <TabsTrigger value="examination" className="border-b-2 border-transparent rounded-none data-[state=active]:border-primary data-[state=active]:shadow-none data-[state=active]:bg-transparent -mb-px">Examination</TabsTrigger>
                        <TabsTrigger value="treatment" className="border-b-2 border-transparent rounded-none data-[state=active]:border-primary data-[state=active]:shadow-none data-[state=active]:bg-transparent -mb-px">Treatment</TabsTrigger>
                        <TabsTrigger value="files" className="border-b-2 border-transparent rounded-none data-[state=active]:border-primary data-[state=active]:shadow-none data-[state=active]:bg-transparent -mb-px">Files</TabsTrigger>
                    </TabsList>
                    <div className="border-t -mt-px">
                        <TabsContent value="examination" className="mt-6">
                             <Tabs defaultValue="examination-details" className="w-full">
                                <TabsList className="border-b w-full justify-start rounded-none bg-transparent p-0">
                                    <TabsTrigger value="examination-details" className="relative h-9 rounded-none border-b-2 border-b-transparent bg-transparent px-4 pb-3 pt-2 font-semibold text-muted-foreground shadow-none transition-none data-[state=active]:border-b-primary data-[state=active]:text-foreground data-[state=active]:shadow-none">Examination</TabsTrigger>
                                    <TabsTrigger value="dental-chart" className="relative h-9 rounded-none border-b-2 border-b-transparent bg-transparent px-4 pb-3 pt-2 font-semibold text-muted-foreground shadow-none transition-none data-[state=active]:border-b-primary data-[state=active]:text-foreground data-[state=active]:shadow-none">Dental Chart</TabsTrigger>
                                </TabsList>
                                <TabsContent value="examination-details" className="mt-6 space-y-6">
                                     <Dialog open={isExaminationDialogOpen} onOpenChange={(open) => {
                                        if (!open) {
                                            clinicalExaminationForm.reset();
                                        }
                                        setIsExaminationDialogOpen(open);
                                    }}>
                                        <DialogTrigger asChild>
                                            <Button>
                                                <PlusCircle className="mr-2 h-4 w-4" />
                                                Add Examination
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="sm:max-w-2xl">
                                            <DialogHeader>
                                                <DialogTitle>Add Clinical Examination</DialogTitle>
                                                <DialogDescription>
                                                    Record the details of the clinical examination for {patient.name}.
                                                </DialogDescription>
                                            </DialogHeader>
                                            <Form {...clinicalExaminationForm}>
                                                <form onSubmit={clinicalExaminationForm.handleSubmit(handleClinicalExaminationSubmit)} className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
                                                    <FormField
                                                        control={clinicalExaminationForm.control}
                                                        name="chiefComplaint"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>Chief Complaint</FormLabel>
                                                                <MultiSelectDropdown
                                                                    options={chiefComplaints}
                                                                    selected={field.value}
                                                                    onChange={field.onChange}
                                                                    onCreate={handleNewComplaintSubmit}
                                                                    placeholder="Select complaints..."
                                                                />
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                    <FormField control={clinicalExaminationForm.control} name="medicalHistory" render={({ field }) => (<FormItem><FormLabel>Medical History (Optional)</FormLabel><FormControl><Textarea placeholder="Any relevant medical history..." {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>)} />
                                                    <FormField control={clinicalExaminationForm.control} name="dentalHistory" render={({ field }) => (<FormItem><FormLabel>Dental History (Optional)</FormLabel><FormControl><Textarea placeholder="Previous dental treatments, issues..." {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>)} />
                                                    <FormField control={clinicalExaminationForm.control} name="observationNotes" render={({ field }) => (<FormItem><FormLabel>Observation Notes (Optional)</FormLabel><FormControl><Textarea placeholder="Clinical observations..." {...field} value={field.value || ''}/></FormControl><FormMessage /></FormItem>)} />
                                                        <DialogFooter className="pt-4 pr-4">
                                                        <Button type="button" variant="ghost" onClick={() => setIsExaminationDialogOpen(false)}>Cancel</Button>
                                                        <Button type="submit" disabled={isSubmitting}>
                                                            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                                            Save
                                                        </Button>
                                                    </DialogFooter>
                                                </form>
                                            </Form>
                                        </DialogContent>
                                    </Dialog>

                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2">
                                                <History className="h-5 w-5" />
                                                Examination History
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            {patient.clinicalExaminations && patient.clinicalExaminations.length > 0 ? (
                                                <div className="space-y-4">
                                                    {patient.clinicalExaminations.map((exam) => (
                                                        <div key={exam.id} className="p-4 border rounded-md bg-card shadow-sm">
                                                            <div className="flex justify-between items-start gap-4">
                                                                <div>
                                                                    <div className="flex flex-wrap gap-2">
                                                                        {exam.chiefComplaint.map(complaint => <Badge key={complaint}>{complaint}</Badge>)}
                                                                    </div>
                                                                    <p className="text-sm text-muted-foreground mt-2">{format(new Date(exam.date), 'PPP')}</p>
                                                                </div>
                                                                <Button variant="ghost" size="icon" onClick={() => setExaminationToDelete(exam)}>
                                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                                </Button>
                                                            </div>
                                                            <div className="mt-4 space-y-4">
                                                                {exam.medicalHistory && <div><Label className="font-semibold">Medical History</Label><p className="text-sm text-muted-foreground whitespace-pre-wrap">{exam.medicalHistory}</p></div>}
                                                                {exam.dentalHistory && <div><Label className="font-semibold">Dental History</Label><p className="text-sm text-muted-foreground whitespace-pre-wrap">{exam.dentalHistory}</p></div>}
                                                                {exam.observationNotes && <div><Label className="font-semibold">Observation Notes</Label><p className="text-sm text-muted-foreground whitespace-pre-wrap">{exam.observationNotes}</p></div>}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-sm text-muted-foreground text-center py-4">No examination records for this patient.</p>
                                            )}
                                        </CardContent>
                                    </Card>
                                </TabsContent>
                                <TabsContent value="dental-chart" className="mt-6">
                                     <Card>
                                        <CardHeader>
                                            <div className="flex justify-between items-center">
                                                <CardTitle className="flex items-center gap-2">
                                                    <Heart className="h-5 w-5" />
                                                    Dental Chart
                                                </CardTitle>
                                                <div className="flex items-center space-x-2">
                                                    <Checkbox 
                                                        id="primary-teeth" 
                                                        checked={showPrimaryTeeth}
                                                        onCheckedChange={(checked) => setShowPrimaryTeeth(Boolean(checked))}
                                                    />
                                                    <Label htmlFor="primary-teeth" className="font-medium">Primary Teeth</Label>
                                                </div>
                                            </div>
                                            <CardDescription>Click on a tooth to record an examination.</CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                             {showPrimaryTeeth ? (
                                                <PrimaryToothChart onToothClick={onToothClick} assignedTreatmentsByTooth={assignedTreatmentsByTooth} />
                                             ) : (
                                                <ToothChart onToothClick={onToothClick} assignedTreatmentsByTooth={assignedTreatmentsByTooth} />
                                             )}
                                        </CardContent>
                                    </Card>
                                </TabsContent>
                            </Tabs>
                        </TabsContent>
                        <TabsContent value="treatment" className="mt-6 space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Heart className="h-5 w-5" />
                                        Treatment Plan
                                    </CardTitle>
                                    <CardDescription>A list of all treatments assigned to this patient.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {patient.assignedTreatments && patient.assignedTreatments.length > 0 ? (
                                        <ul className="space-y-2">
                                            {patient.assignedTreatments.map((t, index) => (
                                                <li key={t.dateAdded} className="flex justify-between items-center p-3 border rounded-md bg-card">
                                                    <div className="flex items-center gap-3 flex-1">
                                                            {t.tooth && (
                                                            <div
                                                                className="h-3 w-3 rounded-full shrink-0"
                                                                style={{ backgroundColor: COLOR_PALETTE[treatedTeeth.indexOf(t.tooth) % COLOR_PALETTE.length] }}
                                                            />
                                                        )}
                                                        <div>
                                                            <p className="font-medium">{t.name} {t.tooth && `(Tooth #${t.tooth})`}</p>
                                                            <p className="text-xs text-muted-foreground">Added on: {new Date(t.dateAdded).toLocaleDateString()}</p>
                                                            {t.description && <p className="text-xs text-muted-foreground whitespace-pre-wrap">{t.description}</p>}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-4">
                                                        <span className="font-semibold text-primary">Rs. {(t.amount || 0).toFixed(2)}</span>
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
                                </CardContent>
                            </Card>

                             <Card>
                                <CardHeader className="flex flex-row items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <CreditCard className="h-5 w-5" />
                                        <CardTitle>Billing Summary</CardTitle>
                                    </div>
                                     <Button asChild size="sm">
                                        <Link href="/dashboard/billing">Go to Billing</Link>
                                    </Button>
                                </CardHeader>
                                <CardContent className="space-y-2 text-right font-medium">
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
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <ScrollText className="h-5 w-5" />
                                        <CardTitle>Prescriptions</CardTitle>
                                    </div>
                                    <Button variant="outline" size="sm" onClick={() => setIsPrescriptionDialogOpen(true)}>
                                        <PlusCircle className="mr-2 h-4 w-4" />
                                        Add Prescription
                                    </Button>
                                </CardHeader>
                                <CardContent>
                                    {patient.prescriptions && patient.prescriptions.length > 0 ? (
                                        <div className="space-y-4">
                                            {patient.prescriptions.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((p) => (
                                                <div key={p.id} className="p-3 border rounded-md bg-card shadow-sm">
                                                    <div className="flex justify-between items-start gap-4">
                                                        <p className="font-semibold text-sm">
                                                            {format(new Date(p.date), 'PPP')}
                                                        </p>
                                                    </div>
                                                    <div className="mt-2 pt-2 border-t">
                                                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{p.notes}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-muted-foreground text-center py-4">No prescriptions found for this patient.</p>
                                    )}
                                </CardContent>
                            </Card>
                            
                            <Card>
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
                        </TabsContent>
                        <TabsContent value="files" className="mt-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Patient Files</CardTitle>
                                    <CardDescription>Manage patient documents, X-rays, and other files.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex h-48 w-full flex-col items-center justify-center rounded-lg border-2 border-dashed bg-muted/50 p-8 text-center">
                                        <Upload className="h-8 w-8 text-muted-foreground" />
                                        <p className="mt-4 text-muted-foreground">
                                            File management is coming soon.
                                        </p>
                                        <p className="text-sm text-muted-foreground">You will be able to upload and view documents here.</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </div>
                </Tabs>
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
            <Dialog open={isToothExamDialogOpen} onOpenChange={(open) => { if(!open) { setSelectedTooth(null); toothExaminationForm.reset(); } setIsToothExamDialogOpen(open); }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Record Examination for Tooth #{selectedTooth}</DialogTitle>
                    </DialogHeader>
                    <Form {...toothExaminationForm}>
                        <form onSubmit={toothExaminationForm.handleSubmit(handleToothExaminationSubmit)} className="space-y-4 py-4">
                            <FormField
                                control={toothExaminationForm.control}
                                name="dentalExaminationId"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Dental Examination</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                        <SelectValue placeholder="Select an examination" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {dentalExaminations.map((exam) => (
                                        <SelectItem key={exam.id} value={exam.id}>
                                            {exam.name}
                                        </SelectItem>
                                        ))}
                                    </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                             <FormField
                                control={toothExaminationForm.control}
                                name="investigation"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Investigation (Optional)</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Enter any investigation notes..." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                             <FormField
                                control={toothExaminationForm.control}
                                name="diagnosisId"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Diagnosis (Treatment)</FormLabel>
                                     <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                        <SelectValue placeholder="Select a diagnosis" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {treatments.map((treatment) => (
                                        <SelectItem key={treatment.id} value={treatment.id}>
                                            {treatment.name}
                                        </SelectItem>
                                        ))}
                                    </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                            <DialogFooter>
                                <Button type="submit" disabled={isSubmitting} className="w-full">
                                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
                                    Add to Treatment Plan
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>
             <Dialog open={isPrescriptionDialogOpen} onOpenChange={setIsPrescriptionDialogOpen}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Add New Prescription for {patient.name}</DialogTitle>
                        <DialogDescription>
                            Enter the prescription details below.
                        </DialogDescription>
                    </DialogHeader>
                    <Form {...prescriptionForm}>
                        <form onSubmit={prescriptionForm.handleSubmit(handlePrescriptionSubmit)} className="space-y-4 py-4">
                             <FormField control={prescriptionForm.control} name="date" render={({ field }) => (
                                <FormItem>
                                <FormLabel>Date</FormLabel>
                                <FormControl><Input type="date" {...field} /></FormControl>
                                <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={prescriptionForm.control} name="notes" render={({ field }) => (
                                <FormItem>
                                <FormLabel>Prescription Notes</FormLabel>
                                <FormControl><Textarea placeholder="e.g., Amoxicillin 500mg, 3 times a day for 7 days..." {...field} rows={5} /></FormControl>
                                <FormMessage />
                                </FormItem>
                            )} />
                           
                            <DialogFooter>
                                <Button type="submit" disabled={isSubmittingPrescription}>
                                    {isSubmittingPrescription ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                    Save Prescription
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
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
            <AlertDialog open={!!examinationToDelete} onOpenChange={(open) => !open && setExaminationToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete this examination record from {format(new Date(examinationToDelete?.date || 0), 'PPP')}. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleConfirmDeleteExamination} disabled={isDeleting}>
                            {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Continue
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}

type MultiSelectDropdownProps = {
    options: { id: string, name: string }[];
    selected: string[];
    onChange: (selected: string[]) => void;
    onCreate?: (name: string) => Promise<ChiefComplaint | null>;
    placeholder?: string;
    className?: string;
};

function MultiSelectDropdown({ options, selected, onChange, onCreate, placeholder, className }: MultiSelectDropdownProps) {
    const [open, setOpen] = React.useState(false);
    const [searchQuery, setSearchQuery] = React.useState('');
    const [isCreating, setIsCreating] = React.useState(false);

    const handleCreateNew = async () => {
        if (searchQuery.trim() === '' || isCreating || !onCreate) return;
        setIsCreating(true);
        const newComplaint = await onCreate(searchQuery.trim());
        if (newComplaint) {
            onChange([...selected, newComplaint.name]);
        }
        setIsCreating(false);
        setSearchQuery('');
    };

    const filteredOptions = options.filter(option =>
        option.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    const showCreateOption = onCreate && searchQuery && !options.some(o => o.name.toLowerCase() === searchQuery.toLowerCase());

    const selectedValue = React.useMemo(() => {
        if (selected.length === 0) return placeholder || 'Select...';
        if (selected.length > 2) return `${selected.length} selected`;
        return selected.join(', ');
    }, [selected, placeholder]);

    return (
        <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" className={cn("w-full justify-between font-normal", className)}>
                    <span className="truncate">{selectedValue}</span>
                    <History className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width]" align="start" onCloseAutoFocus={(e) => e.preventDefault()}>
                <div className="p-2">
                    <div className="flex items-center border-b px-2">
                        <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                        <Input 
                            placeholder="Search or add complaint..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="border-0 h-9 focus-visible:ring-0 shadow-none px-0"
                            autoFocus
                        />
                    </div>
                </div>
                <div className="max-h-60 overflow-y-auto">
                    {showCreateOption && (
                         <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onSelect={handleCreateNew} disabled={isCreating}>
                                {isCreating ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <PlusCircle className="mr-2 h-4 w-4" />
                                )}
                                Create "{searchQuery}"
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                        </>
                    )}
                    {filteredOptions.length > 0 ? filteredOptions.map(option => (
                        <DropdownMenuCheckboxItem
                            key={option.id}
                            checked={selected.includes(option.name)}
                            onCheckedChange={(checked) => {
                                const newSelected = checked 
                                    ? [...selected, option.name]
                                    : selected.filter(s => s !== option.name);
                                onChange(newSelected);
                            }}
                            onSelect={(e) => e.preventDefault()}
                        >
                            {option.name}
                        </DropdownMenuCheckboxItem>
                    )) : !showCreateOption && <p className="p-2 text-center text-sm text-muted-foreground">No results found.</p>}
                </div>
                 <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                    <Button
                        className="w-full"
                        onClick={() => setOpen(false)}
                    >
                        Done
                    </Button>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

type MultiSelectSearchBarProps = {
    options: { id: string, name: string }[];
    selected: string[];
    onChange: (selected: string[]) => void;
    onCreate?: (name: string) => Promise<{ id: string, name: string } | null>;
    placeholder?: string;
    className?: string;
    isMulti?: boolean;
};

function MultiSelectSearchBar({ options, selected, onChange, onCreate, placeholder, className, isMulti = true }: MultiSelectSearchBarProps) {
    const inputRef = React.useRef<HTMLInputElement>(null);
    const [isOpen, setIsOpen] = React.useState(false);
    const [searchQuery, setSearchQuery] = React.useState('');
    const [isCreating, setIsCreating] = React.useState(false);

    const handleSelect = (value: string) => {
        if(isMulti) {
            onChange(selected.includes(value) ? selected.filter((s) => s !== value) : [...selected, value]);
        } else {
            onChange([value]);
        }
        setSearchQuery('');
        inputRef.current?.focus();
        if (!isMulti) setIsOpen(false);
    };
    
    const handleCreateNew = async () => {
        if (searchQuery.trim() === '' || isCreating || !onCreate) return;
        setIsCreating(true);
        const newComplaint = await onCreate(searchQuery.trim());
        if (newComplaint) {
            handleSelect(newComplaint.name);
        }
        setIsCreating(false);
        setSearchQuery('');
    };

    const filteredOptions = options.filter(option =>
        option.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const showCreateOption = onCreate && searchQuery && !options.some(o => o.name.toLowerCase() === searchQuery.toLowerCase());

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <div className={cn("space-y-2", className)}>
                {isMulti ? (
                    <div className="w-full p-1 border rounded-md">
                        <div className="flex gap-1 flex-wrap mb-1">
                            {selected.map((value) => (
                                <Badge key={value} variant="secondary">
                                    {value}
                                    <button
                                        type="button"
                                        className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                                        onClick={() => handleSelect(value)}
                                        onMouseDown={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            handleSelect(value);
                                        }}
                                    >
                                        <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                                    </button>
                                </Badge>
                            ))}
                        </div>
                        <Command className="bg-transparent">
                             <div className="flex items-center">
                                <CommandInput
                                    ref={inputRef}
                                    placeholder={placeholder}
                                    value={searchQuery}
                                    onValueChange={setSearchQuery}
                                    onBlur={() => setIsOpen(false)}
                                    onFocus={() => setIsOpen(true)}
                                    className="border-0 h-9 flex-1"
                                />
                            </div>
                        </Command>
                    </div>
                ) : (
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={isOpen}
                            className="w-full justify-between font-normal"
                        >
                            {selected.length > 0 && !isMulti ? selected[0] : placeholder}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                    </PopoverTrigger>
                )}
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                    <Command>
                         <div className="flex items-center border-b px-3">
                           <ClipboardPlus className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                            <CommandInput
                                ref={inputRef}
                                placeholder="Search..."
                                value={searchQuery}
                                onValueChange={setSearchQuery}
                                className="border-0 h-9"
                             />
                        </div>
                        <CommandList>
                            <CommandEmpty>
                                No results found.
                            </CommandEmpty>
                            <CommandGroup>
                                {filteredOptions.map((option) => (
                                    <CommandItem
                                        key={option.id}
                                        value={option.name}
                                        onSelect={() => handleSelect(option.name)}
                                        onMouseDown={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            handleSelect(option.name);
                                        }}
                                        className="cursor-pointer"
                                    >
                                        <Check
                                            className={cn(
                                                "mr-2 h-4 w-4",
                                                selected.includes(option.name) ? "opacity-100" : "opacity-0"
                                            )}
                                        />
                                        {option.name}
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                            {showCreateOption && (
                                <>
                                    <Separator />
                                    <CommandGroup>
                                        <CommandItem
                                            onSelect={handleCreateNew}
                                            onMouseDown={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                handleCreateNew();
                                            }}
                                            className="cursor-pointer"
                                            disabled={isCreating}
                                        >
                                           {isCreating ? (
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            ) : (
                                                <PlusCircle className="mr-2 h-4 w-4" />
                                            )}
                                            Create "{searchQuery}"
                                        </CommandItem>
                                    </CommandGroup>
                                </>
                            )}
                        </CommandList>
                    </Command>
                </PopoverContent>
            </div>
        </Popover>
    );
}

    
