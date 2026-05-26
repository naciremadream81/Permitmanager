import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { PATCH as patchChecklistItem } from '@/app/api/permits/[id]/checklist/[itemId]/route';
import { POST as createChecklistItem } from '@/app/api/permits/[id]/checklist/route';
import { DELETE as deleteFee } from '@/app/api/permits/[id]/fees/[feeId]/route';
import { PATCH as patchInspection } from '@/app/api/permits/[id]/inspections/[inspId]/route';
import { POST as createComment } from '@/app/api/permits/[id]/comments/route';

const mocks = vi.hoisted(() => ({
  requireAuth: vi.fn(),
  logActivity: vi.fn(),
  prisma: {
    permit: {
      findFirst: vi.fn(),
    },
    checklistItem: {
      findFirst: vi.fn(),
      aggregate: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    fee: {
      findFirst: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    inspection: {
      findFirst: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    comment: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    activity: {
      create: vi.fn(),
    },
  },
}));

vi.mock('@/lib/api/auth', () => ({
  requireAuth: mocks.requireAuth,
  isAuthContext: (value: unknown) => (
    typeof value === 'object' &&
    value !== null &&
    'userId' in value &&
    'orgId' in value
  ),
}));

vi.mock('@/lib/api/audit', () => ({
  logActivity: mocks.logActivity,
}));

vi.mock('@/lib/prisma', () => ({
  prisma: mocks.prisma,
}));

const auth = {
  userId: '00000000-0000-4000-8000-000000000001',
  email: 'owner@example.com',
  orgId: '00000000-0000-4000-8000-000000000002',
  role: 'OWNER',
  name: 'Owner',
};

const ownedPermitId = '00000000-0000-4000-8000-000000000003';
const foreignChildId = '00000000-0000-4000-8000-000000000004';

function requestWithJson(path: string, body: unknown, method = 'PATCH') {
  return new NextRequest(`https://permitpro.test${path}`, {
    method,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('permit child authorization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireAuth.mockResolvedValue(auth);
    mocks.prisma.permit.findFirst.mockResolvedValue({ id: ownedPermitId, orgId: auth.orgId });
  });

  it('does not patch a checklist item unless it belongs to the route permit', async () => {
    mocks.prisma.checklistItem.findFirst.mockResolvedValue(null);

    const response = await patchChecklistItem(
      requestWithJson(`/api/permits/${ownedPermitId}/checklist/${foreignChildId}`, {
        status: 'COMPLETED',
      }),
      { params: { id: ownedPermitId, itemId: foreignChildId } },
    );

    expect(response.status).toBe(404);
    expect(mocks.prisma.checklistItem.update).not.toHaveBeenCalled();
    expect(mocks.logActivity).not.toHaveBeenCalled();
  });

  it('does not delete a fee unless it belongs to the route permit', async () => {
    mocks.prisma.fee.findFirst.mockResolvedValue(null);

    const response = await deleteFee(
      new NextRequest(`https://permitpro.test/api/permits/${ownedPermitId}/fees/${foreignChildId}`),
      { params: { id: ownedPermitId, feeId: foreignChildId } },
    );

    expect(response.status).toBe(404);
    expect(mocks.prisma.fee.delete).not.toHaveBeenCalled();
  });

  it('does not patch an inspection unless it belongs to the route permit', async () => {
    mocks.prisma.inspection.findFirst.mockResolvedValue(null);

    const response = await patchInspection(
      requestWithJson(`/api/permits/${ownedPermitId}/inspections/${foreignChildId}`, {
        status: 'PASSED',
      }),
      { params: { id: ownedPermitId, inspId: foreignChildId } },
    );

    expect(response.status).toBe(404);
    expect(mocks.prisma.inspection.update).not.toHaveBeenCalled();
    expect(mocks.logActivity).not.toHaveBeenCalled();
  });

  it('rejects checklist parents from another permit', async () => {
    mocks.prisma.checklistItem.findFirst.mockResolvedValue(null);

    const response = await createChecklistItem(
      requestWithJson(`/api/permits/${ownedPermitId}/checklist`, {
        title: 'Submit plans',
        parentItemId: foreignChildId,
      }, 'POST'),
      { params: { id: ownedPermitId } },
    );

    expect(response.status).toBe(404);
    expect(mocks.prisma.checklistItem.create).not.toHaveBeenCalled();
  });

  it('rejects comment parents from another permit', async () => {
    mocks.prisma.comment.findFirst.mockResolvedValue(null);

    const response = await createComment(
      requestWithJson(`/api/permits/${ownedPermitId}/comments`, {
        content: 'This should not attach elsewhere',
        parentCommentId: foreignChildId,
      }, 'POST'),
      { params: { id: ownedPermitId } },
    );

    expect(response.status).toBe(404);
    expect(mocks.prisma.comment.create).not.toHaveBeenCalled();
  });
});
