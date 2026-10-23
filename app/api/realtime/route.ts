import { NextRequest, NextResponse } from 'next/server';
import { decodeJwt } from 'jose';
import { getCurrentProfile } from '@/lib/auth/supabase/server';
import { AUTH_COOKIE_NAME, readAuthAccessToken } from '@/lib/auth/supabase/auth-cookie';
import { realtimeBroker } from '@/lib/realtime/broker';
import { canReceive, clientEvent, type Principal } from '@/lib/realtime/events';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const authorization = request.headers.get('authorization');
  const cookie = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const token = authorization?.startsWith('Bearer ') ? authorization.slice(7) : readAuthAccessToken(cookie);
  let principal: Principal = null;
  let lifetime = 55000;
  if (authorization || cookie) {
    if (!token) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    try {
      const { user, profile } = await getCurrentProfile(request);
      if (!user || !profile) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
      principal = { id: user.id, admin: profile.role === 'admin' };
      // Decode only after Supabase has verified the token. Never stream past expiry.
      const expiry = decodeJwt(token).exp;
      if (!expiry) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
      lifetime = Math.min(lifetime, expiry * 1000 - Date.now());
      if (lifetime <= 0) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    } catch {
      return NextResponse.json({ success: false, message: 'Authentication unavailable.' }, { status: 503 });
    }
  }

  const encoder = new TextEncoder();
  let controller: ReadableStreamDefaultController<Uint8Array> | undefined;
  let closed = false;
  let heartbeat: ReturnType<typeof setInterval> | undefined;
  let expiry: ReturnType<typeof setTimeout> | undefined;
  let unsubscribe: (() => void) | undefined;
  const close = () => {
    if (closed) return;
    closed = true;
    clearInterval(heartbeat);
    clearTimeout(expiry);
    unsubscribe?.();
    request.signal.removeEventListener('abort', close);
    try { controller?.close(); } catch { /* Already canceled by the HTTP client. */ }
  };
  const send = (value: unknown) => {
    if (closed || !controller) return;
    if ((controller.desiredSize ?? 0) < 0) { close(); return; }
    try { controller.enqueue(encoder.encode(`data: ${JSON.stringify(value)}\n\n`)); } catch { close(); }
  };
  const stream = new ReadableStream<Uint8Array>({
    start(value) { controller = value; }, cancel: close,
  });
  try {
    unsubscribe = await realtimeBroker.subscribe(event => {
      if (event.topic === 'resync') { send({ topic: 'resync' }); return; }
      if (!canReceive(event, principal)) return;
      send(clientEvent(event));
      // A role/profile change must re-authenticate before more admin events.
      if (event.topic === 'profile') close();
    });
    if (closed || request.signal.aborted) {
      unsubscribe(); close();
      return new Response(null, { status: 204 });
    }
    request.signal.addEventListener('abort', close, { once: true });
    send({ topic: 'ready' });
    heartbeat = setInterval(() => send({ topic: 'heartbeat' }), 15000);
    expiry = setTimeout(close, lifetime);
    return new Response(stream, { headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-store, no-transform',
      'X-Accel-Buffering': 'no',
    } });
  } catch {
    close();
    return NextResponse.json({ success: false, message: 'Realtime is temporarily unavailable.' }, { status: 503 });
  }
}
