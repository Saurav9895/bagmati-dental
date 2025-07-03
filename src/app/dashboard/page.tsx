
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Users, Calendar, Wallet } from 'lucide-react';
import { collection, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Patient, Appointment } from '@/lib/types';
import Link from 'next/link';

const formatTime12h = (time24h: string): string => {
    if (!time24h) return '';
    try {
        const [hours, minutes] = time24h.split(':');
        const h = parseInt(hours, 10);
        const m = parseInt(minutes, 10);
        const ampm = h >= 12 ? 'PM' : 'AM';
        const hour12 = h % 12 || 12;
        return `${hour12}:${String(m).padStart(2, '0')} ${ampm}`;
    } catch (error) {
        console.error("Invalid time format:", time24h);
        return time24h;
    }
};

async function getDashboardData() {
    const patientsCollection = collection(db, 'patients');
    const appointmentsCollection = collection(db, 'appointments');

    try {
        const [patientsSnapshot, appointmentsSnapshot] = await Promise.all([
            getDocs(patientsCollection),
            getDocs(appointmentsCollection)
        ]);

        const patients: Patient[] = patientsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Patient));
        const appointments: Appointment[] = appointmentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Appointment));
        
        const totalIncome = patients.reduce((acc, patient) => {
            const patientPayments = patient.payments?.reduce((paymentAcc, payment) => paymentAcc + payment.amount, 0) || 0;
            return acc + patientPayments;
        }, 0);

        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const newPatientsCount = patients.filter(patient => {
            // Firestore timestamps can be tricky. Ensure createdAt exists and is a Timestamp object.
            // When fetched on the server, it's a Firestore Timestamp.
            const createdAt = patient.createdAt as unknown as Timestamp;
            return createdAt && typeof createdAt.toDate === 'function' && createdAt.toDate() > thirtyDaysAgo;
        }).length;
        
        const todaysAppointments = appointments.filter(
            (appt) => appt.date === new Date().toISOString().split('T')[0]
        ).sort((a, b) => a.time.localeCompare(b.time));

        const totalPatientsCount = patients.length;

        return {
            totalIncome,
            newPatientsCount,
            todaysAppointments,
            totalPatientsCount,
        };
    } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
        // Return default/empty values on error to prevent crash
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Patient</TableHead>
                <TableHead>Procedure</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Doctor</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {todaysAppointments.length > 0 ? (
                todaysAppointments.map((appt) => (
                  <TableRow key={appt.id}>
                    <TableCell className="font-medium">
                        <Link href={`/dashboard/patients/${appt.patientId}`} className="hover:underline">
                            {appt.patientName}
                        </Link>
                    </TableCell>
                    <TableCell>{appt.procedure}</TableCell>
                    <TableCell>{formatTime12h(appt.time)}</TableCell>
                    <TableCell>{appt.doctor}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-green-600 border-green-600">Confirmed</Badge>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">No appointments for today.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
