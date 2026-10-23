import { Client } from 'pg';
import { parseEvent, type DatabaseEvent } from './events';

type Handler = (event: DatabaseEvent | { topic: 'resync' }) => void;

/** One PostgreSQL session per Node worker, shared by all its HTTP streams. */
class RealtimeBroker {
  private client: Client | null = null;
  private connecting: Promise<void> | null = null;
  private handlers = new Set<Handler>();
  private retry: ReturnType<typeof setTimeout> | undefined;
  private idle: ReturnType<typeof setTimeout> | undefined;
  private failures = 0;

  private connect() {
    if (this.client) return Promise.resolve();
    if (this.connecting) return this.connecting;
    this.connecting = (async () => {
      const connectionString = process.env.REALTIME_DATABASE_URL || process.env.DATABASE_URL;
      if (!connectionString) throw new Error('PostgreSQL connection is not configured');
      const client = new Client({ connectionString, connectionTimeoutMillis: 5000, keepAlive: true });
      let lost = false;
      const disconnect = () => {
        if (lost) return;
        lost = true;
        if (this.client === client) this.client = null;
        void client.end().catch(() => {});
        if (this.handlers.size) this.scheduleReconnect();
      };
      client.on('error', disconnect);
      client.on('end', disconnect);
      client.on('notification', message => {
        const event = parseEvent(message.payload);
        if (event) this.emit(event);
      });
      try {
        await client.connect();
        await client.query('LISTEN sanatkar_events');
        if (lost) throw new Error('PostgreSQL listener disconnected');
        this.client = client;
        this.failures = 0;
        this.emit({ topic: 'resync' });
      } catch (error) {
        disconnect();
        throw error;
      }
    })().finally(() => { this.connecting = null; });
    return this.connecting;
  }

  private emit(event: Parameters<Handler>[0]) {
    for (const handler of this.handlers) {
      try { handler(event); } catch { /* One dropped HTTP stream cannot stop delivery to others. */ }
    }
  }

  private scheduleReconnect() {
    if (this.retry) return;
    this.retry = setTimeout(() => {
      this.retry = undefined;
      if (!this.handlers.size) return;
      void this.connect().catch(() => this.scheduleReconnect());
    }, Math.min(1000 * 2 ** this.failures++, 30000));
    this.retry.unref?.();
  }

  async subscribe(handler: Handler) {
    clearTimeout(this.idle);
    this.handlers.add(handler);
    const unsubscribe = () => {
      this.handlers.delete(handler);
      if (!this.handlers.size) {
        clearTimeout(this.retry);
        this.retry = undefined;
        this.idle = setTimeout(() => {
          if (this.handlers.size) return;
          const client = this.client;
          this.client = null;
          void client?.end().catch(() => {});
        }, 5000);
        this.idle.unref?.();
      }
    };
    try { await this.connect(); } catch (error) { unsubscribe(); throw error; }
    return unsubscribe;
  }
}

declare global { var sanatkarRealtimeBroker: RealtimeBroker | undefined; }
export const realtimeBroker = globalThis.sanatkarRealtimeBroker ??= new RealtimeBroker();
