'use client';

import { createClient } from '@/lib/auth/supabase/client';
import { decodeSseFrame } from './sse';

export type LiveEvent = { topic: string; operation?: string; id?: string };
type Watcher = { topics: Set<string>; callback: (event: LiveEvent) => void };
const watchers = new Set<Watcher>();
let stop: (() => void) | undefined;

function start() {
  let generation = 0;
  let alive = true;
  let controller: AbortController | undefined;
  let retry: ReturnType<typeof setTimeout> | undefined;
  let failures = 0;
  const dispatch = (event: LiveEvent) => {
    for (const watcher of watchers) {
      if (event.topic === 'ready' || event.topic === 'resync' || watcher.topics.has(event.topic)) {
        try { watcher.callback(event); } catch (error) { console.error('Realtime update failed:', error); }
      }
    }
  };
  const connect = async () => {
    const current = ++generation;
    controller?.abort();
    const connection = controller = new AbortController();
    let watchdog: ReturnType<typeof setTimeout> | undefined;
    try {
      const client = createClient();
      const { data: { session } } = await client.auth.getSession();
      if (!alive || current !== generation) return;
      const response = await fetch('/api/realtime', {
        signal: connection.signal, credentials: 'include', cache: 'no-store',
        headers: { Accept: 'text/event-stream', ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}) },
      });
      if (response.status === 401 && session) {
        await client.auth.refreshSession();
        throw new Error('Session refreshed');
      }
      if (!response.ok || !response.body) throw new Error('Realtime connection unavailable');
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      try {
        while (alive && current === generation) {
          clearTimeout(watchdog);
          watchdog = setTimeout(() => connection.abort(), 40000);
          const { done, value } = await reader.read();
          if (done) break;
          if (current !== generation) return;
          failures = 0;
          buffer = (buffer + decoder.decode(value, { stream: true })).replace(/\r\n/g, '\n');
          if (buffer.length > 65536) throw new Error('Invalid realtime frame');
          let boundary: number;
          while ((boundary = buffer.indexOf('\n\n')) >= 0) {
            const event = decodeSseFrame(buffer.slice(0, boundary));
            buffer = buffer.slice(boundary + 2);
            if (event && event.topic !== 'heartbeat') dispatch(event as LiveEvent);
          }
        }
      } finally { await reader.cancel().catch(() => {}); }
    } catch { /* Reconnect and resync after network/database interruptions. */ }
    finally {
      clearTimeout(watchdog);
      if (alive && current === generation) {
        retry = setTimeout(() => { void connect(); }, Math.min(500 * 2 ** failures++, 15000));
      }
    }
  };
  const restart = () => {
    generation++;
    controller?.abort();
    clearTimeout(retry);
    retry = setTimeout(() => { if (alive) void connect(); }, 0);
  };
  const resume = () => { if (document.visibilityState === 'visible') restart(); };
  let authSubscription: { unsubscribe(): void } | undefined;
  try { authSubscription = createClient().auth.onAuthStateChange(() => restart()).data.subscription; } catch { /* Configuration errors reconnect normally. */ }
  window.addEventListener('online', restart);
  document.addEventListener('visibilitychange', resume);
  void connect();
  return () => {
    alive = false;
    generation++;
    controller?.abort();
    clearTimeout(retry);
    authSubscription?.unsubscribe();
    window.removeEventListener('online', restart);
    document.removeEventListener('visibilitychange', resume);
  };
}

/** All components share one authenticated connection, including after hot reload. */
export function subscribeRealtime(topics: string[], callback: (event: LiveEvent) => void) {
  const watcher = { topics: new Set(topics), callback };
  watchers.add(watcher);
  if (!stop && typeof window !== 'undefined') stop = start();
  return () => {
    watchers.delete(watcher);
    if (!watchers.size) { stop?.(); stop = undefined; }
  };
}

/** Coalesce transaction bursts and serialize refreshes to prevent stale races. */
export function refreshOnRealtime(topics: string[], refresh: () => unknown | Promise<unknown>) {
  let active = true;
  let busy = false;
  let pending = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const run = async () => {
    if (!active) return;
    if (busy) { pending = true; return; }
    busy = true;
    try { await refresh(); } catch (error) { console.error('Realtime refresh failed:', error); }
    finally { busy = false; if (pending && active) { pending = false; void run(); } }
  };
  const unsubscribe = subscribeRealtime(topics, () => {
    clearTimeout(timer);
    timer = setTimeout(() => { void run(); }, 75);
  });
  return () => { active = false; clearTimeout(timer); unsubscribe(); };
}
