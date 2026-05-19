import type { LucideIcon } from 'lucide-react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: string | number;
  trend?: number;
  icon: LucideIcon;
  color?: string;
}

export function StatsCard({ title, value, trend, icon: Icon, color = 'text-navy-900' }: StatsCardProps) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center bg-gray-50', color.replace('text-', 'text-').replace('600', '100').replace('700', '100'))}>
          <Icon className={cn('w-5 h-5', color)} />
        </div>
        {trend !== undefined && (
          <div className={cn(
            'flex items-center gap-1 text-xs font-medium',
            trend >= 0 ? 'text-green-600' : 'text-red-600'
          )}>
            {trend >= 0 ? (
              <TrendingUp className="w-3.5 h-3.5" />
            ) : (
              <TrendingDown className="w-3.5 h-3.5" />
            )}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div className="text-2xl font-bold text-gray-900 font-display mb-0.5">{value}</div>
      <div className="text-sm text-gray-500">{title}</div>
    </div>
  );
}
