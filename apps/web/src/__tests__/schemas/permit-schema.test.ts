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
});
