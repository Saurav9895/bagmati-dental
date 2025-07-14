

'use client';

import * as React from 'react';
import type { Patient, Treatment, Appointment, AssignedTreatment, Prescription, ChiefComplaint, ClinicalExamination } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, Phone, Calendar as CalendarIcon, MapPin, FileText, Heart, PlusCircle, Loader2, Trash2, CreditCard, Edit, User as UserIcon, ScrollText, Upload, ChevronsUpDown, Check, ClipboardPlus, History } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { addAppointment, updateAppointment } from '@/app/actions/appointments';
import { format } from 'date-fns';
import { Badge } from '../ui/badge';
import { ToothChart, COLOR_PALETTE } from './tooth-chart';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '../ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '../ui/command';
import { Label } from '@/components/ui/label';
import { addChiefComplaint } from '@/app/actions/examinations';

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
type PrescriptionFormValues = z.infer<typeof prescriptionSchema>;

const clinicalExaminationSchema = z.object({
    chiefComplaint: z.string().min(1, { message: 'Chief complaint is required.' }),
    medicalHistory: z.string().optional(),
    dentalHistory: z.string().optional(),
    observationNotes: z.string().optional(),
});
type ClinicalExaminationFormValues = z.infer<typeof clinicalExaminationSchema>;


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
}

export function PatientDetailClient({ initialPatient, treatments, appointments: initialAppointments, chiefComplaints: initialChiefComplaints }: PatientDetailClientProps) {
    const [patient, setPatient] = React.useState<Patient>(initialPatient);
    const [appointments, setAppointments] = React.useState<Appointment[]>(initialAppointments);
    const [chiefComplaints, setChiefComplaints] = React.useState<ChiefComplaint[]>(initialChiefComplaints);
    
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
    
    const [isPrescriptionDialogOpen, setIsPrescriptionDialogOpen] = React.useState(false);
    const [isSubmittingPrescription, setIsSubmittingPrescription] = React.useState(false);

    const [isExaminationMode, setIsExaminationMode] = React.useState(false);
    const [isExaminationFormVisible, setIsExaminationFormVisible] = React.useState(false);
    const [isComplaintPopoverOpen, setIsComplaintPopoverOpen] = React.useState(false);
    const [complaintSearchQuery, setComplaintSearchQuery] = React.useState('');
    const [examinationToDelete, setExaminationToDelete] = React.useState<ClinicalExamination | null>(null);

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
            chiefComplaint: '',
            medicalHistory: '',
            dentalHistory: '',
            observationNotes: '',
        },
    });
    
    const handleClinicalExaminationSubmit = async (data: ClinicalExaminationFormValues) => {
        setIsSubmitting(true);
        const payload = { ...data, date: new Date().toISOString() };
        const result = await addClinicalExaminationToPatient(patient.id, payload);

        if (result.success && result.data) {
            setPatient(prev => ({ ...prev, ...(result.data as Partial<Patient>) }));
            toast({ title: 'Examination record saved successfully!' });
            setIsExaminationFormVisible(false);
            clinicalExaminationForm.reset();
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
            const treatmentWithPrice = { ...selectedTreatment, amount: selectedTreatment.defaultAmount || 0 };

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
    
    const treatedTeeth = React.useMemo(() => Array.from(assignedTreatmentsByTooth.keys()), [assignedTreatmentsByTooth]);

    const handleAddNewComplaint = async (newComplaintName: string) => {
        if (!newComplaintName.trim()) return;

        const result = await addChiefComplaint({ name: newComplaintName.trim() });
        if (result.success && result.data) {
            setChiefComplaints(prev => [...prev, result.data!].sort((a, b) => a.name.localeCompare(b.name)));
            clinicalExaminationForm.setValue('chiefComplaint', result.data.name);
            toast({ title: 'New complaint added!' });
        } else {
            toast({ variant: 'destructive', title: 'Failed to add complaint', description: result.error });
        }
        setComplaintSearchQuery('');
        setIsComplaintPopoverOpen(false);
    };

    const filteredComplaints = chiefComplaints.filter(c => c.name.toLowerCase().includes(complaintSearchQuery.toLowerCase()));

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
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="examination">Examination</TabsTrigger>
                        <TabsTrigger value="treatment">Treatment</TabsTrigger>
                        <TabsTrigger value="files">Files</TabsTrigger>
                    </TabsList>
                    <TabsContent value="examination" className="mt-6 space-y-6">
                        <div className="space-y-4 rounded-lg border p-4">
                            <div className="flex items-center space-x-2">
                                <Checkbox id="examination-mode" checked={isExaminationMode} onCheckedChange={(checked) => {
                                    setIsExaminationMode(!!checked);
                                    if (!checked) setIsExaminationFormVisible(false);
                                }} />
                                <label htmlFor="examination-mode" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                    Proceed with Examination
                                </label>
                            </div>
                             {isExaminationMode && (
                                <div className="pl-6 pt-4 border-l-2 space-y-4">
                                    {!isExaminationFormVisible && (
                                        <Button onClick={() => setIsExaminationFormVisible(true)}>
                                            <PlusCircle className="mr-2 h-4 w-4" />
                                            Add Examination
                                        </Button>
                                    )}

                                    {isExaminationFormVisible && (
                                        <Form {...clinicalExaminationForm}>
                                            <form onSubmit={clinicalExaminationForm.handleSubmit(handleClinicalExaminationSubmit)} className="space-y-4">
                                                <FormField control={clinicalExaminationForm.control} name="chiefComplaint" render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Chief Complaint</FormLabel>
                                                        <Popover open={isComplaintPopoverOpen} onOpenChange={setIsComplaintPopoverOpen}>
                                                            <PopoverTrigger asChild>
                                                                <FormControl>
                                                                    <Button variant="outline" role="combobox" className={cn("w-full justify-between", !field.value && "text-muted-foreground")}>
                                                                        {field.value || "Select chief complaint"}
                                                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                                    </Button>
                                                                </FormControl>
                                                            </PopoverTrigger>
                                                            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                                                <Command>
                                                                    <CommandInput placeholder="Search complaints..." value={complaintSearchQuery} onValueChange={setComplaintSearchQuery}/>
                                                                    <CommandList>
                                                                        {filteredComplaints.length === 0 && complaintSearchQuery.length > 0 ? (
                                                                            <CommandItem onSelect={() => handleAddNewComplaint(complaintSearchQuery)}>
                                                                                <PlusCircle className="mr-2 h-4 w-4" />
                                                                                Add new: "{complaintSearchQuery}"
                                                                            </CommandItem>
                                                                        ) : <CommandEmpty>No complaint found.</CommandEmpty>}
                                                                        <CommandGroup>
                                                                            {filteredComplaints.map((c) => (
                                                                                <CommandItem key={c.id} value={c.name} onSelect={(currentValue) => {
                                                                                    field.onChange(currentValue === field.value ? "" : currentValue);
                                                                                    setIsComplaintPopoverOpen(false);
                                                                                }}>
                                                                                    <Check className={cn("mr-2 h-4 w-4", c.name === field.value ? "opacity-100" : "opacity-0")} />
                                                                                    {c.name}
                                                                                </CommandItem>
                                                                            ))}
                                                                        </CommandGroup>
                                                                    </CommandList>
                                                                </Command>
                                                            </PopoverContent>
                                                        </Popover>
                                                        <FormMessage />
                                                    </FormItem>
                                                )} />
                                                <FormField control={clinicalExaminationForm.control} name="medicalHistory" render={({ field }) => (<FormItem><FormLabel>Medical History (Optional)</FormLabel><FormControl><Textarea placeholder="Any relevant medical history..." {...field} /></FormControl><FormMessage /></FormItem>)} />
                                                <FormField control={clinicalExaminationForm.control} name="dentalHistory" render={({ field }) => (<FormItem><FormLabel>Dental History (Optional)</FormLabel><FormControl><Textarea placeholder="Previous dental treatments, issues..." {...field} /></FormControl><FormMessage /></FormItem>)} />
                                                <FormField control={clinicalExaminationForm.control} name="observationNotes" render={({ field }) => (<FormItem><FormLabel>Observation Notes (Optional)</FormLabel><FormControl><Textarea placeholder="Clinical observations..." {...field} /></FormControl><FormMessage /></FormItem>)} />
                                                <div className="flex justify-end gap-2">
                                                    <Button type="button" variant="ghost" onClick={() => setIsExaminationFormVisible(false)}>Cancel</Button>
                                                    <Button type="submit" disabled={isSubmitting}>
                                                        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                                        Save
                                                    </Button>
                                                </div>
                                            </form>
                                        </Form>
                                    )}
                                </div>
                            )}
                        </div>

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
                                                        <p className="font-semibold text-lg">{exam.chiefComplaint}</p>
                                                        <p className="text-sm text-muted-foreground">{format(new Date(exam.date), 'PPP')}</p>
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

                         <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Heart className="h-5 w-5" />
                                    Dental Chart
                                </CardTitle>
                                <CardDescription>Click on a tooth to assign a treatment.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ToothChart onToothClick={onToothClick} assignedTreatmentsByTooth={assignedTreatmentsByTooth} />
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
                                                        <TableCell className="text-right">Rs. {(treatment.amount || 0).toFixed(2)}</TableCell>
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
                                <Separator className="my-4" />
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
                                
                                <Separator className="my-4" />
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
