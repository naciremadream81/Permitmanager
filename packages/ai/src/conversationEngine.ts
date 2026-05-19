import OpenAI from 'openai';
import type {
  Permit,
  Document,
  ChecklistItem,
  Inspection,
  Fee,
} from '@permitpro/shared';
import {
  MODELS,
  SYSTEM_PROMPTS,
  TEMPERATURES,
  TOKEN_LIMITS,
  estimateTokens,
  truncateToTokenBudget,
} from './config';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface PermitRelations {
  documents: Document[];
  checklist: ChecklistItem[];
  inspections: Inspection[];
  fees: Fee[];
}

export interface StreamChatOptions {
  messages: ChatMessage[];
  permitContext?: string;
  onChunk?: (chunk: string) => void;
  signal?: AbortSignal;
}

function formatDate(date: string | Date | null | undefined): string {
  if (!date) return 'N/A';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function formatCurrency(amount: number | null | undefined): string {
  if (amount == null) return 'N/A';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

/**
 * Build a text context block from permit data for the AI to reference
 */
export function buildPermitContext(
  permit: Permit,
  documents: Document[],
  checklist: ChecklistItem[],
  inspections: Inspection[],
  fees: Fee[]
): string {
  const sections: string[] = [];

  // Permit overview
  sections.push(`=== PERMIT: ${permit.permitNumber ?? permit.id} ===
Type: ${permit.type}
Status: ${permit.status}
Address: ${permit.address ?? 'Not specified'}
Jurisdiction: ${permit.jurisdiction ?? 'Not specified'}
Applicant: ${permit.applicantName ?? 'Not specified'}
Submitted: ${formatDate(permit.submittedDate)}
Target Completion: ${formatDate(permit.targetDate)}
Description: ${permit.description ?? 'None'}`);

  // Documents
  if (documents.length > 0) {
    const docLines = documents.map(
      (d) =>
        `  - [${d.id}] ${d.name} | Category: ${d.category} | Status: ${d.status} | Uploaded: ${formatDate(d.uploadedAt)}${d.expirationDate ? ` | Expires: ${formatDate(d.expirationDate)}` : ''}`
    );
    sections.push(`\nDOCUMENTS (${documents.length}):\n${docLines.join('\n')}`);
  } else {
    sections.push('\nDOCUMENTS: None uploaded');
  }

  // Checklist
  if (checklist.length > 0) {
    const completed = checklist.filter((c) => c.completed).length;
    const checklistLines = checklist.map(
      (c) =>
        `  - [${c.completed ? 'X' : ' '}] ${c.title}${c.category ? ` (${c.category})` : ''}${c.dueDate ? ` | Due: ${formatDate(c.dueDate)}` : ''}`
    );
    sections.push(
      `\nCHECKLIST (${completed}/${checklist.length} complete):\n${checklistLines.join('\n')}`
    );
  } else {
    sections.push('\nCHECKLIST: Not generated');
  }

  // Inspections
  if (inspections.length > 0) {
    const inspectionLines = inspections.map(
      (i) =>
        `  - [${i.id}] ${i.type} | Status: ${i.status} | Scheduled: ${formatDate(i.scheduledDate)}${i.result ? ` | Result: ${i.result}` : ''}`
    );
    sections.push(
      `\nINSPECTIONS (${inspections.length}):\n${inspectionLines.join('\n')}`
    );
  } else {
    sections.push('\nINSPECTIONS: None scheduled');
  }

  // Fees
  if (fees.length > 0) {
    const totalDue = fees
      .filter((f) => f.status !== 'paid')
      .reduce((sum, f) => sum + (f.amount ?? 0), 0);
    const totalPaid = fees
      .filter((f) => f.status === 'paid')
      .reduce((sum, f) => sum + (f.amount ?? 0), 0);
    const feeLines = fees.map(
      (f) =>
        `  - [${f.id}] ${f.description} | ${formatCurrency(f.amount)} | Status: ${f.status}${f.dueDate ? ` | Due: ${formatDate(f.dueDate)}` : ''}`
    );
    sections.push(
      `\nFEES (Paid: ${formatCurrency(totalPaid)} | Outstanding: ${formatCurrency(totalDue)}):\n${feeLines.join('\n')}`
    );
  } else {
    sections.push('\nFEES: None recorded');
  }

  return sections.join('\n');
}

/**
 * Prepare messages array with system prompt and context, respecting token limits
 */
function prepareMessages(
  messages: ChatMessage[],
  permitContext?: string
): OpenAI.Chat.Completions.ChatCompletionMessageParam[] {
  const systemContent = permitContext
    ? `${SYSTEM_PROMPTS.COORDINATOR}\n\n--- CURRENT PERMIT DATA ---\n${permitContext}\n--- END PERMIT DATA ---`
    : SYSTEM_PROMPTS.COORDINATOR;

  const systemTokens = estimateTokens(systemContent);
  const availableTokens =
    TOKEN_LIMITS.CONVERSATION_BUDGET -
    systemTokens -
    TOKEN_LIMITS.MAX_OUTPUT -
    TOKEN_LIMITS.SAFETY_MARGIN;

  // Build messages from most recent, keeping within budget
  const preparedMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [];
  let usedTokens = 0;

  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];
    const msgTokens = estimateTokens(msg.content);
    if (usedTokens + msgTokens > availableTokens) {
      // If we can't even fit the most recent message, truncate it
      if (preparedMessages.length === 0) {
        preparedMessages.unshift({
          role: msg.role,
          content: truncateToTokenBudget(msg.content, availableTokens),
        });
      }
      break;
    }
    preparedMessages.unshift({
      role: msg.role,
      content: msg.content,
    });
    usedTokens += msgTokens;
  }

  return [
    { role: 'system' as const, content: systemContent },
    ...preparedMessages,
  ];
}

/**
 * Stream a chat response from the AI coordinator
 */
export async function* streamChat(
  client: OpenAI,
  options: StreamChatOptions
): AsyncGenerator<string, void, undefined> {
  const { messages, permitContext, onChunk, signal } = options;

  const preparedMessages = prepareMessages(messages, permitContext);

  const stream = await client.chat.completions.create(
    {
      model: MODELS.PRIMARY,
      messages: preparedMessages,
      temperature: TEMPERATURES.CONVERSATION,
      max_tokens: TOKEN_LIMITS.MAX_OUTPUT,
      stream: true,
    },
    { signal }
  );

  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content;
    if (content) {
      if (onChunk) {
        onChunk(content);
      }
      yield content;
    }
  }
}

/**
 * Non-streaming chat for simpler use cases
 */
export async function chat(
  client: OpenAI,
  messages: ChatMessage[],
  permitContext?: string
): Promise<string> {
  const preparedMessages = prepareMessages(messages, permitContext);

  const response = await client.chat.completions.create({
    model: MODELS.PRIMARY,
    messages: preparedMessages,
    temperature: TEMPERATURES.CONVERSATION,
    max_tokens: TOKEN_LIMITS.MAX_OUTPUT,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error('No response content received from AI');
  }
  return content;
}

export function createConversationEngine(client: OpenAI) {
  return {
    buildPermitContext,
    streamChat: (options: StreamChatOptions) => streamChat(client, options),
    chat: (messages: ChatMessage[], permitContext?: string) =>
      chat(client, messages, permitContext),
  };
}
