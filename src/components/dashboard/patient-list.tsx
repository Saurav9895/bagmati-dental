'use client';

import * as React from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { MoreHorizontal, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, query, orderBy, serverTimestamp } from 'firebase/firestore';
import type { Patient } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

const patientSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  email: z.string().email("Invalid email address."),
  phone: z.string().min(10, "Phone number seems too short."),
  dob: z.string().refine((val) => !isNaN(Date.parse(val)), "Invalid date of birth."),
  address: z.string().min(5, "Address must be at least 5 characters."),
  medicalHistory: z.string().optional(),
});

type PatientFormValues = z.infer<typeof patientSchema>;

export function PatientList() {
  const [patients, setPatients] = React.useState<Patient[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [open, setOpen] = React.useState(false);
  const { toast } = useToast();

  const form = useForm<PatientFormValues>({
    resolver: zodResolver(patientSchema),
    defaultValues: { name: "", email: "", phone: "", dob: "", address: "", medicalHistory: "" },
  });

  React.useEffect(() => {
    const fetchPatients = async () => {
      try {
        const patientsCollection = collection(db, 'patients');
        const q = query(patientsCollection, orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        const patientsList = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.name,
            email: data.email,
            phone: data.phone,
            dob: data.dob,
            address: data.address,
            medicalHistory: data.medicalHistory,
            status: data.status,
            lastVisit: data.lastVisit,
          };
        }) as Patient[];
        setPatients(patientsList);
      } catch (error) {
        console.error("Error fetching patients: ", error);
        toast({
          variant: "destructive",
          title: "Failed to load patients",
          description: "There was an error fetching the patient list. Please try again later.",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchPatients();
  }, [toast]);

  const onSubmit = async (data: PatientFormValues) => {
    try {
      const newPatientData = {
        name: data.name,
        email: data.email,
        phone: data.phone,
        dob: data.dob,
        address: data.address,
        medicalHistory: data.medicalHistory || "",
        status: 'Active' as const,
        lastVisit: new Date().toISOString().split('T')[0],
        createdAt: serverTimestamp(),
      };
      
      const docRef = await addDoc(collection(db, "patients"), newPatientData);
      
      const newPatientForState: Patient = {
        id: docRef.id,
        ...data,
        status: 'Active',
        lastVisit: newPatientData.lastVisit,
      };

      setPatients([newPatientForState, ...patients]);
      form.reset();
      setOpen(false);
      toast({
        title: "Patient Added",
        description: `${data.name} has been successfully added to the patient list.`,
      });
    } catch (error) {
      console.error("Error adding document: ", error);
      toast({
        variant: "destructive",
        title: "Failed to add patient",
        description: (error as Error).message || "An unexpected error occurred. Please try again.",
      });
    }
  };
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Patients</CardTitle>
          <CardDescription>Manage your clinic's patient records.</CardDescription>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <PlusCircle className="mr-2 h-4 w-4" />
              New Patient
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Patient</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <FormField control={form.control} name="name" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl><Input placeholder="John Doe" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="email" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl><Input placeholder="john.doe@example.com" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="phone" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl><Input placeholder="123-456-7890" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="dob" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date of Birth</FormLabel>
                      <FormControl><Input type="date" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="address" render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Address</FormLabel>
                      <FormControl><Input placeholder="123 Main St, Anytown, USA" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="medicalHistory" render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Medical History</FormLabel>
                      <FormControl><Textarea placeholder="Any allergies, existing conditions, etc." {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
                <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? 'Saving...' : 'Save Patient'}
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
              <TableHead>Status</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Last Visit</TableHead>
              <TableHead><span className="sr-only">Actions</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-8 rounded-full" /></TableCell>
                </TableRow>
              ))
            ) : patients.length > 0 ? (
              patients.map((patient) => (
                <TableRow key={patient.id}>
                  <TableCell className="font-medium">{patient.name}</TableCell>
                  <TableCell>
                    <Badge variant={patient.status === 'Active' ? 'default' : 'secondary'}
                     className={patient.status === 'Active' ? 'bg-accent text-accent-foreground' : ''}>
                      {patient.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{patient.email}</TableCell>
                  <TableCell>{patient.lastVisit}</TableCell>
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
                        <DropdownMenuItem>Edit</DropdownMenuItem>
                        <DropdownMenuItem>View History</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center h-24">
                    No patients found. Add one to get started.
                  </TableCell>
                </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
