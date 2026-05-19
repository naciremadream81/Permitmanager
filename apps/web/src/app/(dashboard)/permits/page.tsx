import { PageHeader } from '@/components/ui/PageHeader';
import { PermitsList } from '@/components/permits/PermitsList';
import Link from 'next/link';
import { Plus } from 'lucide-react';

export default function PermitsPage() {
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <PageHeader
        title="Permits"
        description="Track and manage all your permits in one place."
        action={
          <Link
            href="/permits/new"
            className="inline-flex items-center gap-2 bg-[#0F2044] hover:bg-[#1e3a6e] text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Permit
          </Link>
        }
      />
      <PermitsList />
    </div>
  );
}
