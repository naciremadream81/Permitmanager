'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, ClipboardCheck, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import { getInspections, createInspection } from '@/lib/api-client';
import { INSPECTION_STATUS_CONFIG, InspectionStatus } from '@permitpro/shared';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface InspectionsTabProps {
  permitId: string;
}

const schema = z.object({
  type: z.string().min(1, 'Inspection type required'),
  scheduledDate: z.string().min(1, 'Date required'),
  inspectorName: z.string().optional(),
  inspectorPhone: z.string().optional(),
  location: z.string().optional(),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export function InspectionsTab({ permitId }: InspectionsTabProps) {
  const [showForm, setShowForm] = useState(false);
  const queryClient = useQueryClient();

  const { data: inspections = [], isLoading } = useQuery({
    queryKey: ['inspections', permitId],
    queryFn: () => getInspections(permitId),
  });

  const mutation = useMutation({
    mutationFn: (data: FormData) =>
      createInspection(permitId, {
        ...data,
        inspectorName: data.inspectorName || null,
        inspectorPhone: data.inspectorPhone || null,
        location: data.location || null,
        notes: data.notes || null,
        status: InspectionStatus.SCHEDULED,
        scheduledDate: new Date(data.scheduledDate),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inspections', permitId] });
      toast.success('Inspection scheduled');
      setShowForm(false);
      reset();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  if (isLoading) return <div className="py-10 flex items-center justify-center"><LoadingSpinner /></div>;

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500">{inspections.length} inspection{inspections.length !== 1 ? 's' : ''}</span>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-[#0F2044] hover:bg-[#1e3a6e] text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors"
        >
          <Plus className="w-4 h-4" />
          Schedule Inspection
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 text-sm">New Inspection</h3>
            <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          </div>
          <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Type <span className="text-red-500">*</span></label>
                <input {...register('type')} placeholder="e.g., Framing, Final" className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#F59E0B]" />
                {errors.type && <p className="text-red-500 text-xs mt-0.5">{errors.type.message}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Scheduled Date <span className="text-red-500">*</span></label>
                <input type="date" {...register('scheduledDate')} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#F59E0B]" />
                {errors.scheduledDate && <p className="text-red-500 text-xs mt-0.5">{errors.scheduledDate.message}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Inspector Name</label>
                <input {...register('inspectorName')} placeholder="John Smith" className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#F59E0B]" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Inspector Phone</label>
                <input {...register('inspectorPhone')} placeholder="(555) 000-0000" className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#F59E0B]" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Location</label>
              <input {...register('location')} placeholder="Address or description" className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#F59E0B]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Notes</label>
              <textarea {...register('notes')} rows={2} placeholder="Additional notes..." className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#F59E0B] resize-none" />
            </div>
            <button type="submit" disabled={mutation.isPending} className="flex items-center gap-2 bg-[#0F2044] text-white text-sm font-medium px-4 py-2 rounded-xl disabled:opacity-50">
              {mutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              Schedule
            </button>
          </form>
        </div>
      )}

      {/* List */}
      {inspections.length === 0 ? (
        <EmptyState
          icon={ClipboardCheck}
          title="No inspections"
          description="Schedule your first inspection."
          action={{ label: 'Schedule Inspection', onClick: () => setShowForm(true) }}
        />
      ) : (
        <div className="space-y-3">
          {inspections.map((insp) => {
            const config = INSPECTION_STATUS_CONFIG[insp.status];
            return (
              <div key={insp.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-gray-900 text-sm">{insp.type}</span>
                      <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', config.bgColor, config.textColor)}>
                        {config.label}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400">
                      {formatDate(insp.scheduledDate)}
                      {insp.completedDate && ` · Completed ${formatDate(insp.completedDate)}`}
                    </p>
                    {insp.inspectorName && (
                      <p className="text-xs text-gray-500 mt-1">Inspector: {insp.inspectorName}{insp.inspectorPhone && ` · ${insp.inspectorPhone}`}</p>
                    )}
                    {insp.result && (
                      <p className="text-xs text-gray-700 mt-1.5 font-medium">Result: {insp.result}</p>
                    )}
                    {insp.notes && (
                      <p className="text-xs text-gray-400 mt-1 line-clamp-2">{insp.notes}</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
