
'use server';
/**
 * @fileOverview A legal chat AI agent.
 *
 * - legalChat - A function that handles legal chat queries.
 * - LegalChatInput - The input type for the legalChat function.
 * - LegalChatOutput - The return type for the legalChat function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const LegalChatInputSchema = z.object({
  query: z.string().describe("The user's legal question."),
  // Optional: Consider adding chat history for context in future versions
  // history: z.array(z.object({ role: z.enum(['user', 'assistant']), content: z.string() })).optional(),
});
export type LegalChatInput = z.infer<typeof LegalChatInputSchema>;

const LegalChatOutputSchema = z.object({
  response: z.string().describe("The AI's answer to the legal question."),
});
export type LegalChatOutput = z.infer<typeof LegalChatOutputSchema>;

export async function legalChat(input: LegalChatInput): Promise<LegalChatOutput> {
  return legalChatFlow(input);
}

const prompt = ai.definePrompt({
  name: 'legalChatPrompt',
  input: {schema: LegalChatInputSchema},
  output: {schema: LegalChatOutputSchema},
  prompt: `You are LegallyEasy AI, a specialized legal information assistant. Your goal is to provide helpful and informative answers to legal questions.

IMPORTANT: Always begin your response by stating: "As LegallyEasy AI, I can provide information, but this is not legal advice. For specific legal issues, please consult a qualified legal professional."

Then, address the user's question: {{{query}}}`,
});

const legalChatFlow = ai.defineFlow(
  {
    name: 'legalChatFlow',
    inputSchema: LegalChatInputSchema,
    outputSchema: LegalChatOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output!;
  }
);

