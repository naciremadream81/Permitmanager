'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Loader2, ArrowLeft, ArrowRight, Check } from 'lucide-react';
import Link from 'next/link';
import { createPermit, getProjects } from '@/lib/api-client';
import { PermitType, PERMIT_TYPE_CONFIG } from '@permitpro/shared';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';

const step1Schema = z.object({
  projectId: z.string().optional(),
  type: z.nativeEnum(PermitType, { required_error: 'Permit type is required' }),
});

const step2Schema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  jurisdiction: z.string().optional(),
  agency: z.string().optional(),
  description: z.string().optional(),
  appliedDate: z.string().optional(),
  expirationDate: z.string().optional(),
  estimatedCost: z.string().optional(),
});

type Step1Data = z.infer<typeof step1Schema>;
type Step2Data = z.infer<typeof step2Schema>;

const STEPS = ['Project & Type', 'Permit Details', 'Review'];

export default function NewPermitPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefilledProjectId = searchParams.get('projectId') ?? '';
  const [step, setStep] = useState(1);
  const [step1Data, setStep1Data] = useState<Step1Data>({ projectId: prefilledProjectId, type: PermitType.BUILDING });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: getProjects,
  });

  const step1Form = useForm<Step1Data>({
    resolver: zodResolver(step1Schema),
    defaultValues: step1Data,
  });

  const step2Form = useForm<Step2Data>({
    resolver: zodResolver(step2Schema),
  });

  async function handleStep1(data: Step1Data) {
    setStep1Data(data);
    setStep(2);
  }

  async function handleStep2(data: Step2Data) {
    setStep(3);
    // Store form data so review can show it
    step2Form.reset(data, { keepValues: true });
  }

  async function handleSubmit() {
    setIsSubmitting(true);
    const s2 = step2Form.getValues();
    try {
      const permit = await createPermit({
        projectId: step1Data.projectId || undefined,
        type: step1Data.type,
        title: s2.title,
        jurisdiction: s2.jurisdiction || null,
        agency: s2.agency || null,
        description: s2.description || null,
        appliedDate: s2.appliedDate ? new Date(s2.appliedDate) : null,
        expirationDate: s2.expirationDate ? new Date(s2.expirationDate) : null,
        estimatedCost: s2.estimatedCost ? parseFloat(s2.estimatedCost) : null,
        status: 'DRAFT' as never,
      });
      toast.success('Permit created!');
      router.push(`/permits/${permit.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create permit');
    } finally {
      setIsSubmitting(false);
    }
  }

  const s2Values = step2Form.watch();
  const selectedProject = projects.find((p) => p.id === step1Data.projectId);

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/permits" className="p-2 rounded-xl hover:bg-gray-100 transition-colors text-gray-500">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900 font-display">New Permit</h1>
          <p className="text-sm text-gray-500">Step {step} of 3</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          {STEPS.map((label, i) => {
            const num = i + 1;
            const isActive = step === num;
            const isDone = step > num;
            return (
              <div key={label} className="flex items-center gap-2 flex-1">
                <div className={cn(
                  'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-colors',
                  isDone ? 'bg-green-500 text-white' : isActive ? 'bg-[#0F2044] text-white' : 'bg-gray-100 text-gray-400'
                )}>
                  {isDone ? <Check className="w-4 h-4" /> : num}
                </div>
                <span className={cn('text-xs font-medium', isActive ? 'text-gray-900' : 'text-gray-400')}>
                  {label}
                </span>
                {i < 2 && <div className={cn('flex-1 h-px mx-2', step > num ? 'bg-green-300' : 'bg-gray-200')} />}
              </div>
            );
          })}
        </div>
      </div>

      {/* Step 1: Project + Type */}
      {step === 1 && (
        <form onSubmit={step1Form.handleSubmit(handleStep1)} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Project (optional)</label>
            <select
              {...step1Form.register('projectId')}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#F59E0B] focus:border-transparent bg-white"
            >
              <option value="">No project / standalone permit</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Permit type <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-1">
              {Object.entries(PERMIT_TYPE_CONFIG).map(([type, config]) => {
                const isSelected = step1Form.watch('type') === type;
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => step1Form.setValue('type', type as PermitType)}
                    className={cn(
                      'text-left px-3 py-2.5 rounded-xl border text-sm transition-all',
                      isSelected
                        ? 'border-[#0F2044] bg-[#0F2044]/5 text-[#0F2044] font-medium'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                    )}
                  >
                    <span className="font-medium">{config.label}</span>
                    <span className="text-xs text-gray-400 block">{config.category}</span>
                  </button>
                );
              })}
            </div>
            {step1Form.formState.errors.type && (
              <p className="text-red-500 text-xs mt-1">{step1Form.formState.errors.type.message}</p>
            )}
          </div>

          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 bg-[#0F2044] hover:bg-[#1e3a6e] text-white font-semibold py-3 rounded-xl transition-colors text-sm"
          >
            Next: Permit Details
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      )}

      {/* Step 2: Permit Details */}
      {step === 2 && (
        <form onSubmit={step2Form.handleSubmit(handleStep2)} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Permit title <span className="text-red-500">*</span>
            </label>
            <input
              {...step2Form.register('title')}
              placeholder="e.g., Building Permit – Office Renovation"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#F59E0B] focus:border-transparent"
            />
            {step2Form.formState.errors.title && (
              <p className="text-red-500 text-xs mt-1">{step2Form.formState.errors.title.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Jurisdiction</label>
              <input
                {...step2Form.register('jurisdiction')}
                placeholder="City of Los Angeles"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#F59E0B] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Agency</label>
              <input
                {...step2Form.register('agency')}
                placeholder="Building & Safety Dept"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#F59E0B] focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
            <textarea
              {...step2Form.register('description')}
              rows={3}
              placeholder="Scope of work, special conditions..."
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#F59E0B] focus:border-transparent resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Applied date</label>
              <input
                type="date"
                {...step2Form.register('appliedDate')}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#F59E0B] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Expiration date</label>
              <input
                type="date"
                {...step2Form.register('expirationDate')}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#F59E0B] focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Estimated cost ($)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              {...step2Form.register('estimatedCost')}
              placeholder="0.00"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#F59E0B] focus:border-transparent"
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="flex items-center gap-2 border border-gray-200 text-gray-600 hover:bg-gray-50 font-semibold px-5 py-2.5 rounded-xl transition-colors text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 bg-[#0F2044] hover:bg-[#1e3a6e] text-white font-semibold px-6 py-2.5 rounded-xl transition-colors text-sm"
            >
              Next: Review
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      )}

      {/* Step 3: Review */}
      {step === 3 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
          <h3 className="font-semibold text-gray-900">Review your permit</h3>

          <div className="space-y-3">
            {[
              { label: 'Project', value: selectedProject?.name || 'No project' },
              { label: 'Type', value: PERMIT_TYPE_CONFIG[step1Data.type]?.label || step1Data.type },
              { label: 'Title', value: s2Values.title },
              { label: 'Jurisdiction', value: s2Values.jurisdiction || '—' },
              { label: 'Agency', value: s2Values.agency || '—' },
              { label: 'Description', value: s2Values.description || '—' },
              { label: 'Applied Date', value: s2Values.appliedDate || '—' },
              { label: 'Expiration Date', value: s2Values.expirationDate || '—' },
              { label: 'Estimated Cost', value: s2Values.estimatedCost ? `$${s2Values.estimatedCost}` : '—' },
            ].map(({ label, value }) => (
              <div key={label} className="flex gap-4 py-2 border-b border-gray-50 last:border-0">
                <span className="text-xs font-medium text-gray-400 w-32 flex-shrink-0">{label}</span>
                <span className="text-sm text-gray-700">{value}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="flex items-center gap-2 border border-gray-200 text-gray-600 hover:bg-gray-50 font-semibold px-5 py-2.5 rounded-xl transition-colors text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex items-center gap-2 bg-[#F59E0B] hover:bg-[#D97706] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-6 py-2.5 rounded-xl transition-colors text-sm"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              Create Permit
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
