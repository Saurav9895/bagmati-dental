'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, Calendar, Wallet, Loader2 } from 'lucide-react';
import { collection, query, where, orderBy, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Patient, Appointment } from '@/lib/types';
import { TodaysAppointmentsClient } from "@/components/dashboard/todays-appointments";
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardPage() {
  const [totalIncome, setTotalIncome] = React.useState(0);
  const [newPatientsCount, setNewPatientsCount] = React.useState(0);
  const [todaysAppointments, setTodaysAppointments] = React.useState<Appointment[]>([]);
  const [totalPatientsCount, setTotalPatientsCount] = React.useState(0);
  const [isPatientsLoading, setIsPatientsLoading] = React.useState(true);
  const [isAppointmentsLoading, setIsAppointmentsLoading] = React.useState(true);

  React.useEffect(() => {
    const patientsQuery = query(collection(db, 'patients'));

    const unsubscribePatients = onSnapshot(patientsQuery, (querySnapshot) => {
      const patients: Patient[] = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Patient));
      
      const totalIncomeCalc = patients.reduce((acc, patient) => {
        const patientPayments = patient.payments?.reduce((paymentAcc, payment) => paymentAcc + payment.amount, 0) || 0;
        return acc + patientPayments;
      }, 0);

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const newPatientsCountCalc = patients.filter(patient => {
        const createdAt = patient.createdAt as unknown as Timestamp;
        return createdAt && typeof createdAt.toDate === 'function' && createdAt.toDate() > thirtyDaysAgo;
      }).length;

      setTotalPatientsCount(patients.length);
      setTotalIncome(totalIncomeCalc);
      setNewPatientsCount(newPatientsCountCalc);
      setIsPatientsLoading(false);
    }, (error) => {
      console.error("Failed to fetch patients in real-time:", error);
      setIsPatientsLoading(false);
    });

    const appointmentsQuery = query(
      collection(db, 'appointments'),
      where('date', '==', new Date().toISOString().split('T')[0]),
      orderBy('time', 'asc')
    );

    const unsubscribeAppointments = onSnapshot(appointmentsQuery, (querySnapshot) => {
      const appointments: Appointment[] = querySnapshot.docs.map(doc => {
        const data = doc.data();
        const { createdAt, ...rest } = data;
        return { id: doc.id, ...rest } as Appointment;
      });
      setTodaysAppointments(appointments);
      setIsAppointmentsLoading(false);
    }, (error) => {
      console.error("Failed to fetch appointments in real-time:", error);
      setIsAppointmentsLoading(false);
    });

    return () => {
      unsubscribePatients();
      unsubscribeAppointments();
    };
  }, []);

  const isLoading = isPatientsLoading || isAppointmentsLoading;
  
  if (isLoading) {
    return (
        <div className="grid gap-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Income</CardTitle>
                        <Wallet className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-8 w-3/4" />
                        <Skeleton className="h-4 w-1/2 mt-1" />
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">New Patients</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-8 w-1/4" />
                        <Skeleton className="h-4 w-3/4 mt-1" />
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Today's Appointments</CardTitle>
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-8 w-1/4" />
                        <Skeleton className="h-4 w-3/4 mt-1" />
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-8 w-1/4" />
                        <Skeleton className="h-4 w-1/2 mt-1" />
                    </CardContent>
                </Card>
            </div>
            
            <Card>
                <CardHeader>
                <CardTitle>Today's Appointments</CardTitle>
                <CardDescription>A list of appointments scheduled for today.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex h-24 items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
  }
  
  return (
    <div className="grid gap-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Income</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Rs. {totalIncome.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">from all recorded payments</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New Patients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{newPatientsCount}</div>
            <p className="text-xs text-muted-foreground">in the last 30 days</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Appointments</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todaysAppointments.length}</div>
            <p className="text-xs text-muted-foreground">scheduled for today</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPatientsCount}</div>
            <p className="text-xs text-muted-foreground">in the system</p>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Today's Appointments</CardTitle>
          <CardDescription>A list of appointments scheduled for today.</CardDescription>
        </CardHeader>
        <CardContent>
          <TodaysAppointmentsClient initialAppointments={todaysAppointments} />
        </CardContent>
      </Card>
    </div>
  );
}
