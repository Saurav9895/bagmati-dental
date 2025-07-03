
'use client';

import * as React from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { MoreHorizontal, PlusCircle, Trash2, Edit, Search, Check, ChevronsUpDown, Loader2 } from 'lucide-react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { addAppointment, deleteAppointment, updateAppointment } from '@/app/actions/appointments';
import type { Appointment, Patient } from '@/lib/types';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';

interface AppointmentScheduleProps {
  appointments: Appointment[];
  patients: Patient[];
}

const appointmentSchema = z.object({
    patientId: z.string({ required_error: "Please select a patient." }),
    procedure: z.string().min(2, "Procedure must be at least 2 characters."),
    date: z.string().refine((val) => !isNaN(Date.parse(val)), "Invalid date."),
    time: z.string().min(1, "Time is required."),
    doctor: z.string().min(2, "Doctor's name must be at least 2 characters."),
    description: z.string().optional(),
});

type AppointmentFormValues = z.infer<typeof appointmentSchema>;

const formatTime12h = (time24h: string): string => {
    if (!time24h) return '';
    const [hours, minutes] = time24h.split(':');
    const h = parseInt(hours, 10);
    const m = parseInt(minutes, 10);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 || 12;
    return `${hour12}:${String(m).padStart(2, '0')} ${ampm}`;
};

export function AppointmentSchedule({ appointments: initialAppointments, patients }: AppointmentScheduleProps) {
  const [appointments, setAppointments] = React.useState<Appointment[]>(initialAppointments);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [editingAppointment, setEditingAppointment] = React.useState<Appointment | null>(null);
  const [isPatientPopoverOpen, setIsPatientPopoverOpen] = React.useState(false);
  const [isAlertOpen, setIsAlertOpen] = React.useState(false);
  const [appointmentToDelete, setAppointmentToDelete] = React.useState<Appointment | null>(null);
  const { toast } = useToast();

  const form = useForm<AppointmentFormValues>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: { procedure: '', date: format(new Date(), 'yyyy-MM-dd'), time: '', doctor: '', description: '' },
  });

  const sortedAppointments = React.useMemo(() => {
    return [...appointments].sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        if (dateB !== dateA) return dateB - dateA;
        return a.time.localeCompare(b.time);
    });
  }, [appointments]);

  const filteredAppointments = React.useMemo(() => {
    if (!searchQuery) return sortedAppointments;
    const lowercasedQuery = searchQuery.toLowerCase();
    return sortedAppointments.filter(appt => 
        appt.patientName.toLowerCase().includes(lowercasedQuery) ||
        appt.procedure.toLowerCase().includes(lowercasedQuery) ||
        appt.doctor.toLowerCase().includes(lowercasedQuery)
    );
  }, [searchQuery, sortedAppointments]);

  const handleDialogOpenChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      setEditingAppointment(null);
      form.reset({ procedure: '', date: format(new Date(), 'yyyy-MM-dd'), time: '', doctor: '', patientId: undefined, description: '' });
    }
  };

  const handleEditClick = (appointment: Appointment) => {
    setEditingAppointment(appointment);
    form.reset({
        patientId: appointment.patientId,
        procedure: appointment.procedure,
        date: format(new Date(appointment.date), 'yyyy-MM-dd'),
        time: appointment.time,
        doctor: appointment.doctor,
        description: appointment.description || '',
    });
    setIsDialogOpen(true);
  };

  const handleDeleteClick = (appointment: Appointment) => {
    setAppointmentToDelete(appointment);
    setIsAlertOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!appointmentToDelete) return;
    const result = await deleteAppointment(appointmentToDelete.id);
    if (result.success) {
        setAppointments(prev => prev.filter(appt => appt.id !== appointmentToDelete.id));
        toast({ title: 'Appointment deleted successfully!' });
    } else {
        toast({ variant: 'destructive', title: 'Failed to delete appointment', description: result.error });
    }
    setIsAlertOpen(false);
    setAppointmentToDelete(null);
  };

  const handleMarkAsComplete = async (appointmentId: string) => {
    const result = await updateAppointment(appointmentId, { status: 'Completed' });
    if (result.success) {
        setAppointments(prev => prev.map(appt => appt.id === appointmentId ? { ...appt, status: 'Completed' } : appt));
        toast({ title: 'Appointment marked as complete!' });
    } else {
        toast({ variant: 'destructive', title: 'Failed to update appointment', description: result.error });
    }
  };

  const onSubmit = async (data: AppointmentFormValues) => {
    const selectedPatient = patients.find(p => p.id === data.patientId);
    if (!selectedPatient) {
        toast({ variant: 'destructive', title: 'Invalid patient selected.' });
        return;
    }

    const appointmentPayload = { ...data, patientName: selectedPatient.name };
    let result;

    if (editingAppointment) {
        const { patientId, patientName, ...updateData } = appointmentPayload;
        result = await updateAppointment(editingAppointment.id, updateData);
    } else {
        result = await addAppointment(appointmentPayload);
    }

    if (result.success && result.data) {
        let newAppointments;
        if (editingAppointment) {
            newAppointments = appointments.map(a => a.id === editingAppointment.id ? { ...a, ...result.data! } : a);
            toast({ title: "Appointment updated successfully!" });
        } else {
            newAppointments = [...appointments, result.data!];
            toast({ title: 'Appointment created successfully!' });
        }
        setAppointments(newAppointments);
        handleDialogOpenChange(false);
    } else {
        toast({ variant: 'destructive', title: `Failed to ${editingAppointment ? 'update' : 'save'} appointment`, description: result.error });
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                  <CardTitle>Appointments</CardTitle>
                  <CardDescription>View, create, and manage all patient appointments.</CardDescription>
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
                  <div className="relative w-full sm:w-auto">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                          placeholder="Search appointments..."
                          className="pl-8 sm:w-[300px] w-full"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                      />
                  </div>
                   <Dialog open={isDialogOpen} onOpenChange={handleDialogOpenChange}>
                      <DialogTrigger asChild>
                          <Button className="w-full sm:w-auto">
                              <PlusCircle className="mr-2 h-4 w-4" />
                              New Appointment
                          </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-xl">
                        <DialogHeader>
                          <DialogTitle>{editingAppointment ? 'Edit' : 'Create New'} Appointment</DialogTitle>
                        </DialogHeader>
                        <Form {...form}>
                          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField
                              control={form.control}
                              name="patientId"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Patient</FormLabel>
                                  <Popover open={isPatientPopoverOpen} onOpenChange={setIsPatientPopoverOpen}>
                                    <PopoverTrigger asChild>
                                      <FormControl>
                                        <Button variant="outline" role="combobox" disabled={!!editingAppointment} className={cn("w-full justify-between", !field.value && "text-muted-foreground")}>
                                          {field.value ? patients.find(p => p.id === field.value)?.name : "Select patient"}
                                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                      </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                      <Command>
                                        <CommandInput placeholder="Search patient..." />
                                        <CommandEmpty>No patient found.</CommandEmpty>
                                        <CommandList>
                                          <CommandGroup>
                                            {patients.map((patient) => (
                                              <CommandItem value={patient.name} key={patient.id} onSelect={() => { form.setValue("patientId", patient.id); setIsPatientPopoverOpen(false); }}>
                                                <Check className={cn("mr-2 h-4 w-4", patient.id === field.value ? "opacity-100" : "opacity-0")} />
                                                {patient.name}
                                              </CommandItem>
                                            ))}
                                          </CommandGroup>
                                        </CommandList>
                                      </Command>
                                    </PopoverContent>
                                  </Popover>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField control={form.control} name="procedure" render={({ field }) => (<FormItem><FormLabel>Procedure</FormLabel><FormControl><Input placeholder="e.g., Routine Check-up" {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name="doctor" render={({ field }) => (<FormItem><FormLabel>Doctor</FormLabel><FormControl><Input placeholder="Doctor's name" {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <div className="grid grid-cols-2 gap-4">
                              <FormField control={form.control} name="date" render={({ field }) => (<FormItem><FormLabel>Date</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>)} />
                              <FormField control={form.control} name="time" render={({ field }) => (<FormItem><FormLabel>Time</FormLabel><FormControl><Input type="time" {...field} /></FormControl><FormMessage /></FormItem>)} />
                            </div>
                            <FormField control={form.control} name="description" render={({ field }) => (<FormItem><FormLabel>Description (Optional)</FormLabel><FormControl><Textarea placeholder="e.g., Prescribed Amoxicillin 500mg..." {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>)} />
                            <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                                {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {editingAppointment ? 'Save Changes' : 'Save Appointment'}
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
                <TableHead>Patient</TableHead>
                <TableHead>Procedure</TableHead>
                <TableHead>Date & Time</TableHead>
                <TableHead>Doctor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAppointments.length > 0 ? (
                filteredAppointments.map((appt) => (
                  <TableRow key={appt.id}>
                    <TableCell className="font-medium">
                      <Link href={`/dashboard/patients/${appt.patientId}`} className="hover:underline">{appt.patientName}</Link>
                    </TableCell>
                    <TableCell>{appt.procedure}</TableCell>
                    <TableCell>{format(new Date(appt.date), 'PPP')} at {formatTime12h(appt.time)}</TableCell>
                    <TableCell>{appt.doctor}</TableCell>
                    <TableCell>
                        {appt.status === 'Completed' ? (<Badge variant="secondary">Completed</Badge>) : (<Badge>Scheduled</Badge>)}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button aria-haspopup="true" size="icon" variant="ghost"><MoreHorizontal className="h-4 w-4" /><span className="sr-only">Toggle menu</span></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditClick(appt)}><Edit className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleMarkAsComplete(appt.id)} disabled={appt.status === 'Completed'}><Check className="mr-2 h-4 w-4" /> Mark as Complete</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleDeleteClick(appt)} className="text-destructive focus:text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">No appointments found.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the appointment for {appointmentToDelete?.patientName} on {appointmentToDelete && format(new Date(appointmentToDelete.date), 'PPP')}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setAppointmentToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete}>Continue</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
