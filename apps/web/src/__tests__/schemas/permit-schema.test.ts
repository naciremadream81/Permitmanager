import { describe, expect, it } from 'vitest';
import { CreatePermitSchema, PermitType } from '@permitpro/shared';

describe('CreatePermitSchema', () => {
  it('preserves expirationDate submitted by the permit creation form', () => {
    const expirationDate = '2026-12-31T00:00:00.000Z';

    const result = CreatePermitSchema.parse({
      type: PermitType.BUILDING,
      title: 'Building permit',
      expirationDate,
    });

    expect(result.expirationDate).toBe(expirationDate);
  });

  it('accepts null for optional fields sent blank by the permit creation form', () => {
    const result = CreatePermitSchema.parse({
      type: PermitType.BUILDING,
      title: 'Building permit',
      description: null,
      jurisdiction: null,
      agency: null,
      appliedDate: null,
      expirationDate: null,
      estimatedCost: null,
      projectId: null,
      assigneeId: null,
    });

    expect(result).toMatchObject({
      description: null,
      jurisdiction: null,
      agency: null,
      appliedDate: null,
      expirationDate: null,
      estimatedCost: null,
      projectId: null,
      assigneeId: null,
    });
  });
});
