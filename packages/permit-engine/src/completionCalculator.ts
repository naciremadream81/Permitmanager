import { ChecklistItem, Document, Fee, Inspection } from '@permitpro/shared';
import { ChecklistItemStatus, DocumentStatus, FeeStatus, InspectionStatus } from '@permitpro/shared';

export interface CompletionBreakdown {
  overall: number;
  checklist: number;
  documents: number;
  fees: number;
  inspections: number;
}

/**
 * Calculates weighted completion percentage for a permit.
 * Weights: checklist 40%, documents 35%, fees 15%, inspections 10%
 */
export function calculateCompletion(
  checklistItems: ChecklistItem[],
  documents: Document[],
  fees: Fee[],
  inspections: Inspection[],
): CompletionBreakdown {
  const checklist = calculateChecklistCompletion(checklistItems);
  const docs = calculateDocumentCompletion(documents);
  const feeScore = calculateFeeCompletion(fees);
  const inspectionScore = calculateInspectionCompletion(inspections);

  const hasAnyData =
    checklistItems.length > 0 || documents.length > 0 || fees.length > 0 || inspections.length > 0;
  const overall = !hasAnyData
    ? 0
    : Math.round(
        checklist * 0.4 +
        docs * 0.35 +
        feeScore * 0.15 +
        inspectionScore * 0.1,
      );

  return { overall, checklist, documents: docs, fees: feeScore, inspections: inspectionScore };
}

function calculateChecklistCompletion(items: ChecklistItem[]): number {
  const applicable = items.filter((i) => i.status !== ChecklistItemStatus.NOT_APPLICABLE);
  if (applicable.length === 0) return items.length > 0 ? 100 : 0;
  const completed = applicable.filter((i) => i.status === ChecklistItemStatus.COMPLETED).length;
  return Math.round((completed / applicable.length) * 100);
}

function calculateDocumentCompletion(docs: Document[]): number {
  if (docs.length === 0) return 0;
  const approved = docs.filter((d) => d.status === DocumentStatus.APPROVED).length;
  return Math.round((approved / docs.length) * 100);
}

function calculateFeeCompletion(fees: Fee[]): number {
  if (fees.length === 0) return 100;
  const resolved = fees.filter(
    (f) => f.status === FeeStatus.PAID || f.status === FeeStatus.WAIVED,
  ).length;
  return Math.round((resolved / fees.length) * 100);
}

function calculateInspectionCompletion(inspections: Inspection[]): number {
  if (inspections.length === 0) return 100;
  const passed = inspections.filter((i) => i.status === InspectionStatus.PASSED).length;
  return Math.round((passed / inspections.length) * 100);
}
