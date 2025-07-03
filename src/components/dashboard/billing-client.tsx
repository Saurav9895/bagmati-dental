
'use client';

import * as React from 'react';
import { db } from '@/lib/firebase';
import type { Patient, Payment, Discount } from '@/lib/types';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Printer, Loader2, PlusCircle, Gift, Trash2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { addPaymentToPatient, addDiscountToPatient, removeDiscountFromPatient } from '@/app/actions/patients';
import { Textarea } from '../ui/textarea';

const paymentSchema = z.object({
    amount: z.coerce.number().positive("Amount must be a positive number."),
    method: z.enum(['Cash', 'Card', 'Bank Transfer', 'Other']),
    date: z.string().refine((val) => !isNaN(Date.parse(val)), "Invalid date."),
});

type PaymentFormValues = z.infer<typeof paymentSchema>;

const discountSchema = z.object({
    reason: z.string().min(2, "Reason must be at least 2 characters."),
    amount: z.coerce.number().positive("Amount must be a positive number."),
});

type DiscountFormValues = z.infer<typeof discountSchema>;


export function BillingClient() {
  const [allPatients, setAllPatients] = React.useState<Patient[]>([]);
  const [filteredPatients, setFilteredPatients] = React.useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = React.useState<Patient | null>(null);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(true);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = React.useState(false);
  const [isDiscountDialogOpen, setIsDiscountDialogOpen] = React.useState(false);
  const [isAlertOpen, setIsAlertOpen] = React.useState(false);
  const [discountToDelete, setDiscountToDelete] = React.useState<Discount | null>(null);

  const { toast } = useToast();

  const paymentForm = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
        amount: 0,
        method: 'Card',
        date: new Date().toISOString().split('T')[0],
    },
  });

  const discountForm = useForm<DiscountFormValues>({
    resolver: zodResolver(discountSchema),
    defaultValues: { reason: "", amount: 0 },
  });

  React.useEffect(() => {
    const fetchPatients = async () => {
      setIsLoading(true);
      try {
        const patientsCollection = collection(db, 'patients');
        const q = query(patientsCollection, orderBy('name'));
        const querySnapshot = await getDocs(q);
        const patientsList = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        })) as Patient[];
        setAllPatients(patientsList);
        setFilteredPatients(patientsList);
      } catch (error) {
        console.error("Error fetching patients: ", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPatients();
  }, []);

  React.useEffect(() => {
    if (searchQuery === '') {
      setFilteredPatients(allPatients);
    } else {
      const lowercasedQuery = searchQuery.toLowerCase();
      setFilteredPatients(
        allPatients.filter(patient =>
          patient.name.toLowerCase().includes(lowercasedQuery) ||
          (patient.registrationNumber && patient.registrationNumber.includes(searchQuery))
        )
      );
    }
  }, [searchQuery, allPatients]);

  const handleSelectPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    paymentForm.reset({
        amount: 0,
        method: 'Card',
        date: new Date().toISOString().split('T')[0],
    });
    discountForm.reset({ reason: "", amount: 0 });
  };

  const onSubmitPayment = async (data: PaymentFormValues) => {
    if (!selectedPatient) return;

    try {
        const result = await addPaymentToPatient(selectedPatient.id, {
            amount: data.amount,
            method: data.method,
            date: new Date(data.date).toISOString(),
        });

        if (result.success && result.data) {
            setSelectedPatient(prev => ({...prev, ...(result.data as Partial<Patient>)}));
            toast({ title: "Payment added successfully!" });
            setIsPaymentDialogOpen(false);
            paymentForm.reset();
        } else {
            toast({ variant: 'destructive', title: 'Failed to add payment', description: result.error });
        }
    } catch (error) {
        toast({ variant: 'destructive', title: 'An unexpected error occurred', description: (error as Error).message });
    }
  };

  const onSubmitDiscount = async (data: DiscountFormValues) => {
    if (!selectedPatient) return;

    try {
        const result = await addDiscountToPatient(selectedPatient.id, data);
        if (result.success && result.data) {
            setSelectedPatient(prev => ({...prev, ...(result.data as Partial<Patient>)}));
            toast({ title: "Discount added successfully!" });
            setIsDiscountDialogOpen(false);
            discountForm.reset();
        } else {
            toast({ variant: 'destructive', title: 'Failed to add discount', description: result.error });
        }
    } catch (error) {
        toast({ variant: 'destructive', title: 'An unexpected error occurred', description: (error as Error).message });
    }
  };
  
  const handleRemoveDiscountClick = (discount: Discount) => {
    setDiscountToDelete(discount);
    setIsAlertOpen(true);
  };

  const confirmRemoveDiscount = async () => {
    if (!discountToDelete || !selectedPatient) return;

    try {
        const result = await removeDiscountFromPatient(selectedPatient.id, discountToDelete);
        if (result.success && result.data) {
            setSelectedPatient(prev => ({...prev, ...(result.data as Partial<Patient>)}));
            toast({ title: "Discount removed" });
        } else {
            toast({ variant: 'destructive', title: 'Failed to remove discount', description: result.error });
        }
    } catch (error) {
        toast({ variant: 'destructive', title: 'An unexpected error occurred', description: (error as Error).message });
    } finally {
        setIsAlertOpen(false);
        setDiscountToDelete(null);
    }
  };

  const totalAmount = React.useMemo(() => {
    if (!selectedPatient || !selectedPatient.assignedTreatments) return 0;
    return selectedPatient.assignedTreatments.reduce((total, treatment) => total + treatment.amount, 0);
  }, [selectedPatient]);

  const amountPaid = React.useMemo(() => {
    if (!selectedPatient || !selectedPatient.payments) return 0;
    return selectedPatient.payments.reduce((total, payment) => total + payment.amount, 0);
  }, [selectedPatient]);

  const totalDiscount = React.useMemo(() => {
    if (!selectedPatient || !selectedPatient.discounts) return 0;
    return selectedPatient.discounts.reduce((total, discount) => total + discount.amount, 0);
  }, [selectedPatient]);

  const balanceDue = totalAmount - amountPaid - totalDiscount;

  return (
    <>
    <div className="grid md:grid-cols-3 gap-6">
      <div className="md:col-span-1">
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or registration #"
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          {isLoading ? (
             <div className="text-center p-4">
                <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                <p className="text-sm text-muted-foreground mt-2">Loading patients...</p>
             </div>
          ) : (
            <ScrollArea className="h-[600px] rounded-md border">
              <div className="p-2">
                {filteredPatients.length > 0 ? (
                  filteredPatients.map(patient => (
                    <button
                      key={patient.id}
                      onClick={() => handleSelectPatient(patient)}
                      className={`w-full text-left p-2 rounded-md hover:bg-muted text-sm ${selectedPatient?.id === patient.id ? 'bg-muted font-semibold' : ''}`}
                    >
                      {patient.name}
                      {patient.registrationNumber && <span className="text-xs text-muted-foreground ml-2">#{patient.registrationNumber}</span>}
                    </button>
                  ))
                ) : (
                  <p className="text-center text-sm text-muted-foreground p-4">No patients found.</p>
                )}
              </div>
            </ScrollArea>
          )}
        </div>
      </div>
      <div className="md:col-span-2">
        {selectedPatient ? (
          <div className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                      <CardTitle>Invoice for {selectedPatient.name}</CardTitle>
                      <CardDescription>
                          Registration #: {selectedPatient.registrationNumber || 'N/A'}
                      </CardDescription>
                  </div>
                  <div className='flex gap-2'>
                    <Dialog open={isDiscountDialogOpen} onOpenChange={setIsDiscountDialogOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline"><Gift className="mr-2 h-4 w-4" /> Add Discount</Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Add Discount for {selectedPatient.name}</DialogTitle>
                            </DialogHeader>
                            <Form {...discountForm}>
                                <form onSubmit={discountForm.handleSubmit(onSubmitDiscount)} className="space-y-4 py-4">
                                    <FormField control={discountForm.control} name="reason" render={({ field }) => (
                                        <FormItem>
                                        <FormLabel>Reason</FormLabel>
                                        <FormControl><Textarea placeholder="e.g., Seasonal Promotion" {...field} /></FormControl>
                                        <FormMessage />
                                        </FormItem>
                                    )} />
                                     <FormField control={discountForm.control} name="amount" render={({ field }) => (
                                        <FormItem>
                                        <FormLabel>Amount</FormLabel>
                                        <FormControl><Input type="number" placeholder="50.00" {...field} /></FormControl>
                                        <FormMessage />
                                        </FormItem>
                                    )} />
                                    <DialogFooter>
                                        <Button type="submit" disabled={discountForm.formState.isSubmitting}>
                                            {discountForm.formState.isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                            Save Discount
                                        </Button>
                                    </DialogFooter>
                                </form>
                            </Form>
                        </DialogContent>
                    </Dialog>
                    <Button variant="outline" onClick={() => window.print()}>
                        <Printer className="mr-2 h-4 w-4" />
                        Print Invoice
                    </Button>
                  </div>
              </CardHeader>
              <CardContent>
                  <Table>
                      <TableHeader>
                          <TableRow>
                              <TableHead>Treatment</TableHead>
                              <TableHead>Date Added</TableHead>
                              <TableHead className="text-right">Amount</TableHead>
                          </TableRow>
                      </TableHeader>
                      <TableBody>
                          {selectedPatient.assignedTreatments && selectedPatient.assignedTreatments.length > 0 ? (
                              selectedPatient.assignedTreatments.map(treatment => (
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
                  <Separator className="my-4" />
                   <div className="space-y-2 text-right font-medium">
                        <div className="flex justify-end items-center text-md">
                            <span className="text-muted-foreground mr-4">Total Amount:</span>
                            <span>${totalAmount.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-end items-center text-md">
                            <span className="text-muted-foreground mr-4">Total Discount:</span>
                            <span className="text-destructive">-${totalDiscount.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-end items-center text-md">
                            <span className="text-muted-foreground mr-4">Amount Paid:</span>
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
                    <Separator className="my-4" />
                    <div>
                        <h4 className="text-base font-semibold mb-2">Applied Discounts</h4>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Reason</TableHead>
                                    <TableHead>Date Added</TableHead>
                                    <TableHead className="text-right">Amount</TableHead>
                                    <TableHead className="w-[50px]"><span className='sr-only'>Actions</span></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {selectedPatient.discounts && selectedPatient.discounts.length > 0 ? (
                                    selectedPatient.discounts.map(discount => (
                                        <TableRow key={discount.dateAdded}>
                                            <TableCell>{discount.reason}</TableCell>
                                            <TableCell>{new Date(discount.dateAdded).toLocaleDateString()}</TableCell>
                                            <TableCell className="text-right">-${discount.amount.toFixed(2)}</TableCell>
                                            <TableCell>
                                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleRemoveDiscountClick(discount)}>
                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center h-24">No discounts applied yet.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
              </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Payment History</CardTitle>
                        <CardDescription>Record and view payments for this patient.</CardDescription>
                    </div>
                    <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
                        <DialogTrigger asChild>
                            <Button><PlusCircle className="mr-2 h-4 w-4" /> Add Payment</Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Add New Payment for {selectedPatient.name}</DialogTitle>
                                <DialogDescription>Enter the details for the new payment.</DialogDescription>
                            </DialogHeader>
                            <Form {...paymentForm}>
                                <form onSubmit={paymentForm.handleSubmit(onSubmitPayment)} className="space-y-4 py-4">
                                    <FormField control={paymentForm.control} name="amount" render={({ field }) => (
                                        <FormItem>
                                        <FormLabel>Amount</FormLabel>
                                        <FormControl><Input type="number" placeholder="100.00" {...field} /></FormControl>
                                        <FormMessage />
                                        </FormItem>
                                    )} />
                                    <FormField control={paymentForm.control} name="date" render={({ field }) => (
                                        <FormItem>
                                        <FormLabel>Payment Date</FormLabel>
                                        <FormControl><Input type="date" {...field} /></FormControl>
                                        <FormMessage />
                                        </FormItem>
                                    )} />
                                    <FormField control={paymentForm.control} name="method" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Payment Method</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select a payment method" />
                                                </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="Card">Card</SelectItem>
                                                    <SelectItem value="Cash">Cash</SelectItem>
                                                    <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                                                    <SelectItem value="Other">Other</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                    <DialogFooter>
                                        <Button type="submit" disabled={paymentForm.formState.isSubmitting}>
                                            {paymentForm.formState.isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                            Save Payment
                                        </Button>
                                    </DialogFooter>
                                </form>
                            </Form>
                        </DialogContent>
                    </Dialog>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Method</TableHead>
                                <TableHead className="text-right">Amount</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {selectedPatient.payments && selectedPatient.payments.length > 0 ? (
                                selectedPatient.payments.map(payment => (
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
                </CardContent>
            </Card>
          </div>
        ) : (
          <div className="flex h-full items-center justify-center rounded-lg border-2 border-dashed bg-muted/50 p-8 text-center">
            <p className="text-muted-foreground">Select a patient to view their bill.</p>
          </div>
        )}
      </div>
    </div>
    <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                    This will permanently remove the discount of ${discountToDelete?.amount.toFixed(2)} for "{discountToDelete?.reason}".
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setDiscountToDelete(null)}>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={confirmRemoveDiscount} >
                    Continue
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
