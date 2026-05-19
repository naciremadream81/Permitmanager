'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, DollarSign, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import { getFees, createFee, updateFee } from '@/lib/api-client';
import { FeeStatus, FEE_STATUS_CONFIG } from '@permitpro/shared';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatDate, formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface FeesTabProps {
  permitId: string;
}

const schema = z.object({
  description: z.string().min(1, 'Description required'),
  amount: z.string().min(1, 'Amount required'),
  dueDate: z.string().optional(),
  category: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export function FeesTab({ permitId }: FeesTabProps) {
  const [showForm, setShowForm] = useState(false);
  const queryClient = useQueryClient();

  const { data: fees = [], isLoading } = useQuery({
    queryKey: ['fees', permitId],
    queryFn: () => getFees(permitId),
  });

  const addMutation = useMutation({
    mutationFn: (data: FormData) =>
      createFee(permitId, {
        description: data.description,
        amount: parseFloat(data.amount),
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        category: data.category || null,
        status: FeeStatus.PENDING,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fees', permitId] });
      toast.success('Fee added');
      setShowForm(false);
      reset();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const markPaidMutation = useMutation({
    mutationFn: (feeId: string) =>
      updateFee(permitId, feeId, { status: FeeStatus.PAID, paidDate: new Date() }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fees', permitId] });
      toast.success('Fee marked as paid');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  if (isLoading) return <div className="py-10 flex items-center justify-center"><LoadingSpinner /></div>;

  const totalOwed = fees.filter(f => f.status === FeeStatus.PENDING || f.status === FeeStatus.OVERDUE).reduce((s, f) => s + f.amount, 0);
  const totalPaid = fees.filter(f => f.status === FeeStatus.PAID).reduce((s, f) => s + f.amount, 0);

  return (
    <div className="space-y-4">
      {/* Summary */}
      {fees.length > 0 && (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-red-50 rounded-2xl p-4 border border-red-100">
            <p className="text-xs text-red-600 font-medium mb-1">Total Owed</p>
            <p className="text-2xl font-bold text-red-700 font-display">{formatCurrency(totalOwed)}</p>
          </div>
          <div className="bg-green-50 rounded-2xl p-4 border border-green-100">
            <p className="text-xs text-green-600 font-medium mb-1">Total Paid</p>
            <p className="text-2xl font-bold text-green-700 font-display">{formatCurrency(totalPaid)}</p>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500">{fees.length} fee{fees.length !== 1 ? 's' : ''}</span>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-[#0F2044] hover:bg-[#1e3a6e] text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Fee
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 text-sm">New Fee</h3>
            <button onClick={() => setShowForm(false)}><X className="w-4 h-4 text-gray-400" /></button>
          </div>
          <form onSubmit={handleSubmit((d) => addMutation.mutate(d))} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-700 mb-1">Description <span className="text-red-500">*</span></label>
                <input {...register('description')} placeholder="e.g., Plan check fee" className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#F59E0B]" />
                {errors.description && <p className="text-red-500 text-xs mt-0.5">{errors.description.message}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Amount ($) <span className="text-red-500">*</span></label>
                <input type="number" step="0.01" min="0" {...register('amount')} placeholder="0.00" className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#F59E0B]" />
                {errors.amount && <p className="text-red-500 text-xs mt-0.5">{errors.amount.message}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Due Date</label>
                <input type="date" {...register('dueDate')} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#F59E0B]" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-700 mb-1">Category</label>
                <input {...register('category')} placeholder="e.g., Plan Check, Permit, Impact" className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#F59E0B]" />
              </div>
            </div>
            <button type="submit" disabled={addMutation.isPending} className="flex items-center gap-2 bg-[#0F2044] text-white text-sm font-medium px-4 py-2 rounded-xl disabled:opacity-50">
              {addMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              Add Fee
            </button>
          </form>
        </div>
      )}

      {/* List */}
      {fees.length === 0 ? (
        <EmptyState
          icon={DollarSign}
          title="No fees tracked"
          description="Add permit fees to track payments and totals."
          action={{ label: 'Add Fee', onClick: () => setShowForm(true) }}
        />
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {fees.map((fee) => {
                const config = FEE_STATUS_CONFIG[fee.status];
                return (
                  <tr key={fee.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{fee.description}</p>
                        {fee.category && <p className="text-xs text-gray-400">{fee.category}</p>}
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-sm font-semibold text-gray-900">{formatCurrency(fee.amount)}</span>
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-sm text-gray-500">{formatDate(fee.dueDate)}</span>
                    </td>
                    <td className="px-5 py-3">
                      <span className={cn('text-xs font-medium px-2.5 py-0.5 rounded-full', config.bgColor, config.textColor)}>
                        {config.label}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      {fee.status === FeeStatus.PENDING && (
                        <button
                          onClick={() => markPaidMutation.mutate(fee.id)}
                          disabled={markPaidMutation.isPending}
                          className="text-xs text-green-600 hover:text-green-800 font-medium"
                        >
                          Mark paid
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
