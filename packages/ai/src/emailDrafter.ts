import OpenAI from 'openai';
import { MODELS, TEMPERATURES } from './config';

export type EmailType =
  | 'status_inquiry'
  | 'correction_response'
  | 'expedite_request'
  | 'extension_request'
  | 'general_inquiry'
  | 'document_submission';

export interface DraftedEmail {
  subject: string;
  body: string;
  tone: 'professional' | 'formal' | 'urgent';
}

export interface EmailContext {
  permitNumber?: string;
  permitTitle: string;
  agencyName: string;
  recipientName?: string;
  senderName: string;
  senderTitle?: string;
  projectAddress?: string;
  keyPoints?: string[];
  urgency?: 'low' | 'medium' | 'high';
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const EMAIL_TYPE_INSTRUCTIONS: Record<EmailType, string> = {
  status_inquiry: 'Write a professional inquiry about the current status of a permit application.',
  correction_response:
    'Write a response addressing plan check corrections, explaining how each has been resolved.',
  expedite_request:
    'Write a respectful but persuasive request to expedite permit review.',
  extension_request:
    'Write a request for a permit extension, explaining the circumstances.',
  general_inquiry: 'Write a clear, professional general inquiry.',
  document_submission:
    'Write a cover letter for document submission, summarizing what is enclosed.',
};

export async function draftAgencyEmail(
  emailType: EmailType,
  context: EmailContext,
  additionalInstructions?: string,
): Promise<DraftedEmail> {
  const instruction = EMAIL_TYPE_INSTRUCTIONS[emailType];

  try {
    const response = await openai.chat.completions.create({
      model: MODELS.analysis,
      messages: [
        {
          role: 'system',
          content: `You are an experienced permit expediter. Draft professional correspondence to government agencies.
- Professional and respectful
- Reference permit numbers and dates specifically
- Clear ask in every email
- 2-4 paragraphs max
Return JSON: { "subject": "string", "body": "string", "tone": "professional|formal|urgent" }`,
        },
        {
          role: 'user',
          content: `Task: ${instruction}
${context.urgency === 'high' ? 'Note: Convey appropriate urgency while remaining professional.' : ''}

Context:
- Permit: ${context.permitTitle}${context.permitNumber ? ` (${context.permitNumber})` : ''}
- Agency: ${context.agencyName}
- Recipient: ${context.recipientName ?? 'Permit Department'}
- Project: ${context.projectAddress ?? 'See permit'}
- Sender: ${context.senderName}${context.senderTitle ? `, ${context.senderTitle}` : ''}
${context.keyPoints?.length ? `Key points:\n${context.keyPoints.map(p => `- ${p}`).join('\n')}` : ''}
${additionalInstructions ? `Additional instructions: ${additionalInstructions}` : ''}`,
        },
      ],
      temperature: TEMPERATURES.generation,
      response_format: { type: 'json_object' },
      max_tokens: 1000,
    });

    const content = response.choices[0].message.content;
    if (!content) throw new Error('No content');
    return JSON.parse(content) as DraftedEmail;
  } catch {
    return {
      subject: `Re: ${context.permitTitle}${context.permitNumber ? ` (${context.permitNumber})` : ''}`,
      body: 'Unable to draft email at this time. Please try again.',
      tone: 'professional',
    };
  }
}

export async function improveEmail(draft: string, instructions: string): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: MODELS.analysis,
      messages: [
        {
          role: 'system',
          content:
            'Improve this email per the instructions. Return only the improved body, no commentary.',
        },
        { role: 'user', content: `Email:\n\n${draft}\n\nInstructions: ${instructions}` },
      ],
      temperature: TEMPERATURES.generation,
      max_tokens: 800,
    });

    return response.choices[0].message.content ?? draft;
  } catch {
    return draft;
  }
}
