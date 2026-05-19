'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Users, CreditCard, Bell, User, Loader2, Trash2, Check } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { SUBSCRIPTION_PLANS, USER_ROLE_CONFIG } from '@permitpro/shared';
import type { UserRole } from '@permitpro/shared';
import { cn } from '@/lib/utils';

const TABS = [
  { id: 'team', label: 'Team', icon: Users },
  { id: 'billing', label: 'Billing', icon: CreditCard },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'profile', label: 'Profile', icon: User },
];

const NOTIFICATION_SETTINGS = [
  { id: 'deadline_7d', label: 'Deadline: 7 days out', group: 'Deadlines' },
  { id: 'deadline_1d', label: 'Deadline: 1 day out', group: 'Deadlines' },
  { id: 'deadline_day_of', label: 'Deadline: day of', group: 'Deadlines' },
  { id: 'doc_expiry', label: 'Document expiry warning', group: 'Documents' },
  { id: 'status_change', label: 'Status changed', group: 'Permits' },
  { id: 'inspection_reminder', label: 'Inspection reminder', group: 'Inspections' },
  { id: 'weekly_digest', label: 'Weekly digest email', group: 'Digest' },
];

const inviteSchema = z.object({
  email: z.string().email('Valid email required'),
  role: z.enum(['OWNER', 'ADMIN', 'COORDINATOR', 'VIEWER']),
});

type InviteFormData = z.infer<typeof inviteSchema>;

const profileSchema = z.object({
  name: z.string().min(1, 'Name required'),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('team');
  const [notifSettings, setNotifSettings] = useState<Record<string, boolean>>({
    deadline_7d: true,
    deadline_1d: true,
    deadline_day_of: true,
    doc_expiry: true,
    status_change: true,
    inspection_reminder: true,
    weekly_digest: false,
  });

  const queryClient = useQueryClient();

  // Team data
  const { data: teamData } = useQuery({
    queryKey: ['team'],
    queryFn: async () => {
      const res = await fetch('/api/team');
      if (!res.ok) return { members: [] };
      return res.json();
    },
  });

  const inviteMutation = useMutation({
    mutationFn: async (data: InviteFormData) => {
      const res = await fetch('/api/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to invite member');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team'] });
      toast.success('Invitation sent');
      inviteReset();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const { register: registerInvite, handleSubmit: handleInviteSubmit, formState: { errors: inviteErrors }, reset: inviteReset } = useForm<InviteFormData>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { role: 'COORDINATOR' },
  });

  const { register: registerProfile, handleSubmit: handleProfileSubmit, formState: { errors: profileErrors, isSubmitting: profileSubmitting } } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
  });

  const members = teamData?.members ?? [];

  function toggleNotif(id: string) {
    setNotifSettings((prev) => ({ ...prev, [id]: !prev[id] }));
    toast.success('Notification preference saved');
  }

  const groupedNotifs = NOTIFICATION_SETTINGS.reduce<Record<string, typeof NOTIFICATION_SETTINGS>>((acc, n) => {
    if (!acc[n.group]) acc[n.group] = [];
    acc[n.group].push(n);
    return acc;
  }, {});

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <PageHeader title="Settings" description="Manage your workspace, team, and preferences." />

      <div className="flex gap-6">
        {/* Sidebar tabs */}
        <div className="w-48 flex-shrink-0">
          <nav className="space-y-1">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={cn(
                  'w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left',
                  activeTab === id
                    ? 'bg-[#0F2044] text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                )}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Team tab */}
          {activeTab === 'team' && (
            <div className="space-y-5">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <h3 className="font-semibold text-gray-900 mb-4">Team Members</h3>
                {members.length === 0 ? (
                  <p className="text-sm text-gray-400">No team members yet.</p>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {members.map((m: { id: string; user: { name: string; email: string }; role: UserRole; joinedAt: string | null }) => {
                      const roleConfig = USER_ROLE_CONFIG[m.role];
                      return (
                        <div key={m.id} className="flex items-center gap-3 py-3">
                          <div className="w-8 h-8 bg-[#0F2044]/10 rounded-full flex items-center justify-center text-xs font-bold text-[#0F2044] flex-shrink-0">
                            {m.user.name?.slice(0, 2).toUpperCase() || 'U'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{m.user.name || m.user.email}</p>
                            <p className="text-xs text-gray-400">{m.user.email}</p>
                          </div>
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                            {roleConfig?.label || m.role}
                          </span>
                          <button className="p-1.5 text-gray-300 hover:text-red-400 rounded-lg transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Invite */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <h3 className="font-semibold text-gray-900 mb-4">Invite Team Member</h3>
                <form onSubmit={handleInviteSubmit((d) => inviteMutation.mutate(d))} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
                      <input
                        type="email"
                        {...registerInvite('email')}
                        placeholder="colleague@company.com"
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#F59E0B]"
                      />
                      {inviteErrors.email && <p className="text-red-500 text-xs mt-0.5">{inviteErrors.email.message}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Role</label>
                      <select
                        {...registerInvite('role')}
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#F59E0B] bg-white"
                      >
                        {Object.entries(USER_ROLE_CONFIG).map(([role, config]) => (
                          <option key={role} value={role}>{config.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={inviteMutation.isPending}
                    className="flex items-center gap-2 bg-[#0F2044] text-white text-sm font-medium px-4 py-2 rounded-xl disabled:opacity-50"
                  >
                    {inviteMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                    Send Invite
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* Billing tab */}
          {activeTab === 'billing' && (
            <div className="space-y-5">
              {/* Current plan */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <h3 className="font-semibold text-gray-900 mb-4">Current Plan</h3>
                <div className="flex items-center justify-between p-4 bg-[#0F2044]/5 rounded-xl border border-[#0F2044]/10">
                  <div>
                    <p className="font-bold text-[#0F2044] text-lg font-display">Pro Plan</p>
                    <p className="text-sm text-gray-500 mt-0.5">$49/month · Renews Dec 1, 2026</p>
                  </div>
                  <button className="text-sm font-medium text-[#0F2044] border border-[#0F2044]/20 px-4 py-2 rounded-xl hover:bg-[#0F2044]/5 transition-colors">
                    Manage Billing
                  </button>
                </div>
              </div>

              {/* Usage */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <h3 className="font-semibold text-gray-900 mb-4">Usage</h3>
                <div className="space-y-4">
                  {[
                    { label: 'Permits', used: 12, limit: SUBSCRIPTION_PLANS.pro.permits },
                    { label: 'Seats', used: 3, limit: SUBSCRIPTION_PLANS.pro.seats },
                    { label: 'Storage (GB)', used: 2.4, limit: SUBSCRIPTION_PLANS.pro.storage },
                  ].map(({ label, used, limit }) => {
                    const pct = Math.min(100, (used / limit) * 100);
                    return (
                      <div key={label}>
                        <div className="flex items-center justify-between text-sm mb-1.5">
                          <span className="text-gray-600">{label}</span>
                          <span className="font-medium text-gray-900">{used} / {limit}</span>
                        </div>
                        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={cn('h-full rounded-full transition-all', pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-amber-500' : 'bg-green-500')}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Notifications tab */}
          {activeTab === 'notifications' && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-5">
              <h3 className="font-semibold text-gray-900">Notification Preferences</h3>
              {Object.entries(groupedNotifs).map(([group, items]) => (
                <div key={group}>
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">{group}</p>
                  <div className="space-y-1">
                    {items.map((item) => (
                      <div key={item.id} className="flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-gray-50 transition-colors">
                        <span className="text-sm text-gray-700">{item.label}</span>
                        <button
                          onClick={() => toggleNotif(item.id)}
                          className={cn(
                            'relative w-10 h-5 rounded-full transition-colors',
                            notifSettings[item.id] ? 'bg-[#0F2044]' : 'bg-gray-200'
                          )}
                        >
                          <div className={cn(
                            'absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform',
                            notifSettings[item.id] ? 'translate-x-5' : 'translate-x-0.5'
                          )} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Profile tab */}
          {activeTab === 'profile' && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-5">
              <h3 className="font-semibold text-gray-900">Profile</h3>
              <form onSubmit={handleProfileSubmit(async (d) => {
                try {
                  const res = await fetch('/api/team', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(d) });
                  if (!res.ok) throw new Error('Failed to update profile');
                  toast.success('Profile updated');
                } catch (err) {
                  toast.error(err instanceof Error ? err.message : 'Failed to update');
                }
              })} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Display name</label>
                  <input
                    {...registerProfile('name')}
                    placeholder="Your name"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#F59E0B]"
                  />
                  {profileErrors.name && <p className="text-red-500 text-xs mt-0.5">{profileErrors.name.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                  <input
                    type="email"
                    disabled
                    placeholder="your@email.com"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-400 cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-400 mt-1">Email is managed by your auth provider</p>
                </div>
                <button
                  type="submit"
                  disabled={profileSubmitting}
                  className="flex items-center gap-2 bg-[#0F2044] text-white text-sm font-medium px-5 py-2.5 rounded-xl disabled:opacity-50"
                >
                  {profileSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  Save Profile
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
