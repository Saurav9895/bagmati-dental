import { TreatmentList } from "@/components/dashboard/treatment-list";
import { getTreatments } from "@/app/actions/treatments";

export default async function TreatmentsPage() {
  const treatments = await getTreatments();
  return (
    <div>
      <TreatmentList initialTreatments={treatments} />
    </div>
  );
}
