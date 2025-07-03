'use client';

import * as React from 'react';
import { format, addDays, subDays, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';
import { ChevronLeft, ChevronRight, PlusCircle, Check, ChevronsUpDown, Loader2, Trash2 } from 'lucide-react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { addAppointment, deleteAppointment } from '@/app/actions/appointments';
import type { Appointment, Patient } from '@/lib/types';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

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
  const [currentDate, setCurrentDate] = React.useState(new Date());
  const [appointments, setAppointments] = React.useState(initialAppointments);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [isPatientPopoverOpen, setIsPatientPopoverOpen] = React.useState(false);
  const [isAlertOpen, setIsAlertOpen] = React.useState(false);
  const [appointmentToDelete, setAppointmentToDelete] = React.useState<Appointment | null>(null);

  const { toast } = useToast();

  const form = useForm<AppointmentFormValues>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
        procedure: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        time: '',
        doctor: '',
        description: '',
    },
  });

  const weekDays = eachDayOfInterval({
    start: startOfWeek(currentDate, { weekStartsOn: 1 }),
    end: endOfWeek(currentDate, { weekStartsOn: 1 }),
  });

  const handlePrevWeek = () => setCurrentDate(subDays(currentDate, 7));
  const handleNextWeek = () => setCurrentDate(addDays(currentDate, 7));

  const onSubmit = async (data: AppointmentFormValues) => {
    const selectedPatient = patients.find(p => p.id === data.patientId);
    if (!selectedPatient) {
        toast({ variant: 'destructive', title: 'Invalid patient selected.' });
        return;
    }

    const appointmentData = {
        ...data,
        patientName: selectedPatient.name,
    };

    const result = await addAppointment(appointmentData);

    if (result.success && result.data) {
        setAppointments(prev => [...prev, result.data!]);
        toast({ title: 'Appointment created successfully!' });
        setIsDialogOpen(false);
        form.reset({
            procedure: '',
            date: format(new Date(), 'yyyy-MM-dd'),
            time: '',
            doctor: '',
            patientId: undefined,
            description: '',
        });
    } else {
        toast({ variant: 'destructive', title: 'Failed to create appointment', description: result.error });
    }
  };

  const handleDeleteClick = (appointment: Appointment) => {
    setAppointmentToDelete(appointment);
    setIsAlertOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!appointmentToDelete) return;
    
    const result = await deleteAppointment(appointmentToDelete.id);

    if (result.success) {
        setAppointments(prev => prev.filter(appt => appt.id !== appointmentToDelete!.id));
        toast({ title: 'Appointment deleted successfully!' });
    } else {
        toast({ variant: 'destructive', title: 'Failed to delete appointment', description: result.error });
    }
    
    setIsAlertOpen(false);
    setAppointmentToDelete(null);
  };


  return (
    <>
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between pb-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={handlePrevWeek}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-xl font-headline font-semibold">
            {format(startOfWeek(currentDate, { weekStartsOn: 1 }), 'MMMM d')} - {format(endOfWeek(currentDate, { weekStartsOn: 1 }), 'MMMM d, yyyy')}
          </h2>
          <Button variant="outline" size="icon" onClick={handleNextWeek}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              New Appointment
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-5xl p-5">
            <DialogHeader>
              <DialogTitle>Create New Appointment</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="md:col-span-2">
                        <FormField
                        control={form.control}
                        name="patientId"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Patient</FormLabel>
                            <Popover open={isPatientPopoverOpen} onOpenChange={setIsPatientPopoverOpen}>
                                <PopoverTrigger asChild>
                                <FormControl>
                                    <Button
                                    variant="outline"
                                    role="combobox"
                                    className={cn(
                                        "w-full justify-between",
                                        !field.value && "text-muted-foreground"
                                    )}
                                    >
                                    {field.value
                                        ? (() => {
                                            const patient = patients.find(p => p.id === field.value);
                                            return patient ? `${patient.name} ${patient.registrationNumber ? `(#${patient.registrationNumber})` : ''}` : "Select patient"
                                        })()
                                        : "Select patient"}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                <Command>
                                    <CommandInput placeholder="Search by name or registration #" />
                                    <CommandEmpty>No patient found.</CommandEmpty>
                                    <CommandList>
                                        <CommandGroup>
                                        {patients.map((patient) => (
                                            <CommandItem
                                            value={`${patient.name} ${patient.registrationNumber || ''}`}
                                            key={patient.id}
                                            onSelect={() => {
                                                form.setValue("patientId", patient.id)
                                                setIsPatientPopoverOpen(false);
                                            }}
                                            >
                                            <Check
                                                className={cn(
                                                "mr-2 h-4 w-4",
                                                patient.id === field.value
                                                    ? "opacity-100"
                                                    : "opacity-0"
                                                )}
                                            />
                                            <div className="flex justify-between w-full items-center">
                                                <span>{patient.name}</span>
                                                {patient.registrationNumber && (
                                                    <span className="text-xs text-muted-foreground">
                                                        #{patient.registrationNumber}
                                                    </span>
                                                )}
                                            </div>
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
                    </div>
                    <FormField control={form.control} name="procedure" render={({ field }) => (
                        <FormItem>
                        <FormLabel>Procedure</FormLabel>
                        <FormControl><Input placeholder="e.g., Routine Check-up" {...field} /></FormControl>
                        <FormMessage />
                        </FormItem>
                    )} />
                    <FormField control={form.control} name="doctor" render={({ field }) => (
                        <FormItem>
                        <FormLabel>Doctor</FormLabel>
                        <FormControl><Input placeholder="Doctor's name" {...field} /></FormControl>
                        <FormMessage />
                        </FormItem>
                    )} />
                    <FormField control={form.control} name="date" render={({ field }) => (
                        <FormItem>
                        <FormLabel>Date</FormLabel>
                        <FormControl><Input type="date" {...field} /></FormControl>
                        <FormMessage />
                        </FormItem>
                    )} />
                    <FormField control={form.control} name="time" render={({ field }) => (
                        <FormItem>
                        <FormLabel>Time</FormLabel>
                        <FormControl><Input type="time" {...field} /></FormControl>
                        <FormMessage />
                        </FormItem>
                    )} />
                </div>
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (Prescription, Notes, etc.)</FormLabel>
                      <FormControl>
                        <Textarea placeholder="e.g., Prescribed Amoxicillin 500mg..." {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Appointment
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
      <div className="grid flex-1 grid-cols-7 gap-2">
        {weekDays.map((day) => (
          <div key={day.toString()} className="flex flex-col gap-2 rounded-lg bg-card p-2">
            <div className="text-center font-semibold">{format(day, 'EEE')}</div>
            <div className="text-center text-sm text-muted-foreground">{format(day, 'd')}</div>
            <div className="flex-1 space-y-2 overflow-y-auto">
              {appointments
                .filter((appt) => format(new Date(appt.date), 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd'))
                .sort((a, b) => a.time.localeCompare(b.time))
                .map((appt) => (
                  <Card key={appt.id} className="bg-primary/10 border-primary/50 text-sm relative group">
                    <CardContent className="p-2">
                      <p className="font-semibold">{appt.patientName}</p>
                      <p className="text-xs">{appt.procedure}</p>
                      <p className="text-xs text-muted-foreground">{formatTime12h(appt.time)} - {appt.doctor}</p>
                    </CardContent>
                     <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100"
                        onClick={() => handleDeleteClick(appt)}
                    >
                        <Trash2 className="h-4 w-4 text-destructive" />
                        <span className="sr-only">Delete appointment</span>
                    </Button>
                  </Card>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
    <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                    This will permanently delete the appointment for {appointmentToDelete?.patientName} on {appointmentToDelete && format(new Date(appointmentToDelete.date), 'PPP')} at {appointmentToDelete && formatTime12h(appointmentToDelete.time)}.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setAppointmentToDelete(null)}>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleConfirmDelete}>
                    Continue
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
