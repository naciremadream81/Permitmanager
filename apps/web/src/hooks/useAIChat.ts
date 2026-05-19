'use client';

import { useState, useCallback } from 'react';
import type { AiMessage } from '@permitpro/shared';
import { streamPermitAI } from '@/lib/api-client';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  isStreaming?: boolean;
}

export function useAIChat(permitId: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(
    async (content: string): Promise<void> => {
      if (!content.trim() || isStreaming) return;

      setError(null);

      // Add user message
      const userMessage: ChatMessage = {
        role: 'user',
        content: content.trim(),
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, userMessage]);

      // Add placeholder AI message
      const aiMessage: ChatMessage = {
        role: 'assistant',
        content: '',
        timestamp: new Date().toISOString(),
        isStreaming: true,
      };

      setMessages((prev) => [...prev, aiMessage]);
      setIsStreaming(true);

      try {
        // Build history for API call
        const history: AiMessage[] = messages.map((m) => ({
          role: m.role,
          content: m.content,
          timestamp: m.timestamp,
        }));
        history.push({ role: 'user', content: content.trim(), timestamp: userMessage.timestamp });

        await streamPermitAI(permitId, history, (chunk) => {
          setMessages((prev) => {
            const updated = [...prev];
            const lastIdx = updated.length - 1;
            if (updated[lastIdx]?.role === 'assistant') {
              updated[lastIdx] = {
                ...updated[lastIdx],
                content: updated[lastIdx].content + chunk,
              };
            }
            return updated;
          });
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Something went wrong';
        setError(msg);
        setMessages((prev) => {
          const updated = [...prev];
          const lastIdx = updated.length - 1;
          if (updated[lastIdx]?.role === 'assistant' && updated[lastIdx].content === '') {
            updated[lastIdx] = {
              ...updated[lastIdx],
              content: `Sorry, I ran into an error: ${msg}`,
              isStreaming: false,
            };
          }
          return updated;
        });
      } finally {
        setIsStreaming(false);
        setMessages((prev) => {
          const updated = [...prev];
          const lastIdx = updated.length - 1;
          if (updated[lastIdx]?.role === 'assistant') {
            updated[lastIdx] = { ...updated[lastIdx], isStreaming: false };
          }
          return updated;
        });
      }
    },
    [permitId, messages, isStreaming]
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return { messages, isStreaming, error, sendMessage, clearMessages };
}
