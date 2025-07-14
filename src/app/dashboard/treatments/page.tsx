import { TreatmentList } from "@/components/dashboard/treatment-list";
import { getTreatments } from "@/app/actions/treatments";
import { getChiefComplaints, getDentalExaminations } from "@/app/actions/examinations";

export default async function TreatmentsPage() {
  const treatments = await getTreatments();
  const chiefComplaints = await getChiefComplaints();
  const dentalExaminations = await getDentalExaminations();
  
  return (
    <div>
      <TreatmentList 
        initialTreatments={treatments} 
        initialChiefComplaints={chiefComplaints}
        initialDentalExaminations={dentalExaminations}
      />
    </div>
  );
}
