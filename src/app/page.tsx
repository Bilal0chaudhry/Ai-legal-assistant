'use client';

import type { ChangeEvent } from 'react';
import { useState, useTransition } from 'react';
import { FileText, Loader2, UploadCloud, Lightbulb, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { summarizeDocument, type SummarizeDocumentOutput } from '@/ai/flows/summarize-document';
import { useToast } from '@/hooks/use-toast';

export default function LegallyEasyPage() {
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [summary, setSummary] = useState<SummarizeDocumentOutput | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.size > 5 * 1024 * 1024) { // 5MB limit
        setError('File size exceeds 5MB. Please upload a smaller document.');
        setFile(null);
        setFileName('');
        return;
      }
      setFile(selectedFile);
      setFileName(selectedFile.name);
      setSummary(null);
      setError(null);
    }
  };

  const handleSubmit = async () => {
    if (!file) {
      setError('Please select a document to summarize.');
      return;
    }
    setError(null);

    startTransition(async () => {
      try {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = async () => {
          const documentDataUri = reader.result as string;
          const result = await summarizeDocument({ documentDataUri });
          setSummary(result);
          toast({
            title: "Summarization Successful",
            description: "Your document has been summarized.",
            variant: "default",
          });
        };
        reader.onerror = () => {
          setError('Failed to read the file. Please try again.');
          toast({
            title: "Error Reading File",
            description: "Could not read the selected file.",
            variant: "destructive",
          });
        };
      } catch (e: any) {
        setError(`An error occurred: ${e.message || 'Unknown error'}`);
        toast({
          title: "Summarization Failed",
          description: e.message || "An unexpected error occurred.",
          variant: "destructive",
        });
      }
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/50 flex flex-col items-center py-8 px-4 sm:px-6 lg:px-8">
      <header className="mb-10 text-center">
        <div className="flex items-center justify-center mb-4">
           <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary mr-3"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><line x1="10" y1="9" x2="8" y2="9"></line></svg>
          <h1 className="text-4xl sm:text-5xl font-bold text-primary tracking-tight">
            Legally Easy
          </h1>
        </div>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Upload your legal documents and let our AI assistant provide concise summaries, making complex information easy to understand.
        </p>
      </header>

      <main className="w-full max-w-4xl space-y-8">
        <Card className="shadow-2xl rounded-xl overflow-hidden">
          <CardHeader className="bg-card-foreground/5 p-6">
            <div className="flex items-center space-x-3">
              <UploadCloud className="h-8 w-8 text-primary" />
              <div>
                <CardTitle className="text-2xl font-semibold text-primary">Document Upload</CardTitle>
                <CardDescription className="text-muted-foreground">
                  Select a document (PDF, DOCX, TXT - max 5MB) to summarize.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="grid w-full items-center gap-2">
              <Label htmlFor="document-upload" className="text-base font-medium text-foreground">
                Choose Document
              </Label>
              <div className="flex items-center space-x-2">
                <Input
                  id="document-upload"
                  type="file"
                  accept=".pdf,.doc,.docx,.txt"
                  onChange={handleFileChange}
                  className="flex-grow file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer"
                />
              </div>
              {fileName && (
                <p className="text-sm text-muted-foreground flex items-center mt-2">
                  <FileText className="h-4 w-4 mr-2 text-accent" /> Selected: {fileName}
                </p>
              )}
            </div>
          </CardContent>
          <CardFooter className="border-t p-6 bg-card-foreground/5">
            <Button
              onClick={handleSubmit}
              disabled={isPending || !file}
              className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground text-lg py-3 px-6 rounded-lg shadow-md transition-all duration-150 ease-in-out hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Summarizing...
                </>
              ) : (
                <>
                  <Lightbulb className="mr-2 h-5 w-5" /> Summarize Document
                </>
              )}
            </Button>
          </CardFooter>
        </Card>

        {summary && (
          <Card className="shadow-2xl rounded-xl animate-fadeIn">
            <CardHeader className="bg-accent/10 p-6">
               <div className="flex items-center space-x-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent"><path d="M20 6 9 17l-5-5"></path></svg>
                <div>
                  <CardTitle className="text-2xl font-semibold text-accent">Summary</CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Here's a concise overview of your document.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <Textarea
                readOnly
                value={summary.summary}
                className="min-h-[200px] text-base leading-relaxed bg-background/50 border-accent/30 focus:ring-accent"
                rows={10}
              />
            </CardContent>
             <CardFooter className="border-t p-6 bg-accent/5 text-sm text-muted-foreground">
              This summary is AI-generated and should be used for informational purposes. Always refer to the original document for critical decisions.
            </CardFooter>
          </Card>
        )}
      </main>

      <footer className="mt-12 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} Legally Easy. All rights reserved.</p>
        <p>Powered by AI, designed for clarity.</p>
      </footer>
    </div>
  );
}
