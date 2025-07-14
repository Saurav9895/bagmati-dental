
'use client';

import * as React from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { MoreHorizontal, PlusCircle, Edit, Trash2, Loader2, ChevronsUpDown, Search, ClipboardList, Stethoscope } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import type { Treatment } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { addTreatment, updateTreatment, deleteTreatment } from '@/app/actions/treatments';
import { ScrollArea } from '../ui/scroll-area';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const treatmentSchema = z.object({
  name: z.string().min(2, "Treatment name must be at least 2 characters."),
});

type TreatmentFormValues = z.infer<typeof treatmentSchema>;

export function TreatmentList({ initialTreatments }: { initialTreatments: Treatment[] }) {
  const [treatments, setTreatments] = React.useState<Treatment[]>(initialTreatments);
  const [searchQuery, setSearchQuery] = React.useState('');

  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [editingTreatment, setEditingTreatment] = React.useState<Treatment | null>(null);
  
  const [isAlertOpen, setIsAlertOpen] = React.useState(false);
  const [deletingTreatment, setDeletingTreatment] = React.useState<Treatment | null>(null);

  const { toast } = useToast();

  const form = useForm<TreatmentFormValues>({
    resolver: zodResolver(treatmentSchema),
    defaultValues: { name: "" },
  });

  const filteredTreatments = React.useMemo(() => {
    if (!searchQuery) return treatments;
    const lowercasedQuery = searchQuery.toLowerCase();
    return treatments.filter(t => t.name.toLowerCase().includes(lowercasedQuery));
  }, [searchQuery, treatments]);

  React.useEffect(() => {
    if (isFormOpen && editingTreatment) {
      form.reset({
          name: editingTreatment.name,
      });
    } else if (!isFormOpen) {
      form.reset({ name: "" });
    }
  }, [isFormOpen, editingTreatment, form]);
  
  const handleDialogOpenChange = (open: boolean) => {
    setIsFormOpen(open);
    if (!open) {
      setEditingTreatment(null);
    }
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

  const onSubmit = async (data: TreatmentFormValues) => {
    if (editingTreatment) {
      const updatedData: Partial<Treatment> = { name: data.name };
      const result = await updateTreatment(editingTreatment.id, updatedData);
      if (result.success) {
        const newTreatments = treatments.map(t => t.id === editingTreatment.id ? { ...t, ...updatedData } : t);
        setTreatments(newTreatments);
        toast({ title: "Treatment Updated" });
      } else {
        toast({ variant: "destructive", title: "Failed to update treatment", description: result.error });
        return;
      }
    } else {
      const payload: Omit<Treatment, 'id' | 'defaultAmount'> = { ...data, description: '', prices: {} };
      const result = await addTreatment({ ...payload, defaultAmount: 0 });
      if (result.success && result.data) {
        setTreatments([result.data, ...treatments]);
        toast({ title: "Treatment Added" });
      } else {
        toast({ variant: "destructive", title: "Failed to add treatment", description: result.error });
        return;
      }
    }
    
    form.reset();
    handleDialogOpenChange(false);
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
                        <Button variant="outline" size="sm"><PlusCircle className="mr-2 h-4 w-4" /> Add</Button>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground text-center py-8">No chief complaints defined yet.</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-base font-semibold flex items-center gap-2">
                            <Stethoscope className="h-5 w-5" />
                            Dental Examinations
                        </CardTitle>
                        <Button variant="outline" size="sm"><PlusCircle className="mr-2 h-4 w-4" /> Add</Button>
                    </CardHeader>
                    <CardContent>
                         <p className="text-sm text-muted-foreground text-center py-8">No examination templates defined yet.</p>
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
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                            <FormField control={form.control} name="name" render={({ field }) => (
                                <FormItem>
                                <FormLabel>Treatment Name</FormLabel>
                                <FormControl><Input placeholder="e.g., Teeth Whitening" {...field} /></FormControl>
                                <FormMessage />
                                </FormItem>
                            )} />
                            <DialogFooter>
                                <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                                    {form.formState.isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Save Treatment'}
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
    </>
  );
}

    