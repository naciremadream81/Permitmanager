import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Plus, MapPin, Calendar, FileText } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { RecentPermitsTable } from '@/components/dashboard/RecentPermitsTable';
import { formatDate } from '@/lib/utils';
import type { ProjectWithPermits } from '@permitpro/shared';

async function getProject(id: string): Promise<ProjectWithPermits | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const res = await fetch(`${baseUrl}/api/projects/${id}`, { cache: 'no-store' });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = await getProject(id);

  if (!project) {
    notFound();
  }

  const fullAddress = [project.address, project.city, project.state, project.zip]
    .filter(Boolean)
    .join(', ');

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <PageHeader
        title={project.name}
        description={fullAddress || undefined}
        breadcrumb={[
          { label: 'Projects', href: '/projects' },
          { label: project.name },
        ]}
        action={
          <Link
            href={`/permits/new?projectId=${project.id}`}
            className="inline-flex items-center gap-2 bg-[#0F2044] hover:bg-[#1e3a6e] text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Permit
          </Link>
        }
      />

      {/* Project Info Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-start gap-3">
          <MapPin className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs text-gray-400 font-medium mb-0.5">Location</p>
            <p className="text-sm text-gray-700">{fullAddress || 'No address set'}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-start gap-3">
          <Calendar className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs text-gray-400 font-medium mb-0.5">Timeline</p>
            <p className="text-sm text-gray-700">
              {project.startDate ? formatDate(project.startDate) : '—'}
              {project.estimatedEndDate ? ` → ${formatDate(project.estimatedEndDate)}` : ''}
            </p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-start gap-3">
          <FileText className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs text-gray-400 font-medium mb-0.5">Permits</p>
            <p className="text-sm text-gray-700">{project.permits?.length ?? 0} total</p>
          </div>
        </div>
      </div>

      {/* Description */}
      {project.description && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Description</h3>
          <p className="text-sm text-gray-500 leading-relaxed">{project.description}</p>
        </div>
      )}

      {/* Permits Table */}
      <RecentPermitsTable permits={project.permits ?? []} />
    </div>
  );
}
