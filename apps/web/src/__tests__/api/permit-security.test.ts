import type { NextRequest } from 'next/server';
import type { Mock } from 'vitest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { requireAuth } from '@/lib/api/auth';
import { logActivity } from '@/lib/api/audit';
import { prisma } from '@/lib/prisma';
import { POST as createPermit } from '@/app/api/permits/route';
import { PATCH as updateInspection, DELETE as deleteInspection } from '@/app/api/permits/[id]/inspections/[inspId]/route';
import { PATCH as updateFee, DELETE as deleteFee } from '@/app/api/permits/[id]/fees/[feeId]/route';
import { PATCH as updateChecklistItem, DELETE as deleteChecklistItem } from '@/app/api/permits/[id]/checklist/[itemId]/route';

vi.mock('@/lib/api/auth', () => ({
  requireAuth: vi.fn(),
  isAuthContext: (value: unknown) => (
    typeof value === 'object' &&
    value !== null &&
    'userId' in value &&
    'orgId' in value
  ),
}));

vi.mock('@/lib/api/audit', () => ({
  logActivity: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    permit: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    project: {
      findFirst: vi.fn(),
    },
    orgMembership: {
      findFirst: vi.fn(),
    },
    inspection: {
      updateMany: vi.fn(),
      findUniqueOrThrow: vi.fn(),
      deleteMany: vi.fn(),
    },
    fee: {
      updateMany: vi.fn(),
      findUniqueOrThrow: vi.fn(),
      deleteMany: vi.fn(),
    },
    checklistItem: {
      updateMany: vi.fn(),
      findUniqueOrThrow: vi.fn(),
      deleteMany: vi.fn(),
    },
  },
}));

const authContext = {
  userId: '00000000-0000-4000-8000-000000000001',
  email: 'user@example.com',
  orgId: '00000000-0000-4000-8000-000000000002',
  role: 'ADMIN',
  name: 'User',
};

const permitId = '00000000-0000-4000-8000-000000000003';
const childId = '00000000-0000-4000-8000-000000000004';
const projectId = '00000000-0000-4000-8000-000000000005';

type PrismaMock = {
  permit: {
    findFirst: Mock;
    create: Mock;
  };
  project: {
    findFirst: Mock;
  };
  orgMembership: {
    findFirst: Mock;
  };
  inspection: {
    updateMany: Mock;
    findUniqueOrThrow: Mock;
    deleteMany: Mock;
  };
  fee: {
    updateMany: Mock;
    findUniqueOrThrow: Mock;
    deleteMany: Mock;
  };
  checklistItem: {
    updateMany: Mock;
    findUniqueOrThrow: Mock;
    deleteMany: Mock;
  };
};

const prismaMock = prisma as unknown as PrismaMock;
const requireAuthMock = requireAuth as Mock;
const logActivityMock = logActivity as Mock;

function jsonRequest(body: unknown): NextRequest {
  return new Request('http://localhost/api/test', {
    method: 'PATCH',
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json' },
  }) as unknown as NextRequest;
}

async function expectNotFound(response: Response, message: string) {
  expect(response.status).toBe(404);
  await expect(response.json()).resolves.toMatchObject({ error: 'Not found', message });
}

describe('permit API tenant isolation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireAuthMock.mockResolvedValue(authContext);
    prismaMock.permit.findFirst.mockResolvedValue({ id: permitId, orgId: authContext.orgId });
  });

  it('rejects permit creation when projectId is outside the caller organization', async () => {
    prismaMock.project.findFirst.mockResolvedValue(null);

    const response = await createPermit(jsonRequest({
      projectId,
      type: 'BUILDING',
      title: 'Tenant isolation test',
    }));

    await expectNotFound(response, 'Project not found');
    expect(prismaMock.project.findFirst).toHaveBeenCalledWith({
      where: { id: projectId, orgId: authContext.orgId },
      select: { id: true },
    });
    expect(prismaMock.permit.create).not.toHaveBeenCalled();
  });

  it.each([
    {
      name: 'inspection PATCH',
      action: () => updateInspection(jsonRequest({ result: 'approved' }), { params: { id: permitId, inspId: childId } }),
      model: prismaMock.inspection,
      expectedMessage: 'Inspection not found',
    },
    {
      name: 'fee PATCH',
      action: () => updateFee(jsonRequest({ status: 'PAID' }), { params: { id: permitId, feeId: childId } }),
      model: prismaMock.fee,
      expectedMessage: 'Fee not found',
    },
    {
      name: 'checklist item PATCH',
      action: () => updateChecklistItem(jsonRequest({ status: 'COMPLETED' }), { params: { id: permitId, itemId: childId } }),
      model: prismaMock.checklistItem,
      expectedMessage: 'Checklist item not found',
    },
  ])('does not update a mismatched $name child id', async ({ action, model, expectedMessage }) => {
    model.updateMany.mockResolvedValue({ count: 0 });

    const response = await action();

    await expectNotFound(response, expectedMessage);
    expect(model.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ id: childId, permitId }),
    }));
    expect(model.findUniqueOrThrow).not.toHaveBeenCalled();
    expect(logActivityMock).not.toHaveBeenCalled();
  });

  it.each([
    {
      name: 'inspection DELETE',
      action: () => deleteInspection({} as NextRequest, { params: { id: permitId, inspId: childId } }),
      model: prismaMock.inspection,
      expectedMessage: 'Inspection not found',
    },
    {
      name: 'fee DELETE',
      action: () => deleteFee({} as NextRequest, { params: { id: permitId, feeId: childId } }),
      model: prismaMock.fee,
      expectedMessage: 'Fee not found',
    },
    {
      name: 'checklist item DELETE',
      action: () => deleteChecklistItem({} as NextRequest, { params: { id: permitId, itemId: childId } }),
      model: prismaMock.checklistItem,
      expectedMessage: 'Checklist item not found',
    },
  ])('does not delete a mismatched $name child id', async ({ action, model, expectedMessage }) => {
    model.deleteMany.mockResolvedValue({ count: 0 });

    const response = await action();

    await expectNotFound(response, expectedMessage);
    expect(model.deleteMany).toHaveBeenCalledWith({
      where: { id: childId, permitId },
    });
  });
});
