import OpenAI from 'openai';
import { PermitType } from '@permitpro/shared';
import { MODELS, TEMPERATURES } from './config';

export interface GeneratedChecklistItem {
  title: string;
  description: string;
  category: string;
  isConditional: boolean;
  condition?: string;
  priority: 'required' | 'recommended' | 'conditional';
  estimatedDays?: number;
}

export interface ChecklistGenerationOptions {
  permitType: PermitType;
  jurisdiction: string;
  projectDescription?: string;
  projectSize?: string;
  specialConditions?: string[];
  existingItems?: string[];
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const PERMIT_TYPE_CONTEXT: Partial<Record<PermitType, string>> = {
  [PermitType.BUILDING]: 'new construction or major structural alterations',
  [PermitType.ELECTRICAL]: 'electrical installation, panel upgrades, or EV chargers',
  [PermitType.PLUMBING]: 'plumbing installation or sewer/water connections',
  [PermitType.MECHANICAL]: 'HVAC or gas line installations',
  [PermitType.DEMOLITION]: 'partial or full structure demolition',
  [PermitType.GRADING]: 'earthwork, grading, or drainage work',
  [PermitType.FIRE]: 'fire suppression or alarm systems',
  [PermitType.ENVIRONMENTAL]: 'projects with CEQA environmental review requirements',
};

export async function generateChecklist(
  options: ChecklistGenerationOptions,
): Promise<GeneratedChecklistItem[]> {
  const { permitType, jurisdiction, projectDescription, projectSize, specialConditions, existingItems } = options;

  const typeContext = PERMIT_TYPE_CONTEXT[permitType] ?? `${permitType} permit`;
  const existingCtx = existingItems?.length
    ? `\nExisting items (do not duplicate):\n${existingItems.join('\n')}`
    : '';
  const conditionsCtx = specialConditions?.length
    ? `\nSpecial conditions: ${specialConditions.join(', ')}`
    : '';

  try {
    const response = await openai.chat.completions.create({
      model: MODELS.analysis,
      messages: [
        {
          role: 'system',
          content: `You are an expert permit coordinator. Generate a comprehensive permit application checklist.

For each item:
- title: concise action item (imperative form)
- description: 1-2 sentences explaining what's needed and why
- category: Application | Plans | Engineering | Insurance | Compliance | Inspection | Fees | Closeout
- isConditional: true if circumstance-dependent
- condition: when it applies (if isConditional)
- priority: "required" | "recommended" | "conditional"
- estimatedDays: rough days to complete

Return JSON: { "items": [...] }`,
        },
        {
          role: 'user',
          content: `Generate checklist for:
Permit Type: ${permitType} (${typeContext})
Jurisdiction: ${jurisdiction}
Project: ${projectDescription ?? 'Not specified'}
Scale: ${projectSize ?? 'Not specified'}${conditionsCtx}${existingCtx}`,
        },
      ],
      temperature: TEMPERATURES.generation,
      response_format: { type: 'json_object' },
      max_tokens: 4000,
    });

    const content = response.choices[0].message.content;
    if (!content) return [];
    const result = JSON.parse(content) as { items: GeneratedChecklistItem[] };
    return result.items ?? [];
  } catch {
    return [];
  }
}

export async function analyzeChecklistGaps(
  permitType: PermitType,
  jurisdiction: string,
  existingItems: Array<{ title: string; status: string; category: string }>,
): Promise<{ gaps: string[]; recommendations: string[] }> {
  try {
    const response = await openai.chat.completions.create({
      model: MODELS.analysis,
      messages: [
        {
          role: 'system',
          content: 'Identify gaps in a permit checklist. Return JSON: { "gaps": ["string"], "recommendations": ["string"] }',
        },
        {
          role: 'user',
          content: `Permit: ${permitType} in ${jurisdiction}\n\nChecklist:\n${JSON.stringify(existingItems)}`,
        },
      ],
      temperature: TEMPERATURES.analysis,
      response_format: { type: 'json_object' },
      max_tokens: 1000,
    });

    const content = response.choices[0].message.content;
    if (!content) return { gaps: [], recommendations: [] };
    return JSON.parse(content) as { gaps: string[]; recommendations: string[] };
  } catch {
    return { gaps: [], recommendations: [] };
  }
}
