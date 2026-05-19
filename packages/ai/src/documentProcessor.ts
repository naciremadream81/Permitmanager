import OpenAI from 'openai';
import { MODELS, TEMPERATURES } from './config';

export interface ExtractedDocumentData {
  documentType: string;
  confidence: number;
  fields: Record<string, string | number | boolean | null>;
  expirationDate?: string;
  licenseNumber?: string;
  amounts?: number[];
  names?: string[];
  dates?: string[];
  flags: string[];
  summary: string;
}

export interface ClassificationResult {
  category: string;
  confidence: number;
  reasoning: string;
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function extractDocumentData(
  fileUrl: string,
  mimeType: string,
  fileName: string,
): Promise<ExtractedDocumentData> {
  const isImage = mimeType.startsWith('image/');

  const systemPrompt = `You are a document extraction specialist for construction permit management.
Extract structured data from permit-related documents including:
- Document type and classification
- Expiration/effective dates (ISO format)
- License numbers, permit numbers, reference numbers
- Monetary amounts and fees
- Names (people, companies, contractors)
- Addresses and project locations
- Any compliance flags or issues

Return a JSON object with these exact fields:
{
  "documentType": "string describing document type",
  "confidence": 0-1 float,
  "fields": { "key": "value" pairs of extracted data },
  "expirationDate": "ISO date string or null",
  "licenseNumber": "string or null",
  "amounts": [array of numbers],
  "names": [array of strings],
  "dates": [array of ISO date strings],
  "flags": ["array of issues or warnings"],
  "summary": "2-3 sentence description of the document"
}`;

  const userContent: OpenAI.ChatCompletionContentPart[] = [
    {
      type: 'text',
      text: `Extract structured data from this document. File name: ${fileName}`,
    },
  ];

  if (isImage) {
    userContent.push({
      type: 'image_url',
      image_url: { url: fileUrl, detail: 'high' },
    });
  } else {
    userContent.push({
      type: 'text',
      text: `Document URL: ${fileUrl}\nMIME type: ${mimeType}\nExtract data based on filename, context, and any available content.`,
    });
  }

  try {
    const response = await openai.chat.completions.create({
      model: MODELS.vision,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent },
      ],
      temperature: TEMPERATURES.extraction,
      response_format: { type: 'json_object' },
      max_tokens: 2000,
    });

    const content = response.choices[0].message.content;
    if (!content) throw new Error('No content in extraction response');
    return JSON.parse(content) as ExtractedDocumentData;
  } catch (error) {
    return {
      documentType: 'Unknown',
      confidence: 0,
      fields: {},
      flags: ['AI extraction failed — manual review required'],
      summary: `Document uploaded: ${fileName}`,
      names: [],
      dates: [],
      amounts: [],
    };
  }
}

export async function classifyDocument(
  fileName: string,
  extractedData?: Partial<ExtractedDocumentData>,
): Promise<ClassificationResult> {
  const context = extractedData ? JSON.stringify(extractedData) : 'No extracted data';

  try {
    const response = await openai.chat.completions.create({
      model: MODELS.analysis,
      messages: [
        {
          role: 'system',
          content: `You are a document classifier for a permit management system.
Classify into one of: APPLICATION, PLAN, ENGINEERING, SURVEY, ENVIRONMENTAL, INSURANCE, LICENSE, PERMIT_COPY, CORRESPONDENCE, INSPECTION_REPORT, PHOTO, RECEIPT, CONTRACT, APPROVAL_LETTER, NOTICE, OTHER
Return JSON: { "category": "CATEGORY", "confidence": 0-1, "reasoning": "brief explanation" }`,
        },
        {
          role: 'user',
          content: `File: ${fileName}\nExtracted data: ${context}`,
        },
      ],
      temperature: TEMPERATURES.extraction,
      response_format: { type: 'json_object' },
      max_tokens: 300,
    });

    const content = response.choices[0].message.content;
    if (!content) throw new Error('No content');
    return JSON.parse(content) as ClassificationResult;
  } catch {
    return { category: 'OTHER', confidence: 0, reasoning: 'Classification unavailable' };
  }
}

export async function detectDocumentIssues(
  extractedData: ExtractedDocumentData,
  permitContext: string,
): Promise<string[]> {
  try {
    const response = await openai.chat.completions.create({
      model: MODELS.analysis,
      messages: [
        {
          role: 'system',
          content: 'Identify document issues or gaps for a permit application. Return JSON: { "issues": ["issue1"] }',
        },
        {
          role: 'user',
          content: `Document: ${JSON.stringify(extractedData)}\n\nPermit context: ${permitContext}`,
        },
      ],
      temperature: TEMPERATURES.extraction,
      response_format: { type: 'json_object' },
      max_tokens: 500,
    });

    const content = response.choices[0].message.content;
    if (!content) return [];
    const result = JSON.parse(content) as { issues: string[] };
    return result.issues ?? [];
  } catch {
    return [];
  }
}
