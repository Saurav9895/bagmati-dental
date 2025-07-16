import { BillingClient } from '@/components/dashboard/billing-client';
import { getOpdCharge } from '@/app/actions/settings';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default async function BillingPage() {
  const opdChargeSetting = await getOpdCharge();
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Patient Billing</CardTitle>
        <CardDescription>Search for a patient to view their treatments and generate an invoice.</CardDescription>
      </CardHeader>
      <CardContent>
        <BillingClient opdChargeSetting={opdChargeSetting} />
      </CardContent>
    </Card>
  );
}
