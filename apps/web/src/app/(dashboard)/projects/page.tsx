import Link from 'next/link';
import { Plus, FolderOpen } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { ProjectCard } from '@/components/projects/ProjectCard';
import { EmptyState } from '@/components/ui/EmptyState';
import type { Project } from '@permitpro/shared';

async function getProjects(): Promise<Project[]> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const res = await fetch(`${baseUrl}/api/projects`, { cache: 'no-store' });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export default async function ProjectsPage() {
  const projects = await getProjects();

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <PageHeader
        title="Projects"
        description="Organize your permits by project or site."
        action={
          <Link
            href="/projects/new"
            className="inline-flex items-center gap-2 bg-[#0F2044] hover:bg-[#1e3a6e] text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Project
          </Link>
        }
      />

      {projects.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title="No projects yet"
          description="Create your first project to start organizing permits by site."
          action={{
            label: 'Create Project',
            href: '/projects/new',
            onClick: () => {},
          }}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  );
}
