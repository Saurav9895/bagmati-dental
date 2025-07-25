

'use client';

import * as React from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { MoreHorizontal, PlusCircle, Trash2, Edit, Search, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, query, orderBy, serverTimestamp, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import type { Patient } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const patientSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  email: z.string().email("Invalid email address.").or(z.literal('')).optional(),
  phone: z.string().min(10, "Phone number seems too short."),
  dob: z.string().optional(),
  age: z.coerce.number().int().positive("Age must be a positive number."),
  gender: z.enum(['Male', 'Female', 'Other'], { required_error: 'Please select a gender.'}),
  address: z.string().min(5, "Address must be at least 5 characters."),
});

type PatientFormValues = z.infer<typeof patientSchema>;

export function PatientList() {
  const [patients, setPatients] = React.useState<Patient[]>([]);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedPatientIds, setSelectedPatientIds] = React.useState<string[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [editingPatient, setEditingPatient] = React.useState<Patient | null>(null);
  
  const [isSingleDeleteAlertOpen, setIsSingleDeleteAlertOpen] = React.useState(false);
  const [isBulkDeleteAlertOpen, setIsBulkDeleteAlertOpen] = React.useState(false);
  const [deletingPatientId, setDeletingPatientId] = React.useState<string | null>(null);

  const { toast } = useToast();

  const form = useForm<PatientFormValues>({
    resolver: zodResolver(patientSchema),
    defaultValues: { name: "", email: "", phone: "", dob: "", age: '' as any, address: "" },
  });
  
  const filteredPatients = React.useMemo(() => {
    if (!searchQuery) return patients;
    const lowercasedQuery = searchQuery.toLowerCase();
    return patients.filter(p =>
      p.name.toLowerCase().includes(lowercasedQuery) ||
      (p.registrationNumber && p.registrationNumber.includes(searchQuery)) ||
      (p.email && p.email.toLowerCase().includes(lowercasedQuery))
    );
  }, [searchQuery, patients]);

  React.useEffect(() => {
    const fetchPatients = async () => {
      try {
        const patientsCollection = collection(db, 'patients');
        const q = query(patientsCollection, orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        const patientsList = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        })) as Patient[];
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
  
  React.useEffect(() => {
    if (editingPatient) {
      form.reset({
        ...editingPatient,
        dob: editingPatient.dob || '',
        email: editingPatient.email || '',
        age: editingPatient.age || ('' as any),
        gender: editingPatient.gender,
      });
    } else {
      form.reset({ name: "", email: "", phone: "", dob: "", age: '' as any, address: "" });
    }
  }, [editingPatient, form]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedPatientIds(filteredPatients.map(p => p.id));
    } else {
      setSelectedPatientIds([]);
    }
  };

  const handleSelectPatient = (patientId: string, checked: boolean) => {
    setSelectedPatientIds(prev =>
      checked ? [...prev, patientId] : prev.filter(id => id !== patientId)
    );
  };
  
  const handleDialogOpenChange = (open: boolean) => {
    setIsFormOpen(open);
    if (!open) {
      setEditingPatient(null);
    }
  }

  const handleEditClick = (patient: Patient) => {
    setEditingPatient(patient);
    setIsFormOpen(true);
  };
  
  const handleDeleteClick = (patientId: string) => {
    setDeletingPatientId(patientId);
    setIsSingleDeleteAlertOpen(true);
  };
  
  const handleBulkDeleteClick = () => {
    setIsBulkDeleteAlertOpen(true);
  };

  const confirmSingleDelete = async () => {
    if (!deletingPatientId) return;
    try {
        await deleteDoc(doc(db, "patients", deletingPatientId));
        setPatients(patients.filter(p => p.id !== deletingPatientId));
        toast({
            title: "Patient Deleted",
            description: "The patient record has been successfully deleted.",
        });
    } catch (error) {
        toast({
            variant: "destructive",
            title: "Failed to delete patient",
            description: (error as Error).message || "An unexpected error occurred.",
        });
    } finally {
        setIsSingleDeleteAlertOpen(false);
        setDeletingPatientId(null);
    }
  };

  const confirmBulkDelete = async () => {
    try {
        const deletePromises = selectedPatientIds.map(id => deleteDoc(doc(db, "patients", id)));
        await Promise.all(deletePromises);
        
        setPatients(patients.filter(p => !selectedPatientIds.includes(p.id)));
        toast({
            title: "Patients Deleted",
            description: `${selectedPatientIds.length} patient records have been successfully deleted.`,
        });
    } catch (error) {
         toast({
            variant: "destructive",
            title: "Failed to delete patients",
            description: (error as Error).message || "An unexpected error occurred.",
        });
    } finally {
        setSelectedPatientIds([]);
        setIsBulkDeleteAlertOpen(false);
    }
  }


  const onSubmit = async (data: PatientFormValues) => {
    const patientPayload = {
      ...data,
      email: data.email || '',
      dob: data.dob || '',
    };
    try {
      if (editingPatient) {
        const patientRef = doc(db, "patients", editingPatient.id);
        const updateData: Partial<Patient> = patientPayload;
        await updateDoc(patientRef, updateData);
        
        setPatients(patients.map(p => p.id === editingPatient.id ? { ...p, ...updateData } as Patient : p));
        
        toast({
          title: "Patient Updated",
          description: `${patientPayload.name}'s record has been successfully updated.`,
        });
      } else {
        const newPatientData = {
          ...patientPayload,
          status: 'Active' as const,
          lastVisit: new Date().toISOString().split('T')[0],
          createdAt: serverTimestamp(),
        };
        const docRef = await addDoc(collection(db, "patients"), newPatientData);
        const newPatientForState: Patient = {
          id: docRef.id,
          ...patientPayload,
          status: 'Active',
          lastVisit: newPatientData.lastVisit,
        };
        setPatients([newPatientForState, ...patients]);
        toast({
          title: "Patient Added",
          description: `${patientPayload.name} has been successfully added to the patient list.`,
        });
      }
      form.reset();
      handleDialogOpenChange(false);
    } catch (error) {
      console.error("Error saving document: ", error);
      toast({
        variant: "destructive",
        title: `Failed to ${editingPatient ? 'update' : 'add'} patient`,
        description: (error as Error).message || "An unexpected error occurred. Please try again.",
      });
    }
  };
  
  return (
    <>
    <Card>
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between gap-4">
        <div>
          <CardTitle>Patients</CardTitle>
          <CardDescription>Manage your clinic's patient records.</CardDescription>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-auto">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    type="search"
                    placeholder="Search by name, email, or reg. #"
                    className="pl-8 sm:w-[300px] w-full"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>
            <div className="flex gap-2">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" disabled={selectedPatientIds.length === 0} className="w-full sm:w-auto">
                            Actions
                            <ChevronDown className="ml-2 h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem
                            className="text-destructive"
                            onSelect={handleBulkDeleteClick}
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete ({selectedPatientIds.length})
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
                <Dialog open={isFormOpen} onOpenChange={handleDialogOpenChange}>
                    <DialogTrigger asChild>
                        <Button size="sm" onClick={() => setEditingPatient(null)} className="w-full sm:w-auto">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        New Patient
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-2xl">
                        <DialogHeader>
                        <DialogTitle>{editingPatient ? 'Edit Patient' : 'Add New Patient'}</DialogTitle>
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
                                <FormLabel>Email (Optional)</FormLabel>
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
                                <FormLabel>Date of Birth (Optional)</FormLabel>
                                <FormControl><Input type="date" {...field} /></FormControl>
                                <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="age" render={({ field }) => (
                                <FormItem>
                                <FormLabel>Age</FormLabel>
                                <FormControl><Input type="number" placeholder="30" {...field} /></FormControl>
                                <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="gender" render={({ field }) => (
                                <FormItem>
                                <FormLabel>Gender</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a gender" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="Male">Male</SelectItem>
                                        <SelectItem value="Female">Female</SelectItem>
                                        <SelectItem value="Other">Other</SelectItem>
                                    </SelectContent>
                                </Select>
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
                            </div>
                            <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                            {form.formState.isSubmitting ? 'Saving...' : 'Save Patient'}
                            </Button>
                        </form>
                        </Form>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40px]">
                <Checkbox
                    checked={filteredPatients.length > 0 && selectedPatientIds.length === filteredPatients.length}
                    onCheckedChange={(value) => handleSelectAll(!!value)}
                    aria-label="Select all"
                    // This is an example of an indeterminate checkbox
                    // It's checked if some but not all items are selected
                    ref={element => {
                        if (element) {
                            element.indeterminate = selectedPatientIds.length > 0 && selectedPatientIds.length < filteredPatients.length
                        }
                    }}
                />
              </TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Registration #</TableHead>
              <TableHead><span className="sr-only">Actions</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-5 w-5" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-8 rounded-full" /></TableCell>
                </TableRow>
              ))
            ) : filteredPatients.length > 0 ? (
              filteredPatients.map((patient) => (
                <TableRow key={patient.id} data-state={selectedPatientIds.includes(patient.id) && "selected"}>
                  <TableCell>
                     <Checkbox
                        checked={selectedPatientIds.includes(patient.id)}
                        onCheckedChange={(value) => handleSelectPatient(patient.id, !!value)}
                        aria-label={`Select patient ${patient.name}`}
                     />
                  </TableCell>
                  <TableCell className="font-medium">
                    <Link href={`/dashboard/patients/${patient.id}`} className="hover:underline">
                      {patient.name}
                    </Link>
                  </TableCell>
                  <TableCell>{patient.phone}</TableCell>
                  <TableCell>{patient.email || 'N/A'}</TableCell>
                  <TableCell>{patient.registrationNumber || 'N/A'}</TableCell>
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
                        <DropdownMenuItem onClick={() => handleEditClick(patient)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleDeleteClick(patient.id)} className="text-destructive focus:text-destructive focus:bg-destructive/10">
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
                  <TableCell colSpan={6} className="text-center h-24">
                    {searchQuery ? 'No patients match your search.' : 'No patients found. Add one to get started.'}
                  </TableCell>
                </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
    <AlertDialog open={isSingleDeleteAlertOpen} onOpenChange={setIsSingleDeleteAlertOpen}>
      <AlertDialogContent>
          <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete this patient's record.
              </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setDeletingPatientId(null)}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmSingleDelete}>
                  Continue
              </AlertDialogAction>
          </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    <AlertDialog open={isBulkDeleteAlertOpen} onOpenChange={setIsBulkDeleteAlertOpen}>
      <AlertDialogContent>
          <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                  This will permanently delete the selected {selectedPatientIds.length} patient records. This action cannot be undone.
              </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmBulkDelete}>
                  Continue
              </AlertDialogAction>
          </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
