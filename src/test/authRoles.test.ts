import { describe, expect, it } from 'vitest';
import { resolveAppRole } from '@/lib/authRoles';

describe('resolveAppRole', () => {
  it('keeps the ministra fallback when no role is assigned', () => {
    expect(resolveAppRole([])).toBe('ministra');
    expect(resolveAppRole(null)).toBe('ministra');
  });

  it('recognizes the admin role with one entry', () => {
    expect(resolveAppRole([{ role: 'admin' }])).toBe('admin');
  });

  it('recognizes admin even if legacy data has multiple role rows', () => {
    expect(resolveAppRole([{ role: 'ministra' }, { role: 'admin' }])).toBe('admin');
  });

  it('does not escalate unknown role values', () => {
    expect(resolveAppRole([{ role: 'unknown' }])).toBe('ministra');
  });
});
