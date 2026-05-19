import OpenAI from 'openai';
import { MODELS, TEMPERATURES } from './config';

export interface PermitSummary {
  headline: string;
  statusNarrative: string;
  keyDates: Array<{ label: string; date: string; isUpcoming: boolean }>;
  criticalIssues: string[];
  nextSteps: string[];
  progressHighlights: string[];
  riskStatement: string;
}

export interface PermitSummaryInput {
  title: string;
  type: string;
  status: string;
  jurisdiction: string;
  agency: string;
  appliedDate?: string;
  issuedDate?: string;
  expirationDate?: string;
  completionPercentage: number;
  riskScore: number;
  documentCount: number;
  approvedDocuments: number;
  pendingDocuments: number;
  rejectedDocuments: number;
  checklistTotal: number;
  checklistCompleted: number;
  checklistBlocked: number;
  pendingFees: number;
  totalFeeAmount: number;
  upcomingInspections: Array<{ type: string; date: string }>;
  recentActivity: Array<{ action: string; date: string }>;
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function generatePermitSummary(input: PermitSummaryInput): Promise<PermitSummary> {
  try {
    const response = await openai.chat.completions.create({
      model: MODELS.analysis,
      messages: [
        {
          role: 'system',
          content: `You are a permit coordinator generating a status summary. Be direct, specific, actionable.
Return JSON: {
  "headline": "one sentence",
  "statusNarrative": "2-3 sentences",
  "keyDates": [{ "label": "string", "date": "YYYY-MM-DD", "isUpcoming": bool }],
  "criticalIssues": ["string"],
  "nextSteps": ["2-4 specific actions"],
  "progressHighlights": ["2-3 wins"],
  "riskStatement": "one sentence"
}`,
        },
        { role: 'user', content: `Generate status summary:\n${JSON.stringify(input, null, 2)}` },
      ],
      temperature: TEMPERATURES.generation,
      response_format: { type: 'json_object' },
      max_tokens: 1000,
    });

    const content = response.choices[0].message.content;
    if (!content) throw new Error('No content');
    return JSON.parse(content) as PermitSummary;
  } catch {
    return {
      headline: `${input.title} — ${input.status}`,
      statusNarrative: `This ${input.type} permit is ${input.status} and ${input.completionPercentage}% complete.`,
      keyDates: [],
      criticalIssues: [],
      nextSteps: ['Review current status'],
      progressHighlights: [],
      riskStatement: `Risk score: ${input.riskScore}/100`,
    };
  }
}

export async function generateWeeklyDigest(
  permits: PermitSummaryInput[],
  orgName: string,
): Promise<string> {
  const summary = {
    orgName,
    totalPermits: permits.length,
    byStatus: permits.reduce(
      (acc, p) => {
        acc[p.status] = (acc[p.status] ?? 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    ),
    averageCompletion:
      permits.length > 0
        ? Math.round(
            permits.reduce((s, p) => s + p.completionPercentage, 0) / permits.length,
          )
        : 0,
    highRiskPermits: permits.filter(p => p.riskScore >= 60).length,
    totalPendingFees: permits.reduce((s, p) => s + p.totalFeeAmount, 0),
  };

  try {
    const response = await openai.chat.completions.create({
      model: MODELS.analysis,
      messages: [
        {
          role: 'system',
          content:
            'Write a concise weekly permit portfolio digest. Direct, specific, actionable. 3-4 paragraphs max.',
        },
        {
          role: 'user',
          content: `Weekly digest for ${orgName}:\n${JSON.stringify(summary, null, 2)}`,
        },
      ],
      temperature: TEMPERATURES.generation,
      max_tokens: 500,
    });

    return response.choices[0].message.content ?? 'Unable to generate digest.';
  } catch {
    return `${orgName} portfolio: ${summary.totalPermits} permits, ${summary.highRiskPermits} high-risk. Average completion: ${summary.averageCompletion}%.`;
  }
}
