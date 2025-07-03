import { StaffList } from "@/components/dashboard/staff-list";
import { getStaff } from "@/app/actions/staff";

export default async function StaffPage() {
  const staff = await getStaff();
  return (
    <div>
      <StaffList initialStaff={staff} />
    </div>
  );
}
