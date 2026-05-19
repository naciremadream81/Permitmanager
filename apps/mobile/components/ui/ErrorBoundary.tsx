import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; reset: () => void }>;
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  reset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        const Fallback = this.props.fallback;
        return <Fallback error={this.state.error} reset={this.reset} />;
      }

      return (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-4xl mb-4">⚠️</Text>
          <Text className="text-xl font-bold text-navy-500 text-center mb-2">
            Something went wrong
          </Text>
          <Text className="text-sm text-gray-500 text-center mb-6">
            {this.state.error.message}
          </Text>
          <TouchableOpacity
            onPress={this.reset}
            className="bg-navy-500 px-6 py-3 rounded-xl"
          >
            <Text className="text-white font-semibold">Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

interface InlineErrorProps {
  message: string;
  onRetry?: () => void;
}

export function InlineError({ message, onRetry }: InlineErrorProps) {
  return (
    <View className="flex-1 items-center justify-center px-8 py-12">
      <Text className="text-3xl mb-3">⚠️</Text>
      <Text className="text-base text-gray-700 text-center mb-4">{message}</Text>
      {onRetry ? (
        <TouchableOpacity
          onPress={onRetry}
          className="bg-navy-500 px-5 py-2.5 rounded-lg"
        >
          <Text className="text-white font-medium">Retry</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}
