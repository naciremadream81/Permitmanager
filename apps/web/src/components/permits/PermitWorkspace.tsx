'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  Upload,
  ClipboardList,
  RefreshCw,
  ChevronDown,
  ArrowLeft,
} from 'lucide-react';
import Link from 'next/link';
import type { PermitWithRelations, PermitStatus } from '@permitpro/shared';
import { PERMIT_STATUS_CONFIG, PERMIT_STATUS_TRANSITIONS, PERMIT_TYPE_CONFIG } from '@permitpro/shared';
import { PermitStatusBadge } from './PermitStatusBadge';
import { RiskScoreGauge } from './RiskScoreGauge';
import { OverviewTab } from './tabs/OverviewTab';
import { DocumentsTab } from './tabs/DocumentsTab';
import { ChecklistTab } from './tabs/ChecklistTab';
import { InspectionsTab } from './tabs/InspectionsTab';
import { FeesTab } from './tabs/FeesTab';
import { ActivityTab } from './tabs/ActivityTab';
import { AIChatTab } from './tabs/AIChatTab';
import { updatePermit } from '@/lib/api-client';
import { cn } from '@/lib/utils';

interface PermitWorkspaceProps {
  permit: PermitWithRelations;
}

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'documents', label: 'Documents' },
  { id: 'checklist', label: 'Checklist' },
  { id: 'inspections', label: 'Inspections' },
  { id: 'fees', label: 'Fees' },
  { id: 'activity', label: 'Activity' },
  { id: 'ai', label: 'AI Chat' },
];

export function PermitWorkspace({ permit }: PermitWorkspaceProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');
  const [currentStatus, setCurrentStatus] = useState<PermitStatus>(permit.status);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);

  const availableTransitions = PERMIT_STATUS_TRANSITIONS[currentStatus] ?? [];

  async function handleStatusChange(newStatus: PermitStatus) {
    setIsUpdatingStatus(true);
    setShowStatusMenu(false);
    try {
      await updatePermit(permit.id, { status: newStatus });
      setCurrentStatus(newStatus);
      toast.success(`Status updated to ${PERMIT_STATUS_CONFIG[newStatus]?.label}`);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update status');
    } finally {
      setIsUpdatingStatus(false);
    }
  }

  const typeConfig = PERMIT_TYPE_CONFIG[permit.type];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-6 py-5">
        <div className="max-w-7xl mx-auto">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 mb-3">
            <Link href="/permits" className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 transition-colors">
              <ArrowLeft className="w-3.5 h-3.5" />
              Permits
            </Link>
          </div>

          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-xl font-bold text-[#0F2044] font-display truncate">{permit.title}</h1>
                <PermitStatusBadge status={currentStatus} size="md" />
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                {permit.permitNumber && (
                  <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">{permit.permitNumber}</span>
                )}
                {typeConfig && <span>{typeConfig.label}</span>}
                {permit.jurisdiction && <span>{permit.jurisdiction}</span>}
                {permit.project && (
                  <Link href={`/projects/${permit.project.id}`} className="hover:text-[#0F2044] transition-colors">
                    {permit.project.name}
                  </Link>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Risk gauge */}
              <div className="hidden lg:block">
                <RiskScoreGauge score={permit.riskScore} size={80} />
              </div>

              {/* Status change */}
              {availableTransitions.length > 0 && (
                <div className="relative">
                  <button
                    onClick={() => setShowStatusMenu(!showStatusMenu)}
                    disabled={isUpdatingStatus}
                    className="flex items-center gap-2 bg-[#0F2044] hover:bg-[#1e3a6e] disabled:opacity-50 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
                  >
                    <RefreshCw className={cn('w-4 h-4', isUpdatingStatus && 'animate-spin')} />
                    Update Status
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                  {showStatusMenu && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setShowStatusMenu(false)} />
                      <div className="absolute right-0 top-full mt-1 bg-white border border-gray-100 rounded-xl shadow-lg z-20 py-1 min-w-[180px]">
                        {availableTransitions.map((status) => {
                          const config = PERMIT_STATUS_CONFIG[status];
                          return (
                            <button
                              key={status}
                              onClick={() => handleStatusChange(status)}
                              className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
                            >
                              <span className={`w-2 h-2 rounded-full`} style={{ backgroundColor: config.color }} />
                              {config.label}
                            </button>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
              )}

              <button
                onClick={() => setActiveTab('documents')}
                className="flex items-center gap-2 border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-medium px-4 py-2.5 rounded-xl transition-colors"
              >
                <Upload className="w-4 h-4" />
                Upload Doc
              </button>

              <button
                onClick={() => setActiveTab('checklist')}
                className="flex items-center gap-2 border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-medium px-4 py-2.5 rounded-xl transition-colors"
              >
                <ClipboardList className="w-4 h-4" />
                Checklist
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-100 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex gap-1 overflow-x-auto scrollbar-hide">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
                  activeTab === tab.id
                    ? 'border-[#F59E0B] text-[#0F2044]'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-7xl mx-auto">
          {activeTab === 'overview' && (
            <OverviewTab permit={permit} currentStatus={currentStatus} />
          )}
          {activeTab === 'documents' && <DocumentsTab permitId={permit.id} />}
          {activeTab === 'checklist' && <ChecklistTab permitId={permit.id} permitType={permit.type} />}
          {activeTab === 'inspections' && <InspectionsTab permitId={permit.id} />}
          {activeTab === 'fees' && <FeesTab permitId={permit.id} />}
          {activeTab === 'activity' && <ActivityTab permitId={permit.id} />}
          {activeTab === 'ai' && <AIChatTab permitId={permit.id} />}
        </div>
      </div>
    </div>
  );
}
