'use client';

import * as React from 'react';
import { mockAppointments } from "@/lib/data";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, Send } from 'lucide-react';

export default function RemindersPage() {
  const [generatedReminders, setGeneratedReminders] = React.useState<string[]>([]);
  
  const upcomingAppointments = mockAppointments.filter(
    (appt) => new Date(appt.date) >= new Date()
  );

  const generateReminders = () => {
    const reminders = upcomingAppointments.map(appt => 
      `Hi ${appt.patientName}, this is a reminder for your appointment for a ${appt.procedure} on ${new Date(appt.date).toLocaleDateString()} at ${appt.time} with ${appt.doctor} at DentalFlow Clinic. See you soon!`
    );
    setGeneratedReminders(reminders);
  };

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Automated Reminders</CardTitle>
          <CardDescription>Generate and review reminders for upcoming appointments.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border bg-card p-4">
            <h3 className="font-semibold">Upcoming Appointments ({upcomingAppointments.length})</h3>
            <ul className="mt-2 list-disc pl-5 text-sm text-muted-foreground">
              {upcomingAppointments.map(appt => (
                <li key={appt.id}>{appt.patientName} - {appt.procedure} on {new Date(appt.date).toLocaleDateString()}</li>
              ))}
            </ul>
          </div>
          <Button onClick={generateReminders}>
            <Bell className="mr-2 h-4 w-4" />
            Generate Reminders
          </Button>
        </CardContent>
      </Card>
      {generatedReminders.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Generated Reminder Messages</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {generatedReminders.map((reminder, index) => (
              <div key={index} className="flex items-start justify-between gap-4 rounded-lg border bg-muted/50 p-4">
                <p className="text-sm">{reminder}</p>
                <Button variant="ghost" size="icon" className="shrink-0">
                  <Send className="h-4 w-4" />
                  <span className="sr-only">Send</span>
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
