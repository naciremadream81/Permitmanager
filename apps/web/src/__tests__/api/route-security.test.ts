import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { NextRequest } from 'next/server';

const authMock = vi.hoisted(() => ({
  requireAuth: vi.fn(),
}));

const prismaMock = vi.hoisted(() => ({
  permit: {
    findFirst: vi.fn(),
    create: vi.fn(),
  },
  project: {
    findFirst: vi.fn(),
  },
  fee: {
    findFirst: vi.fn(),
    update: vi.fn(),
  },
  comment: {
    findFirst: vi.fn(),
    create: vi.fn(),
  },
}));

vi.mock('@/lib/api/auth', () => ({
  requireAuth: authMock.requireAuth,
  isAuthContext: (value: unknown) =>
    typeof value === 'object' &&
    value !== null &&
    'userId' in value &&
    'orgId' in value,
}));

vi.mock('@/lib/prisma', () => ({
  prisma: prismaMock,
}));

vi.mock('@/lib/api/audit', () => ({
  logActivity: vi.fn(),
}));

import { POST as createPermit } from '../../app/api/permits/route';
import { PATCH as updateFee } from '../../app/api/permits/[id]/fees/[feeId]/route';
import { POST as createComment } from '../../app/api/permits/[id]/comments/route';

function jsonRequest(body: unknown): NextRequest {
  return new Request('https://permitpro.test/api', {
    method: 'POST',
    body: JSON.stringify(body),
  }) as NextRequest;
}

describe('API route ownership checks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMock.requireAuth.mockResolvedValue({
      userId: '11111111-1111-4111-8111-111111111111',
      email: 'coordinator@example.com',
      orgId: '22222222-2222-4222-8222-222222222222',
      role: 'COORDINATOR',
      name: 'Coordinator',
    });
  });

  it('rejects creating a permit for a project outside the authenticated organization', async () => {
    prismaMock.project.findFirst.mockResolvedValue(null);
    prismaMock.permit.create.mockResolvedValue({
      id: '33333333-3333-4333-8333-333333333333',
    });

    const response = await createPermit(jsonRequest({
      type: 'BUILDING',
      title: 'Tenant improvement',
      projectId: '44444444-4444-4444-8444-444444444444',
    }));

    expect(response.status).toBe(404);
    expect(await response.json()).toMatchObject({
      error: 'Not found',
      message: 'Project not found',
    });
    expect(prismaMock.permit.create).not.toHaveBeenCalled();
  });

  it('does not update a fee unless it belongs to the permit in the route', async () => {
    prismaMock.permit.findFirst.mockResolvedValue({
      id: '55555555-5555-4555-8555-555555555555',
      orgId: '22222222-2222-4222-8222-222222222222',
    });
    prismaMock.fee.findFirst.mockResolvedValue(null);
    prismaMock.fee.update.mockResolvedValue({
      id: '66666666-6666-4666-8666-666666666666',
      permitId: '77777777-7777-4777-8777-777777777777',
      amount: 99,
    });

    const response = await updateFee(
      jsonRequest({ amount: 99 }),
      {
        params: {
          id: '55555555-5555-4555-8555-555555555555',
          feeId: '66666666-6666-4666-8666-666666666666',
        },
      },
    );

    expect(response.status).toBe(404);
    expect(await response.json()).toMatchObject({
      error: 'Not found',
      message: 'Fee not found',
    });
    expect(prismaMock.fee.update).not.toHaveBeenCalled();
  });

  it('rejects replies whose parent comment is not on the same permit', async () => {
    prismaMock.permit.findFirst.mockResolvedValue({
      id: '88888888-8888-4888-8888-888888888888',
      orgId: '22222222-2222-4222-8222-222222222222',
    });
    prismaMock.comment.findFirst.mockResolvedValue(null);
    prismaMock.comment.create.mockResolvedValue({
      id: '99999999-9999-4999-8999-999999999999',
    });

    const response = await createComment(
      jsonRequest({
        content: 'Please see this correction.',
        parentCommentId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      }),
      { params: { id: '88888888-8888-4888-8888-888888888888' } },
    );

    expect(response.status).toBe(404);
    expect(await response.json()).toMatchObject({
      error: 'Not found',
      message: 'Parent comment not found',
    });
    expect(prismaMock.comment.create).not.toHaveBeenCalled();
  });
});
