// src/ai/flows/analyze-xray.ts
'use server';

/**
 * @fileOverview An AI agent that analyzes dental X-ray images to identify potential issues.
 *
 * - analyzeXRay - A function that handles the X-ray analysis process.
 * - AnalyzeXRayInput - The input type for the analyzeXRay function.
 * - AnalyzeXRayOutput - The return type for the analyzeXRay function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeXRayInputSchema = z.object({
  xrayDataUri: z
    .string()
    .describe(
      "A dental X-ray image as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type AnalyzeXRayInput = z.infer<typeof AnalyzeXRayInputSchema>;

const AnalyzeXRayOutputSchema = z.object({
  preliminaryDiagnosis: z
    .string()
    .describe('A preliminary diagnosis based on the X-ray image.'),
  potentialIssues: z.array(
    z.string().describe('A list of potential issues identified in the X-ray.')
  ),
});
export type AnalyzeXRayOutput = z.infer<typeof AnalyzeXRayOutputSchema>;

export async function analyzeXRay(input: AnalyzeXRayInput): Promise<AnalyzeXRayOutput> {
  return analyzeXRayFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeXRayPrompt',
  input: {schema: AnalyzeXRayInputSchema},
  output: {schema: AnalyzeXRayOutputSchema},
  prompt: `You are an expert dental radiologist. Analyze the provided dental X-ray image and identify any potential issues. Provide a preliminary diagnosis based on your analysis.

X-ray Image: {{media url=xrayDataUri}}

Respond in the following JSON format:
{
  "preliminaryDiagnosis": "",
  "potentialIssues": ["", ""]
}
`,
});

const analyzeXRayFlow = ai.defineFlow(
  {
    name: 'analyzeXRayFlow',
    inputSchema: AnalyzeXRayInputSchema,
    outputSchema: AnalyzeXRayOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
