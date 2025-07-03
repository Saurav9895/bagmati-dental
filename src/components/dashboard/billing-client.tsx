'use client';

import * as React from 'react';
import { db } from '@/lib/firebase';
import type { Patient, Payment } from '@/lib/types';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Printer, Loader2, PlusCircle } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { addPaymentToPatient } from '@/app/actions/patients';

const paymentSchema = z.object({
    amount: z.coerce.number().positive("Amount must be a positive number."),
    method: z.enum(['Cash', 'Card', 'Bank Transfer', 'Other']),
    date: z.string().refine((val) => !isNaN(Date.parse(val)), "Invalid date."),
});

type PaymentFormValues = z.infer<typeof paymentSchema>;

export function BillingClient() {
  const [allPatients, setAllPatients] = React.useState<Patient[]>([]);
  const [filteredPatients, setFilteredPatients] = React.useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = React.useState<Patient | null>(null);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(true);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = React.useState(false);
  const { toast } = useToast();

  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
        amount: 0,
        method: 'Card',
        date: new Date().toISOString().split('T')[0],
    },
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
        setFilteredPatients(patientsList); // Initially show all
      } catch (error) {
        console.error("Error fetching patients: ", error);
        // Maybe add a toast here in a real app
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
      setFilteredPatients(
        allPatients.filter(patient =>
          patient.name.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    }
  }, [searchQuery, allPatients]);

  const handleSelectPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    form.reset({
        amount: 0,
        method: 'Card',
        date: new Date().toISOString().split('T')[0],
    });
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
            form.reset();
        } else {
            toast({ variant: 'destructive', title: 'Failed to add payment', description: result.error });
        }
    } catch (error) {
        toast({ variant: 'destructive', title: 'An unexpected error occurred', description: (error as Error).message });
    }
  };

  const totalAmount = React.useMemo(() => {
    if (!selectedPatient || !selectedPatient.assignedTreatments) {
      return 0;
    }
    return selectedPatient.assignedTreatments.reduce((total, treatment) => total + treatment.amount, 0);
  }, [selectedPatient]);

  const amountPaid = React.useMemo(() => {
    if (!selectedPatient || !selectedPatient.payments) {
        return 0;
    }
    return selectedPatient.payments.reduce((total, payment) => total + payment.amount, 0);
  }, [selectedPatient]);

  const balanceDue = totalAmount - amountPaid;

  return (
    <div className="grid md:grid-cols-3 gap-6">
      <div className="md:col-span-1">
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search for a patient..."
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
                  <Button variant="outline" onClick={() => window.print()}>
                      <Printer className="mr-2 h-4 w-4" />
                      Print Invoice
                  </Button>
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
                            <span className="text-muted-foreground mr-4">Amount Paid:</span>
                            <span className="text-green-600">${amountPaid.toFixed(2)}</span>
                        </div>
                         <Separator className="my-2" />
                        <div className="flex justify-end items-center text-lg font-bold">
                            <span className="text-muted-foreground mr-4">Balance Due:</span>
                            <span>${balanceDue.toFixed(2)}</span>
                        </div>
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
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmitPayment)} className="space-y-4 py-4">
                                    <FormField control={form.control} name="amount" render={({ field }) => (
                                        <FormItem>
                                        <FormLabel>Amount</FormLabel>
                                        <FormControl><Input type="number" placeholder="100.00" {...field} /></FormControl>
                                        <FormMessage />
                                        </FormItem>
                                    )} />
                                    <FormField control={form.control} name="date" render={({ field }) => (
                                        <FormItem>
                                        <FormLabel>Payment Date</FormLabel>
                                        <FormControl><Input type="date" {...field} /></FormControl>
                                        <FormMessage />
                                        </FormItem>
                                    )} />
                                    <FormField control={form.control} name="method" render={({ field }) => (
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
                                        <Button type="submit" disabled={form.formState.isSubmitting}>
                                            {form.formState.isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
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
  );
}
