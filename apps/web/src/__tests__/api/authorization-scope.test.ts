import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PATCH as patchChecklistItem } from '@/app/api/permits/[id]/checklist/[itemId]/route';
import { POST as createPermit } from '@/app/api/permits/route';
import { POST as createComment } from '@/app/api/permits/[id]/comments/route';

const mocks = vi.hoisted(() => {
  const checklistItemTransaction = {
    updateMany: vi.fn(),
    findFirst: vi.fn(),
  };

  return {
    auth: {
      userId: '11111111-1111-1111-1111-111111111111',
      email: 'owner@example.com',
      orgId: '22222222-2222-2222-2222-222222222222',
      role: 'OWNER',
      name: 'Owner',
    },
    checklistItemTransaction,
    prisma: {
      $transaction: vi.fn(async (
        callback: (tx: { checklistItem: typeof checklistItemTransaction }) => Promise<unknown>,
      ) => callback({ checklistItem: checklistItemTransaction })),
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
      comment: {
        findFirst: vi.fn(),
        create: vi.fn(),
      },
    },
    logActivity: vi.fn(),
  };
});

vi.mock('@/lib/prisma', () => ({ prisma: mocks.prisma }));
vi.mock('@/lib/api/auth', () => ({
  requireAuth: vi.fn(async () => mocks.auth),
  isAuthContext: vi.fn((value: unknown) => (
    typeof value === 'object' &&
    value !== null &&
    'userId' in value &&
    'orgId' in value
  )),
}));
vi.mock('@/lib/api/audit', () => ({ logActivity: mocks.logActivity }));

function jsonRequest(body: unknown): Request {
  return new Request('http://localhost/api/test', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('API authorization scoping', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.prisma.permit.findFirst.mockResolvedValue({
      id: '33333333-3333-3333-3333-333333333333',
      orgId: mocks.auth.orgId,
      status: 'DRAFT',
    });
  });

  it('does not update a checklist item unless it belongs to the route permit', async () => {
    mocks.checklistItemTransaction.updateMany.mockResolvedValue({ count: 0 });

    const response = await patchChecklistItem(
      jsonRequest({ status: 'COMPLETED' }) as never,
      {
        params: {
          id: '33333333-3333-3333-3333-333333333333',
          itemId: '44444444-4444-4444-4444-444444444444',
        },
      },
    );

    expect(response.status).toBe(404);
    expect(mocks.checklistItemTransaction.updateMany).toHaveBeenCalledWith({
      where: {
        id: '44444444-4444-4444-4444-444444444444',
        permitId: '33333333-3333-3333-3333-333333333333',
      },
      data: expect.objectContaining({
        status: 'COMPLETED',
        completedById: mocks.auth.userId,
      }),
    });
    expect(mocks.checklistItemTransaction.findFirst).not.toHaveBeenCalled();
    expect(mocks.logActivity).not.toHaveBeenCalled();
  });

  it('rejects creating a permit linked to a project outside the current organization', async () => {
    mocks.prisma.project.findFirst.mockResolvedValue(null);

    const response = await createPermit(
      jsonRequest({
        title: 'Cross-linked permit',
        type: 'BUILDING',
        projectId: '55555555-5555-5555-5555-555555555555',
      }) as never,
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ message: 'Project not found' });
    expect(mocks.prisma.project.findFirst).toHaveBeenCalledWith({
      where: {
        id: '55555555-5555-5555-5555-555555555555',
        orgId: mocks.auth.orgId,
      },
      select: { id: true },
    });
    expect(mocks.prisma.permit.create).not.toHaveBeenCalled();
  });

  it('rejects comment replies whose parent comment belongs to another permit', async () => {
    mocks.prisma.comment.findFirst.mockResolvedValue(null);

    const response = await createComment(
      jsonRequest({
        content: 'Injected reply',
        parentCommentId: '66666666-6666-6666-6666-666666666666',
      }) as never,
      {
        params: {
          id: '33333333-3333-3333-3333-333333333333',
        },
      },
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ message: 'Parent comment not found' });
    expect(mocks.prisma.comment.findFirst).toHaveBeenCalledWith({
      where: {
        id: '66666666-6666-6666-6666-666666666666',
        permitId: '33333333-3333-3333-3333-333333333333',
      },
      select: { id: true },
    });
    expect(mocks.prisma.comment.create).not.toHaveBeenCalled();
  });
});
