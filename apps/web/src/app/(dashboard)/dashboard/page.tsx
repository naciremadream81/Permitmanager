import { Suspense } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { InsightsPanel } from '@/components/dashboard/InsightsPanel';
import { DeadlinesList } from '@/components/dashboard/DeadlinesList';
import { RecentPermitsTable } from '@/components/dashboard/RecentPermitsTable';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import {
  FileText,
  AlertTriangle,
  Clock,
  CheckCircle,
} from 'lucide-react';

async function getDashboardData() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const [insightsRes, permitsRes] = await Promise.allSettled([
      fetch(`${baseUrl}/api/insights`, { cache: 'no-store' }),
      fetch(`${baseUrl}/api/permits?limit=5`, { cache: 'no-store' }),
    ]);

    const insights =
      insightsRes.status === 'fulfilled' && insightsRes.value.ok
        ? await insightsRes.value.json()
        : [];

    const permitsData =
      permitsRes.status === 'fulfilled' && permitsRes.value.ok
        ? await permitsRes.value.json()
        : { data: [], total: 0 };

    return { insights, permits: permitsData.data ?? [], total: permitsData.total ?? 0 };
  } catch {
    return { insights: [], permits: [], total: 0 };
  }
}

export default async function DashboardPage() {
  const { insights, permits, total } = await getDashboardData();

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <PageHeader
        title="Dashboard"
        description="Welcome back. Here's what needs your attention today."
      />

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Permits"
          value={total}
          icon={FileText}
          color="text-blue-600"
        />
        <StatsCard
          title="Active Permits"
          value={permits.filter((p: { status: string }) => ['ACTIVE', 'ISSUED', 'UNDER_REVIEW', 'SUBMITTED'].includes(p.status)).length}
          icon={CheckCircle}
          color="text-green-600"
        />
        <StatsCard
          title="Pending Action"
          value={permits.filter((p: { status: string }) => ['CORRECTIONS_NEEDED', 'PENDING_REVIEW', 'DRAFT'].includes(p.status)).length}
          icon={Clock}
          color="text-amber-600"
        />
        <StatsCard
          title="Urgent Issues"
          value={insights.filter((i: { severity: string }) => i.severity === 'critical').length}
          icon={AlertTriangle}
          color="text-red-600"
        />
      </div>

      {/* Insights + Deadlines */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Suspense fallback={<LoadingSpinner />}>
          <InsightsPanel insights={insights} />
        </Suspense>
        <Suspense fallback={<LoadingSpinner />}>
          <DeadlinesList />
        </Suspense>
      </div>

      {/* Recent permits table */}
      <Suspense fallback={<LoadingSpinner />}>
        <RecentPermitsTable permits={permits} />
      </Suspense>
    </div>
  );
}
