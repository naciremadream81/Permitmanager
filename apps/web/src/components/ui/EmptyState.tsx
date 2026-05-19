import type { LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    href?: string;
  };
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 px-6 text-center', className)}>
      {Icon && (
        <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mb-4">
          <Icon className="w-7 h-7 text-gray-300" />
        </div>
      )}
      <h3 className="font-semibold text-gray-700 mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-gray-400 max-w-xs leading-relaxed mb-5">{description}</p>
      )}
      {action && (
        action.href ? (
          <Link
            href={action.href}
            className="inline-flex items-center gap-2 bg-[#0F2044] hover:bg-[#1e3a6e] text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
          >
            {action.label}
          </Link>
        ) : (
          <button
            onClick={action.onClick}
            className="inline-flex items-center gap-2 bg-[#0F2044] hover:bg-[#1e3a6e] text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
          >
            {action.label}
          </button>
        )
      )}
    </div>
  );
}
