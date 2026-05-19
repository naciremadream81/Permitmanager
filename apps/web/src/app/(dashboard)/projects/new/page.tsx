'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { PageHeader } from '@/components/ui/PageHeader';
import { createProject } from '@/lib/api-client';

const schema = z.object({
  name: z.string().min(1, 'Project name is required').max(100),
  description: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
  startDate: z.string().optional(),
  estimatedEndDate: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function NewProjectPage() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit(data: FormData) {
    try {
      const project = await createProject({
        name: data.name,
        description: data.description || null,
        address: data.address || null,
        city: data.city || null,
        state: data.state || null,
        zip: data.zip || null,
        startDate: data.startDate ? new Date(data.startDate) : null,
        estimatedEndDate: data.estimatedEndDate ? new Date(data.estimatedEndDate) : null,
        status: 'ACTIVE',
      });
      toast.success('Project created!');
      router.push(`/projects/${project.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create project');
    }
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/projects" className="p-2 rounded-xl hover:bg-gray-100 transition-colors text-gray-500">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <PageHeader title="New Project" description="Create a project to group related permits." />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Project name <span className="text-red-500">*</span>
          </label>
          <input
            {...register('name')}
            placeholder="e.g., Downtown Office Renovation"
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#F59E0B] focus:border-transparent"
          />
          {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
          <textarea
            {...register('description')}
            rows={3}
            placeholder="Brief description of the project..."
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#F59E0B] focus:border-transparent resize-none"
          />
        </div>

        {/* Address */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Street address</label>
          <input
            {...register('address')}
            placeholder="123 Main St"
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#F59E0B] focus:border-transparent"
          />
        </div>

        {/* City / State / ZIP */}
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">City</label>
            <input
              {...register('city')}
              placeholder="City"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#F59E0B] focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">State</label>
            <input
              {...register('state')}
              placeholder="CA"
              maxLength={2}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#F59E0B] focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">ZIP</label>
            <input
              {...register('zip')}
              placeholder="90210"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#F59E0B] focus:border-transparent"
            />
          </div>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Start date</label>
            <input
              type="date"
              {...register('startDate')}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#F59E0B] focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Estimated end date</label>
            <input
              type="date"
              {...register('estimatedEndDate')}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#F59E0B] focus:border-transparent"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2 bg-[#0F2044] hover:bg-[#1e3a6e] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-6 py-2.5 rounded-xl transition-colors text-sm"
          >
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
            Create Project
          </button>
          <Link href="/projects" className="text-sm text-gray-500 hover:text-gray-700 px-4 py-2.5">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
