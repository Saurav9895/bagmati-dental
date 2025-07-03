import { PatientList } from "@/components/dashboard/patient-list";
import { mockPatients } from "@/lib/data";

export default function PatientsPage() {
  return (
    <div>
      <PatientList patients={mockPatients} />
    </div>
  );
}
