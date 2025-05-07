
'use client';

import type { ChangeEvent, KeyboardEvent } from 'react';
import { useState, useTransition, useRef, useEffect } from 'react';
import { 
  Loader2, 
  Scale, 
  MessageSquare,
  User,
  Bot,
  Send,
  AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { legalChat, type LegalChatOutput } from '@/ai/flows/legal-chat-flow';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export default function LegallyEasyPage() {
  // Chat State
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [currentUserQuery, setCurrentUserQuery] = useState<string>('');
  const [isChatPending, startChatTransition] = useTransition();
  const [chatError, setChatError] = useState<string | null>(null);
  const chatScrollAreaRef = useRef<HTMLDivElement>(null);

  const { toast } = useToast();

  // Chat Logic
  const handleChatSubmit = async () => {
    if (!currentUserQuery.trim()) {
      setChatError('Please enter a question.');
      toast({
        title: "Input Error",
        description: "Please enter a question to ask the Legal Chat Assistant.",
        variant: "destructive",
      });
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
        const errorMessage = e instanceof Error ? e.message : String(e);
        setChatError(`An error occurred: ${errorMessage || 'Unknown error'}`);
        const errorResponse: ChatMessage = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: `Sorry, I encountered an error: ${errorMessage || 'Unknown error'}. Please try again.`,
        };
        setChatMessages((prevMessages) => [...prevMessages, errorResponse]);
        toast({
          title: "Chat Error",
          description: errorMessage || "An unexpected error occurred while fetching chat response.",
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
      // Attempt to find the viewport element within the ScrollArea
      const scrollViewport = chatScrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
      if (scrollViewport) {
        scrollViewport.scrollTop = scrollViewport.scrollHeight;
      } else {
        // Fallback if Radix viewport selector not found (e.g. if ScrollArea structure changes)
        chatScrollAreaRef.current.scrollTop = chatScrollAreaRef.current.scrollHeight;
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
          Your AI legal assistant for legal queries.
        </p>
      </header>

      <main className="w-full max-w-4xl space-y-8">
        <Tabs defaultValue="chat" className="w-full">
          <TabsList className="grid w-full grid-cols-1 mb-6 shadow-sm">
            <TabsTrigger value="chat" className="py-3 text-base">
              <MessageSquare className="mr-2 h-5 w-5" /> Legal Chat
            </TabsTrigger>
          </TabsList>

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
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setCurrentUserQuery(e.target.value)}
                    onKeyDown={handleChatInputKeyDown}
                    disabled={isChatPending}
                    className="flex-grow text-base"
                    aria-label="Chat input for legal questions"
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
