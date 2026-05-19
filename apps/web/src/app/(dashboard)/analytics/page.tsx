'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  RadialBarChart,
  RadialBar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { getPermits } from '@/lib/api-client';
import { PERMIT_STATUS_CONFIG, PERMIT_TYPE_CONFIG } from '@permitpro/shared';
import type { PermitListItem, PermitStatus, PermitType } from '@permitpro/shared';
import { PageHeader } from '@/components/ui/PageHeader';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { format, subMonths, startOfMonth } from 'date-fns';

const DATE_RANGES = [
  { label: '3 months', months: 3 },
  { label: '6 months', months: 6 },
  { label: '12 months', months: 12 },
];

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState(6);

  const { data, isLoading } = useQuery({
    queryKey: ['permits-analytics'],
    queryFn: () => getPermits({ limit: 500 }),
  });

  const permits: PermitListItem[] = data?.data ?? [];

  if (isLoading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <PageHeader title="Analytics" />
        <div className="py-20 flex items-center justify-center"><LoadingSpinner /></div>
      </div>
    );
  }

  // 1. Permits by status
  const byStatus = Object.entries(PERMIT_STATUS_CONFIG).map(([status, config]) => ({
    status: config.label,
    count: permits.filter((p) => p.status === status as PermitStatus).length,
    fill: config.color,
  })).filter((s) => s.count > 0);

  // 2. Monthly submissions (last N months)
  const monthlyData = Array.from({ length: dateRange }, (_, i) => {
    const month = subMonths(new Date(), dateRange - 1 - i);
    const monthKey = format(startOfMonth(month), 'yyyy-MM');
    const count = permits.filter((p) => {
      if (!p.appliedDate) return false;
      return format(startOfMonth(new Date(p.appliedDate)), 'yyyy-MM') === monthKey;
    }).length;
    return { month: format(month, 'MMM yy'), count };
  });

  // 3. Permits by type (top 8)
  const byType = Object.entries(PERMIT_TYPE_CONFIG)
    .map(([type, config]) => ({
      name: config.label,
      value: permits.filter((p) => p.type === type as PermitType).length,
    }))
    .filter((t) => t.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  // 4. Avg completion rate
  const avgCompletion = permits.length
    ? Math.round(permits.reduce((s, p) => s + (p.completionPercentage ?? 0), 0) / permits.length)
    : 0;

  const radialData = [{ name: 'Completion', value: avgCompletion, fill: '#F59E0B' }];

  // 5. Doc expiry forecast (next 6 months — approximate with permit expiry)
  const expiryForecast = Array.from({ length: 6 }, (_, i) => {
    const month = subMonths(new Date(), -i - 1);
    const monthKey = format(startOfMonth(month), 'yyyy-MM');
    const count = permits.filter((p) => {
      if (!p.expirationDate) return false;
      return format(startOfMonth(new Date(p.expirationDate)), 'yyyy-MM') === monthKey;
    }).length;
    return { month: format(month, 'MMM yy'), expiring: count };
  });

  const PIE_COLORS = ['#0F2044', '#1e3a6e', '#4a6fa5', '#F59E0B', '#D97706', '#10B981', '#8B5CF6', '#EF4444'];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <PageHeader
        title="Analytics"
        description="Permit portfolio overview and trends."
        action={
          <div className="flex items-center gap-2">
            {DATE_RANGES.map((r) => (
              <button
                key={r.months}
                onClick={() => setDateRange(r.months)}
                className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${dateRange === r.months ? 'bg-[#0F2044] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                {r.label}
              </button>
            ))}
          </div>
        }
      />

      {/* Top stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Permits', value: permits.length },
          { label: 'Active', value: permits.filter(p => ['ACTIVE', 'ISSUED', 'SUBMITTED', 'UNDER_REVIEW'].includes(p.status)).length },
          { label: 'Avg Completion', value: `${avgCompletion}%` },
          { label: 'Expiring Soon', value: permits.filter(p => {
            const d = p.expirationDate ? new Date(p.expirationDate) : null;
            if (!d) return false;
            const days = Math.ceil((d.getTime() - Date.now()) / 86400000);
            return days >= 0 && days <= 30;
          }).length },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <div className="text-2xl font-bold text-[#0F2044] font-display">{s.value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Charts grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Permits by status */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-semibold text-gray-900 text-sm mb-4">Permits by Status</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={byStatus} barSize={24}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="status" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {byStatus.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Monthly submissions */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-semibold text-gray-900 text-sm mb-4">Monthly Submissions</h3>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#0F2044" strokeWidth={2} dot={{ fill: '#F59E0B', r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Permits by type */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-semibold text-gray-900 text-sm mb-4">Permits by Type</h3>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={byType} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                {byType.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Avg completion radial */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col items-center justify-center">
          <h3 className="font-semibold text-gray-900 text-sm mb-4 self-start">Avg Completion Rate</h3>
          <ResponsiveContainer width="100%" height={200}>
            <RadialBarChart cx="50%" cy="50%" innerRadius="60%" outerRadius="90%" data={radialData} startAngle={90} endAngle={-270}>
              <RadialBar dataKey="value" cornerRadius={8} background={{ fill: '#f3f4f6' }} />
            </RadialBarChart>
          </ResponsiveContainer>
          <div className="text-4xl font-bold text-[#0F2044] font-display -mt-14">{avgCompletion}%</div>
          <p className="text-sm text-gray-400 mt-1">portfolio average</p>
        </div>
      </div>

      {/* Expiry forecast */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h3 className="font-semibold text-gray-900 text-sm mb-4">Permit Expiry Forecast (Next 6 Months)</h3>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={expiryForecast}>
            <defs>
              <linearGradient id="expiryGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#EF4444" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Area type="monotone" dataKey="expiring" stroke="#EF4444" fill="url(#expiryGrad)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
