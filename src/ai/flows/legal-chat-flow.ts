
'use server';
/**
 * @fileOverview A legal chat AI agent that can use a document for context.
 *
 * - legalChat - A function that handles legal chat queries, optionally with a document.
 * - LegalChatInput - The input type for the legalChat function.
 * - LegalChatOutput - The return type for the legalChat function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const LegalChatInputSchema = z.object({
  query: z.string().describe("The user's legal question."),
  documentDataUri: z
    .string()
    .optional()
    .describe(
      "An optional document file, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  documentName: z
    .string()
    .optional()
    .describe("The name of the uploaded document, e.g., 'contract.pdf'."),
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
  prompt: `You are LegallyEasy AI, a specialized legal information assistant. Your primary goal is to provide helpful and informative answers to legal questions.

If the user's query is clearly not related to legal matters, your *entire response* must be *exactly* this: "This query does not appear to be related to legal matters. As LegallyEasy AI, I can only assist with legal questions." After providing this specific sentence, you must stop and provide no further information or answer. Do not attempt to answer the non-legal query in any other way.

IMPORTANT: If the query *is* legal, always begin your response by stating: "As LegallyEasy AI, I can provide information, but this is not legal advice. For specific legal issues, please consult a qualified legal professional."

{{#if documentDataUri}}
The user has provided the following document named '{{documentName}}' for reference. Use its content to inform your answer to the user's query if it's relevant to the legal question.
Document Content:
{{media url=documentDataUri}}
{{/if}}

Please address the user's legal question based on the information provided (if any document was attached) and your general legal knowledge: {{{query}}}`,
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

