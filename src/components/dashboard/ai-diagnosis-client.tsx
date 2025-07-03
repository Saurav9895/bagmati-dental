'use client';

import { useState } from 'react';
import Image from 'next/image';
import { analyzeXRay, AnalyzeXRayOutput } from '@/ai/flows/analyze-xray';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Lightbulb, ListChecks, Upload, X, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '../ui/badge';

export function AiDiagnosisClient() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<AnalyzeXRayOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
      setAnalysis(null);
    }
  };

  const handleRemoveImage = () => {
    setFile(null);
    setPreviewUrl(null);
    setAnalysis(null);
  };

  const handleAnalyze = async () => {
    if (!file || !previewUrl) {
      toast({
        variant: "destructive",
        title: "No file selected",
        description: "Please upload an X-ray image to analyze.",
      });
      return;
    }

    setIsLoading(true);
    setAnalysis(null);

    try {
      const result = await analyzeXRay({ xrayDataUri: previewUrl });
      setAnalysis(result);
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Analysis Failed",
        description: "Something went wrong. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <div className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="xray-upload" className="font-medium">
            Upload X-Ray Image
          </label>
          <div className="flex items-center gap-2">
            <Input id="xray-upload" type="file" accept="image/*" onChange={handleFileChange} disabled={isLoading} />
            <Button onClick={handleAnalyze} disabled={!file || isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
              Analyze
            </Button>
          </div>
        </div>
        {previewUrl && (
          <div className="relative aspect-video w-full overflow-hidden rounded-lg border">
            <Image src={previewUrl} alt="X-ray preview" layout="fill" objectFit="contain" data-ai-hint="dental xray" />
            <Button
              variant="destructive"
              size="icon"
              className="absolute right-2 top-2 h-7 w-7"
              onClick={handleRemoveImage}
              aria-label="Remove image"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <h3 className="font-headline text-lg font-semibold">Analysis Results</h3>
        {isLoading && (
            <div className="space-y-4">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-24 w-full" />
            </div>
        )}
        {analysis ? (
          <div className="space-y-4">
            <Alert>
              <Lightbulb className="h-4 w-4" />
              <AlertTitle>Preliminary Diagnosis</AlertTitle>
              <AlertDescription>{analysis.preliminaryDiagnosis}</AlertDescription>
            </Alert>
            <Alert>
              <ListChecks className="h-4 w-4" />
              <AlertTitle>Potential Issues</AlertTitle>
              <AlertDescription>
                <div className="flex flex-wrap gap-2 pt-2">
                    {analysis.potentialIssues.map((issue, index) => (
                        <Badge key={index} variant="secondary">{issue}</Badge>
                    ))}
                </div>
              </AlertDescription>
            </Alert>
          </div>
        ) : (
          !isLoading && (
            <div className="flex h-full items-center justify-center rounded-lg border-2 border-dashed bg-muted/50 p-8 text-center">
              <p className="text-muted-foreground">Analysis results will appear here.</p>
            </div>
          )
        )}
      </div>
    </div>
  );
}
