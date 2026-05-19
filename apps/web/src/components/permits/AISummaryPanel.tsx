'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Sparkles, RefreshCw, AlertCircle, ArrowRight, CheckCircle2, Loader2 } from 'lucide-react';
import { getPermitSummary } from '@/lib/api-client';

interface AISummaryPanelProps {
  permitId: string;
}

export function AISummaryPanel({ permitId }: AISummaryPanelProps) {
  const [refreshKey, setRefreshKey] = useState(0);

  const { data: summary, isLoading, isError, refetch } = useQuery({
    queryKey: ['summary', permitId, refreshKey],
    queryFn: () => getPermitSummary(permitId),
    retry: 1,
  });

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-4 h-4 text-[#F59E0B]" />
          <h3 className="text-sm font-semibold text-gray-700">AI Summary</h3>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Loader2 className="w-4 h-4 animate-spin" />
          Generating summary...
        </div>
      </div>
    );
  }

  if (isError || !summary) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-[#F59E0B]" />
          <h3 className="text-sm font-semibold text-gray-700">AI Summary</h3>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <AlertCircle className="w-4 h-4 text-red-400" />
          <span>Summary unavailable</span>
          <button
            onClick={() => refetch()}
            className="text-[#0F2044] hover:underline text-xs ml-1"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#F59E0B]" />
          <h3 className="text-sm font-semibold text-gray-700">AI Summary</h3>
        </div>
        <button
          onClick={() => setRefreshKey((k) => k + 1)}
          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Regenerate
        </button>
      </div>

      {/* Headline */}
      <div className="bg-[#0F2044]/5 rounded-xl p-3">
        <p className="text-sm font-semibold text-[#0F2044]">{summary.headline}</p>
        <p className="text-xs text-gray-500 mt-1 leading-relaxed">{summary.statusNarrative}</p>
      </div>

      {/* Key Dates */}
      {summary.keyDates?.length > 0 && (
        <div>
          <h4 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Key Dates</h4>
          <div className="space-y-1">
            {summary.keyDates.map((d, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <span className="text-gray-500">{d.label}</span>
                <span className="font-medium text-gray-700">{d.date}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Critical Issues */}
      {summary.criticalIssues?.length > 0 && (
        <div>
          <h4 className="text-xs font-medium text-red-600 uppercase tracking-wider mb-2">Critical Issues</h4>
          <ul className="space-y-1.5">
            {summary.criticalIssues.map((issue, i) => (
              <li key={i} className="flex items-start gap-2 text-xs">
                <AlertCircle className="w-3.5 h-3.5 text-red-500 mt-0.5 flex-shrink-0" />
                <span className="text-red-700">{issue}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Next Steps */}
      {summary.nextSteps?.length > 0 && (
        <div>
          <h4 className="text-xs font-medium text-blue-600 uppercase tracking-wider mb-2">Next Steps</h4>
          <ul className="space-y-1.5">
            {summary.nextSteps.map((step, i) => (
              <li key={i} className="flex items-start gap-2 text-xs">
                <ArrowRight className="w-3.5 h-3.5 text-blue-500 mt-0.5 flex-shrink-0" />
                <span className="text-blue-800">{step}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Risk Statement */}
      {summary.riskStatement && (
        <div className="flex items-start gap-2 bg-amber-50 rounded-xl p-3 border border-amber-100">
          <CheckCircle2 className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-amber-800 leading-relaxed">{summary.riskStatement}</p>
        </div>
      )}
    </div>
  );
}
