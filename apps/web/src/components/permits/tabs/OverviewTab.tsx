import type { PermitWithRelations, PermitStatus } from '@permitpro/shared';
import { StatusTimeline } from '../StatusTimeline';
import { AISummaryPanel } from '../AISummaryPanel';
import { formatDate, formatCurrency } from '@/lib/utils';
import { Calendar, Building2, FileText, DollarSign, TrendingUp } from 'lucide-react';
import { RiskScoreGauge } from '../RiskScoreGauge';

interface OverviewTabProps {
  permit: PermitWithRelations;
  currentStatus: PermitStatus;
}

export function OverviewTab({ permit, currentStatus }: OverviewTabProps) {
  return (
    <div className="space-y-5">
      {/* Status Timeline */}
      <StatusTimeline currentStatus={currentStatus} />

      {/* AI Summary */}
      <AISummaryPanel permitId={permit.id} />

      {/* Details grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Key Dates */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-4 h-4 text-gray-400" />
            <h3 className="text-sm font-semibold text-gray-700">Key Dates</h3>
          </div>
          <div className="space-y-3">
            {[
              { label: 'Applied', value: formatDate(permit.appliedDate) },
              { label: 'Issued', value: formatDate(permit.issuedDate) },
              { label: 'Expires', value: formatDate(permit.expirationDate) },
              { label: 'Last Updated', value: formatDate(permit.updatedAt) },
              { label: 'Created', value: formatDate(permit.createdAt) },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                <span className="text-xs text-gray-400">{label}</span>
                <span className="text-sm text-gray-700 font-medium">{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Permit Details */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <Building2 className="w-4 h-4 text-gray-400" />
            <h3 className="text-sm font-semibold text-gray-700">Permit Details</h3>
          </div>
          <div className="space-y-3">
            {[
              { label: 'Jurisdiction', value: permit.jurisdiction || '—' },
              { label: 'Agency', value: permit.agency || '—' },
              { label: 'Permit #', value: permit.permitNumber || '—' },
              { label: 'Completion', value: `${permit.completionPercentage ?? 0}%` },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                <span className="text-xs text-gray-400">{label}</span>
                <span className="text-sm text-gray-700 font-medium">{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Description + financials */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Description */}
        {permit.description && (
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-3">
              <FileText className="w-4 h-4 text-gray-400" />
              <h3 className="text-sm font-semibold text-gray-700">Description</h3>
            </div>
            <p className="text-sm text-gray-500 leading-relaxed">{permit.description}</p>
          </div>
        )}

        {/* Financials */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="w-4 h-4 text-gray-400" />
            <h3 className="text-sm font-semibold text-gray-700">Financials</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-1.5 border-b border-gray-50">
              <span className="text-xs text-gray-400">Estimated Cost</span>
              <span className="text-sm font-medium text-gray-700">{formatCurrency(permit.estimatedCost)}</span>
            </div>
            <div className="flex items-center justify-between py-1.5">
              <span className="text-xs text-gray-400">Actual Cost</span>
              <span className="text-sm font-medium text-gray-700">{formatCurrency(permit.actualCost)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Risk Section */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-4 h-4 text-gray-400" />
          <h3 className="text-sm font-semibold text-gray-700">Risk Assessment</h3>
        </div>
        <div className="flex items-start gap-8">
          <RiskScoreGauge score={permit.riskScore} size={100} />
          <div className="flex-1">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 bg-gray-50 rounded-xl">
                <div className="text-lg font-bold text-gray-900">{permit.documents?.length ?? 0}</div>
                <div className="text-xs text-gray-400 mt-0.5">Documents</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-xl">
                <div className="text-lg font-bold text-gray-900">{permit.checklistItems?.filter(i => i.status === 'COMPLETED').length ?? 0}/{permit.checklistItems?.length ?? 0}</div>
                <div className="text-xs text-gray-400 mt-0.5">Checklist</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-xl">
                <div className="text-lg font-bold text-gray-900">{permit.inspections?.filter(i => i.status === 'PASSED').length ?? 0}</div>
                <div className="text-xs text-gray-400 mt-0.5">Inspections Passed</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
