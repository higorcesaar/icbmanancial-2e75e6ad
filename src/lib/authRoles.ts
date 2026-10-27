export type AppRole = 'admin' | 'ministra';

// The legacy schema permits a user to have more than one role row.
// Never use maybeSingle() for this relation.
export function resolveAppRole(rows: readonly { role: string | null }[] | null | undefined): AppRole {
  return rows?.some(({ role }) => role === 'admin') ? 'admin' : 'ministra';
}
