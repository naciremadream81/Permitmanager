import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import type { AiMessage } from '@permitpro/shared';
import { streamAiChat } from '../../../../lib/api-client';
import { useAuthStore } from '../../../../store/authStore';

const SUGGESTED_PROMPTS = [
  "What's missing from this permit?",
  'Draft email to agency',
  'Summarize current status',
  'What are the next steps?',
  'List outstanding checklist items',
];

interface ChatBubbleProps {
  message: AiMessage;
}

function ChatBubble({ message }: ChatBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <View
      className={`flex-row mb-3 ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      {!isUser ? (
        <View className="w-8 h-8 rounded-full bg-navy-500 items-center justify-center mr-2 mt-1 flex-shrink-0">
          <Text className="text-white text-sm">🤖</Text>
        </View>
      ) : null}
      <View
        style={{
          maxWidth: '78%',
          backgroundColor: isUser ? '#0F2044' : '#F1F5F9',
          borderRadius: 16,
          borderBottomRightRadius: isUser ? 4 : 16,
          borderBottomLeftRadius: isUser ? 16 : 4,
        }}
        className="px-4 py-3"
      >
        <Text
          style={{ color: isUser ? '#FFFFFF' : '#1E293B' }}
          className="text-sm leading-relaxed"
        >
          {message.content}
        </Text>
        <Text
          style={{ color: isUser ? 'rgba(255,255,255,0.5)' : '#94A3B8' }}
          className="text-xs mt-1"
        >
          {new Date(message.timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
      </View>
      {isUser ? (
        <View className="w-8 h-8 rounded-full bg-amber-500 items-center justify-center ml-2 mt-1 flex-shrink-0">
          <Text className="text-white text-xs font-bold">You</Text>
        </View>
      ) : null}
    </View>
  );
}

export default function AiChatTab() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<AiMessage[]>([
    {
      role: 'assistant',
      content:
        "Hi! I'm your AI permit coordinator. I can help you understand this permit's status, identify missing documents, draft emails to agencies, and more. What would you like to know?",
      timestamp: new Date().toISOString(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isStreaming || !id) return;

      const userMessage: AiMessage = {
        role: 'user',
        content: text.trim(),
        timestamp: new Date().toISOString(),
      };

      const newMessages = [...messages, userMessage];
      setMessages(newMessages);
      setInputText('');
      setIsStreaming(true);

      // Add streaming assistant placeholder
      const assistantMessage: AiMessage = {
        role: 'assistant',
        content: '',
        timestamp: new Date().toISOString(),
      };
      setMessages([...newMessages, assistantMessage]);

      try {
        const stream = await streamAiChat(id, newMessages);
        if (!stream) throw new Error('No stream');

        const reader = stream.getReader();
        const decoder = new TextDecoder();
        let accumulated = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6).trim();
              if (data === '[DONE]') continue;
              try {
                const parsed = JSON.parse(data) as { content?: string };
                if (parsed.content) {
                  accumulated += parsed.content;
                  setMessages((prev) => {
                    const updated = [...prev];
                    const last = updated[updated.length - 1];
                    if (last?.role === 'assistant') {
                      updated[updated.length - 1] = {
                        ...last,
                        content: accumulated,
                      };
                    }
                    return updated;
                  });
                }
              } catch {
                // Non-JSON line, skip
                if (data && data !== '[DONE]') {
                  accumulated += data;
                  setMessages((prev) => {
                    const updated = [...prev];
                    const last = updated[updated.length - 1];
                    if (last?.role === 'assistant') {
                      updated[updated.length - 1] = {
                        ...last,
                        content: accumulated,
                      };
                    }
                    return updated;
                  });
                }
              }
            }
          }
        }

        if (!accumulated) {
          setMessages((prev) => {
            const updated = [...prev];
            const last = updated[updated.length - 1];
            if (last?.role === 'assistant' && !last.content) {
              updated[updated.length - 1] = {
                ...last,
                content: 'I processed your request but received an empty response. Please try again.',
              };
            }
            return updated;
          });
        }
      } catch {
        setMessages((prev) => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          if (last?.role === 'assistant' && !last.content) {
            updated[updated.length - 1] = {
              ...last,
              content: 'Sorry, I encountered an error. Please check your connection and try again.',
            };
          }
          return updated;
        });
      } finally {
        setIsStreaming(false);
      }
    },
    [messages, isStreaming, id],
  );

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-gray-50"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Messages */}
      <ScrollView
        ref={scrollViewRef}
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: 8 }}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={scrollToBottom}
      >
        {messages.map((msg, idx) => (
          <ChatBubble key={`${msg.timestamp}-${idx}`} message={msg} />
        ))}
        {isStreaming ? (
          <View className="flex-row mb-3">
            <View className="w-8 h-8 rounded-full bg-navy-500 items-center justify-center mr-2 mt-1">
              <Text className="text-white text-sm">🤖</Text>
            </View>
            <View className="bg-gray-200 rounded-2xl rounded-bl px-4 py-3">
              <View className="flex-row gap-1">
                <View className="w-2 h-2 bg-gray-400 rounded-full" />
                <View className="w-2 h-2 bg-gray-400 rounded-full opacity-70" />
                <View className="w-2 h-2 bg-gray-400 rounded-full opacity-40" />
              </View>
            </View>
          </View>
        ) : null}
      </ScrollView>

      {/* Suggested prompts */}
      {messages.length <= 1 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 8, gap: 8 }}
        >
          {SUGGESTED_PROMPTS.map((prompt) => (
            <TouchableOpacity
              key={prompt}
              onPress={() => sendMessage(prompt)}
              className="bg-white border border-gray-200 rounded-full px-3 py-2"
            >
              <Text className="text-sm text-navy-500 font-medium">{prompt}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      ) : null}

      {/* Input bar */}
      <View className="bg-white border-t border-gray-100 px-4 py-3">
        <View className="flex-row items-end gap-2">
          <TextInput
            value={inputText}
            onChangeText={setInputText}
            placeholder="Ask about this permit..."
            placeholderTextColor="#94A3B8"
            multiline
            maxLength={1000}
            className="flex-1 bg-gray-100 rounded-2xl px-4 py-2.5 text-navy-500 text-sm max-h-28"
            returnKeyType="send"
            blurOnSubmit={false}
            onSubmitEditing={() => {
              if (!isStreaming) sendMessage(inputText);
            }}
          />
          <TouchableOpacity
            onPress={() => sendMessage(inputText)}
            disabled={!inputText.trim() || isStreaming}
            className={`w-10 h-10 rounded-full items-center justify-center ${
              inputText.trim() && !isStreaming
                ? 'bg-amber-500'
                : 'bg-gray-200'
            }`}
          >
            {isStreaming ? (
              <ActivityIndicator size="small" color="#9CA3AF" />
            ) : (
              <Text className="text-white font-bold text-base">↑</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
