import type { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PATCH as patchChecklistItem } from '../../app/api/permits/[id]/checklist/[itemId]/route';
import { DELETE as deleteFee } from '../../app/api/permits/[id]/fees/[feeId]/route';
import { PATCH as patchInspection } from '../../app/api/permits/[id]/inspections/[inspId]/route';
import { POST as createPermit } from '../../app/api/permits/route';
import { PATCH as updatePermit } from '../../app/api/permits/[id]/route';
import { PermitType } from '@permitpro/shared';

const mocks = vi.hoisted(() => ({
  authContext: {
    userId: '00000000-0000-4000-8000-000000000001',
    email: 'owner@example.com',
    name: 'Owner',
    orgId: '00000000-0000-4000-8000-000000000002',
    role: 'OWNER',
  },
  requireAuth: vi.fn(),
  isAuthContext: vi.fn(),
  logActivity: vi.fn(),
  prisma: {
    permit: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    project: {
      findFirst: vi.fn(),
    },
    checklistItem: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    inspection: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    fee: {
      findFirst: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

vi.mock('@/lib/api/auth', () => ({
  requireAuth: mocks.requireAuth,
  isAuthContext: mocks.isAuthContext,
}));

vi.mock('@/lib/api/audit', () => ({
  logActivity: mocks.logActivity,
}));

vi.mock('@/lib/prisma', () => ({
  prisma: mocks.prisma,
}));

function jsonRequest(body: unknown): NextRequest {
  return new Request('http://localhost/api/test', {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  }) as NextRequest;
}

describe('permit API tenant scoping', () => {
  const permitId = '00000000-0000-4000-8000-000000000003';
  const foreignChildId = '00000000-0000-4000-8000-000000000004';
  const foreignProjectId = '00000000-0000-4000-8000-000000000005';

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireAuth.mockResolvedValue(mocks.authContext);
    mocks.isAuthContext.mockImplementation((value: unknown) => (
      typeof value === 'object' &&
      value !== null &&
      'userId' in value &&
      'orgId' in value
    ));
    mocks.prisma.permit.findFirst.mockResolvedValue({ id: permitId, orgId: mocks.authContext.orgId });
  });

  it('does not update a checklist item unless it belongs to the URL permit', async () => {
    mocks.prisma.checklistItem.findFirst.mockResolvedValue(null);

    const response = await patchChecklistItem(
      jsonRequest({ title: 'Updated checklist title' }),
      { params: { id: permitId, itemId: foreignChildId } },
    );

    expect(response.status).toBe(404);
    expect(mocks.prisma.checklistItem.findFirst).toHaveBeenCalledWith({
      where: { id: foreignChildId, permitId },
    });
    expect(mocks.prisma.checklistItem.update).not.toHaveBeenCalled();
    expect(mocks.logActivity).not.toHaveBeenCalled();
  });

  it('does not update an inspection unless it belongs to the URL permit', async () => {
    mocks.prisma.inspection.findFirst.mockResolvedValue(null);

    const response = await patchInspection(
      jsonRequest({ inspectorName: 'Updated inspector' }),
      { params: { id: permitId, inspId: foreignChildId } },
    );

    expect(response.status).toBe(404);
    expect(mocks.prisma.inspection.findFirst).toHaveBeenCalledWith({
      where: { id: foreignChildId, permitId },
    });
    expect(mocks.prisma.inspection.update).not.toHaveBeenCalled();
    expect(mocks.logActivity).not.toHaveBeenCalled();
  });

  it('does not delete a fee unless it belongs to the URL permit', async () => {
    mocks.prisma.fee.findFirst.mockResolvedValue(null);

    const response = await deleteFee(
      jsonRequest({}),
      { params: { id: permitId, feeId: foreignChildId } },
    );

    expect(response.status).toBe(404);
    expect(mocks.prisma.fee.findFirst).toHaveBeenCalledWith({
      where: { id: foreignChildId, permitId },
    });
    expect(mocks.prisma.fee.delete).not.toHaveBeenCalled();
  });

  it('does not create a permit linked to a project from another organization', async () => {
    mocks.prisma.project.findFirst.mockResolvedValue(null);

    const response = await createPermit(
      jsonRequest({
        projectId: foreignProjectId,
        type: PermitType.BUILDING,
        title: 'Injected permit',
      }),
    );

    expect(response.status).toBe(404);
    expect(mocks.prisma.project.findFirst).toHaveBeenCalledWith({
      where: { id: foreignProjectId, orgId: mocks.authContext.orgId },
      select: { id: true },
    });
    expect(mocks.prisma.permit.create).not.toHaveBeenCalled();
    expect(mocks.logActivity).not.toHaveBeenCalled();
  });

  it('does not move a permit onto a project from another organization', async () => {
    mocks.prisma.project.findFirst.mockResolvedValue(null);

    const response = await updatePermit(
      jsonRequest({ projectId: foreignProjectId }),
      { params: { id: permitId } },
    );

    expect(response.status).toBe(404);
    expect(mocks.prisma.project.findFirst).toHaveBeenCalledWith({
      where: { id: foreignProjectId, orgId: mocks.authContext.orgId },
      select: { id: true },
    });
    expect(mocks.prisma.permit.update).not.toHaveBeenCalled();
    expect(mocks.logActivity).not.toHaveBeenCalled();
  });
});
