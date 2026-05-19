import Link from 'next/link';
import { MapPin, FileText, ArrowRight } from 'lucide-react';
import type { Project } from '@permitpro/shared';
import { cn } from '@/lib/utils';

interface ProjectCardProps {
  project: Project & { _count?: { permits: number } };
}

const statusColors: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-700',
  PLANNING: 'bg-blue-100 text-blue-700',
  ON_HOLD: 'bg-amber-100 text-amber-700',
  COMPLETED: 'bg-gray-100 text-gray-600',
  CANCELLED: 'bg-red-100 text-red-700',
};

export function ProjectCard({ project }: ProjectCardProps) {
  const address = [project.city, project.state].filter(Boolean).join(', ');
  const statusClass = statusColors[project.status] || statusColors.ACTIVE;

  return (
    <Link href={`/projects/${project.id}`} className="block group">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-gray-200 transition-all p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="w-10 h-10 bg-[#0F2044]/10 rounded-xl flex items-center justify-center flex-shrink-0">
            <FileText className="w-5 h-5 text-[#0F2044]" />
          </div>
          <span className={cn('text-xs font-medium px-2.5 py-1 rounded-full', statusClass)}>
            {project.status.replace('_', ' ')}
          </span>
        </div>

        {/* Content */}
        <h3 className="font-semibold text-gray-900 mb-1 text-sm group-hover:text-[#0F2044] transition-colors line-clamp-2">
          {project.name}
        </h3>

        {address && (
          <div className="flex items-center gap-1 text-xs text-gray-400 mb-3">
            <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">{address}</span>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-50">
          <span className="text-xs text-gray-400">
            {project._count?.permits ?? 0} permit{(project._count?.permits ?? 0) !== 1 ? 's' : ''}
          </span>
          <ArrowRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-[#0F2044] transition-colors" />
        </div>
      </div>
    </Link>
  );
}
