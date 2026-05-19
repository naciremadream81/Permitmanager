import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { router } from 'expo-router';
import type { Project } from '@permitpro/shared';
import { PermitType, PERMIT_TYPE_CONFIG } from '@permitpro/shared';
import { createPermit } from '../../../lib/api-client';
import { getAuthTokens } from '../../../lib/auth';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

async function fetchProjects(): Promise<Project[]> {
  try {
    const tokens = await getAuthTokens();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (tokens?.accessToken) {
      headers['Authorization'] = `Bearer ${tokens.accessToken}`;
    }
    const res = await fetch(`${API_URL}/api/projects`, { headers });
    if (!res.ok) return [];
    const data = (await res.json()) as { data?: Project[] };
    return data.data ?? [];
  } catch {
    return [];
  }
}

const PERMIT_TYPES = Object.entries(PERMIT_TYPE_CONFIG).map(([key, val]) => ({
  value: key as PermitType,
  label: val.label,
  icon: val.icon,
  category: val.category,
}));

interface WizardStep {
  step: 1 | 2 | 3;
  total: 3;
}

interface FormData {
  projectId: string | null;
  projectName: string;
  type: PermitType | null;
  title: string;
  jurisdiction: string;
  agency: string;
  description: string;
  appliedDate: string;
  estimatedCost: string;
}

const EMPTY_FORM: FormData = {
  projectId: null,
  projectName: '',
  type: null,
  title: '',
  jurisdiction: '',
  agency: '',
  description: '',
  appliedDate: '',
  estimatedCost: '',
};

function ProgressBar({ step, total }: { step: number; total: number }) {
  return (
    <View className="px-5 pt-3 pb-2">
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-white/70 text-sm">Step {step} of {total}</Text>
        <Text className="text-amber-400 text-sm font-semibold">
          {step === 1 ? 'Project & Type' : step === 2 ? 'Details' : 'Review'}
        </Text>
      </View>
      <View className="flex-row gap-1.5">
        {Array.from({ length: total }).map((_, i) => (
          <View
            key={i}
            style={{ flex: 1 }}
            className={`h-1.5 rounded-full ${
              i < step ? 'bg-amber-500' : 'bg-white/20'
            }`}
          />
        ))}
      </View>
    </View>
  );
}

function Step1({
  form,
  setForm,
  projects,
  isLoadingProjects,
}: {
  form: FormData;
  setForm: React.Dispatch<React.SetStateAction<FormData>>;
  projects: Project[];
  isLoadingProjects: boolean;
}) {
  return (
    <ScrollView
      className="flex-1"
      contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* Project Selection */}
      <Text className="text-navy-500 text-base font-bold mb-3">Select Project</Text>

      {isLoadingProjects ? (
        <View className="items-center py-6">
          <ActivityIndicator color="#0F2044" />
        </View>
      ) : (
        <>
          {projects.length > 0 ? (
            <FlashList
              data={projects}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() =>
                    setForm((f) => ({
                      ...f,
                      projectId: item.id,
                      projectName: item.name,
                    }))
                  }
                  className={`flex-row items-center p-3 mb-2 rounded-xl border ${
                    form.projectId === item.id
                      ? 'border-amber-500 bg-amber-50'
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  <View
                    className={`w-5 h-5 rounded-full border-2 mr-3 items-center justify-center ${
                      form.projectId === item.id
                        ? 'border-amber-500 bg-amber-500'
                        : 'border-gray-300'
                    }`}
                  >
                    {form.projectId === item.id ? (
                      <Text className="text-white text-xs">✓</Text>
                    ) : null}
                  </View>
                  <View className="flex-1">
                    <Text className="text-navy-500 font-semibold">{item.name}</Text>
                    {item.address ? (
                      <Text className="text-xs text-gray-500 mt-0.5">{item.address}</Text>
                    ) : null}
                  </View>
                </TouchableOpacity>
              )}
              estimatedItemSize={64}
              scrollEnabled={false}
              keyExtractor={(item) => item.id}
            />
          ) : null}

          {/* No project / custom */}
          <TouchableOpacity
            onPress={() => setForm((f) => ({ ...f, projectId: null, projectName: '' }))}
            className={`flex-row items-center p-3 mb-4 rounded-xl border ${
              form.projectId === null
                ? 'border-amber-500 bg-amber-50'
                : 'border-gray-200 bg-white'
            }`}
          >
            <View
              className={`w-5 h-5 rounded-full border-2 mr-3 items-center justify-center ${
                form.projectId === null
                  ? 'border-amber-500 bg-amber-500'
                  : 'border-gray-300'
              }`}
            >
              {form.projectId === null ? (
                <Text className="text-white text-xs">✓</Text>
              ) : null}
            </View>
            <Text className="text-navy-500 font-semibold">No project (standalone permit)</Text>
          </TouchableOpacity>
        </>
      )}

      {/* Permit Type Grid */}
      <Text className="text-navy-500 text-base font-bold mb-3">Permit Type</Text>
      <View className="flex-row flex-wrap gap-2">
        {PERMIT_TYPES.map((pt) => (
          <TouchableOpacity
            key={pt.value}
            onPress={() => setForm((f) => ({ ...f, type: pt.value }))}
            style={{ width: '30%' }}
            className={`p-3 rounded-xl border items-center ${
              form.type === pt.value
                ? 'border-amber-500 bg-amber-50'
                : 'border-gray-200 bg-white'
            }`}
          >
            <Text className="text-xl mb-1">📋</Text>
            <Text
              className={`text-xs font-semibold text-center ${
                form.type === pt.value ? 'text-amber-600' : 'text-navy-500'
              }`}
              numberOfLines={2}
            >
              {pt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

function Step2({
  form,
  setForm,
}: {
  form: FormData;
  setForm: React.Dispatch<React.SetStateAction<FormData>>;
}) {
  return (
    <KeyboardAvoidingView
      className="flex-1"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text className="text-navy-500 text-base font-bold mb-4">Permit Details</Text>

        <View className="mb-4">
          <Text className="text-sm font-medium text-gray-700 mb-1.5">
            Permit Title <Text className="text-red-500">*</Text>
          </Text>
          <TextInput
            value={form.title}
            onChangeText={(v) => setForm((f) => ({ ...f, title: v }))}
            placeholder="e.g. Building Permit - 123 Main St"
            placeholderTextColor="#9CA3AF"
            className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-navy-500 text-sm"
          />
        </View>

        <View className="mb-4">
          <Text className="text-sm font-medium text-gray-700 mb-1.5">Jurisdiction</Text>
          <TextInput
            value={form.jurisdiction}
            onChangeText={(v) => setForm((f) => ({ ...f, jurisdiction: v }))}
            placeholder="e.g. City of Austin"
            placeholderTextColor="#9CA3AF"
            className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-navy-500 text-sm"
          />
        </View>

        <View className="mb-4">
          <Text className="text-sm font-medium text-gray-700 mb-1.5">Agency</Text>
          <TextInput
            value={form.agency}
            onChangeText={(v) => setForm((f) => ({ ...f, agency: v }))}
            placeholder="e.g. Austin Development Services"
            placeholderTextColor="#9CA3AF"
            className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-navy-500 text-sm"
          />
        </View>

        <View className="mb-4">
          <Text className="text-sm font-medium text-gray-700 mb-1.5">Description</Text>
          <TextInput
            value={form.description}
            onChangeText={(v) => setForm((f) => ({ ...f, description: v }))}
            placeholder="Describe the scope of this permit..."
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={4}
            className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-navy-500 text-sm"
            style={{ minHeight: 96, textAlignVertical: 'top' }}
          />
        </View>

        <View className="mb-4">
          <Text className="text-sm font-medium text-gray-700 mb-1.5">Applied Date</Text>
          <TextInput
            value={form.appliedDate}
            onChangeText={(v) => setForm((f) => ({ ...f, appliedDate: v }))}
            placeholder="MM/DD/YYYY"
            placeholderTextColor="#9CA3AF"
            keyboardType="numbers-and-punctuation"
            className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-navy-500 text-sm"
          />
        </View>

        <View className="mb-4">
          <Text className="text-sm font-medium text-gray-700 mb-1.5">Estimated Cost ($)</Text>
          <TextInput
            value={form.estimatedCost}
            onChangeText={(v) => setForm((f) => ({ ...f, estimatedCost: v }))}
            placeholder="e.g. 50000"
            placeholderTextColor="#9CA3AF"
            keyboardType="numeric"
            className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-navy-500 text-sm"
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Step3({
  form,
  projects,
}: {
  form: FormData;
  projects: Project[];
}) {
  const project = projects.find((p) => p.id === form.projectId);
  const typeConfig = form.type ? PERMIT_TYPE_CONFIG[form.type] : null;

  return (
    <ScrollView
      className="flex-1"
      contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
    >
      <Text className="text-navy-500 text-base font-bold mb-4">Review & Submit</Text>

      <View className="bg-white rounded-2xl p-5 shadow-sm mb-4">
        <Text className="text-xs text-gray-500 uppercase font-semibold mb-4 tracking-wider">
          Permit Summary
        </Text>

        <ReviewRow label="Title" value={form.title || '—'} />
        <ReviewRow label="Type" value={typeConfig?.label ?? '—'} />
        <ReviewRow label="Project" value={project?.name ?? 'Standalone'} />
        <ReviewRow label="Jurisdiction" value={form.jurisdiction || '—'} />
        <ReviewRow label="Agency" value={form.agency || '—'} />
        {form.appliedDate ? (
          <ReviewRow label="Applied Date" value={form.appliedDate} />
        ) : null}
        {form.estimatedCost ? (
          <ReviewRow label="Est. Cost" value={`$${parseInt(form.estimatedCost).toLocaleString()}`} />
        ) : null}
        {form.description ? (
          <View className="mt-2 pt-3 border-t border-gray-100">
            <Text className="text-xs text-gray-500 mb-1">Description</Text>
            <Text className="text-sm text-navy-500">{form.description}</Text>
          </View>
        ) : null}
      </View>

      <View className="bg-amber-50 rounded-xl p-4 border border-amber-200">
        <Text className="text-amber-700 text-sm font-semibold mb-1">Ready to create</Text>
        <Text className="text-amber-600 text-xs">
          Your permit will be created as a Draft. You can add documents and update the status once created.
        </Text>
      </View>
    </ScrollView>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between items-start mb-3">
      <Text className="text-sm text-gray-500 w-28">{label}</Text>
      <Text className="text-sm font-semibold text-navy-500 flex-1 text-right" numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

export default function NewPermitScreen() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchProjects()
      .then(setProjects)
      .finally(() => setIsLoadingProjects(false));
  }, []);

  const validateStep = useCallback(
    (s: 1 | 2 | 3): boolean => {
      if (s === 1) {
        if (!form.type) {
          Alert.alert('Select Permit Type', 'Please select a permit type to continue.');
          return false;
        }
      }
      if (s === 2) {
        if (!form.title.trim()) {
          Alert.alert('Title Required', 'Please enter a permit title.');
          return false;
        }
      }
      return true;
    },
    [form],
  );

  const handleNext = useCallback(() => {
    if (!validateStep(step)) return;
    if (step < 3) setStep((s) => (s + 1) as 1 | 2 | 3);
  }, [step, validateStep]);

  const handleBack = useCallback(() => {
    if (step > 1) setStep((s) => (s - 1) as 1 | 2 | 3);
    else router.back();
  }, [step]);

  const handleSubmit = useCallback(async () => {
    if (!form.type || !form.title.trim()) {
      Alert.alert('Missing Information', 'Please fill in all required fields.');
      return;
    }

    setIsSubmitting(true);
    try {
      const appliedDate = form.appliedDate
        ? new Date(form.appliedDate).toISOString()
        : null;
      const estimatedCost = form.estimatedCost
        ? parseFloat(form.estimatedCost)
        : null;

      const permit = await createPermit({
        type: form.type,
        title: form.title.trim(),
        projectId: form.projectId,
        jurisdiction: form.jurisdiction || null,
        agency: form.agency || null,
        description: form.description || null,
        appliedDate,
        estimatedCost,
      });

      Alert.alert('Permit Created', `"${permit.title}" has been created successfully.`, [
        {
          text: 'View Permit',
          onPress: () => router.replace(`/(tabs)/permits/${permit.id}` as never),
        },
        {
          text: 'Back to List',
          onPress: () => router.replace('/(tabs)/permits' as never),
        },
      ]);
    } catch {
      Alert.alert('Error', 'Failed to create permit. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [form]);

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-navy-500">
        <View className="flex-row items-center px-5 pt-4 pb-1">
          <TouchableOpacity
            onPress={handleBack}
            className="mr-3 w-8 h-8 rounded-full bg-white/15 items-center justify-center"
          >
            <Text className="text-white text-base">←</Text>
          </TouchableOpacity>
          <Text className="text-white text-xl font-black flex-1">New Permit</Text>
        </View>
        <ProgressBar step={step} total={3} />
      </View>

      {/* Step content */}
      <View className="flex-1">
        {step === 1 ? (
          <Step1
            form={form}
            setForm={setForm}
            projects={projects}
            isLoadingProjects={isLoadingProjects}
          />
        ) : step === 2 ? (
          <Step2 form={form} setForm={setForm} />
        ) : (
          <Step3 form={form} projects={projects} />
        )}
      </View>

      {/* Bottom navigation */}
      <View className="bg-white border-t border-gray-100 px-5 py-4">
        <View className="flex-row gap-3">
          <TouchableOpacity
            onPress={handleBack}
            className="flex-1 py-3.5 rounded-xl border border-gray-200 items-center"
          >
            <Text className="text-navy-500 font-semibold text-base">
              {step === 1 ? 'Cancel' : 'Back'}
            </Text>
          </TouchableOpacity>

          {step < 3 ? (
            <TouchableOpacity
              onPress={handleNext}
              className="flex-2 bg-amber-500 px-8 py-3.5 rounded-xl items-center"
              style={{ flex: 2 }}
            >
              <Text className="text-white font-bold text-base">Next →</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={isSubmitting}
              className="bg-navy-500 px-8 py-3.5 rounded-xl items-center"
              style={{ flex: 2, opacity: isSubmitting ? 0.7 : 1 }}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text className="text-white font-bold text-base">Create Permit</Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}
