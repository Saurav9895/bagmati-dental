'use client';

import * as React from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { MoreHorizontal, PlusCircle, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, query, orderBy, serverTimestamp, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import type { Treatment } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

const treatmentSchema = z.object({
  name: z.string().min(2, "Treatment name must be at least 2 characters."),
  description: z.string().min(10, "Description must be at least 10 characters."),
  amount: z.coerce.number().positive("Amount must be a positive number."),
});

type TreatmentFormValues = z.infer<typeof treatmentSchema>;

export function TreatmentList() {
  const [treatments, setTreatments] = React.useState<Treatment[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [editingTreatment, setEditingTreatment] = React.useState<Treatment | null>(null);
  const [isAlertOpen, setIsAlertOpen] = React.useState(false);
  const [deletingTreatmentId, setDeletingTreatmentId] = React.useState<string | null>(null);
  const { toast } = useToast();

  const form = useForm<TreatmentFormValues>({
    resolver: zodResolver(treatmentSchema),
    defaultValues: { name: "", description: "", amount: 0 },
  });

  React.useEffect(() => {
    const fetchTreatments = async () => {
      try {
        const treatmentsCollection = collection(db, 'treatments');
        const q = query(treatmentsCollection, orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        const treatmentsList = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        })) as Treatment[];
        setTreatments(treatmentsList);
      } catch (error) {
        console.error("Error fetching treatments: ", error);
        toast({
          variant: "destructive",
          title: "Failed to load treatments",
          description: "There was an error fetching the treatment list. Please try again later.",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchTreatments();
  }, [toast]);
  
  React.useEffect(() => {
    if (isFormOpen && editingTreatment) {
      form.reset(editingTreatment);
    } else if (!isFormOpen) {
      form.reset({ name: "", description: "", amount: 0 });
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

  const handleDeleteClick = (treatmentId: string) => {
    setDeletingTreatmentId(treatmentId);
    setIsAlertOpen(true);
  };
  
  const confirmDelete = async () => {
    if (!deletingTreatmentId) return;
    try {
        await deleteDoc(doc(db, "treatments", deletingTreatmentId));
        setTreatments(treatments.filter(t => t.id !== deletingTreatmentId));
        toast({
            title: "Treatment Deleted",
            description: "The treatment has been successfully deleted.",
        });
    } catch (error) {
        toast({
            variant: "destructive",
            title: "Failed to delete treatment",
            description: (error as Error).message || "An unexpected error occurred.",
        });
    } finally {
        setIsAlertOpen(false);
        setDeletingTreatmentId(null);
    }
  }

  const onSubmit = async (data: TreatmentFormValues) => {
    try {
      if (editingTreatment) {
        const treatmentRef = doc(db, "treatments", editingTreatment.id);
        await updateDoc(treatmentRef, data);
        setTreatments(treatments.map(t => t.id === editingTreatment.id ? { ...t, ...data } : t));
        toast({
          title: "Treatment Updated",
          description: `${data.name} has been successfully updated.`,
        });
      } else {
        const newTreatmentData = {
          ...data,
          createdAt: serverTimestamp(),
        };
        const docRef = await addDoc(collection(db, "treatments"), newTreatmentData);
        const newTreatmentForState: Treatment = {
          id: docRef.id,
          ...data,
        };
        setTreatments([newTreatmentForState, ...treatments]);
        toast({
          title: "Treatment Added",
          description: `${data.name} has been successfully added to the list.`,
        });
      }
      form.reset();
      handleDialogOpenChange(false);
    } catch (error) {
      console.error("Error saving document: ", error);
      toast({
        variant: "destructive",
        title: `Failed to ${editingTreatment ? 'update' : 'add'} treatment`,
        description: (error as Error).message || "An unexpected error occurred. Please try again.",
      });
    }
  };
  
  return (
    <>
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Treatments</CardTitle>
          <CardDescription>Manage the treatments offered by your clinic.</CardDescription>
        </div>
        <Dialog open={isFormOpen} onOpenChange={handleDialogOpenChange}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={() => setEditingTreatment(null)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              New Treatment
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingTreatment ? 'Edit Treatment' : 'Add New Treatment'}</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Treatment Name</FormLabel>
                    <FormControl><Input placeholder="e.g., Teeth Whitening" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="description" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl><Textarea placeholder="Describe the treatment..." {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="amount" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount ($)</FormLabel>
                    <FormControl><Input type="number" placeholder="e.g., 250" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? 'Saving...' : 'Save Treatment'}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead><span className="sr-only">Actions</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-8 rounded-full" /></TableCell>
                </TableRow>
              ))
            ) : treatments.length > 0 ? (
              treatments.map((treatment) => (
                <TableRow key={treatment.id}>
                  <TableCell className="font-medium">{treatment.name}</TableCell>
                  <TableCell>{treatment.description}</TableCell>
                  <TableCell className="text-right">${treatment.amount.toFixed(2)}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button aria-haspopup="true" size="icon" variant="ghost">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Toggle menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => handleEditClick(treatment)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleDeleteClick(treatment.id)} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center h-24">
                    No treatments found. Add one to get started.
                  </TableCell>
                </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
    <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the treatment
                    from your records.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setDeletingTreatmentId(null)}>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={confirmDelete}>
                    Continue
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
