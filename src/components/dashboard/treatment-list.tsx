

'use client';

import * as React from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { MoreHorizontal, PlusCircle, Edit, Trash2, Loader2, Search, ClipboardList, Stethoscope, ChevronsUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import type { Treatment, ChiefComplaint, DentalExamination } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { addTreatment, updateTreatment, deleteTreatment } from '@/app/actions/treatments';
import { addChiefComplaint, deleteChiefComplaint, addDentalExamination, deleteDentalExamination, updateChiefComplaint, updateDentalExamination } from '@/app/actions/examinations';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const treatmentSchema = z.object({
  name: z.string().min(2, "Treatment name must be at least 2 characters."),
  cost: z.coerce.number().min(0, "Cost must be a positive number.").optional(),
});
type TreatmentFormValues = z.infer<typeof treatmentSchema>;

const complaintSchema = z.object({
  name: z.string().min(2, "Complaint must be at least 2 characters."),
});
type ComplaintFormValues = z.infer<typeof complaintSchema>;

const examinationSchema = z.object({
  name: z.string().min(2, "Examination name must be at least 2 characters."),
});
type ExaminationFormValues = z.infer<typeof examinationSchema>;


interface TreatmentListProps {
    initialTreatments: Treatment[];
    initialChiefComplaints: ChiefComplaint[];
    initialDentalExaminations: DentalExamination[];
}

export function TreatmentList({ initialTreatments, initialChiefComplaints, initialDentalExaminations }: TreatmentListProps) {
  const [treatments, setTreatments] = React.useState<Treatment[]>(initialTreatments);
  const [chiefComplaints, setChiefComplaints] = React.useState<ChiefComplaint[]>(initialChiefComplaints);
  const [dentalExaminations, setDentalExaminations] = React.useState<DentalExamination[]>(initialDentalExaminations);
  
  const [searchQuery, setSearchQuery] = React.useState('');

  const [isTreatmentFormOpen, setIsTreatmentFormOpen] = React.useState(false);
  const [editingTreatment, setEditingTreatment] = React.useState<Treatment | null>(null);
  const [deletingTreatment, setDeletingTreatment] = React.useState<Treatment | null>(null);

  const [isComplaintFormOpen, setIsComplaintFormOpen] = React.useState(false);
  const [editingComplaint, setEditingComplaint] = React.useState<ChiefComplaint | null>(null);
  const [deletingComplaint, setDeletingComplaint] = React.useState<ChiefComplaint | null>(null);

  const [isAddingExamination, setIsAddingExamination] = React.useState(false);
  const [editingExamination, setEditingExamination] = React.useState<DentalExamination | null>(null);
  const [deletingExamination, setDeletingExamination] = React.useState<DentalExamination | null>(null);

  const { toast } = useToast();

  const treatmentForm = useForm<TreatmentFormValues>({ resolver: zodResolver(treatmentSchema), defaultValues: { name: "" } });
  const complaintForm = useForm<ComplaintFormValues>({ resolver: zodResolver(complaintSchema), defaultValues: { name: "" } });
  const examinationForm = useForm<ExaminationFormValues>({ resolver: zodResolver(examinationSchema), defaultValues: { name: "" } });

  const filteredTreatments = React.useMemo(() => {
    if (!searchQuery) return treatments;
    const lowercasedQuery = searchQuery.toLowerCase();
    return treatments.filter(t => t.name.toLowerCase().includes(lowercasedQuery));
  }, [searchQuery, treatments]);

  React.useEffect(() => {
    if (isTreatmentFormOpen && editingTreatment) {
      treatmentForm.reset({ name: editingTreatment.name, cost: editingTreatment.cost });
    } else {
      treatmentForm.reset({ name: "", cost: undefined });
    }
  }, [isTreatmentFormOpen, editingTreatment, treatmentForm]);
  
  React.useEffect(() => {
    if (isComplaintFormOpen && editingComplaint) {
      complaintForm.reset({ name: editingComplaint.name });
    } else {
      complaintForm.reset({ name: "" });
    }
  }, [isComplaintFormOpen, editingComplaint, complaintForm]);

  React.useEffect(() => {
    if (editingExamination) {
      examinationForm.reset({ name: editingExamination.name });
    } else {
      examinationForm.reset({ name: "" });
    }
  }, [editingExamination, examinationForm]);
  
  const handleTreatmentDialogChange = (open: boolean) => {
    setIsTreatmentFormOpen(open);
    if (!open) setEditingTreatment(null);
  }
  const handleComplaintDialogChange = (open: boolean) => {
    setIsComplaintFormOpen(open);
    if (!open) setEditingComplaint(null);
  }
  const handleExaminationDialogChange = (open: boolean) => {
    // This is for the edit dialog, not the inline add form
    if (!open) setEditingExamination(null);
  }

  const onTreatmentSubmit = async (data: TreatmentFormValues) => {
    if (editingTreatment) {
      const result = await updateTreatment(editingTreatment.id, data);
      if (result.success) {
        setTreatments(treatments.map(t => t.id === editingTreatment.id ? { ...t, ...data } : t));
        toast({ title: "Treatment Updated" });
      } else {
        toast({ variant: "destructive", title: "Failed to update treatment", description: result.error });
        return;
      }
    } else {
      const payload: Omit<Treatment, 'id'> = { ...data };
      const result = await addTreatment(payload);
      if (result.success && result.data) {
        setTreatments([result.data, ...treatments]);
        toast({ title: "Treatment Added" });
      } else {
        toast({ variant: "destructive", title: "Failed to add treatment", description: result.error });
        return;
      }
    }
    treatmentForm.reset();
    handleTreatmentDialogChange(false);
  };

  const onComplaintSubmit = async (data: ComplaintFormValues) => {
    if (editingComplaint) {
        const result = await updateChiefComplaint(editingComplaint.id, data);
        if (result.success) {
            setChiefComplaints(chiefComplaints.map(c => c.id === editingComplaint.id ? { ...c, ...data } : c).sort((a,b) => a.name.localeCompare(b.name)));
            toast({ title: "Chief Complaint Updated" });
        } else {
            toast({ variant: "destructive", title: "Failed to update complaint", description: result.error });
        }
    } else {
        const result = await addChiefComplaint(data);
        if (result.success && result.data) {
            setChiefComplaints([result.data, ...chiefComplaints].sort((a,b) => a.name.localeCompare(b.name)));
            toast({ title: "Chief Complaint Added" });
        } else {
            toast({ variant: "destructive", title: "Failed to add complaint", description: result.error });
        }
    }
    handleComplaintDialogChange(false);
  };

  const onExaminationSubmit = async (data: ExaminationFormValues) => {
     if (editingExamination) {
        const result = await updateDentalExamination(editingExamination.id, data);
        if (result.success) {
            setDentalExaminations(dentalExaminations.map(e => e.id === editingExamination.id ? { ...e, ...data } : e).sort((a,b) => a.name.localeCompare(b.name)));
            toast({ title: "Dental Examination Updated" });
        } else {
            toast({ variant: "destructive", title: "Failed to update examination", description: result.error });
        }
        setEditingExamination(null); // This closes the edit dialog
    } else {
        const result = await addDentalExamination(data);
        if (result.success && result.data) {
            setDentalExaminations([result.data, ...dentalExaminations].sort((a,b) => a.name.localeCompare(b.name)));
            toast({ title: "Dental Examination Added" });
        } else {
            toast({ variant: "destructive", title: "Failed to add examination", description: result.error });
        }
        setIsAddingExamination(false);
        examinationForm.reset({ name: '' });
    }
  };

  const confirmDeleteTreatment = async () => {
    if (!deletingTreatment) return;
    const result = await deleteTreatment(deletingTreatment.id);
    if (result.success) {
      setTreatments(treatments.filter(t => t.id !== deletingTreatment.id));
      toast({ title: "Treatment Deleted" });
    } else {
      toast({ variant: "destructive", title: "Failed to delete treatment", description: result.error });
    }
    setDeletingTreatment(null);
  }

  const confirmDeleteComplaint = async () => {
    if (!deletingComplaint) return;
    const result = await deleteChiefComplaint(deletingComplaint.id);
    if (result.success) {
        setChiefComplaints(chiefComplaints.filter(c => c.id !== deletingComplaint.id));
        toast({ title: `Item Deleted` });
    } else {
        toast({ variant: "destructive", title: "Failed to delete item", description: result.error });
    }
    setDeletingComplaint(null);
  };
  
  const confirmDeleteExamination = async () => {
    if (!deletingExamination) return;
    const result = await deleteDentalExamination(deletingExamination.id);
    if (result.success) {
        setDentalExaminations(dentalExaminations.filter(e => e.id !== deletingExamination.id));
        toast({ title: `Item Deleted` });
    } else {
        toast({ variant: "destructive", title: "Failed to delete item", description: result.error });
    }
    setDeletingExamination(null);
  };
  
  return (
    <>
      <div className="space-y-6">
        <Card>
            <CardHeader>
                <CardTitle>Clinical Examination Setup</CardTitle>
                <CardDescription>Define standard templates for chief complaints and dental examinations.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-4">
                        <CardTitle className="text-base font-semibold flex items-center gap-2">
                            <ClipboardList className="h-5 w-5" />
                            Chief Complaints
                        </CardTitle>
                        <Dialog open={isComplaintFormOpen} onOpenChange={handleComplaintDialogChange}>
                            <DialogTrigger asChild>
                                <Button size="sm" onClick={() => setEditingComplaint(null)}><PlusCircle className="mr-2 h-4 w-4" /> Add New</Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>{editingComplaint ? 'Edit' : 'Add New'} Chief Complaint</DialogTitle>
                                </DialogHeader>
                                <Form {...complaintForm}>
                                    <form onSubmit={complaintForm.handleSubmit(onComplaintSubmit)} className="space-y-4 py-4">
                                        <FormField control={complaintForm.control} name="name" render={({ field }) => (
                                            <FormItem>
                                            <FormLabel>Complaint Name</FormLabel>
                                            <FormControl><Input placeholder="e.g., Toothache" {...field} /></FormControl>
                                            <FormMessage />
                                            </FormItem>
                                        )} />
                                        <DialogFooter>
                                            <Button type="submit" disabled={complaintForm.formState.isSubmitting}>
                                                {complaintForm.formState.isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Save'}
                                            </Button>
                                        </DialogFooter>
                                    </form>
                                </Form>
                            </DialogContent>
                        </Dialog>
                    </CardHeader>
                    <CardContent>
                        <div className="border rounded-md">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead className="w-[80px] text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {chiefComplaints.length > 0 ? chiefComplaints.map(complaint => (
                                        <TableRow key={complaint.id}>
                                            <TableCell>{complaint.name}</TableCell>
                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onSelect={() => {setEditingComplaint(complaint); setIsComplaintFormOpen(true);}}><Edit className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                                                        <DropdownMenuItem onSelect={() => setDeletingComplaint(complaint)} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    )) : (
                                        <TableRow><TableCell colSpan={2} className="h-24 text-center">No chief complaints defined.</TableCell></TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-4">
                        <CardTitle className="text-base font-semibold flex items-center gap-2">
                            <Stethoscope className="h-5 w-5" />
                            Dental Examinations
                        </CardTitle>
                        {!isAddingExamination && (
                             <Button size="sm" onClick={() => setIsAddingExamination(true)}>
                                <PlusCircle className="mr-2 h-4 w-4" /> Add New
                             </Button>
                        )}
                    </CardHeader>
                    <CardContent>
                        {isAddingExamination && (
                            <Form {...examinationForm}>
                                <form onSubmit={examinationForm.handleSubmit(onExaminationSubmit)} className="space-y-4 p-4 border rounded-md mb-4">
                                    <h3 className="font-medium">Add New Dental Examination</h3>
                                    <FormField control={examinationForm.control} name="name" render={({ field }) => (
                                        <FormItem>
                                        <FormLabel>Examination Name</FormLabel>
                                        <FormControl><Input placeholder="e.g., Standard Check-up" {...field} /></FormControl>
                                        <FormMessage />
                                        </FormItem>
                                    )} />
                                    <div className="flex justify-end gap-2">
                                        <Button type="button" variant="ghost" onClick={() => setIsAddingExamination(false)}>Cancel</Button>
                                        <Button type="submit" disabled={examinationForm.formState.isSubmitting}>
                                            {examinationForm.formState.isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Save'}
                                        </Button>
                                    </div>
                                </form>
                            </Form>
                        )}
                       <div className="border rounded-md">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead className="w-[80px] text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {dentalExaminations.length > 0 ? dentalExaminations.map(exam => (
                                        <TableRow key={exam.id}>
                                            <TableCell>{exam.name}</TableCell>
                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onSelect={() => setEditingExamination(exam)}><Edit className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                                                        <DropdownMenuItem onSelect={() => setDeletingExamination(exam)} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    )) : (
                                        <TableRow><TableCell colSpan={2} className="h-24 text-center">No examination templates defined.</TableCell></TableRow>
                                    )}
                                </TableBody>
                            </Table>
                       </div>
                    </CardContent>
                </Card>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
            <div className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between gap-4">
                <div>
                    <CardTitle>Treatments</CardTitle>
                    <CardDescription>Manage services and their default prices offered at the clinic.</CardDescription>
                </div>
                <div className="flex w-full sm:w-auto gap-2">
                    <div className="relative flex-1 sm:flex-initial">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                        placeholder="Search treatments..."
                        className="pl-10"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                     <Dialog open={isTreatmentFormOpen} onOpenChange={handleTreatmentDialogChange}>
                        <DialogTrigger asChild>
                        <Button size="sm" onClick={() => setEditingTreatment(null)}>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            New
                        </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-lg">
                        <DialogHeader>
                            <DialogTitle>{editingTreatment ? 'Edit Treatment' : 'Add New Treatment'}</DialogTitle>
                            <DialogDescription>
                            {editingTreatment ? 'Update the details for this treatment.' : 'Create a new treatment to offer at your clinic.'}
                            </DialogDescription>
                        </DialogHeader>
                        <Form {...treatmentForm}>
                            <form onSubmit={treatmentForm.handleSubmit(onTreatmentSubmit)} className="space-y-4 py-4">
                            <FormField control={treatmentForm.control} name="name" render={({ field }) => (
                                <FormItem>
                                <FormLabel>Treatment Name</FormLabel>
                                <FormControl><Input placeholder="e.g., Teeth Whitening" {...field} /></FormControl>
                                <FormMessage />
                                </FormItem>
                            )} />
                             <FormField control={treatmentForm.control} name="cost" render={({ field }) => (
                                <FormItem>
                                <FormLabel>Default Cost (Optional)</FormLabel>
                                <FormControl><Input type="number" placeholder="1500" {...field} value={field.value ?? ''} /></FormControl>
                                <FormMessage />
                                </FormItem>
                            )} />
                            <DialogFooter>
                                <Button type="submit" className="w-full" disabled={treatmentForm.formState.isSubmitting}>
                                    {treatmentForm.formState.isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Save Treatment'}
                                </Button>
                            </DialogFooter>
                            </form>
                        </Form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>
            </CardHeader>
            <CardContent>
                <div className="border rounded-md">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Treatment Name</TableHead>
                                <TableHead>Default Cost</TableHead>
                                <TableHead className="w-[80px] text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                        {filteredTreatments.length > 0 ? (
                            filteredTreatments.map(treatment => (
                                <TableRow key={treatment.id}>
                                    <TableCell className="font-medium">{treatment.name}</TableCell>
                                    <TableCell>{treatment.cost ? `Rs. ${treatment.cost.toFixed(2)}` : 'N/A'}</TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                    <span className="sr-only">Actions</span>
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onSelect={() => {setEditingTreatment(treatment); setIsTreatmentFormOpen(true);}}>
                                                    <Edit className="mr-2 h-4 w-4" /> Edit
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onSelect={() => setDeletingTreatment(treatment)} className="text-destructive">
                                                    <Trash2 className="mr-2 h-4 w-4" /> Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={3} className="h-24 text-center">
                                    {searchQuery ? "No treatments found." : "No treatments created yet."}
                                </TableCell>
                            </TableRow>
                        )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
      </div>
      
      <AlertDialog open={!!deletingTreatment} onOpenChange={(open) => !open && setDeletingTreatment(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the treatment <span className="font-bold">{deletingTreatment?.name}</span>.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setDeletingTreatment(null)}>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={confirmDeleteTreatment}>
                    Continue
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

       <AlertDialog open={!!deletingComplaint} onOpenChange={(open) => !open && setDeletingComplaint(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                    This will permanently delete the complaint: <span className="font-bold">{deletingComplaint?.name}</span>.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={confirmDeleteComplaint}>Continue</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <Dialog open={!!editingExamination} onOpenChange={(open) => !open && setEditingExamination(null)}>
         <DialogContent>
            <DialogHeader>
                <DialogTitle>Edit Dental Examination</DialogTitle>
            </DialogHeader>
            <Form {...examinationForm}>
                <form onSubmit={examinationForm.handleSubmit(onExaminationSubmit)} className="space-y-4 py-4">
                    <FormField control={examinationForm.control} name="name" render={({ field }) => (
                        <FormItem>
                        <FormLabel>Examination Name</FormLabel>
                        <FormControl><Input placeholder="e.g., Standard Check-up" {...field} /></FormControl>
                        <FormMessage />
                        </FormItem>
                    )} />
                    <DialogFooter>
                        <Button type="submit" disabled={examinationForm.formState.isSubmitting}>
                            {examinationForm.formState.isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Save Changes'}
                        </Button>
                    </DialogFooter>
                </form>
            </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingExamination} onOpenChange={(open) => !open && setDeletingExamination(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                    This will permanently delete the examination: <span className="font-bold">{deletingExamination?.name}</span>.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={confirmDeleteExamination}>Continue</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
