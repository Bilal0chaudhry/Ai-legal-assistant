
'use client';

import type { ChangeEvent, KeyboardEvent } from 'react';
import { useState, useTransition, useRef, useEffect } from 'react';
import { 
  FileText, 
  Loader2, 
  UploadCloud, 
  Lightbulb, 
  AlertTriangle, 
  Scale, 
  MessageSquare,
  User,
  Bot,
  Send,
  CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { summarizeDocument, type SummarizeDocumentOutput } from '@/ai/flows/summarize-document';
import { legalChat, type LegalChatOutput } from '@/ai/flows/legal-chat-flow';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export default function LegallyEasyPage() {
  // Summarizer State
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [summary, setSummary] = useState<SummarizeDocumentOutput | null>(null);
  const [isSummarizerPending, startSummarizerTransition] = useTransition();
  const [summarizerError, setSummarizerError] = useState<string | null>(null);
  
  // Chat State
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [currentUserQuery, setCurrentUserQuery] = useState<string>('');
  const [isChatPending, startChatTransition] = useTransition();
  const [chatError, setChatError] = useState<string | null>(null);
  const chatScrollAreaRef = useRef<HTMLDivElement>(null);

  const { toast } = useToast();

  // Summarizer Logic
  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.size > 5 * 1024 * 1024) { // 5MB limit
        setSummarizerError('File size exceeds 5MB. Please upload a smaller document.');
        setFile(null);
        setFileName('');
        toast({
          title: "File Error",
          description: "File size exceeds 5MB.",
          variant: "destructive",
        });
        return;
      }
      setFile(selectedFile);
      setFileName(selectedFile.name);
      setSummary(null);
      setSummarizerError(null);
    }
  };

  const handleSummarizeSubmit = async () => {
    if (!file) {
      setSummarizerError('Please select a document to summarize.');
      toast({
        title: "Input Error",
        description: "Please select a document.",
        variant: "destructive",
      });
      return;
    }
    setSummarizerError(null);

    startSummarizerTransition(async () => {
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
          setSummarizerError('Failed to read the file. Please try again.');
          toast({
            title: "Error Reading File",
            description: "Could not read the selected file.",
            variant: "destructive",
          });
        };
      } catch (e: any) {
        setSummarizerError(`An error occurred: ${e.message || 'Unknown error'}`);
        toast({
          title: "Summarization Failed",
          description: e.message || "An unexpected error occurred.",
          variant: "destructive",
        });
      }
    });
  };

  // Chat Logic
  const handleChatSubmit = async () => {
    if (!currentUserQuery.trim()) {
      setChatError('Please enter a question.');
      return;
    }
    setChatError(null);

    const newUserMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: currentUserQuery.trim(),
    };
    setChatMessages((prevMessages) => [...prevMessages, newUserMessage]);
    setCurrentUserQuery('');

    startChatTransition(async () => {
      try {
        const result = await legalChat({ query: newUserMessage.content });
        const aiResponse: ChatMessage = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: result.response,
        };
        setChatMessages((prevMessages) => [...prevMessages, aiResponse]);
      } catch (e: any) {
        setChatError(`An error occurred: ${e.message || 'Unknown error'}`);
        const errorResponse: ChatMessage = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: `Sorry, I encountered an error: ${e.message || 'Unknown error'}. Please try again.`,
        };
        setChatMessages((prevMessages) => [...prevMessages, errorResponse]);
        toast({
          title: "Chat Error",
          description: e.message || "An unexpected error occurred while fetching chat response.",
          variant: "destructive",
        });
      }
    });
  };
  
  const handleChatInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleChatSubmit();
    }
  };

  useEffect(() => {
    // Auto-scroll for chat messages
    if (chatScrollAreaRef.current) {
      const scrollViewport = chatScrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
      if (scrollViewport) {
        scrollViewport.scrollTop = scrollViewport.scrollHeight;
      }
    }
  }, [chatMessages]);


  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/50 flex flex-col items-center py-8 px-4 sm:px-6 lg:px-8">
      <header className="mb-10 text-center">
        <div className="flex items-center justify-center mb-4">
           <Scale className="h-12 w-12 text-primary mr-3" />
          <h1 className="text-4xl sm:text-5xl font-bold text-primary tracking-tight">
            Legally Easy
          </h1>
        </div>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Your AI legal assistant for document summarization and legal queries.
        </p>
      </header>

      <main className="w-full max-w-4xl space-y-8">
        <Tabs defaultValue="summarizer" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6 shadow-sm">
            <TabsTrigger value="summarizer" className="py-3 text-base">
              <FileText className="mr-2 h-5 w-5" /> Document Summarizer
            </TabsTrigger>
            <TabsTrigger value="chat" className="py-3 text-base">
              <MessageSquare className="mr-2 h-5 w-5" /> Legal Chat
            </TabsTrigger>
          </TabsList>

          <TabsContent value="summarizer">
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
                {summarizerError && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{summarizerError}</AlertDescription>
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
                  onClick={handleSummarizeSubmit}
                  disabled={isSummarizerPending || !file}
                  className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground text-lg py-3 px-6 rounded-lg shadow-md transition-all duration-150 ease-in-out hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  {isSummarizerPending ? (
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
              <Card className="shadow-2xl rounded-xl animate-fadeIn mt-8">
                <CardHeader className="bg-accent/10 p-6">
                   <div className="flex items-center space-x-3">
                    <CheckCircle2 className="h-8 w-8 text-accent"/>
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
          </TabsContent>

          <TabsContent value="chat">
            <Card className="shadow-2xl rounded-xl overflow-hidden">
              <CardHeader className="bg-card-foreground/5 p-6">
                <div className="flex items-center space-x-3">
                  <MessageSquare className="h-8 w-8 text-primary" />
                  <div>
                    <CardTitle className="text-2xl font-semibold text-primary">Legal Chat Assistant</CardTitle>
                    <CardDescription className="text-muted-foreground">
                      Ask your legal questions. Please note this is not legal advice.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[500px] w-full p-6" ref={chatScrollAreaRef}>
                  <div className="space-y-6">
                    {chatMessages.map((message) => (
                      <div
                        key={message.id}
                        className={cn(
                          "flex items-start gap-3",
                          message.role === 'user' ? "justify-end" : "justify-start"
                        )}
                      >
                        {message.role === 'assistant' && (
                          <Avatar className="h-8 w-8 border border-primary/50">
                            <AvatarFallback><Bot className="h-5 w-5 text-primary" /></AvatarFallback>
                          </Avatar>
                        )}
                        <div
                          className={cn(
                            "max-w-[75%] rounded-xl px-4 py-3 shadow-md text-sm",
                            message.role === 'user'
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground"
                          )}
                        >
                          <p className="whitespace-pre-wrap">{message.content}</p>
                        </div>
                        {message.role === 'user' && (
                           <Avatar className="h-8 w-8 border border-accent/50">
                            <AvatarFallback><User className="h-5 w-5 text-accent" /></AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                    ))}
                    {isChatPending && chatMessages[chatMessages.length -1]?.role === 'user' && (
                       <div className="flex items-start gap-3 justify-start">
                         <Avatar className="h-8 w-8 border border-primary/50">
                            <AvatarFallback><Bot className="h-5 w-5 text-primary" /></AvatarFallback>
                          </Avatar>
                          <div className="max-w-[75%] rounded-xl px-4 py-3 shadow-md bg-muted text-muted-foreground">
                            <Loader2 className="h-5 w-5 animate-spin text-primary" />
                          </div>
                       </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
              <CardFooter className="border-t p-6 bg-card-foreground/5">
                <div className="flex w-full items-center space-x-3">
                  <Input
                    type="text"
                    placeholder="Type your legal question here..."
                    value={currentUserQuery}
                    onChange={(e) => setCurrentUserQuery(e.target.value)}
                    onKeyDown={handleChatInputKeyDown}
                    disabled={isChatPending}
                    className="flex-grow text-base"
                  />
                  <Button 
                    onClick={handleChatSubmit} 
                    disabled={isChatPending || !currentUserQuery.trim()}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg shadow-md"
                    aria-label="Send chat message"
                  >
                    {isChatPending ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Send className="h-5 w-5" />
                    )}
                  </Button>
                </div>
              </CardFooter>
               {chatError && (
                <Alert variant="destructive" className="m-6 mt-0 rounded-t-none border-t-0">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Chat Error</AlertTitle>
                  <AlertDescription>{chatError}</AlertDescription>
                </Alert>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <footer className="mt-12 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} Legally Easy. All rights reserved.</p>
        <p>Powered by AI, designed for clarity.</p>
      </footer>
    </div>
  );
}
