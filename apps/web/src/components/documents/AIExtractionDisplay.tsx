import { CheckCircle2, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ExtractedField {
  label: string;
  value: string;
  confidence?: number;
  flagged?: boolean;
}

interface AIExtractionDisplayProps {
  extractedData: Record<string, unknown> | null;
}

function parseExtractedData(data: Record<string, unknown>): ExtractedField[] {
  const fields: ExtractedField[] = [];
  for (const [key, val] of Object.entries(data)) {
    if (key.startsWith('_')) continue;
    fields.push({
      label: key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      value: String(val),
      confidence: (data[`_${key}_confidence`] as number) ?? 1,
      flagged: (data[`_${key}_flagged`] as boolean) ?? false,
    });
  }
  return fields;
}

export function AIExtractionDisplay({ extractedData }: AIExtractionDisplayProps) {
  if (!extractedData || Object.keys(extractedData).length === 0) {
    return (
      <div className="text-xs text-gray-400 italic">No data extracted</div>
    );
  }

  const fields = parseExtractedData(extractedData);

  if (fields.length === 0) {
    return <div className="text-xs text-gray-400 italic">No extracted fields available</div>;
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-3 space-y-2">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
        AI Extracted Fields
      </p>
      {fields.map((field) => (
        <div key={field.label} className="flex items-start gap-2">
          {field.flagged ? (
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
          ) : (
            <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0 mt-0.5" />
          )}
          <div className="flex-1 min-w-0">
            <span className="text-xs text-gray-400">{field.label}: </span>
            <span className={cn('text-xs font-medium', field.flagged ? 'text-amber-700' : 'text-gray-700')}>
              {field.value}
            </span>
          </div>
          {field.confidence !== undefined && field.confidence < 0.8 && (
            <span className="text-xs text-amber-500 flex-shrink-0">
              {Math.round(field.confidence * 100)}%
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
