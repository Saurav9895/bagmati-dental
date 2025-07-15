

'use client';

import * as React from 'react';
import type { Patient, Treatment, Appointment, AssignedTreatment, Prescription, ChiefComplaint, ClinicalExamination, DentalExamination, ToothExamination, Discount } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, Phone, Calendar as CalendarIcon, MapPin, FileText, Heart, PlusCircle, Loader2, Trash2, CreditCard, Edit, User as UserIcon, ScrollText, Upload, Check, ClipboardPlus, History, X, Search, ChevronsUpDown, Save, Gift, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { addTreatmentToPatient, removeTreatmentFromPatient, addPrescriptionToPatient, saveToothExamination, removeToothExamination, updateTreatmentInPatientPlan, addDiscountToPatient, removeDiscountFromPatient } from '@/app/actions/patients';
import { addClinicalExaminationToPatient, removeClinicalExaminationFromPatient } from '@/app/actions/clinical-examinations';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useForm, Controller, FormProvider } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { addAppointment, updateAppointment } from '@/app/actions/appointments';
import { format } from 'date-fns';
import { Badge } from '../ui/badge';
import { ToothChart, COLOR_PALETTE, PrimaryToothChart } from './tooth-chart';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '../ui/checkbox';
import { Label } from '@/components/ui/label';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { addChiefComplaint, updateChiefComplaint, deleteChiefComplaint, addDentalExamination, updateDentalExamination, deleteDentalExamination } from '@/app/actions/examinations';
import { addTreatment, updateTreatment } from '@/app/actions/treatments';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../ui/select';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';


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

const discountSchema = z.object({
    reason: z.string().min(2, "Reason must be at least 2 characters."),
    type: z.enum(['Amount', 'Percentage']),
    value: z.coerce.number().positive("Value must be a positive number."),
});
type DiscountFormValues = z.infer<typeof discountSchema>;


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

export function PatientDetailClient({ initialPatient, treatments: initialTreatments, appointments: initialAppointments, chiefComplaints: initialChiefComplaints, dentalExaminations: initialDentalExaminations }: PatientDetailClientProps) {
    const [patient, setPatient] = React.useState<Patient>(initialPatient);
    const [appointments, setAppointments] = React.useState<Appointment[]>(initialAppointments);
    const [treatments, setTreatments] = React.useState<Treatment[]>(initialTreatments);
    const [chiefComplaints, setChiefComplaints] = React.useState<ChiefComplaint[]>(initialChiefComplaints);
    const [dentalExaminations, setDentalExaminations] = React.useState<DentalExamination[]>(initialDentalExaminations);
    
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    
    const [treatmentToDelete, setTreatmentToDelete] = React.useState<AssignedTreatment | null>(null);
    const [discountToDelete, setDiscountToDelete] = React.useState<Discount | null>(null);
    const [isDeleting, setIsDeleting] = React.useState(false);

    const [isAppointmentDialogOpen, setIsAppointmentDialogOpen] = React.useState(false);
    const [isSubmittingAppointment, setIsSubmittingAppointment] = React.useState(false);
    const [editingAppointment, setEditingAppointment] = React.useState<Appointment | null>(null);
    
    const [isToothExamDialogOpen, setIsToothExamDialogOpen] = React.useState(false);
    const [selectedTooth, setSelectedTooth] = React.useState<number | string | null>(null);
    
    const [isPrescriptionDialogOpen, setIsPrescriptionDialogOpen] = React.useState(false);
    const [isSubmittingPrescription, setIsSubmittingPrescription] = React.useState(false);

    const [isDiscountDialogOpen, setIsDiscountDialogOpen] = React.useState(false);
    const [isSubmittingDiscount, setIsSubmittingDiscount] = React.useState(false);

    const [isExaminationDialogOpen, setIsExaminationDialogOpen] = React.useState(false);
    const [examinationToDelete, setExaminationToDelete] = React.useState<ClinicalExamination | null>(null);
    const [toothExaminationToDelete, setToothExaminationToDelete] = React.useState<ToothExamination | null>(null);
    const [showPrimaryTeeth, setShowPrimaryTeeth] = React.useState(false);
    
    const [activeTab, setActiveTab] = React.useState("examination");
    const [editingTreatmentId, setEditingTreatmentId] = React.useState<string | null>(null);
    const [prefillTreatment, setPrefillTreatment] = React.useState<Partial<AssignedTreatment> | null>(null);

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

    const discountForm = useForm<DiscountFormValues>({
        resolver: zodResolver(discountSchema),
        defaultValues: { reason: '', type: 'Amount', value: 0 }
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

    const { totalCost, totalPaid, totalDiscount, balanceDue } = React.useMemo(() => {
        const totalCost = patient.assignedTreatments?.reduce((total, t) => {
            let cost = t.cost || 0;
            if (t.multiplyCost && t.tooth) {
                const toothCount = t.tooth.split(',').length;
                cost *= toothCount;
            }
            return total + cost;
        }, 0) || 0;

        const totalPaid = patient.payments?.reduce((total, payment) => total + payment.amount, 0) || 0;
        
        const totalOverallDiscount = patient.discounts?.reduce((total, d) => total + d.amount, 0) || 0;
        
        const perTreatmentDiscount = patient.assignedTreatments?.reduce((total, t) => {
             return total + (t.discountAmount || 0);
        }, 0) || 0;


        const balanceDue = totalCost - totalPaid - totalOverallDiscount - perTreatmentDiscount;
        return { totalCost, totalPaid, totalDiscount: totalOverallDiscount + perTreatmentDiscount, balanceDue };
    }, [patient]);


    const handleToothExaminationSubmit = async (data: ToothExaminationFormValues) => {
        if (!data.diagnosisId || !data.dentalExaminationId || !selectedTooth) {
            toast({ variant: 'destructive', title: 'Please fill all required fields.' });
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

        setIsSubmitting(true);
        try {
            const toothExam: Omit<ToothExamination, 'id'> = {
                tooth: selectedTooth,
                dentalExamination: selectedExamination.name,
                investigation: data.investigation,
                diagnosis: selectedTreatment.name,
                date: new Date().toISOString()
            };

            const result = await saveToothExamination(patient.id, toothExam);
            
            if (result.success && result.data) {
                setPatient(prev => ({ ...prev, ...(result.data as Partial<Patient>) }));
                toast({ title: "Examination saved successfully!" });
                setIsToothExamDialogOpen(false);
                setSelectedTooth(null);
                toothExaminationForm.reset();
            } else {
                toast({ variant: 'destructive', title: 'Failed to save examination', description: result.error });
            }
        } catch (error) {
             toast({ variant: 'destructive', title: 'An unexpected error occurred', description: (error as Error).message });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handleAddExaminationToTreatmentPlan = (examination: ToothExamination) => {
        const treatmentToAdd = treatments.find(t => t.name === examination.diagnosis);
        if (!treatmentToAdd) {
            toast({ variant: 'destructive', title: 'Treatment not found', description: `The treatment "${examination.diagnosis}" is not a recognized service.` });
            return;
        }
        
        setActiveTab("treatment");
        
        setPrefillTreatment({
            treatmentId: treatmentToAdd.id,
            name: treatmentToAdd.name,
            tooth: String(examination.tooth),
        });

        // Use a timeout to ensure the tab has switched before setting the editing ID
        setTimeout(() => {
            setEditingTreatmentId("new");
        }, 50);
    };
    
    const confirmRemoveTreatment = async () => {
        if (!treatmentToDelete) return;
        setIsDeleting(true);
        try {
            const result = await removeTreatmentFromPatient(patient.id, treatmentToDelete.id);
            if (result.success) {
                setPatient(prev => ({
                    ...prev,
                    assignedTreatments: prev.assignedTreatments?.filter(t => t.id !== treatmentToDelete.id)
                }));
                toast({ title: "Treatment removed successfully!" });
            } else {
                toast({ variant: 'destructive', title: 'Failed to remove treatment', description: result.error });
            }
        } catch (error) {
            toast({ variant: 'destructive', title: 'An unexpected error occurred', description: (error as Error).message });
        } finally {
            setIsDeleting(false);
            setTreatmentToDelete(null);
        }
    }

    const handleConfirmDeleteToothExamination = async () => {
        if (!toothExaminationToDelete) return;
        setIsDeleting(true);
        const result = await removeToothExamination(patient.id, toothExaminationToDelete.id);
        if (result.success && result.data) {
            setPatient(prev => ({...prev, ...(result.data as Partial<Patient>)}));
            toast({ title: "Examination deleted." });
        } else {
            toast({ variant: 'destructive', title: 'Failed to delete examination', description: result.error });
        }
        setIsDeleting(false);
        setToothExaminationToDelete(null);
    }
    
    const onToothClick = (tooth: number | string) => {
        setSelectedTooth(tooth);
        setIsToothExamDialogOpen(true);
    }
    
    const toothExaminationsByTooth = React.useMemo(() => {
        const map = new Map<string | number, ToothExamination[]>();
        if (patient.toothExaminations) {
            patient.toothExaminations.forEach(exam => {
                if (!map.has(exam.tooth)) {
                    map.set(exam.tooth, []);
                }
                map.get(exam.tooth)!.push(exam);
            });
        }
        return map;
    }, [patient.toothExaminations]);
    
    const handleNewComplaintSubmit = async (complaintName: string) => {
        setIsSubmitting(true);
        const result = await addChiefComplaint({ name: complaintName });
        if (result.success && result.data) {
            const newComplaint = result.data;
            setChiefComplaints(prev => [...prev, newComplaint].sort((a, b) => a.name.localeCompare(b.name)));
            
            toast({ title: 'New complaint added!' });
            setIsSubmitting(false);
            return newComplaint;
        } else {
            toast({ variant: 'destructive', title: 'Failed to add complaint', description: result.error });
            setIsSubmitting(false);
            return null;
        }
    };

    const handleNewDentalExaminationSubmit = async (examName: string) => {
        setIsSubmitting(true);
        const result = await addDentalExamination({ name: examName });
        if (result.success && result.data) {
            const newExam = result.data;
            setDentalExaminations(prev => [...prev, newExam].sort((a,b) => a.name.localeCompare(b.name)));
            toast({ title: 'New dental examination added!' });
            setIsSubmitting(false);
            return newExam;
        } else {
            toast({ variant: 'destructive', title: 'Failed to add examination', description: result.error });
            setIsSubmitting(false);
            return null;
        }
    };
    
    const handleNewTreatmentSubmit = async (treatmentName: string) => {
        setIsSubmitting(true);
        const result = await addTreatment({ name: treatmentName });
        if (result.success && result.data) {
            const newTreatment = result.data;
            setTreatments(prev => [...prev, newTreatment].sort((a, b) => a.name.localeCompare(b.name)));
            toast({ title: 'New treatment added!' });
            setIsSubmitting(false);
            return newTreatment;
        } else {
            toast({ variant: 'destructive', title: 'Failed to add treatment', description: result.error });
            setIsSubmitting(false);
            return null;
        }
    };

    const handleDiscountSubmit = async (data: DiscountFormValues) => {
        setIsSubmittingDiscount(true);
        
        const result = await addDiscountToPatient(patient.id, data);

        if (result.success && result.data) {
            setPatient(prev => ({...prev, ...(result.data as Partial<Patient>)}));
            toast({ title: "Discount applied successfully!" });
            setIsDiscountDialogOpen(false);
            discountForm.reset({ reason: '', type: 'Amount', value: 0 });
        } else {
            toast({ variant: 'destructive', title: 'Failed to apply discount', description: result.error });
        }
        setIsSubmittingDiscount(false);
    }
    
    const confirmDeleteDiscount = async () => {
        if (!discountToDelete) return;
        setIsDeleting(true);
        try {
            const result = await removeDiscountFromPatient(patient.id, discountToDelete.id);
            if (result.success) {
                setPatient(prev => ({
                    ...prev,
                    discounts: prev.discounts?.filter(d => d.id !== discountToDelete.id)
                }));
                toast({ title: "Discount removed." });
            } else {
                toast({ variant: 'destructive', title: 'Failed to remove discount', description: result.error });
            }
        } catch (error) {
            toast({ variant: 'destructive', title: 'An unexpected error occurred', description: (error as Error).message });
        } finally {
            setIsDeleting(false);
            setDiscountToDelete(null);
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

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                     <TabsList className="grid w-full grid-cols-5 border-b p-0 h-auto bg-transparent rounded-none">
                        <TabsTrigger value="examination" className="border-b-2 border-transparent rounded-none data-[state=active]:border-primary data-[state=active]:shadow-none data-[state=active]:bg-transparent -mb-px">Examination</TabsTrigger>
                        <TabsTrigger value="treatment" className="border-b-2 border-transparent rounded-none data-[state=active]:border-primary data-[state=active]:shadow-none data-[state=active]:bg-transparent -mb-px">Treatment</TabsTrigger>
                        <TabsTrigger value="pricing" className="border-b-2 border-transparent rounded-none data-[state=active]:border-primary data-[state=active]:shadow-none data-[state=active]:bg-transparent -mb-px">Pricing</TabsTrigger>
                        <TabsTrigger value="history" className="border-b-2 border-transparent rounded-none data-[state=active]:border-primary data-[state=active]:shadow-none data-[state=active]:bg-transparent -mb-px">History</TabsTrigger>
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
                                                                    disabled={isSubmitting}
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
                                <TabsContent value="dental-chart" className="mt-6 space-y-6">
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
                                                <PrimaryToothChart onToothClick={onToothClick} toothExaminationsByTooth={toothExaminationsByTooth} />
                                             ) : (
                                                <ToothChart onToothClick={onToothClick} toothExaminationsByTooth={toothExaminationsByTooth} />
                                             )}
                                        </CardContent>
                                    </Card>

                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2">
                                                <History className="h-5 w-5" />
                                                Tooth Examination History
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>Tooth #</TableHead>
                                                        <TableHead>Date</TableHead>
                                                        <TableHead>Examination</TableHead>
                                                        <TableHead>Diagnosis</TableHead>
                                                        <TableHead className="text-right">Actions</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {patient.toothExaminations && patient.toothExaminations.length > 0 ? (
                                                        patient.toothExaminations
                                                            .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                                                            .map((exam) => (
                                                            <TableRow key={exam.id}>
                                                                <TableCell className="font-medium">{exam.tooth}</TableCell>
                                                                <TableCell>{format(new Date(exam.date), 'PP')}</TableCell>
                                                                <TableCell>
                                                                    <div className="font-medium">{exam.dentalExamination}</div>
                                                                    {exam.investigation && <div className="text-xs text-muted-foreground">{exam.investigation}</div>}
                                                                </TableCell>
                                                                <TableCell>{exam.diagnosis}</TableCell>
                                                                <TableCell className="text-right space-x-2">
                                                                    <Button 
                                                                        variant="outline" 
                                                                        size="sm" 
                                                                        onClick={() => handleAddExaminationToTreatmentPlan(exam)}
                                                                    >
                                                                        <PlusCircle className="mr-2 h-4 w-4" />
                                                                        Add to Plan
                                                                    </Button>
                                                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setToothExaminationToDelete(exam)}>
                                                                        <Trash2 className="h-4 w-4 text-destructive" />
                                                                    </Button>
                                                                </TableCell>
                                                            </TableRow>
                                                        ))
                                                    ) : (
                                                        <TableRow>
                                                            <TableCell colSpan={5} className="h-24 text-center">
                                                                No tooth-specific examinations recorded yet.
                                                            </TableCell>
                                                        </TableRow>
                                                    )}
                                                </TableBody>
                                            </Table>
                                        </CardContent>
                                    </Card>
                                </TabsContent>
                            </Tabs>
                        </TabsContent>
                        <TabsContent value="treatment" className="mt-6 space-y-6">
                            <Card>
                                <CardHeader>
                                    <div className="flex justify-between items-center">
                                        <CardTitle className="flex items-center gap-2">
                                            <Heart className="h-5 w-5" />
                                            Treatment Plan
                                        </CardTitle>
                                        <Button size="sm" onClick={() => { setPrefillTreatment(null); setEditingTreatmentId("new");}}>
                                            <PlusCircle className="mr-2 h-4 w-4" />
                                            Add Treatment
                                        </Button>
                                    </div>
                                    <CardDescription>A list of all billable treatments assigned to this patient.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <TreatmentPlanTable
                                        patient={patient}
                                        allTreatments={treatments}
                                        editingId={editingTreatmentId}
                                        setEditingId={setEditingTreatmentId}
                                        prefillData={prefillTreatment}
                                        onSave={async (data) => {
                                            let result;
                                            if (data.id === 'new') {
                                                const newTreatmentData: Omit<AssignedTreatment, 'dateAdded'> = {
                                                    id: crypto.randomUUID(),
                                                    treatmentId: data.treatmentId,
                                                    name: data.name,
                                                    tooth: data.tooth,
                                                    cost: data.cost,
                                                    multiplyCost: data.multiplyCost,
                                                    discountType: data.discountType,
                                                    discountValue: data.discountValue,
                                                    discountAmount: data.discountAmount,
                                                };
                                                result = await addTreatmentToPatient(patient.id, newTreatmentData);
                                            } else {
                                                 result = await updateTreatmentInPatientPlan(patient.id, data);
                                            }

                                            if (result.success && result.data) {
                                                setPatient(p => ({...p, ...result.data}));
                                                toast({ title: `Treatment ${data.id === 'new' ? 'added' : 'updated'}` });
                                                setEditingTreatmentId(null);
                                            } else {
                                                toast({ variant: 'destructive', title: 'Failed to save', description: result.error });
                                            }
                                        }}
                                        onDelete={(id) => {
                                            const treatment = patient.assignedTreatments?.find(t => t.id === id);
                                            if (treatment) setTreatmentToDelete(treatment);
                                        }}
                                        onCreateNewTreatment={handleNewTreatmentSubmit}
                                    />
                                </CardContent>
                            </Card>
                        </TabsContent>
                        <TabsContent value="pricing" className="mt-6 space-y-6">
                             <Card>
                                <CardHeader className="flex flex-row items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <CreditCard className="h-5 w-5" />
                                        <CardTitle>Billing Summary</CardTitle>
                                    </div>
                                    <div className="flex gap-2">
                                         <Dialog open={isDiscountDialogOpen} onOpenChange={setIsDiscountDialogOpen}>
                                            <DialogTrigger asChild>
                                                <Button variant="outline" size="sm"><Gift className="mr-2 h-4 w-4" /> Add Overall Discount</Button>
                                            </DialogTrigger>
                                            <DialogContent>
                                                <DialogHeader>
                                                    <DialogTitle>Add Overall Discount for {patient.name}</DialogTitle>
                                                </DialogHeader>
                                                <Form {...discountForm}>
                                                    <form onSubmit={discountForm.handleSubmit(handleDiscountSubmit)} className="space-y-4 py-4">
                                                        <FormField control={discountForm.control} name="reason" render={({ field }) => (
                                                            <FormItem><FormLabel>Reason</FormLabel><FormControl><Input placeholder="e.g., Seasonal Promotion" {...field} /></FormControl><FormMessage /></FormItem>
                                                        )} />
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <FormField control={discountForm.control} name="type" render={({ field }) => (
                                                                <FormItem>
                                                                    <FormLabel>Type</FormLabel>
                                                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                                                        <SelectContent>
                                                                            <SelectItem value="Amount">Amount</SelectItem>
                                                                            <SelectItem value="Percentage">Percentage</SelectItem>
                                                                        </SelectContent>
                                                                    </Select>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )} />
                                                            <FormField control={discountForm.control} name="value" render={({ field }) => (
                                                                <FormItem>
                                                                    <FormLabel>Value</FormLabel>
                                                                    <FormControl><Input type="number" placeholder="50" {...field} /></FormControl>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )} />
                                                        </div>
                                                        <DialogFooter>
                                                            <Button type="submit" disabled={isSubmittingDiscount}>
                                                                {isSubmittingDiscount && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save Discount
                                                            </Button>
                                                        </DialogFooter>
                                                    </form>
                                                </Form>
                                            </DialogContent>
                                        </Dialog>
                                        <Button asChild size="sm">
                                            <Link href="/dashboard/billing">Go to Full Billing Page</Link>
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2 text-right font-medium">
                                        <div className="flex justify-end items-center text-md">
                                            <span className="text-muted-foreground mr-4">Total Amount:</span>
                                            <span>Rs. {totalCost.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-end items-center text-md">
                                            <span className="text-muted-foreground mr-4">Total Discount:</span>
                                            <span className="text-destructive">-Rs. {totalDiscount.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-end items-center text-md">
                                            <span className="text-muted-foreground mr-4">Total Paid:</span>
                                            <span className="text-green-600">Rs. {totalPaid.toFixed(2)}</span>
                                        </div>
                                        <Separator className="my-2" />
                                        <div className="flex justify-end items-center text-lg font-bold">
                                            <span className="text-muted-foreground mr-4">Balance Due:</span>
                                            {balanceDue <= 0 && totalCost > 0 ? (
                                                <span className="text-green-600">Fully Paid</span>
                                            ) : (
                                                <span>Rs. {balanceDue.toFixed(2)}</span>
                                            )}
                                        </div>
                                    </div>
                                    { (patient.discounts?.length ?? 0) > 0 &&
                                    <>
                                    <Separator className="my-4" />
                                    <div>
                                        <h4 className="text-base font-semibold mb-2">Applied Overall Discounts</h4>
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Reason</TableHead>
                                                    <TableHead>Discount</TableHead>
                                                    <TableHead className="text-right">Amount</TableHead>
                                                    <TableHead className="w-[50px]"><span className='sr-only'>Actions</span></TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {patient.discounts!.map(discount => (
                                                    <TableRow key={discount.id}>
                                                        <TableCell>{discount.reason}</TableCell>
                                                        <TableCell>{discount.type === 'Percentage' ? `${discount.value}%` : `Fixed`}</TableCell>
                                                        <TableCell className="text-right">-Rs. {discount.amount.toFixed(2)}</TableCell>
                                                        <TableCell>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDiscountToDelete(discount)}>
                                                                <Trash2 className="h-4 w-4 text-destructive" />
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                    </>
                                    }
                                </CardContent>
                            </Card>
                        </TabsContent>
                        <TabsContent value="history" className="mt-6 space-y-6">
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
                                        <SingleSelectDropdown
                                            options={dentalExaminations}
                                            selected={field.value}
                                            onChange={field.onChange}
                                            onCreate={handleNewDentalExaminationSubmit}
                                            placeholder="Select an examination"
                                            disabled={isSubmitting}
                                        />
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
                                        <Textarea placeholder="Enter any investigation notes..." {...field} value={field.value ?? ''} />
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
                                    <SingleSelectDropdown
                                        options={treatments}
                                        selected={field.value}
                                        onChange={field.onChange}
                                        onCreate={handleNewTreatmentSubmit}
                                        placeholder="Select a diagnosis"
                                        disabled={isSubmitting}
                                    />
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                            <DialogFooter>
                                <Button type="submit" disabled={isSubmitting}>
                                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                    Save
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
            <AlertDialog open={!!treatmentToDelete} onOpenChange={(open) => !open && setTreatmentToDelete(null)}>
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
             <AlertDialog open={!!discountToDelete} onOpenChange={(open) => !open && setDiscountToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently remove the discount: <span className="font-bold">{discountToDelete?.reason}</span>.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setDiscountToDelete(null)}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDeleteDiscount} disabled={isDeleting}>
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
            <AlertDialog open={!!toothExaminationToDelete} onOpenChange={(open) => !open && setToothExaminationToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete the examination for tooth #{toothExaminationToDelete?.tooth}. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleConfirmDeleteToothExamination} disabled={isDeleting}>
                            {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Continue
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}

const treatmentPlanSchema = z.object({
  id: z.string(),
  treatmentId: z.string().min(1, 'Treatment type is required.'),
  name: z.string(),
  tooth: z.string().optional(),
  cost: z.coerce.number().min(0, 'Cost must be a positive number.'),
  multiplyCost: z.boolean().optional(),
  discountType: z.enum(['Amount', 'Percentage']).optional(),
  discountValue: z.coerce.number().min(0).optional(),
});
type TreatmentPlanFormValues = z.infer<typeof treatmentPlanSchema>;

interface TreatmentPlanTableProps {
    patient: Patient;
    allTreatments: Treatment[];
    editingId: string | null;
    setEditingId: (id: string | null) => void;
    prefillData: Partial<AssignedTreatment> | null;
    onSave: (data: AssignedTreatment) => void;
    onDelete: (id: string) => void;
    onCreateNewTreatment: (name: string) => Promise<{id: string, name: string} | null>;
}

function TreatmentPlanTable({ patient, allTreatments, editingId, setEditingId, prefillData, onSave, onDelete, onCreateNewTreatment }: TreatmentPlanTableProps) {
    const { toast } = useToast();

    const handleSave = (formData: AssignedTreatment) => {
        if (!formData.treatmentId) {
            toast({ variant: 'destructive', title: 'Please select a treatment type.' });
            return;
        }
        onSave(formData);
    }
    
    const assignedTreatments = patient.assignedTreatments || [];

    return (
        <div className="border rounded-md">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className='min-w-[200px]'>Treatment</TableHead>
                        <TableHead>Tooth</TableHead>
                        <TableHead>Cost</TableHead>
                        <TableHead>Discount</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead className="w-[100px] text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {editingId === "new" && (
                        <TreatmentFormRow
                            allTreatments={allTreatments}
                            onSave={handleSave}
                            onCancel={() => setEditingId(null)}
                            onCreateNewTreatment={onCreateNewTreatment}
                            prefillData={prefillData}
                        />
                    )}
                    {assignedTreatments.map((treatment) => {
                        let totalCost = treatment.cost;
                        if (treatment.multiplyCost && treatment.tooth) {
                            const toothCount = treatment.tooth.split(',').length;
                            totalCost *= toothCount;
                        }
                        const finalCost = totalCost - (treatment.discountAmount || 0);

                        return editingId === treatment.id ? (
                            <TreatmentFormRow
                                key={treatment.id}
                                initialData={treatment}
                                allTreatments={allTreatments}
                                onSave={handleSave}
                                onCancel={() => setEditingId(null)}
                                onCreateNewTreatment={onCreateNewTreatment}
                            />
                        ) : (
                            <TableRow key={treatment.id}>
                                <TableCell className="font-medium">{treatment.name}</TableCell>
                                <TableCell>{treatment.tooth || 'N/A'}</TableCell>
                                <TableCell>Rs. {treatment.cost.toFixed(2)}</TableCell>
                                <TableCell>
                                    {treatment.discountValue ? (
                                        <span>
                                            {treatment.discountType === 'Percentage' ? `${treatment.discountValue}%` : `Rs. ${treatment.discountValue}`}
                                            <span className='text-muted-foreground'> (-Rs. {treatment.discountAmount?.toFixed(2)})</span>
                                        </span>
                                    ) : ('N/A')}
                                </TableCell>
                                <TableCell className='font-medium'>Rs. {finalCost.toFixed(2)}</TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="icon" onClick={() => setEditingId(treatment.id)}><Edit className="h-4 w-4" /></Button>
                                    <Button variant="ghost" size="icon" onClick={() => onDelete(treatment.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                </TableCell>
                            </TableRow>
                        )
                    })}
                     {assignedTreatments.length === 0 && editingId !== 'new' && (
                        <TableRow>
                            <TableCell colSpan={6} className="h-24 text-center">No treatments assigned yet.</TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
}

interface TreatmentFormRowProps {
    initialData?: AssignedTreatment;
    prefillData?: Partial<AssignedTreatment> | null;
    allTreatments: Treatment[];
    onSave: (data: AssignedTreatment) => void;
    onCancel: () => void;
    onCreateNewTreatment: (name: string) => Promise<{id: string, name: string} | null>;
}

function TreatmentFormRow({ initialData, prefillData, allTreatments, onSave, onCancel, onCreateNewTreatment }: TreatmentFormRowProps) {
    const methods = useForm<TreatmentPlanFormValues>({
        resolver: zodResolver(treatmentPlanSchema),
        defaultValues: {
            id: initialData?.id || 'new',
            treatmentId: initialData?.treatmentId || '',
            name: initialData?.name || '',
            tooth: initialData?.tooth || '',
            cost: initialData?.cost,
            multiplyCost: initialData?.multiplyCost || false,
            discountType: initialData?.discountType,
            discountValue: initialData?.discountValue,
        }
    });

    const { control, handleSubmit, setValue, watch, formState: { errors } } = methods;
    
    React.useEffect(() => {
        if (prefillData) {
            setValue('treatmentId', prefillData.treatmentId || '');
            setValue('name', prefillData.name || '');
            setValue('tooth', prefillData.tooth || '');
            const treatment = allTreatments.find(t => t.id === prefillData.treatmentId);
        }
    }, [prefillData, setValue, allTreatments]);

    const [isToothChartOpen, setIsToothChartOpen] = React.useState(false);
    const [selectedTeeth, setSelectedTeeth] = React.useState<string[]>(initialData?.tooth?.split(',').filter(Boolean) || []);
    const [showPrimaryTeeth, setShowPrimaryTeeth] = React.useState(false);
    
    const { cost, discountType, discountValue, multiplyCost, tooth } = watch();

    const onSubmit = (data: TreatmentPlanFormValues) => {
        let singleCost = data.cost || 0;
        let totalCost = singleCost;
        if (data.multiplyCost && data.tooth) {
            const toothCount = data.tooth.split(',').length;
            totalCost = singleCost * toothCount;
        }

        let discountAmount = 0;
        if (data.discountType && data.discountValue) {
            if (data.discountType === 'Amount') {
                discountAmount = data.discountValue;
            } else { // Percentage
                discountAmount = (totalCost * data.discountValue) / 100;
            }
        }
        
        onSave({
            id: data.id,
            treatmentId: data.treatmentId,
            name: data.name,
            tooth: data.tooth,
            cost: data.cost,
            multiplyCost: data.multiplyCost,
            dateAdded: initialData?.dateAdded || new Date().toISOString(),
            discountType: data.discountType,
            discountValue: data.discountValue,
            discountAmount: discountAmount
        });
    }

    const handleTreatmentChange = (treatmentId: string) => {
        const selected = allTreatments.find(t => t.id === treatmentId);
        if (selected) {
            setValue('treatmentId', selected.id);
            setValue('name', selected.name);
        }
    };
    
    const toothValue = watch('tooth');
    
    const handleToothSelection = (tooth: string | number) => {
        const toothStr = String(tooth);
        const newSelectedTeeth = selectedTeeth.includes(toothStr)
            ? selectedTeeth.filter(t => t !== toothStr)
            : [...selectedTeeth, toothStr];
        setSelectedTeeth(newSelectedTeeth);
    }
    
    const handleSaveTeeth = () => {
        setValue('tooth', selectedTeeth.join(', '));
        setIsToothChartOpen(false);
    }

    const calculateTotal = () => {
        let totalCost = cost || 0;
        if (multiplyCost && tooth) {
            const toothCount = tooth.split(',').length;
            totalCost *= toothCount;
        }

        let totalDiscount = 0;
        if (discountType && discountValue) {
            if (discountType === 'Amount') {
                totalDiscount = discountValue;
            } else {
                totalDiscount = (totalCost * discountValue) / 100;
            }
        }
        return totalCost - totalDiscount;
    }

    return (
        <FormProvider {...methods}>
            <TableRow className="bg-muted/50 align-top">
                <TableCell className='min-w-[200px] pt-4'>
                    <FormField
                        name="treatmentId"
                        control={control}
                        render={({ field }) => (
                            <FormItem>
                                <SingleSelectDropdown
                                    options={allTreatments}
                                    selected={field.value}
                                    onChange={(id) => {
                                        handleTreatmentChange(id);
                                        field.onChange(id);
                                    }}
                                    onCreate={async (name) => {
                                        const newTreatment = await onCreateNewTreatment(name);
                                        if (newTreatment) {
                                            handleTreatmentChange(newTreatment.id);
                                            field.onChange(newTreatment.id);
                                        }
                                        return newTreatment;
                                    }}
                                    placeholder="Select treatment"
                                />
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </TableCell>
                <TableCell className="pt-4">
                    <Dialog open={isToothChartOpen} onOpenChange={setIsToothChartOpen}>
                        <DialogTrigger asChild>
                            <Button type="button" variant="outline" className="w-[120px] justify-start text-left font-normal truncate">
                            {toothValue || 'Add Tooth'}
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl">
                            <DialogHeader>
                                <div className='flex justify-between items-center'>
                                    <DialogTitle>Select Teeth</DialogTitle>
                                    <FormField
                                        name="multiplyCost"
                                        control={control}
                                        render={({ field }) => (
                                            <FormItem className="flex items-center gap-2 space-y-0">
                                                <FormControl>
                                                    <Checkbox
                                                        checked={field.value}
                                                        onCheckedChange={field.onChange}
                                                    />
                                                </FormControl>
                                                <FormLabel className="font-normal">Multiply cost by # of teeth</FormLabel>
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <div className="flex items-center space-x-2 pt-2">
                                    <Checkbox 
                                        id="form-primary-teeth" 
                                        checked={showPrimaryTeeth}
                                        onCheckedChange={(checked) => setShowPrimaryTeeth(Boolean(checked))}
                                    />
                                    <Label htmlFor="form-primary-teeth" className="font-medium">Show Primary Teeth</Label>
                                </div>
                            </DialogHeader>
                            {showPrimaryTeeth ? (
                                <PrimaryToothChart onToothClick={handleToothSelection} selectedTeeth={selectedTeeth} />
                            ) : (
                                <ToothChart onToothClick={handleToothSelection} selectedTeeth={selectedTeeth} />
                            )}
                            <DialogFooter>
                                <Button onClick={handleSaveTeeth}>Save Selection</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </TableCell>
                <TableCell className="pt-2">
                    <FormField name="cost" control={control} render={({ field }) => (
                        <FormItem>
                            <FormControl>
                                <Input {...field} type="number" placeholder='Cost' className="w-28" value={field.value ?? ''} />
                            </FormControl>
                             <FormMessage />
                        </FormItem>
                    )} />
                </TableCell>
                <TableCell className="pt-2">
                    <div className='flex gap-1'>
                        <FormField
                            name="discountType"
                            control={control}
                            render={({ field }) => (
                                <FormItem>
                                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger className='w-[120px]'>
                                                <SelectValue placeholder="Type" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="Amount">Amount (Rs)</SelectItem>
                                            <SelectItem value="Percentage">Percentage (%)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </FormItem>
                            )}
                        />
                         <FormField name="discountValue" control={control} render={({ field }) => (
                            <FormItem>
                                <FormControl>
                                    <Input {...field} type="number" placeholder='Value' className="w-24" value={field.value ?? ''} />
                                </FormControl>
                            </FormItem>
                         )} />
                    </div>
                </TableCell>
                <TableCell className="font-medium pt-4">
                    Rs. {calculateTotal().toFixed(2)}
                </TableCell>
                <TableCell className="text-right pt-4">
                    <Button variant="ghost" size="icon" onClick={handleSubmit(onSubmit)}><Save className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={onCancel}><X className="h-4 w-4" /></Button>
                </TableCell>
            </TableRow>
        </FormProvider>
    );
}


type MultiSelectDropdownProps = {
    options: { id: string, name: string }[];
    selected: string[];
    onChange: (selected: string[]) => void;
    onCreate?: (name: string) => Promise<{id: string, name: string} | null>;
    placeholder?: string;
    className?: string;
    disabled?: boolean;
};

function MultiSelectDropdown({ options, selected, onChange, onCreate, placeholder, className, disabled = false }: MultiSelectDropdownProps) {
    const [open, setOpen] = React.useState(false);
    const [searchQuery, setSearchQuery] = React.useState('');
    const [isCreating, setIsCreating] = React.useState(false);

    const handleCreateNew = async () => {
        if (searchQuery.trim() === '' || isCreating || !onCreate) return;
        setIsCreating(true);
        const newOption = await onCreate(searchQuery.trim());
        if (newOption) {
            onChange([...selected, newOption.name]);
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
                <Button variant="outline" className={cn("w-full justify-between font-normal", className)} disabled={disabled}>
                    <span className="truncate">{selectedValue}</span>
                    <History className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width]" align="start" onCloseAutoFocus={(e) => e.preventDefault()}>
                <div className="p-2">
                    <div className="flex items-center border-b px-2">
                        <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                        <Input 
                            placeholder="Search or add..."
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


type SingleSelectDropdownProps = {
    options: { id: string, name: string }[];
    selected: string;
    onChange: (selectedId: string) => void;
    onCreate?: (name: string) => Promise<{id: string, name: string} | null>;
    placeholder?: string;
    className?: string;
    disabled?: boolean;
};

function SingleSelectDropdown({ options, selected, onChange, onCreate, placeholder, className, disabled = false }: SingleSelectDropdownProps) {
    const [open, setOpen] = React.useState(false);
    const [searchQuery, setSearchQuery] = React.useState('');
    const [isCreating, setIsCreating] = React.useState(false);

    const handleCreateNew = async () => {
        if (searchQuery.trim() === '' || isCreating || !onCreate) return;
        setIsCreating(true);
        const newOption = await onCreate(searchQuery.trim());
        if (newOption) {
            onChange(newOption.id);
        }
        setIsCreating(false);
        setOpen(false);
    };

    const filteredOptions = options.filter(option =>
        option.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    const showCreateOption = onCreate && searchQuery && !options.some(o => o.name.toLowerCase() === searchQuery.toLowerCase());

    const selectedValue = React.useMemo(() => {
        const selectedOption = options.find(o => o.id === selected);
        return selectedOption ? selectedOption.name : (placeholder || 'Select...');
    }, [selected, options, placeholder]);

    return (
        <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" className={cn("w-full justify-between font-normal", className)} disabled={disabled}>
                    <span className="truncate">{selectedValue}</span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width]" align="start">
                <div className="p-2">
                    <div className="flex items-center border-b px-2">
                        <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                        <Input 
                            placeholder="Search or add..."
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
                        <DropdownMenuItem
                            key={option.id}
                            onSelect={() => {
                                onChange(option.id);
                                setOpen(false);
                            }}
                        >
                             <Check className={cn("mr-2 h-4 w-4", selected === option.id ? "opacity-100" : "opacity-0")} />
                            {option.name}
                        </DropdownMenuItem>
                    )) : !showCreateOption && <p className="p-2 text-center text-sm text-muted-foreground">No results found.</p>}
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

    









    



