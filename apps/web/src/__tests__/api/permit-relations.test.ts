import { describe, expect, it, beforeEach, vi } from 'vitest';
import { validatePermitRelations } from '@/lib/api/permit-relations';

const mocks = vi.hoisted(() => ({
  projectFindFirst: vi.fn(),
  membershipFindFirst: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    project: {
      findFirst: mocks.projectFindFirst,
    },
    orgMembership: {
      findFirst: mocks.membershipFindFirst,
    },
  },
}));

describe('validatePermitRelations', () => {
  beforeEach(() => {
    mocks.projectFindFirst.mockReset();
    mocks.membershipFindFirst.mockReset();
  });

  it('allows permit data without scoped relations', async () => {
    const result = await validatePermitRelations('org-1', {});

    expect(result).toBeNull();
    expect(mocks.projectFindFirst).not.toHaveBeenCalled();
    expect(mocks.membershipFindFirst).not.toHaveBeenCalled();
  });

  it('rejects a project outside the current organization', async () => {
    mocks.projectFindFirst.mockResolvedValue(null);

    const response = await validatePermitRelations('org-1', { projectId: 'project-2' });

    expect(mocks.projectFindFirst).toHaveBeenCalledWith({
      where: { id: 'project-2', orgId: 'org-1' },
      select: { id: true },
    });
    expect(response?.status).toBe(400);
    await expect(response?.json()).resolves.toMatchObject({
      error: 'Bad request',
      message: 'Project must belong to the current organization',
    });
  });

  it('rejects an assignee without an active membership in the current organization', async () => {
    mocks.membershipFindFirst.mockResolvedValue(null);

    const response = await validatePermitRelations('org-1', { assigneeId: 'user-2' });

    expect(mocks.membershipFindFirst).toHaveBeenCalledWith({
      where: {
        userId: 'user-2',
        orgId: 'org-1',
        joinedAt: { not: null },
      },
      select: { id: true },
    });
    expect(response?.status).toBe(400);
    await expect(response?.json()).resolves.toMatchObject({
      error: 'Bad request',
      message: 'Assignee must be an active member of the current organization',
    });
  });

  it('allows relations that belong to the current organization', async () => {
    mocks.projectFindFirst.mockResolvedValue({ id: 'project-1' });
    mocks.membershipFindFirst.mockResolvedValue({ id: 'membership-1' });

    const result = await validatePermitRelations('org-1', {
      projectId: 'project-1',
      assigneeId: 'user-1',
    });

    expect(result).toBeNull();
  });
});
