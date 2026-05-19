'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  FolderOpen,
  FileText,
  Calendar,
  BarChart3,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useUIStore } from '@/store/uiStore';
import { cn } from '@/lib/utils';

interface SidebarProps {
  userEmail: string;
}

const navLinks = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/projects', label: 'Projects', icon: FolderOpen },
  { href: '/permits', label: 'Permits', icon: FileText },
  { href: '/calendar', label: 'Calendar', icon: Calendar },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function Sidebar({ userEmail }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { sidebarCollapsed, setSidebarCollapsed } = useUIStore();
  const supabase = createClient();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push('/login');
  }

  const initials = userEmail
    ? userEmail
        .split('@')[0]
        .slice(0, 2)
        .toUpperCase()
    : 'U';

  return (
    <div
      className={cn(
        'relative flex flex-col bg-[#0F2044] text-white transition-all duration-300 flex-shrink-0',
        sidebarCollapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-white/10">
        <div className="w-8 h-8 bg-[#F59E0B] rounded-lg flex items-center justify-center flex-shrink-0">
          <span className="text-white font-bold text-sm">P</span>
        </div>
        {!sidebarCollapsed && (
          <span className="text-lg font-bold font-display text-white truncate">PermitPro</span>
        )}
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
        className="absolute -right-3 top-14 w-6 h-6 bg-[#1e3a6e] border border-white/20 rounded-full flex items-center justify-center hover:bg-[#4a6fa5] transition-colors z-10"
      >
        {sidebarCollapsed ? (
          <ChevronRight className="w-3 h-3 text-white" />
        ) : (
          <ChevronLeft className="w-3 h-3 text-white" />
        )}
      </button>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto scrollbar-hide">
        {navLinks.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group',
                isActive
                  ? 'bg-white/10 text-white border-l-2 border-[#F59E0B] pl-[10px]'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              )}
              title={sidebarCollapsed ? label : undefined}
            >
              <Icon className={cn('w-5 h-5 flex-shrink-0', isActive ? 'text-[#F59E0B]' : 'text-white/60 group-hover:text-white')} />
              {!sidebarCollapsed && <span className="truncate">{label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* User section */}
      <div className="border-t border-white/10 p-3">
        <div className={cn('flex items-center gap-3', sidebarCollapsed && 'justify-center')}>
          <div className="w-8 h-8 bg-[#F59E0B] rounded-full flex items-center justify-center flex-shrink-0 text-white text-xs font-bold">
            {initials}
          </div>
          {!sidebarCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-white truncate">{userEmail}</p>
            </div>
          )}
          <button
            onClick={handleSignOut}
            className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors flex-shrink-0"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
