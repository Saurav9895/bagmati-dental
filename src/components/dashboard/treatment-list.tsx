
'use client';

import * as React from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { MoreHorizontal, PlusCircle, Edit, Trash2, Loader2, Search, ClipboardList, Stethoscope } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import type { Treatment, ChiefComplaint, DentalExamination } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { addTreatment, updateTreatment, deleteTreatment } from '@/app/actions/treatments';
import { addChiefComplaint, deleteChiefComplaint, addDentalExamination, deleteDentalExamination } from '@/app/actions/examinations';
import { ScrollArea } from '../ui/scroll-area';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const treatmentSchema = z.object({
  name: z.string().min(2, "Treatment name must be at least 2 characters."),
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

  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [editingTreatment, setEditingTreatment] = React.useState<Treatment | null>(null);
  
  const [isAlertOpen, setIsAlertOpen] = React.useState(false);
  const [deletingTreatment, setDeletingTreatment] = React.useState<Treatment | null>(null);

  const [isComplaintDialogOpen, setIsComplaintDialogOpen] = React.useState(false);
  const [isExaminationDialogOpen, setIsExaminationDialogOpen] = React.useState(false);

  const [itemToDelete, setItemToDelete] = React.useState<{id: string, name: string, type: 'complaint' | 'examination'} | null>(null);

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
    if (isFormOpen && editingTreatment) {
      treatmentForm.reset({ name: editingTreatment.name });
    } else if (!isFormOpen) {
      treatmentForm.reset({ name: "" });
    }
  }, [isFormOpen, editingTreatment, treatmentForm]);
  
  const handleDialogOpenChange = (open: boolean) => {
    setIsFormOpen(open);
    if (!open) setEditingTreatment(null);
  }
  const handleComplaintDialogChange = (open: boolean) => {
    setIsComplaintDialogOpen(open);
    if (!open) complaintForm.reset();
  }
  const handleExaminationDialogChange = (open: boolean) => {
    setIsExaminationDialogOpen(open);
    if (!open) examinationForm.reset();
  }

  const handleEditClick = (treatment: Treatment) => {
    setEditingTreatment(treatment);
    setIsFormOpen(true);
  };

  const handleDeleteClick = (treatment: Treatment) => {
    setDeletingTreatment(treatment);
    setIsAlertOpen(true);
  };
  
  const confirmDelete = async () => {
    if (!deletingTreatment) return;
    const result = await deleteTreatment(deletingTreatment.id);
    if (result.success) {
      const newTreatments = treatments.filter(t => t.id !== deletingTreatment.id)
      setTreatments(newTreatments);
      toast({ title: "Treatment Deleted" });
    } else {
      toast({ variant: "destructive", title: "Failed to delete treatment", description: result.error });
    }
    setIsAlertOpen(false);
    setDeletingTreatment(null);
  }

  const onTreatmentSubmit = async (data: TreatmentFormValues) => {
    if (editingTreatment) {
      const updatedData: Partial<Treatment> = { name: data.name };
      const result = await updateTreatment(editingTreatment.id, updatedData);
      if (result.success) {
        setTreatments(treatments.map(t => t.id === editingTreatment.id ? { ...t, ...updatedData } : t));
        toast({ title: "Treatment Updated" });
      } else {
        toast({ variant: "destructive", title: "Failed to update treatment", description: result.error });
        return;
      }
    } else {
      const payload: Omit<Treatment, 'id'> = { ...data, description: '', prices: {} };
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
    handleDialogOpenChange(false);
  };

  const onComplaintSubmit = async (data: ComplaintFormValues) => {
    const result = await addChiefComplaint(data);
    if (result.success && result.data) {
        setChiefComplaints([result.data, ...chiefComplaints].sort((a,b) => a.name.localeCompare(b.name)));
        toast({ title: "Chief Complaint Added" });
    } else {
        toast({ variant: "destructive", title: "Failed to add complaint", description: result.error });
    }
    handleComplaintDialogChange(false);
  };

  const onExaminationSubmit = async (data: ExaminationFormValues) => {
    const result = await addDentalExamination(data);
    if (result.success && result.data) {
        setDentalExaminations([result.data, ...dentalExaminations].sort((a,b) => a.name.localeCompare(b.name)));
        toast({ title: "Dental Examination Added" });
    } else {
        toast({ variant: "destructive", title: "Failed to add examination", description: result.error });
    }
    handleExaminationDialogChange(false);
  };

  const handleDeleteItem = (id: string, name: string, type: 'complaint' | 'examination') => {
    setItemToDelete({ id, name, type });
  };

  const confirmDeleteItem = async () => {
    if (!itemToDelete) return;
    const { id, type } = itemToDelete;
    let result;
    if (type === 'complaint') {
        result = await deleteChiefComplaint(id);
        if (result.success) setChiefComplaints(chiefComplaints.filter(c => c.id !== id));
    } else {
        result = await deleteDentalExamination(id);
        if (result.success) setDentalExaminations(dentalExaminations.filter(e => e.id !== id));
    }

    if (result.success) {
        toast({ title: `Item Deleted` });
    } else {
        toast({ variant: "destructive", title: "Failed to delete item", description: result.error });
    }
    setItemToDelete(null);
  };
  
  return (
    <>
      <div className="space-y-6">
        <Card>
            <CardHeader>
                <CardTitle>Clinical Examination Setup</CardTitle>
                <CardDescription>Define standard templates for chief complaints and dental examinations.</CardDescription>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-base font-semibold flex items-center gap-2">
                            <ClipboardList className="h-5 w-5" />
                            Chief Complaints
                        </CardTitle>
                        <Dialog open={isComplaintDialogOpen} onOpenChange={handleComplaintDialogChange}>
                            <DialogTrigger asChild>
                                <Button variant="outline" size="sm"><PlusCircle className="mr-2 h-4 w-4" /> Add</Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Add New Chief Complaint</DialogTitle>
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
                        {chiefComplaints.length > 0 ? (
                            <ScrollArea className="h-48">
                                <ul className="space-y-2 pr-4">
                                    {chiefComplaints.map(complaint => (
                                        <li key={complaint.id} className="flex items-center justify-between text-sm p-2 rounded-md hover:bg-muted">
                                            <span>{complaint.name}</span>
                                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDeleteItem(complaint.id, complaint.name, 'complaint')}><Trash2 className="h-4 w-4" /></Button>
                                        </li>
                                    ))}
                                </ul>
                            </ScrollArea>
                        ) : (
                            <p className="text-sm text-muted-foreground text-center py-8">No chief complaints defined yet.</p>
                        )}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-base font-semibold flex items-center gap-2">
                            <Stethoscope className="h-5 w-5" />
                            Dental Examinations
                        </CardTitle>
                        <Dialog open={isExaminationDialogOpen} onOpenChange={handleExaminationDialogChange}>
                            <DialogTrigger asChild>
                                <Button variant="outline" size="sm"><PlusCircle className="mr-2 h-4 w-4" /> Add</Button>
                            </DialogTrigger>
                             <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Add New Dental Examination</DialogTitle>
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
                                                {examinationForm.formState.isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Save'}
                                            </Button>
                                        </DialogFooter>
                                    </form>
                                </Form>
                            </DialogContent>
                        </Dialog>
                    </CardHeader>
                    <CardContent>
                        {dentalExaminations.length > 0 ? (
                             <ScrollArea className="h-48">
                                <ul className="space-y-2 pr-4">
                                    {dentalExaminations.map(exam => (
                                        <li key={exam.id} className="flex items-center justify-between text-sm p-2 rounded-md hover:bg-muted">
                                            <span>{exam.name}</span>
                                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDeleteItem(exam.id, exam.name, 'examination')}><Trash2 className="h-4 w-4" /></Button>
                                        </li>
                                    ))}
                                </ul>
                            </ScrollArea>
                        ) : (
                            <p className="text-sm text-muted-foreground text-center py-8">No examination templates defined yet.</p>
                        )}
                    </CardContent>
                </Card>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
            <div className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between gap-4">
                <div>
                    <CardTitle>Treatments</CardTitle>
                    <CardDescription>Manage services offered at the clinic.</CardDescription>
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
                     <Dialog open={isFormOpen} onOpenChange={handleDialogOpenChange}>
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
                                <TableHead className="w-[80px] text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                        {filteredTreatments.length > 0 ? (
                            filteredTreatments.map(treatment => (
                                <TableRow key={treatment.id}>
                                    <TableCell className="font-medium">{treatment.name}</TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                    <span className="sr-only">Actions</span>
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onSelect={() => handleEditClick(treatment)}>
                                                    <Edit className="mr-2 h-4 w-4" /> Edit
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onSelect={() => handleDeleteClick(treatment)} className="text-destructive">
                                                    <Trash2 className="mr-2 h-4 w-4" /> Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={2} className="h-24 text-center">
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
      
      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the treatment <span className="font-bold">{deletingTreatment?.name}</span> and all its associated pricing.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setDeletingTreatment(null)}>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={confirmDelete}>
                    Continue
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <AlertDialog open={!!itemToDelete} onOpenChange={(open) => !open && setItemToDelete(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the template: <span className="font-bold">{itemToDelete?.name}</span>.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setItemToDelete(null)}>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={confirmDeleteItem}>
                    Continue
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
