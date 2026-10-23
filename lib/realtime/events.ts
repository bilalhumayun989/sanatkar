export const topics = ['listings', 'catalog', 'profile', 'favorites', 'chats', 'notifications', 'admin'] as const;
export type Topic = typeof topics[number];
export type DatabaseEvent = {
  topic: Topic;
  audience: 'public' | 'users' | 'admins';
  users: string[];
  record_id?: string | null;
  operation?: string | null;
};
export type Principal = { id: string; admin: boolean } | null;

export function parseEvent(payload?: string): DatabaseEvent | null {
  try {
    const value = JSON.parse(payload || '');
    if (!topics.includes(value.topic) || !['public', 'users', 'admins'].includes(value.audience)) return null;
    // Public listeners must only ever receive catalog/listing invalidations.
    if (value.audience === 'public' && !['listings', 'catalog'].includes(value.topic)) return null;
    if (value.audience === 'admins' && value.topic !== 'admin') return null;
    if (value.audience === 'users' && !Array.isArray(value.users)) return null;
    return {
      topic: value.topic, audience: value.audience,
      users: (value.users || []).filter((id: unknown) => typeof id === 'string'),
      record_id: typeof value.record_id === 'string' ? value.record_id : null,
      operation: typeof value.operation === 'string' ? value.operation : null,
    };
  } catch { return null; }
}

export function canReceive(event: DatabaseEvent, principal: Principal): boolean {
  return event.audience === 'public' || Boolean(principal && (
    event.audience === 'admins' ? principal.admin : event.users.includes(principal.id)
  ));
}

export function clientEvent(event: DatabaseEvent) {
  // Neither recipient IDs nor database row contents cross the stream boundary.
  return { topic: event.topic, operation: event.operation,
    ...(event.audience === 'users' && event.record_id ? { id: event.record_id } : {}) };
}
