'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Loader2 } from 'lucide-react';
import { useAIChat } from '@/hooks/useAIChat';
import { cn } from '@/lib/utils';

interface AIChatTabProps {
  permitId: string;
}

const SUGGESTED_PROMPTS = [
  'What documents are missing?',
  'Draft a follow-up email to the agency',
  'Summarize the current permit status',
  'What are my biggest risk factors?',
  'What are the next steps to get approved?',
  'Are there any upcoming deadlines I should know about?',
];

export function AIChatTab({ permitId }: AIChatTabProps) {
  const { messages, isStreaming, sendMessage } = useAIChat(permitId);
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleSend() {
    const text = input.trim();
    if (!text || isStreaming) return;
    setInput('');
    await sendMessage(text);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="flex flex-col h-[600px] bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-[#0F2044]/5 to-transparent">
        <div className="w-8 h-8 bg-[#F59E0B]/20 rounded-full flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-[#F59E0B]" />
        </div>
        <div>
          <p className="font-semibold text-gray-900 text-sm">PermitPro AI</p>
          <p className="text-xs text-gray-400">Ask anything about this permit</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="py-6">
            <div className="text-center mb-6">
              <Sparkles className="w-8 h-8 text-[#F59E0B] mx-auto mb-2" />
              <p className="text-sm text-gray-600 font-medium">How can I help with this permit?</p>
              <p className="text-xs text-gray-400 mt-1">I have full context on documents, status, and deadlines.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {SUGGESTED_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => sendMessage(prompt)}
                  disabled={isStreaming}
                  className="text-left px-3 py-2.5 text-xs text-gray-600 bg-gray-50 hover:bg-[#0F2044]/5 border border-gray-200 hover:border-[#0F2044]/20 rounded-xl transition-all disabled:opacity-50"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={cn('flex gap-2', msg.role === 'user' ? 'justify-end' : 'justify-start')}
          >
            {msg.role === 'assistant' && (
              <div className="w-7 h-7 bg-[#F59E0B]/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <Sparkles className="w-3.5 h-3.5 text-[#F59E0B]" />
              </div>
            )}
            <div
              className={cn(
                'max-w-[80%] px-4 py-2.5 rounded-2xl text-sm',
                msg.role === 'user'
                  ? 'bg-[#F59E0B] text-white rounded-br-sm'
                  : 'bg-gray-100 text-gray-800 rounded-bl-sm'
              )}
            >
              {msg.content || (
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" />
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.15s]" />
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.3s]" />
                </div>
              )}
            </div>
            {msg.role === 'user' && (
              <div className="w-7 h-7 bg-[#0F2044] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-white text-xs font-bold">
                U
              </div>
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-100 p-4">
        {messages.length > 0 && (
          <div className="flex gap-2 mb-3 overflow-x-auto scrollbar-hide">
            {SUGGESTED_PROMPTS.slice(0, 3).map((prompt) => (
              <button
                key={prompt}
                onClick={() => sendMessage(prompt)}
                disabled={isStreaming}
                className="whitespace-nowrap text-xs text-gray-500 bg-gray-50 hover:bg-gray-100 border border-gray-200 px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-50"
              >
                {prompt}
              </button>
            ))}
          </div>
        )}
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isStreaming}
            placeholder="Ask about this permit..."
            rows={1}
            className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#F59E0B] resize-none disabled:opacity-50"
            style={{ minHeight: '42px', maxHeight: '120px' }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isStreaming}
            className="w-10 h-10 bg-[#0F2044] hover:bg-[#1e3a6e] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl flex items-center justify-center transition-colors flex-shrink-0"
          >
            {isStreaming ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-2 text-center">
          Press Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
