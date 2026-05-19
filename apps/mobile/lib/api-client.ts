import type {
  Permit,
  PermitListItem,
  PermitWithRelations,
  Document as PermitDocument,
  ChecklistItem,
  ChecklistItemWithAssignee,
  Inspection,
  Fee,
  Deadline,
  DeadlineWithPermit,
  DashboardStats,
  PaginatedResponse,
  ApiResponse,
  AiMessage,
} from '@permitpro/shared';
import { getAuthTokens, refreshAccessToken } from './auth';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function getHeaders(): Promise<Record<string, string>> {
  const tokens = await getAuthTokens();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (tokens?.accessToken) {
    headers['Authorization'] = `Bearer ${tokens.accessToken}`;
  }
  return headers;
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  retry = true,
): Promise<T> {
  const headers = await getHeaders();
  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: { ...headers, ...(options.headers as Record<string, string>) },
  });

  if (response.status === 401 && retry) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      return request<T>(path, options, false);
    }
    throw new ApiError(401, 'Unauthorized');
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new ApiError(response.status, errorText);
  }

  return response.json() as Promise<T>;
}

async function requestStream(
  path: string,
  options: RequestInit = {},
): Promise<ReadableStream<Uint8Array> | null> {
  const headers = await getHeaders();
  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: { ...headers, ...(options.headers as Record<string, string>) },
  });
  if (!response.ok) throw new ApiError(response.status, 'Stream request failed');
  return response.body;
}

// Dashboard
export async function fetchDashboardStats(): Promise<DashboardStats> {
  const res = await request<ApiResponse<DashboardStats>>('/api/dashboard/stats');
  if (!res.data) throw new Error('No data');
  return res.data;
}

// Permits
export async function fetchPermits(params?: {
  page?: number;
  pageSize?: number;
  status?: string;
  type?: string;
  search?: string;
}): Promise<PaginatedResponse<PermitListItem>> {
  const query = new URLSearchParams();
  if (params?.page) query.set('page', String(params.page));
  if (params?.pageSize) query.set('pageSize', String(params.pageSize));
  if (params?.status) query.set('status', params.status);
  if (params?.type) query.set('type', params.type);
  if (params?.search) query.set('search', params.search);
  return request<PaginatedResponse<PermitListItem>>(
    `/api/permits?${query.toString()}`,
  );
}

export async function fetchPermit(id: string): Promise<PermitWithRelations> {
  const res = await request<ApiResponse<PermitWithRelations>>(`/api/permits/${id}`);
  if (!res.data) throw new Error('No data');
  return res.data;
}

export async function updatePermitStatus(
  id: string,
  status: string,
): Promise<Permit> {
  const res = await request<ApiResponse<Permit>>(`/api/permits/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
  if (!res.data) throw new Error('No data');
  return res.data;
}

export async function createPermit(
  data: Partial<Permit>,
): Promise<Permit> {
  const res = await request<ApiResponse<Permit>>('/api/permits', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  if (!res.data) throw new Error('No data');
  return res.data;
}

// Permit summary (AI)
export async function fetchPermitSummary(
  id: string,
): Promise<{ summary: string }> {
  return request<{ summary: string }>(`/api/permits/${id}/summary`);
}

// Documents
export async function fetchDocuments(permitId: string): Promise<PermitDocument[]> {
  const res = await request<ApiResponse<PermitDocument[]>>(
    `/api/permits/${permitId}/documents`,
  );
  if (!res.data) throw new Error('No data');
  return res.data;
}

export async function uploadDocument(
  permitId: string,
  formData: FormData,
): Promise<PermitDocument> {
  const tokens = await getAuthTokens();
  const headers: Record<string, string> = {};
  if (tokens?.accessToken) {
    headers['Authorization'] = `Bearer ${tokens.accessToken}`;
  }
  const response = await fetch(`${BASE_URL}/api/permits/${permitId}/documents`, {
    method: 'POST',
    headers,
    body: formData,
  });
  if (!response.ok) throw new ApiError(response.status, 'Upload failed');
  const res = (await response.json()) as ApiResponse<PermitDocument>;
  if (!res.data) throw new Error('No data');
  return res.data;
}

// Checklist
export async function fetchChecklist(
  permitId: string,
): Promise<ChecklistItemWithAssignee[]> {
  const res = await request<ApiResponse<ChecklistItemWithAssignee[]>>(
    `/api/permits/${permitId}/checklist`,
  );
  if (!res.data) throw new Error('No data');
  return res.data;
}

export async function updateChecklistItem(
  permitId: string,
  itemId: string,
  data: Partial<ChecklistItem>,
): Promise<ChecklistItem> {
  const res = await request<ApiResponse<ChecklistItem>>(
    `/api/permits/${permitId}/checklist/${itemId}`,
    { method: 'PATCH', body: JSON.stringify(data) },
  );
  if (!res.data) throw new Error('No data');
  return res.data;
}

export async function generateChecklist(permitId: string): Promise<ChecklistItem[]> {
  const res = await request<ApiResponse<ChecklistItem[]>>(
    `/api/permits/${permitId}/checklist`,
    { method: 'POST', body: JSON.stringify({ generate: true }) },
  );
  if (!res.data) throw new Error('No data');
  return res.data;
}

// Inspections
export async function fetchInspections(permitId: string): Promise<Inspection[]> {
  const res = await request<ApiResponse<Inspection[]>>(
    `/api/permits/${permitId}/inspections`,
  );
  if (!res.data) throw new Error('No data');
  return res.data;
}

// Fees
export async function fetchFees(permitId: string): Promise<Fee[]> {
  const res = await request<ApiResponse<Fee[]>>(
    `/api/permits/${permitId}/fees`,
  );
  if (!res.data) throw new Error('No data');
  return res.data;
}

// Deadlines
export async function fetchDeadlines(permitId?: string): Promise<Deadline[]> {
  const path = permitId
    ? `/api/permits/${permitId}/deadlines`
    : '/api/deadlines';
  const res = await request<ApiResponse<Deadline[]>>(path);
  if (!res.data) throw new Error('No data');
  return res.data;
}

export async function fetchUpcomingDeadlines(): Promise<DeadlineWithPermit[]> {
  const res = await request<ApiResponse<DeadlineWithPermit[]>>(
    '/api/deadlines/upcoming',
  );
  if (!res.data) throw new Error('No data');
  return res.data;
}

// AI chat stream
export async function streamAiChat(
  permitId: string,
  messages: AiMessage[],
): Promise<ReadableStream<Uint8Array> | null> {
  return requestStream(`/api/permits/${permitId}/ai`, {
    method: 'POST',
    body: JSON.stringify({ messages }),
    headers: { 'Content-Type': 'application/json' },
  });
}

// Push token registration
export async function registerPushToken(token: string, platform: string): Promise<void> {
  await request('/api/team/push-token', {
    method: 'POST',
    body: JSON.stringify({ token, platform, deviceName: 'Mobile' }),
  });
}

// AI Insights
export async function fetchInsights(): Promise<
  Array<{ id: string; type: string; title: string; description: string; severity: string }>
> {
  const res = await request<
    ApiResponse<
      Array<{ id: string; type: string; title: string; description: string; severity: string }>
    >
  >('/api/insights');
  return res.data ?? [];
}
