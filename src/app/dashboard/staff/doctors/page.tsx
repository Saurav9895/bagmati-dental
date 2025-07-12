import { DoctorList } from "@/components/dashboard/doctor-list";
import { getDoctors } from "@/app/actions/staff";

export default async function DoctorsPage() {
    const doctors = await getDoctors();
    return (
        <div>
            <DoctorList initialDoctors={doctors} />
        </div>
    );
}
