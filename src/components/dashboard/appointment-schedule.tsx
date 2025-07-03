
'use client';

import * as React from 'react';
import {
  format,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameDay,
  isToday,
  subWeeks,
  addWeeks,
} from 'date-fns';
import { ChevronLeft, ChevronRight, PlusCircle, Loader2, ChevronsUpDown, Check, Trash2 } from 'lucide-react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';

import type { Appointment, Patient } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { addAppointment, deleteAppointment } from '@/app/actions/appointments';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';


interface AppointmentScheduleProps {
  appointments: Appointment[];
  patients: Patient[];
}

const appointmentSchema = z.object({
  patientId: z.string({ required_error: 'Please select a patient.' }),
  procedure: z.string().min(2, 'Procedure must be at least 2 characters.'),
  date: z.date({ required_error: 'A date is required.' }),
  time: z.string().min(1, 'Time is required.'),
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
  const [currentDate, setCurrentDate] = React.useState(new Date());
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [isPatientPopoverOpen, setIsPatientPopoverOpen] = React.useState(false);
  const [isAlertOpen, setIsAlertOpen] = React.useState(false);
  const [deletingAppointment, setDeletingAppointment] = React.useState<Appointment | null>(null);
  const { toast } = useToast();

  const form = useForm<AppointmentFormValues>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: { procedure: '', date: new Date(), time: '', doctor: '', patientId: undefined, description: '' },
  });

  const weekDays = React.useMemo(() => {
    const start = startOfWeek(currentDate, { weekStartsOn: 1 }); // Monday
    const end = endOfWeek(currentDate, { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [currentDate]);

  const goToPreviousWeek = () => setCurrentDate(subWeeks(currentDate, 1));
  const goToNextWeek = () => setCurrentDate(addWeeks(currentDate, 1));

  const handleDialogOpenChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      form.reset({ procedure: '', date: new Date(), time: '', doctor: '', patientId: undefined, description: '' });
    }
  };

  const handleNewAppointmentClick = (day?: Date) => {
    form.reset({
      procedure: '',
      date: day || new Date(),
      time: '',
      doctor: '',
      description: '',
      patientId: undefined,
    });
    setIsDialogOpen(true);
  };
  
  const handleDeleteClick = (e: React.MouseEvent, appt: Appointment) => {
    e.stopPropagation();
    setDeletingAppointment(appt);
    setIsAlertOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingAppointment) return;
    const result = await deleteAppointment(deletingAppointment.id);
    if (result.success) {
      setAppointments(appointments.filter(a => a.id !== deletingAppointment.id));
      toast({ title: 'Appointment deleted successfully!' });
    } else {
      toast({
        variant: 'destructive',
        title: 'Failed to delete appointment',
        description: result.error,
      });
    }
    setIsAlertOpen(false);
    setDeletingAppointment(null);
  };

  const onSubmit = async (data: AppointmentFormValues) => {
    const selectedPatient = patients.find((p) => p.id === data.patientId);
    if (!selectedPatient) {
      toast({ variant: 'destructive', title: 'Invalid patient selected.' });
      return;
    }

    const appointmentPayload = { ...data, date: format(data.date, 'yyyy-MM-dd'), patientName: selectedPatient.name };

    const result = await addAppointment(appointmentPayload);

    if (result.success && result.data) {
      const newAppointments = [...appointments, result.data];
      setAppointments(newAppointments);
      handleDialogOpenChange(false);
      toast({ title: 'Appointment created successfully!' });
    } else {
      toast({
        variant: 'destructive',
        title: 'Failed to save appointment',
        description: result.error,
      });
    }
  };

  return (
    <>
      <div className="flex h-full flex-col">
        <header className="flex items-center justify-between pb-4">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={goToPreviousWeek}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-xl font-semibold text-foreground">
              {format(weekDays[0], 'MMMM d')} - {format(weekDays[6], 'MMMM d, yyyy')}
            </h2>
            <Button variant="outline" size="icon" onClick={goToNextWeek}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <Button onClick={() => handleNewAppointmentClick()}>
            <PlusCircle className="mr-2 h-4 w-4" />
            New Appointment
          </Button>
        </header>

        <div className="grid flex-1 grid-cols-7 gap-px overflow-hidden rounded-lg border bg-border">
          {weekDays.map((day) => (
            <div
              key={day.toString()}
              className="flex cursor-pointer flex-col bg-background"
              onClick={() => handleNewAppointmentClick(day)}
            >
              <div className="p-2 text-center text-sm font-medium">
                <span>{format(day, 'E')}</span>
                <span
                  className={cn(
                    'ml-2 rounded-full px-2 py-1 text-sm',
                    isToday(day) && 'bg-primary text-primary-foreground'
                  )}
                >
                  {format(day, 'd')}
                </span>
              </div>
              <div className="flex-1 space-y-2 overflow-y-auto p-2">
                {appointments
                  .filter((appt) => isSameDay(new Date(appt.date), day))
                  .sort((a, b) => a.time.localeCompare(b.time))
                  .map((appt) => (
                    <Card
                      key={appt.id}
                      className="border border-primary bg-primary/10 p-2 text-xs transition-shadow hover:shadow-md"
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                    >
                      <div className="flex justify-between items-start gap-1">
                          <Link href={`/dashboard/patients/${appt.patientId}`} className="font-bold hover:underline flex-1 truncate">
                              {appt.patientName}
                          </Link>
                          <Button
                              variant="ghost"
                              size="icon"
                              className="h-5 w-5 shrink-0 text-destructive hover:bg-destructive/20"
                              onClick={(e) => handleDeleteClick(e, appt)}
                              aria-label="Delete appointment"
                          >
                              <Trash2 className="h-3 w-3" />
                          </Button>
                      </div>
                      <p>{appt.procedure}</p>
                      <p className="text-muted-foreground">
                        {formatTime12h(appt.time)} - {appt.doctor}
                      </p>
                    </Card>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={handleDialogOpenChange}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Appointment</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
               <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="patientId"
                  render={({ field }) => {
                    const selectedPatient = patients.find((p) => p.id === field.value);
                    return (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Patient</FormLabel>
                        <Popover open={isPatientPopoverOpen} onOpenChange={setIsPatientPopoverOpen}>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                role="combobox"
                                className={cn('w-full justify-between text-left font-normal', !field.value && 'text-muted-foreground')}
                              >
                                {selectedPatient ? (
                                    <div className="flex items-center">
                                        {selectedPatient.name}
                                        {selectedPatient.registrationNumber && (
                                            <span className="ml-2 text-xs text-muted-foreground">
                                                #{selectedPatient.registrationNumber}
                                            </span>
                                        )}
                                    </div>
                                ) : (
                                    'Select patient by name or registration #'
                                )}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                            <Command>
                              <CommandInput placeholder="Search by name or registration #" />
                              <CommandList>
                                <CommandEmpty>No patient found.</CommandEmpty>
                                <CommandGroup>
                                  {patients.map((patient) => (
                                    <CommandItem
                                      value={`${patient.name} ${patient.registrationNumber || ''}`}
                                      key={patient.id}
                                      onSelect={() => {
                                        form.setValue('patientId', patient.id);
                                        setIsPatientPopoverOpen(false);
                                      }}
                                    >
                                      <Check
                                        className={cn(
                                          'mr-2 h-4 w-4',
                                          patient.id === field.value ? 'opacity-100' : 'opacity-0'
                                        )}
                                      />
                                      <div className="flex items-center">
                                            {patient.name}
                                            {patient.registrationNumber && (
                                                <span className="ml-2 text-xs text-muted-foreground">
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
                    );
                  }}
                />
                <FormField control={form.control} name="procedure" render={({ field }) => (<FormItem><FormLabel>Procedure</FormLabel><FormControl><Input placeholder="e.g., Routine Check-up" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="doctor" render={({ field }) => (<FormItem><FormLabel>Doctor</FormLabel><FormControl><Input placeholder="Doctor's name" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          value={field.value ? format(field.value, 'yyyy-MM-dd') : ''}
                          onChange={(e) => {
                            const dateValue = e.target.value;
                            // Add time component to avoid timezone issues where date might be off by one.
                            field.onChange(new Date(`${dateValue}T00:00:00`));
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField control={form.control} name="time" render={({ field }) => (<FormItem><FormLabel>Time</FormLabel><FormControl><Input type="time" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="description" render={({ field }) => (<FormItem className="md:col-span-2"><FormLabel>Description (Optional)</FormLabel><FormControl><Textarea placeholder="e.g., Prescribed Amoxicillin 500mg..." {...field} value={field.value || ''} rows={3} /></FormControl><FormMessage /></FormItem>)} />
              </div>
              <DialogFooter className="pt-2">
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Appointment
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
              This action cannot be undone. This will permanently delete the appointment for {deletingAppointment?.patientName} on {deletingAppointment && format(new Date(deletingAppointment.date), 'PPP')} at {deletingAppointment && formatTime12h(deletingAppointment.time)}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeletingAppointment(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
