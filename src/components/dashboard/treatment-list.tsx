
'use client';

import * as React from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { MoreHorizontal, PlusCircle, Edit, Trash2, Loader2, ChevronsUpDown, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import type { Treatment } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { addTreatment, updateTreatment, deleteTreatment } from '@/app/actions/treatments';
import { ToothChart } from './tooth-chart';
import { ScrollArea } from '../ui/scroll-area';

const treatmentSchema = z.object({
  name: z.string().min(2, "Treatment name must be at least 2 characters."),
});

type TreatmentFormValues = z.infer<typeof treatmentSchema>;

const toothPriceSchema = z.object({
    price: z.coerce.number().positive("Price must be a positive number.")
});

type ToothPriceFormValues = z.infer<typeof toothPriceSchema>;


export function TreatmentList({ initialTreatments }: { initialTreatments: Treatment[] }) {
  const [treatments, setTreatments] = React.useState<Treatment[]>(initialTreatments);
  const [selectedTreatment, setSelectedTreatment] = React.useState<Treatment | null>(initialTreatments[0] || null);
  const [searchQuery, setSearchQuery] = React.useState('');

  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [editingTreatment, setEditingTreatment] = React.useState<Treatment | null>(null);
  
  const [isAlertOpen, setIsAlertOpen] = React.useState(false);
  const [deletingTreatment, setDeletingTreatment] = React.useState<Treatment | null>(null);

  const [isPriceDialogOpen, setIsPriceDialogOpen] = React.useState(false);
  const [selectedTooth, setSelectedTooth] = React.useState<number | null>(null);
  const [isSubmittingPrice, setIsSubmittingPrice] = React.useState(false);

  const { toast } = useToast();

  const form = useForm<TreatmentFormValues>({
    resolver: zodResolver(treatmentSchema),
    defaultValues: { name: "" },
  });

  const priceForm = useForm<ToothPriceFormValues>({
      resolver: zodResolver(toothPriceSchema),
      defaultValues: { price: 0 }
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
  
  React.useEffect(() => {
    if (selectedTreatment && selectedTooth) {
        const currentPrice = selectedTreatment.prices?.[selectedTooth] || selectedTreatment.defaultAmount || 0;
        priceForm.reset({ price: currentPrice });
    }
  }, [selectedTooth, selectedTreatment, priceForm]);

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
      if (selectedTreatment?.id === deletingTreatment.id) {
        setSelectedTreatment(newTreatments[0] || null);
      }
      toast({ title: "Treatment Deleted" });
    } else {
      toast({ variant: "destructive", title: "Failed to delete treatment", description: result.error });
    }
    setIsAlertOpen(false);
    setDeletingTreatment(null);
  }

  const onSubmit = async (data: TreatmentFormValues) => {
    if (editingTreatment) {
      const updatedData = { ...editingTreatment, ...data };
      const result = await updateTreatment(editingTreatment.id, updatedData);
      if (result.success) {
        const newTreatments = treatments.map(t => t.id === editingTreatment.id ? updatedData : t);
        setTreatments(newTreatments);
        if (selectedTreatment?.id === editingTreatment.id) {
            setSelectedTreatment(updatedData);
        }
        toast({ title: "Treatment Updated" });
      } else {
        toast({ variant: "destructive", title: "Failed to update treatment", description: result.error });
        return;
      }
    } else {
      const payload: Omit<Treatment, 'id'> = { ...data, description: '', defaultAmount: 0, prices: {} };
      const result = await addTreatment(payload);
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

  const onToothClick = (toothNumber: number) => {
      if (!selectedTreatment) {
          toast({
              variant: 'default',
              title: 'Select a treatment first',
              description: 'Please select a treatment from the list before setting a price.'
          });
          return;
      }
      setSelectedTooth(toothNumber);
      setIsPriceDialogOpen(true);
  };
  
  const handlePriceSubmit = async (data: ToothPriceFormValues) => {
      if (!selectedTreatment || !selectedTooth) return;
      setIsSubmittingPrice(true);

      const newPrices = { ...selectedTreatment.prices, [selectedTooth]: data.price };
      const updatedTreatment = { ...selectedTreatment, prices: newPrices };
      
      const result = await updateTreatment(selectedTreatment.id, { prices: newPrices });
      if (result.success) {
          setTreatments(treatments.map(t => t.id === selectedTreatment.id ? updatedTreatment : t));
          setSelectedTreatment(updatedTreatment);
          toast({ title: `Price for tooth #${selectedTooth} updated successfully!` });
          setIsPriceDialogOpen(false);
      } else {
          toast({ variant: 'destructive', title: 'Failed to update price', description: result.error });
      }
      setIsSubmittingPrice(false);
  };
  
  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle>Treatments & Pricing</CardTitle>
                <CardDescription>Manage services and set default or tooth-specific prices.</CardDescription>
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
        </CardHeader>
        <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
                <div className="md:col-span-1">
                     <h3 className="text-lg font-semibold mb-2">Available Treatments</h3>
                     <CardDescription className="mb-4">Select a treatment to view and edit its prices on the dental chart.</CardDescription>
                      <div className="relative mb-4">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search treatments..."
                          className="pl-10"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                      </div>
                     <ScrollArea className="h-[400px] rounded-md border">
                        <div className="p-2">
                            {filteredTreatments.length > 0 ? (
                            filteredTreatments.map(treatment => (
                                <div key={treatment.id} className={`group w-full text-left p-2 rounded-md hover:bg-muted text-sm flex justify-between items-center ${selectedTreatment?.id === treatment.id ? 'bg-muted font-semibold' : ''}`}>
                                    <button onClick={() => setSelectedTreatment(treatment)} className="flex-1 text-left">
                                        <p>{treatment.name}</p>
                                    </button>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 focus:opacity-100">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onSelect={() => handleEditClick(treatment)}>
                                                <Edit className="mr-2 h-4 w-4" /> Edit Name
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onSelect={() => handleDeleteClick(treatment)} className="text-destructive">
                                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            ))
                            ) : (
                            <p className="text-center text-sm text-muted-foreground p-4">
                                {searchQuery ? "No treatments match your search." : "No treatments found."}
                            </p>
                            )}
                        </div>
                    </ScrollArea>
                </div>
                <div className="md:col-span-2">
                    <h3 className="text-lg font-semibold mb-2">Tooth-Specific Pricing</h3>
                    <CardDescription className="mb-4">
                        {selectedTreatment ? `Editing prices for: ${selectedTreatment.name}. Click a tooth to set its price.` : 'Select a treatment to manage its pricing.'}
                    </CardDescription>
                    <div className="p-4 border rounded-lg">
                        <ToothChart onToothClick={onToothClick} treatmentPrices={selectedTreatment?.prices} />
                    </div>
                </div>
            </div>
        </CardContent>
      </Card>

      <Dialog open={isPriceDialogOpen} onOpenChange={setIsPriceDialogOpen}>
          <DialogContent>
              <DialogHeader>
                  <DialogTitle>Set Price for Tooth #{selectedTooth}</DialogTitle>
                  <DialogDescription>
                      You are setting the price for <span className="font-bold">{selectedTreatment?.name}</span> on this specific tooth.
                  </DialogDescription>
              </DialogHeader>
              <Form {...priceForm}>
                  <form onSubmit={priceForm.handleSubmit(handlePriceSubmit)} className="space-y-4 py-4">
                      <FormField control={priceForm.control} name="price" render={({ field }) => (
                          <FormItem>
                              <FormLabel>Price (Rs.)</FormLabel>
                              <FormControl><Input type="number" {...field} /></FormControl>
                              <FormMessage />
                          </FormItem>
                      )} />
                      <DialogFooter>
                          <Button type="submit" disabled={isSubmittingPrice}>
                              {isSubmittingPrice && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                              Set Price
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
