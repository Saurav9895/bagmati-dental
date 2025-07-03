import { AiDiagnosisClient } from "@/components/dashboard/ai-diagnosis-client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AiDiagnosisPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">AI Diagnosis Assistant</CardTitle>
        <CardDescription>Upload a dental X-ray to get a preliminary analysis of potential issues.</CardDescription>
      </CardHeader>
      <CardContent>
        <AiDiagnosisClient />
      </CardContent>
    </Card>
  );
}
