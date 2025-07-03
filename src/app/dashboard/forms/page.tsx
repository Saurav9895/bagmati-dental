import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Eye, FileText } from "lucide-react";

const forms = [
  {
    title: "Medical History Form",
    description: "Comprehensive medical history for new patients.",
    version: "v2.1",
  },
  {
    title: "Consent to Treatment Form",
    description: "Informed consent for general dental procedures.",
    version: "v1.8",
  },
  {
    title: "HIPAA Privacy Form",
    description: "Patient acknowledgement of privacy practices.",
    version: "v3.0",
  },
  {
    title: "Post-Operative Instructions",
    description: "Care instructions after specific procedures like extractions.",
    version: "v1.5",
  },
];

export default function FormsPage() {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {forms.map((form) => (
        <Card key={form.title}>
          <CardHeader>
            <div className="flex items-start gap-4">
              <FileText className="h-10 w-10 text-primary" />
              <div>
                <CardTitle className="font-headline">{form.title}</CardTitle>
                <p className="text-sm text-muted-foreground">{form.version}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{form.description}</p>
          </CardContent>
          <CardFooter className="flex justify-end gap-2">
            <Button variant="outline">
              <Eye className="mr-2 h-4 w-4" />
              View
            </Button>
            <Button>
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
