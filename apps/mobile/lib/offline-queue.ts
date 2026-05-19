import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { request } from './api-request';

const QUEUE_KEY = 'permitpro_offline_queue';

export interface QueuedAction {
  id: string;
  type: string;
  payload: Record<string, unknown>;
  createdAt: Date;
  retries: number;
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

async function readQueue(): Promise<QueuedAction[]> {
  try {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as QueuedAction[];
  } catch {
    return [];
  }
}

async function writeQueue(queue: QueuedAction[]): Promise<void> {
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export async function enqueueAction(
  action: Omit<QueuedAction, 'id' | 'createdAt' | 'retries'>,
): Promise<void> {
  const queue = await readQueue();
  queue.push({
    ...action,
    id: generateId(),
    createdAt: new Date(),
    retries: 0,
  });
  await writeQueue(queue);
}

export async function processQueue(): Promise<void> {
  const queue = await readQueue();
  if (queue.length === 0) return;

  const netState = await NetInfo.fetch();
  if (!netState.isConnected) return;

  const remaining: QueuedAction[] = [];

  for (const action of queue) {
    try {
      await executeAction(action);
    } catch {
      if (action.retries < 3) {
        remaining.push({ ...action, retries: action.retries + 1 });
      }
      // Drop after 3 retries
    }
  }

  await writeQueue(remaining);
}

async function executeAction(action: QueuedAction): Promise<void> {
  switch (action.type) {
    case 'UPDATE_CHECKLIST_ITEM': {
      const { permitId, itemId, data } = action.payload as {
        permitId: string;
        itemId: string;
        data: Record<string, unknown>;
      };
      await request(`/api/permits/${permitId}/checklist/${itemId}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
      break;
    }
    case 'UPDATE_PERMIT_STATUS': {
      const { permitId, status } = action.payload as {
        permitId: string;
        status: string;
      };
      await request(`/api/permits/${permitId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      break;
    }
    case 'ADD_COMMENT': {
      const { permitId, content } = action.payload as {
        permitId: string;
        content: string;
      };
      await request(`/api/permits/${permitId}/comments`, {
        method: 'POST',
        body: JSON.stringify({ content }),
      });
      break;
    }
    default:
      break;
  }
}

export async function getPendingCount(): Promise<number> {
  const queue = await readQueue();
  return queue.length;
}

export function startNetworkListener(): () => void {
  const unsubscribe = NetInfo.addEventListener((state) => {
    if (state.isConnected) {
      processQueue().catch(() => undefined);
    }
  });
  return unsubscribe;
}
