'use client';

import Link from 'next/link';
import { AlertTriangle, Info, AlertCircle, CheckCircle, ArrowRight } from 'lucide-react';
import type { Insight } from '@/lib/api-client';
import { cn } from '@/lib/utils';

interface InsightsPanelProps {
  insights: Insight[];
}

const severityConfig = {
  critical: {
    icon: AlertCircle,
    bg: 'bg-red-50',
    border: 'border-red-200',
    iconColor: 'text-red-600',
    titleColor: 'text-red-900',
  },
  warning: {
    icon: AlertTriangle,
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    iconColor: 'text-amber-600',
    titleColor: 'text-amber-900',
  },
  info: {
    icon: Info,
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    iconColor: 'text-blue-600',
    titleColor: 'text-blue-900',
  },
};

export function InsightsPanel({ insights }: InsightsPanelProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <h2 className="font-semibold text-gray-900">AI Insights</h2>
        <span className="text-xs text-gray-400">{insights.length} items</span>
      </div>

      {insights.length === 0 ? (
        <div className="py-12 px-6 text-center">
          <CheckCircle className="w-10 h-10 text-green-400 mx-auto mb-3" />
          <p className="font-medium text-gray-700 mb-1">All clear!</p>
          <p className="text-sm text-gray-400">No urgent insights — everything looks good</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-50 max-h-[360px] overflow-y-auto">
          {insights.slice(0, 8).map((insight) => {
            const config = severityConfig[insight.severity] ?? severityConfig.info;
            const Icon = config.icon;

            return (
              <div key={insight.id} className={cn('p-4 flex gap-3', config.bg)}>
                <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0', config.bg, 'border', config.border)}>
                  <Icon className={cn('w-4 h-4', config.iconColor)} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn('text-sm font-medium', config.titleColor)}>{insight.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{insight.description}</p>
                  {insight.permitId && (
                    <Link
                      href={`/permits/${insight.permitId}`}
                      className="inline-flex items-center gap-1 text-xs text-[#0F2044] font-medium mt-1.5 hover:underline"
                    >
                      {insight.permitTitle || 'View permit'}
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
