import { prisma } from '@/lib/prisma';

interface LogActivityParams {
  orgId: string;
  userId?: string;
  permitId?: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
}

export async function logActivity(params: LogActivityParams): Promise<void> {
  try {
    await prisma.activity.create({
      data: {
        orgId: params.orgId,
        userId: params.userId ?? null,
        permitId: params.permitId ?? null,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        metadata: params.metadata ?? {},
        ipAddress: params.ipAddress ?? null,
      },
    });
  } catch (err) {
    // Audit failures must never crash the main request
    console.error('[Audit] Failed to log activity:', err);
  }
}
