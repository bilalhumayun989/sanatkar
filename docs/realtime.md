# PostgreSQL realtime for web and Flutter

The web backend and `D:/Brostech/SANATKAR-WEB-1/SANATKAR-APP-supabase-postgree` now share authenticated realtime updates for chat, read receipts, unread counts, notifications, listings, catalogs, shops, favorites, profile/role changes and loaded admin views. Supabase provides authentication only.

## How delivery works

Writes go through the existing authorized HTTP APIs. PostgreSQL row triggers publish small invalidations through `LISTEN/NOTIFY`; PostgreSQL delivers them after the transaction commits, so rollback does not create phantom changes. Events also cover database writes from another backend worker or SQL client. See [PostgreSQL LISTEN](https://www.postgresql.org/docs/current/sql-listen.html) and [NOTIFY](https://www.postgresql.org/docs/current/sql-notify.html).

`GET /api/realtime` uses a persistent server-sent event stream. Both browser and Flutter clients share one connection among their screens, coalesce bursts, and refresh the relevant snapshots from the existing APIs. Message sends still use POST; persistent streaming provides the server-to-client half of realtime. This fits the existing Next.js server without a separate WebSocket server or additional app dependencies. Next.js supports streaming responses in [Route Handlers](https://nextjs.org/docs/app/api-reference/file-conventions/route).

Each Node worker uses one dedicated PostgreSQL listening session shared across its active clients. The broker reconnects after database connection loss. Every initial connection/reconnection emits a resync marker, so clients fetch the latest state even if they missed events while disconnected. Events are invalidations, not a durable event history; database records remain the source of truth.

## Setup and deployment

The local migration has been applied. For another backend/database, run:

```sh
npx prisma migrate deploy
npx prisma generate
npm run build
npm start
```

The new migration is `20261021000000_postgres_realtime`. It adds notification metadata, source deduplication, indexes and realtime triggers. It backfills currently unread messages and pending offers, preserving existing records. No historical listings or users are deleted.

`DATABASE_URL` remains the application's database connection. Optionally set `REALTIME_DATABASE_URL` to a separate direct/session PostgreSQL DSN. `LISTEN` needs a persistent session; do not point this setting at a transaction-mode connection pooler. Keep it on the server. The default is `DATABASE_URL`.

Hosting must support Node HTTP streaming and persistent PostgreSQL sessions. Proxies must not buffer `/api/realtime`; the response includes `X-Accel-Buffering: no` and `Cache-Control: no-cache, no-store, no-transform`. Heartbeats are emitted every 15 seconds. Streams rotate after at most 55 seconds for token/role revalidation and hosting compatibility; clients reconnect automatically. Host/database connection limits still apply, particularly when scaling to many serverless workers. There is no extra WebSocket port to expose.

Flutter keeps its existing `API_BASE_URL` configuration:

```sh
# Android emulator on the same computer
flutter run --dart-define=API_BASE_URL=http://10.0.2.2:3000

# Physical phone: replace with the backend computer's reachable LAN IP
flutter run --dart-define=API_BASE_URL=http://192.168.1.20:3000
```

Restart the Flutter app after installing these changes. Native mobile and same-origin browser clients are supported. A separately hosted Flutter web client still needs an appropriate API CORS configuration.

## Access controls

- Anonymous streams receive only public catalog/listing invalidations, with no record IDs or row contents.
- Private chat, favorite, notification and profile events are filtered to their database-derived recipients. An unrelated admin does not receive private conversations.
- Admin invalidations require an authenticated admin profile. Profile/role changes close the affected user's stream so its next connection revalidates privileges.
- Tokens are verified through Supabase Auth and supplied in bearer headers or the web session cookie, never query strings. Streams cannot continue beyond token expiry. Both clients refresh tokens and reconnect after auth changes; pending old-account snapshots are discarded.
- Payloads contain a topic and optional private notification ID/operation. Recipient identities, message bodies, credentials, and draft details do not cross the stream. All actual data reads/writes still enforce authorization in their APIs.

## Notifications and read behavior

Messages and offers create persistent recipient notifications in the same database transaction. Source keys prevent duplicate creation. A real offer produces one offer notification, rather than a second duplicate notification for its generated chat message. New messages reopen a hidden conversation for its participants.

`GET /api/notifications?format=records` returns the current user's persistent notifications; `summary=true` returns a read-only unread count. Neither GET marks offers or notifications read. `PATCH /api/notifications` accepts `{ "id": "notification-uuid" }` or `{ "all": true }`, scoped to the authenticated account. Related offer status updates happen in the same transaction. Reading chat messages updates their corresponding notifications and emits read-receipt changes.

Flutter local notification banners for new offers/messages are restored while the app is active. Opening its notifications screen marks existing items read, matching the prior flow; new arrivals remain live. The web bell lists both offer and message notifications, while the message navigation badge continues to show unread chat messages.

## Limits that remain

An HTTP event stream does not provide delivery to a terminated or OS-suspended app. Flutter reconnects/resyncs on foreground resume. True closed-app push requires configured FCM/APNs delivery; the earlier app used local notifications and did not have that infrastructure configured. Device permissions and platform behavior also affect local banners.

Other previously documented API gaps are not silently re-enabled: chat media, shop-only chat, individual-message deletion, listing view/share analytics, detailed offer history, personal bio/avatar persistence, some shop edits, and the app's payment-reference badge purchase flow remain separate work. See the app's `WEB_API_INTEGRATION.md` for the full list.

## Validation

Backend tests cover actual PostgreSQL commits/rollbacks, notifications, read receipts, deduplication, no-op update loops, participant filtering, peer listeners, stream authorization/expiry, role changes and notification API ownership. The database integration test creates and removes its own disposable local database:

```powershell
$env:RUN_REALTIME_DB_TESTS='1'
node --test tests/realtime.test.mjs tests/realtime-db.test.mjs tests/realtime-route.test.mjs tests/notifications-api.test.mjs
```

The Flutter suite includes shared streaming, chunked UTF-8 frames, token refresh, reconnect/resync, absence of normal data polling, account isolation, lifecycle resume and notification read contracts. A live HTTP stream against the local web server delivered a PostgreSQL event, filtered a private event from an anonymous client, and rejected invalid credentials. Production and physical-device verification remains deployment-specific.


Verification: 101 Flutter tests passed in the updated app; Dart analysis reported zero errors (existing warnings remain). All 28 backend tests passed, including the isolated PostgreSQL integration tests. The web webpack production build compiled, passed TypeScript and generated all 68 pages. The default Turbopack build encountered a local worker IPC error. A physical-device and production end-to-end check remains outstanding.

Original changed app files and validation logs are archived at `C:/Users/No-Buddy/AppData/Local/Temp/sanatkar-postgres-realtime-4461a8ad-0eb8-431e-bcfb-ea383c132c55`.


The current companion project is `D:/Brostech/SANATKAR-WEB-1/SANATKAR-APP-supabase-postgree`. Its API and realtime changes are now applied there. See [account deletion and seller activation](account-and-seller-activation.md) for the Rs 5,000 shop/payment workflow, deployment configuration, and corrected device setup.
