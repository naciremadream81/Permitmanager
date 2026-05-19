import OpenAI from 'openai';
import { MODELS, TEMPERATURES } from './config';

export interface AIRiskAssessment {
  score: number;
  level: 'low' | 'medium' | 'high' | 'critical';
  factors: Array<{ factor: string; impact: 'low' | 'medium' | 'high'; description: string }>;
  recommendations: string[];
  summary: string;
}

export interface PermitRiskInput {
  type: string;
  status: string;
  jurisdiction: string;
  daysApplied: number;
  completionPercentage: number;
  correctionsReceived: number;
  failedInspections: number;
  overdueItems: number;
  expiringDocuments: number;
  baseRiskScore: number;
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function generateAIRiskAssessment(input: PermitRiskInput): Promise<AIRiskAssessment> {
  try {
    const response = await openai.chat.completions.create({
      model: MODELS.analysis,
      messages: [
        {
          role: 'system',
          content: `You are a permit risk analyst. Assess permit risk.
Return JSON: {
  "score": 0-100,
  "level": "low|medium|high|critical",
  "factors": [{ "factor": "string", "impact": "low|medium|high", "description": "string" }],
  "recommendations": ["string"],
  "summary": "2-3 sentence risk assessment"
}`,
        },
        { role: 'user', content: `Permit data:\n${JSON.stringify(input, null, 2)}` },
      ],
      temperature: TEMPERATURES.analysis,
      response_format: { type: 'json_object' },
      max_tokens: 800,
    });

    const content = response.choices[0].message.content;
    if (!content) throw new Error('No content');
    return JSON.parse(content) as AIRiskAssessment;
  } catch {
    return {
      score: input.baseRiskScore,
      level:
        input.baseRiskScore >= 80
          ? 'critical'
          : input.baseRiskScore >= 60
          ? 'high'
          : input.baseRiskScore >= 30
          ? 'medium'
          : 'low',
      factors: [],
      recommendations: [],
      summary: `Risk score: ${input.baseRiskScore}/100.`,
    };
  }
}
