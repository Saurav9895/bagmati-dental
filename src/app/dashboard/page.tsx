
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, Calendar, Wallet } from 'lucide-react';
import { collection, getDocs, Timestamp, query, where, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Patient, Appointment } from '@/lib/types';
import { TodaysAppointmentsClient } from "@/components/dashboard/todays-appointments";

async function getDashboardData() {
    const patientsCollection = collection(db, 'patients');
    const appointmentsCollection = collection(db, 'appointments');

    try {
        const [patientsSnapshot, todaysAppointmentsSnapshot] = await Promise.all([
            getDocs(patientsCollection),
            getDocs(query(
                appointmentsCollection,
                where('date', '==', new Date().toISOString().split('T')[0]),
                orderBy('time', 'asc')
            ))
        ]);

        const patients: Patient[] = patientsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Patient));
        
        const totalIncome = patients.reduce((acc, patient) => {
            const patientPayments = patient.payments?.reduce((paymentAcc, payment) => paymentAcc + payment.amount, 0) || 0;
            return acc + patientPayments;
        }, 0);

        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const newPatientsCount = patients.filter(patient => {
            const createdAt = patient.createdAt as unknown as Timestamp;
            return createdAt && typeof createdAt.toDate === 'function' && createdAt.toDate() > thirtyDaysAgo;
        }).length;
        
        const todaysAppointments: Appointment[] = todaysAppointmentsSnapshot.docs.map(doc => {
            const data = doc.data();
            const { createdAt, ...rest } = data;
            return { id: doc.id, ...rest } as Appointment;
        });

        const totalPatientsCount = patients.length;

        return {
            totalIncome,
            newPatientsCount,
            todaysAppointments,
            totalPatientsCount,
        };
    } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
        return {
            totalIncome: 0,
            newPatientsCount: 0,
            todaysAppointments: [],
            totalPatientsCount: 0,
        };
    }
}


export default async function DashboardPage() {
  const { 
    totalIncome, 
    newPatientsCount, 
    todaysAppointments, 
    totalPatientsCount 
  } = await getDashboardData();
  
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
