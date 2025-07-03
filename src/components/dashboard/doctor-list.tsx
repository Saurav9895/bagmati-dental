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
import { Skeleton } from '@/components/ui/skeleton';
import type { Doctor } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { addDoctor, updateDoctor, deleteDoctor } from '@/app/actions/staff';

const doctorSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  specialization: z.string().min(2, "Specialization must be at least 2 characters."),
  phone: z.string().min(10, "Phone number seems too short."),
  email: z.string().email("Invalid email address.").or(z.literal('')).optional(),
});

type DoctorFormValues = z.infer<typeof doctorSchema>;

export function DoctorList({ initialDoctors }: { initialDoctors: Doctor[] }) {
  const [doctors, setDoctors] = React.useState<Doctor[]>(initialDoctors);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [editingDoctor, setEditingDoctor] = React.useState<Doctor | null>(null);
  const [isAlertOpen, setIsAlertOpen] = React.useState(false);
  const [deletingDoctorId, setDeletingDoctorId] = React.useState<string | null>(null);
  const { toast } = useToast();

  const form = useForm<DoctorFormValues>({
    resolver: zodResolver(doctorSchema),
    defaultValues: { name: "", specialization: "", phone: "", email: "" },
  });

  React.useEffect(() => {
    if (isFormOpen && editingDoctor) {
      form.reset(editingDoctor);
    } else if (!isFormOpen) {
      form.reset({ name: "", specialization: "", phone: "", email: "" });
    }
  }, [isFormOpen, editingDoctor, form]);

  const handleDialogOpenChange = (open: boolean) => {
    setIsFormOpen(open);
    if (!open) {
      setEditingDoctor(null);
    }
  }

  const handleEditClick = (doctor: Doctor) => {
    setEditingDoctor(doctor);
    setIsFormOpen(true);
  };

  const handleDeleteClick = (doctorId: string) => {
    setDeletingDoctorId(doctorId);
    setIsAlertOpen(true);
  };
  
  const confirmDelete = async () => {
    if (!deletingDoctorId) return;
    const result = await deleteDoctor(deletingDoctorId);

    if (result.success) {
        setDoctors(doctors.filter(d => d.id !== deletingDoctorId));
        toast({ title: "Doctor Deleted", description: "The doctor's record has been successfully deleted." });
    } else {
        toast({ variant: "destructive", title: "Failed to delete doctor", description: result.error });
    }
    
    setIsAlertOpen(false);
    setDeletingDoctorId(null);
  }

  const onSubmit = async (data: DoctorFormValues) => {
    const doctorPayload = { ...data, email: data.email || undefined };

    if (editingDoctor) {
      const result = await updateDoctor(editingDoctor.id, doctorPayload);
      if (result.success) {
        setDoctors(doctors.map(d => d.id === editingDoctor.id ? { ...d, ...doctorPayload } : d));
        toast({ title: "Doctor Updated", description: `${data.name}'s record has been successfully updated.` });
      } else {
        toast({ variant: "destructive", title: "Failed to update doctor", description: result.error });
        return;
      }
    } else {
      const result = await addDoctor(doctorPayload);
      if (result.success && result.data) {
        setDoctors([result.data, ...doctors]);
        toast({ title: "Doctor Added", description: `${data.name} has been successfully added.` });
      } else {
        toast({ variant: "destructive", title: "Failed to add doctor", description: result.error });
        return;
      }
    }
    
    form.reset();
    handleDialogOpenChange(false);
  };
  
  return (
    <>
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Doctors</CardTitle>
          <CardDescription>Manage the doctors in your clinic.</CardDescription>
        </div>
        <Dialog open={isFormOpen} onOpenChange={handleDialogOpenChange}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={() => setEditingDoctor(null)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              New Doctor
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingDoctor ? 'Edit Doctor' : 'Add New Doctor'}</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl><Input placeholder="e.g., Dr. John Smith" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                 <FormField control={form.control} name="specialization" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Specialization</FormLabel>
                    <FormControl><Input placeholder="e.g., Orthodontist" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="phone" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl><Input placeholder="123-456-7890" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="email" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email (Optional)</FormLabel>
                    <FormControl><Input type="email" placeholder="dr.john@example.com" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? 'Saving...' : 'Save Doctor'}
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
              <TableHead>Specialization</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Email</TableHead>
              <TableHead><span className="sr-only">Actions</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-8 rounded-full" /></TableCell>
                </TableRow>
              ))
            ) : doctors.length > 0 ? (
              doctors.map((doctor) => (
                <TableRow key={doctor.id}>
                  <TableCell className="font-medium">{doctor.name}</TableCell>
                  <TableCell>{doctor.specialization}</TableCell>
                  <TableCell>{doctor.phone}</TableCell>
                  <TableCell>{doctor.email || 'N/A'}</TableCell>
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
                        <DropdownMenuItem onClick={() => handleEditClick(doctor)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleDeleteClick(doctor.id)} className="text-destructive focus:text-destructive focus:bg-destructive/10">
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
                  <TableCell colSpan={5} className="text-center h-24">
                    No doctors found. Add one to get started.
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
                    This action cannot be undone. This will permanently delete the doctor's record.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setDeletingDoctorId(null)}>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={confirmDelete}>
                    Continue
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
