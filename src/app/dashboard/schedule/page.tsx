import { AppointmentSchedule } from "@/components/dashboard/appointment-schedule";
import { mockAppointments } from "@/lib/data";

export default function SchedulePage() {
  return (
    <div className="h-full">
      <AppointmentSchedule appointments={mockAppointments} />
    </div>
  );
}
