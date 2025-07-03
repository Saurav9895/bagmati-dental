'use client';

import * as React from 'react';
import { format, addDays, subDays, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';
import { ChevronLeft, ChevronRight, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Appointment } from '@/lib/types';

interface AppointmentScheduleProps {
  appointments: Appointment[];
}

export function AppointmentSchedule({ appointments: initialAppointments }: AppointmentScheduleProps) {
  const [currentDate, setCurrentDate] = React.useState(new Date());
  const [appointments, setAppointments] = React.useState(initialAppointments);
  const weekDays = eachDayOfInterval({
    start: startOfWeek(currentDate, { weekStartsOn: 1 }),
    end: endOfWeek(currentDate, { weekStartsOn: 1 }),
  });

  const handlePrevWeek = () => setCurrentDate(subDays(currentDate, 7));
  const handleNextWeek = () => setCurrentDate(addDays(currentDate, 7));

  const handleAddAppointment = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newAppointment: Appointment = {
      id: `APT${Math.floor(Math.random() * 1000)}`,
      patientName: formData.get('patientName') as string,
      procedure: formData.get('procedure') as string,
      date: formData.get('date') as string,
      time: formData.get('time') as string,
      doctor: formData.get('doctor') as string,
    };
    setAppointments([...appointments, newAppointment]);
    // Here you would typically close the dialog
  };

  return (
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
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              New Appointment
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Appointment</DialogTitle>
            </DialogHeader>
            <form className="grid gap-4 py-4" onSubmit={handleAddAppointment}>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="patientName" className="text-right">Patient</Label>
                <Input id="patientName" name="patientName" className="col-span-3" placeholder="Patient's full name" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="procedure" className="text-right">Procedure</Label>
                <Input id="procedure" name="procedure" className="col-span-3" placeholder="e.g., Routine Check-up" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="date" className="text-right">Date</Label>
                <Input id="date" name="date" type="date" className="col-span-3" defaultValue={format(new Date(), 'yyyy-MM-dd')} />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="time" className="text-right">Time</Label>
                <Input id="time" name="time" type="time" className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="doctor" className="text-right">Doctor</Label>
                <Input id="doctor" name="doctor" className="col-span-3" placeholder="Doctor's name" />
              </div>
              <Button type="submit" className="w-full">Save Appointment</Button>
            </form>
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
                .map((appt) => (
                  <Card key={appt.id} className="bg-primary/10 border-primary/50 text-sm">
                    <CardContent className="p-2">
                      <p className="font-semibold">{appt.patientName}</p>
                      <p className="text-xs">{appt.procedure}</p>
                      <p className="text-xs text-muted-foreground">{appt.time} - {appt.doctor}</p>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
