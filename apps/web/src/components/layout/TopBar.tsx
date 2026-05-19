'use client';

import { usePathname } from 'next/navigation';
import { Search, Bell, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useUIStore } from '@/store/uiStore';
import { cn } from '@/lib/utils';

const routeLabels: Record<string, string> = {
  dashboard: 'Dashboard',
  projects: 'Projects',
  permits: 'Permits',
  calendar: 'Calendar',
  analytics: 'Analytics',
  settings: 'Settings',
  new: 'New',
};

function getBreadcrumbs(pathname: string) {
  const parts = pathname.split('/').filter(Boolean);
  return parts.map((part, index) => {
    const href = '/' + parts.slice(0, index + 1).join('/');
    const label = routeLabels[part] || (part.length === 36 ? '...' : part.charAt(0).toUpperCase() + part.slice(1));
    return { href, label };
  });
}

export function TopBar() {
  const pathname = usePathname();
  const { setCommandPaletteOpen } = useUIStore();
  const breadcrumbs = getBreadcrumbs(pathname);

  return (
    <div className="sticky top-0 z-30 bg-white border-b border-gray-100 px-6 py-3 flex items-center justify-between">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm">
        {breadcrumbs.map((crumb, i) => (
          <span key={crumb.href} className="flex items-center gap-1">
            {i > 0 && <ChevronRight className="w-3.5 h-3.5 text-gray-400" />}
            {i < breadcrumbs.length - 1 ? (
              <Link
                href={crumb.href}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                {crumb.label}
              </Link>
            ) : (
              <span className="font-medium text-gray-900">{crumb.label}</span>
            )}
          </span>
        ))}
      </nav>

      {/* Right actions */}
      <div className="flex items-center gap-2">
        {/* Search */}
        <button
          onClick={() => setCommandPaletteOpen(true)}
          className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-400 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors"
        >
          <Search className="w-4 h-4" />
          <span className="hidden sm:inline">Search...</span>
          <kbd className="hidden sm:inline-flex items-center gap-0.5 text-xs text-gray-400 bg-white border border-gray-200 rounded px-1.5 py-0.5">
            <span className="text-xs">⌘</span>K
          </kbd>
        </button>

        {/* Notifications */}
        <button className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
          <Bell className="w-4 h-4" />
          <span className={cn(
            'absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full',
          )} />
        </button>
      </div>
    </div>
  );
}
