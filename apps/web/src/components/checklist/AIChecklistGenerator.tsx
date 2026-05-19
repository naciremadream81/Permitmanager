'use client';

import { useState } from 'react';
import { Sparkles, Loader2, Check, X } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { PermitType, ChecklistItem } from '@permitpro/shared';
import { PERMIT_TYPE_CONFIG } from '@permitpro/shared';
import { cn } from '@/lib/utils';

interface AIChecklistGeneratorProps {
  permitId: string;
  permitType: PermitType;
}

interface GeneratedItem {
  title: string;
  description?: string;
  category?: string;
}

export function AIChecklistGenerator({ permitId, permitType }: AIChecklistGeneratorProps) {
  const [open, setOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isInserting, setIsInserting] = useState(false);
  const [generatedItems, setGeneratedItems] = useState<GeneratedItem[]>([]);
  const queryClient = useQueryClient();

  const typeConfig = PERMIT_TYPE_CONFIG[permitType];

  async function handleGenerate() {
    setIsGenerating(true);
    setGeneratedItems([]);
    try {
      const res = await fetch(`/api/permits/${permitId}/checklist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ generateWithAI: true }),
      });
      if (!res.ok) throw new Error('Failed to generate checklist');
      const data = await res.json();
      setGeneratedItems(Array.isArray(data) ? data : data.items ?? []);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Generation failed');
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleInsert() {
    setIsInserting(true);
    try {
      // Items were already created by the API if generateWithAI = true
      // Just invalidate and close
      queryClient.invalidateQueries({ queryKey: ['checklist', permitId] });
      toast.success(`Added ${generatedItems.length} checklist items`);
      setOpen(false);
      setGeneratedItems([]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to insert items');
    } finally {
      setIsInserting(false);
    }
  }

  return (
    <>
      <button
        onClick={() => { setOpen(true); handleGenerate(); }}
        className="flex items-center gap-2 bg-[#F59E0B] hover:bg-[#D97706] text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors"
      >
        <Sparkles className="w-4 h-4" />
        Generate with AI
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#F59E0B]" />
                <h2 className="font-semibold text-gray-900">AI Checklist Generator</h2>
              </div>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 border-b border-gray-100">
              <p className="text-sm text-gray-600">
                Generating checklist for{' '}
                <span className="font-semibold text-[#0F2044]">{typeConfig?.label || permitType}</span> permit.
              </p>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              {isGenerating ? (
                <div className="py-10 flex flex-col items-center gap-3">
                  <Loader2 className="w-8 h-8 text-[#F59E0B] animate-spin" />
                  <p className="text-sm text-gray-500">Generating checklist items...</p>
                </div>
              ) : generatedItems.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-6">No items generated. Try again.</p>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs text-gray-400 mb-3">{generatedItems.length} items to add:</p>
                  {generatedItems.map((item, i) => (
                    <div key={i} className="flex items-start gap-2 py-2 border-b border-gray-50 last:border-0">
                      <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm text-gray-800 font-medium">{item.title}</p>
                        {item.category && (
                          <p className="text-xs text-gray-400">{item.category}</p>
                        )}
                        {item.description && (
                          <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{item.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-5 border-t border-gray-100 flex items-center gap-3">
              {generatedItems.length > 0 && (
                <button
                  onClick={handleInsert}
                  disabled={isInserting}
                  className="flex items-center gap-2 bg-[#0F2044] hover:bg-[#1e3a6e] text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors disabled:opacity-50"
                >
                  {isInserting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Add {generatedItems.length} Items
                </button>
              )}
              <button
                onClick={() => handleGenerate()}
                disabled={isGenerating}
                className={cn(
                  'flex items-center gap-2 border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-medium px-4 py-2.5 rounded-xl transition-colors',
                  isGenerating && 'opacity-50'
                )}
              >
                {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                Regenerate
              </button>
              <button
                onClick={() => setOpen(false)}
                className="text-sm text-gray-400 hover:text-gray-600 px-3 py-2.5"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
