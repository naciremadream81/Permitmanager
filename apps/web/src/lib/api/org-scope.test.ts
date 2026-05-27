import { beforeEach, describe, expect, it, vi } from 'vitest';
import { prisma } from '@/lib/prisma';
import {
  validateChecklistReferencesForPermit,
  validateCommentParentForPermit,
  validatePermitRelationsInOrg,
} from './org-scope';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    project: { findFirst: vi.fn() },
    orgMembership: { findFirst: vi.fn() },
    checklistItem: { findFirst: vi.fn() },
    comment: { findFirst: vi.fn() },
  },
}));

const mockedPrisma = vi.mocked(prisma, { deep: true });

describe('org scope validators', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects permit project references outside the active organization', async () => {
    mockedPrisma.project.findFirst.mockResolvedValue(null);

    const response = await validatePermitRelationsInOrg(
      { projectId: 'project-from-another-org' },
      'org-a',
    );

    expect(response?.status).toBe(404);
    expect(mockedPrisma.project.findFirst).toHaveBeenCalledWith({
      where: { id: 'project-from-another-org', orgId: 'org-a' },
      select: { id: true },
    });
  });

  it('rejects permit assignees without active membership in the organization', async () => {
    mockedPrisma.orgMembership.findFirst.mockResolvedValue(null);

    const response = await validatePermitRelationsInOrg(
      { assigneeId: 'user-from-another-org' },
      'org-a',
    );

    expect(response?.status).toBe(404);
    expect(mockedPrisma.orgMembership.findFirst).toHaveBeenCalledWith({
      where: {
        userId: 'user-from-another-org',
        orgId: 'org-a',
        joinedAt: { not: null },
      },
      select: { id: true },
    });
  });

  it('rejects checklist parent items outside the current permit', async () => {
    mockedPrisma.checklistItem.findFirst.mockResolvedValue(null);

    const response = await validateChecklistReferencesForPermit(
      { parentItemId: 'other-permit-item' },
      'permit-a',
      'org-a',
    );

    expect(response?.status).toBe(404);
    expect(mockedPrisma.checklistItem.findFirst).toHaveBeenCalledWith({
      where: { id: 'other-permit-item', permitId: 'permit-a' },
      select: { id: true },
    });
  });

  it('rejects comment parents outside the current permit', async () => {
    mockedPrisma.comment.findFirst.mockResolvedValue(null);

    const response = await validateCommentParentForPermit('other-permit-comment', 'permit-a');

    expect(response?.status).toBe(404);
    expect(mockedPrisma.comment.findFirst).toHaveBeenCalledWith({
      where: { id: 'other-permit-comment', permitId: 'permit-a' },
      select: { id: true },
    });
  });
});
