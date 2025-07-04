
'use client';

import * as React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Appointment } from '@/lib/types';
import { updateAppointment } from '@/app/actions/appointments';

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

export function TodaysAppointmentsClient({ initialAppointments }: { initialAppointments: Appointment[] }) {
    const [appointments, setAppointments] = React.useState(initialAppointments);
    const [updatingId, setUpdatingId] = React.useState<string | null>(null);
    const { toast } = useToast();

    React.useEffect(() => {
        setAppointments(initialAppointments);
    }, [initialAppointments]);

    const handleMarkAsComplete = async (appointmentId: string) => {
        setUpdatingId(appointmentId);
        const result = await updateAppointment(appointmentId, { status: 'Completed' });
        if (result.success) {
            toast({ title: 'Appointment marked as complete!' });
        } else {
            toast({ variant: 'destructive', title: 'Failed to update appointment', description: result.error });
        }
        setUpdatingId(null);
    };

    return (
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
                {appointments.length > 0 ? (
                    appointments.map((appt) => (
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
                                {appt.status === 'Completed' ? (
                                    <Badge variant="secondary">Completed</Badge>
                                ) : (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleMarkAsComplete(appt.id)}
                                        disabled={updatingId === appt.id}
                                    >
                                        {updatingId === appt.id && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Mark as Complete
                                    </Button>
                                )}
                            </TableCell>
                        </TableRow>
                    ))
                ) : (
                    <TableRow>
                        <TableCell colSpan={5} className="text-center h-24">No appointments for today.</TableCell>
                    </TableRow>
                )}
            </TableBody>
        </Table>
    );
}
