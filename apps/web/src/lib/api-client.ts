import type {
  Permit,
  PermitWithRelations,
  PermitListItem,
  Project,
  ProjectWithPermits,
  Document as PermitDocument,
  ChecklistItem,
  Inspection,
  Fee,
  Activity,
  AiMessage,
} from '@permitpro/shared';

// ─── Base fetch wrapper ──────────────────────────────────────────────────────────

async function fetchApi<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`/api${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!res.ok) {
    let message = `HTTP ${res.status}`;
    try {
      const body = await res.json();
      message = body?.error?.message || body?.message || message;
    } catch {
      // ignore parse error
    }
    throw new Error(message);
  }

  const contentType = res.headers.get('content-type');
  if (contentType?.includes('application/json')) {
    return res.json() as Promise<T>;
  }
  return undefined as T;
}

export function get<T>(path: string): Promise<T> {
  return fetchApi<T>(path, { method: 'GET' });
}

export function post<T>(path: string, body: unknown): Promise<T> {
  return fetchApi<T>(path, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function patch<T>(path: string, body: unknown): Promise<T> {
  return fetchApi<T>(path, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

export function del<T>(path: string): Promise<T> {
  return fetchApi<T>(path, { method: 'DELETE' });
}

// ─── Permit filters ──────────────────────────────────────────────────────────────

export interface PermitFilters {
  status?: string;
  type?: string;
  projectId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

function buildQuery(filters: Record<string, unknown>): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== null && value !== '') {
      params.set(key, String(value));
    }
  }
  const str = params.toString();
  return str ? `?${str}` : '';
}

// ─── Permits ──────────────────────────────────────────────────────────────────────

export function getPermits(filters?: PermitFilters): Promise<{ data: PermitListItem[]; total: number }> {
  return get(`/permits${buildQuery(filters ?? {})}`);
}

export function getPermit(id: string): Promise<PermitWithRelations> {
  return get(`/permits/${id}`);
}

export function createPermit(data: Partial<Permit>): Promise<Permit> {
  return post('/permits', data);
}

export function updatePermit(id: string, data: Partial<Permit>): Promise<Permit> {
  return patch(`/permits/${id}`, data);
}

export function deletePermit(id: string): Promise<void> {
  return del(`/permits/${id}`);
}

// ─── Projects ─────────────────────────────────────────────────────────────────────

export function getProjects(): Promise<Project[]> {
  return get('/projects');
}

export function getProject(id: string): Promise<ProjectWithPermits> {
  return get(`/projects/${id}`);
}

export function createProject(data: Partial<Project>): Promise<Project> {
  return post('/projects', data);
}

export function updateProject(id: string, data: Partial<Project>): Promise<Project> {
  return patch(`/projects/${id}`, data);
}

// ─── Documents ────────────────────────────────────────────────────────────────────

export function getDocuments(permitId: string): Promise<PermitDocument[]> {
  return get(`/permits/${permitId}/documents`);
}

export async function uploadDocument(permitId: string, formData: FormData): Promise<PermitDocument> {
  const res = await fetch(`/api/permits/${permitId}/documents`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error?.message || `HTTP ${res.status}`);
  }
  return res.json();
}

export function updateDocument(
  permitId: string,
  docId: string,
  data: Partial<PermitDocument>
): Promise<PermitDocument> {
  return patch(`/permits/${permitId}/documents/${docId}`, data);
}

export function deleteDocument(permitId: string, docId: string): Promise<void> {
  return del(`/permits/${permitId}/documents/${docId}`);
}

// ─── Checklist ────────────────────────────────────────────────────────────────────

export function getChecklist(permitId: string): Promise<ChecklistItem[]> {
  return get(`/permits/${permitId}/checklist`);
}

export function createChecklistItem(
  permitId: string,
  data: Partial<ChecklistItem>
): Promise<ChecklistItem> {
  return post(`/permits/${permitId}/checklist`, data);
}

export function updateChecklistItem(
  permitId: string,
  itemId: string,
  data: Partial<ChecklistItem>
): Promise<ChecklistItem> {
  return patch(`/permits/${permitId}/checklist/${itemId}`, data);
}

// ─── Inspections ──────────────────────────────────────────────────────────────────

export function getInspections(permitId: string): Promise<Inspection[]> {
  return get(`/permits/${permitId}/inspections`);
}

export function createInspection(
  permitId: string,
  data: Partial<Inspection>
): Promise<Inspection> {
  return post(`/permits/${permitId}/inspections`, data);
}

// ─── Fees ─────────────────────────────────────────────────────────────────────────

export function getFees(permitId: string): Promise<Fee[]> {
  return get(`/permits/${permitId}/fees`);
}

export function createFee(permitId: string, data: Partial<Fee>): Promise<Fee> {
  return post(`/permits/${permitId}/fees`, data);
}

export function updateFee(permitId: string, feeId: string, data: Partial<Fee>): Promise<Fee> {
  return patch(`/permits/${permitId}/fees/${feeId}`, data);
}

// ─── Insights ─────────────────────────────────────────────────────────────────────

export interface Insight {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  permitId?: string;
  permitTitle?: string;
  action?: string;
}

export function getInsights(): Promise<Insight[]> {
  return get('/insights');
}

// ─── Search ───────────────────────────────────────────────────────────────────────

export function searchPermits(query: string): Promise<PermitListItem[]> {
  return get(`/search?q=${encodeURIComponent(query)}`);
}

// ─── AI ───────────────────────────────────────────────────────────────────────────

export interface PermitSummary {
  headline: string;
  statusNarrative: string;
  keyDates: Array<{ label: string; date: string }>;
  criticalIssues: string[];
  nextSteps: string[];
  riskStatement: string;
}

export function getPermitSummary(permitId: string): Promise<PermitSummary> {
  return get(`/permits/${permitId}/summary`);
}

export async function streamPermitAI(
  permitId: string,
  messages: AiMessage[],
  onChunk: (chunk: string) => void
): Promise<void> {
  const res = await fetch(`/api/permits/${permitId}/ai`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages }),
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }

  const reader = res.body?.getReader();
  if (!reader) return;

  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const text = decoder.decode(value, { stream: true });
    const lines = text.split('\n');

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6).trim();
        if (data === '[DONE]') return;
        try {
          const parsed = JSON.parse(data);
          if (parsed.content) {
            onChunk(parsed.content);
          }
        } catch {
          // ignore malformed chunks
        }
      }
    }
  }
}

// ─── Activity ────────────────────────────────────────────────────────────────────

export function getActivity(permitId: string, page = 1): Promise<{ data: Activity[]; total: number }> {
  return get(`/permits/${permitId}/comments?page=${page}`);
}
