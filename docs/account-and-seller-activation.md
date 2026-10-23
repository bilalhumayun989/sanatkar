# Account deletion and seller activation

The companion app is **`D:/Brostech/SANATKAR-WEB-1/SANATKAR-APP-supabase-postgree`**. The similarly named `D:/Brostech/SANATKAR-APP-supabase` is a different copy. Use the companion project above for builds and device testing.

## Data source and local device setup

The app's business data comes from this web backend; Supabase provides authentication only. API integration does not erase or replace PostgreSQL rows. The app and web must use the same backend/database to show the same records.

Start the backend on port 3000. On a USB-connected Android phone, forward the port and rebuild the correct project:

```powershell
adb reverse tcp:3000 tcp:3000
cd D:/Brostech/SANATKAR-WEB-1/SANATKAR-APP-supabase-postgree
flutter run --dart-define=API_BASE_URL=http://127.0.0.1:3000
```

`10.0.2.2` is the Android emulator's host address; a physical phone needs USB port forwarding or a reachable LAN server address. `API_BASE_URL` is compiled into Flutter. Restarting the backend or editing its `.env` does not update an installed APK's API address. The app's `scripts/run-local-android.ps1` automates the USB configuration.

## Password-confirmed deletion

Web: Profile / mobile profile / Edit Profile → Delete account. App: Profile or Password & sign-in → Delete account.

`DELETE /api/account` requires an authenticated session and `{ "password": "current-password" }`. The server obtains the account ID and email from verified authentication, checks the password with an isolated Supabase client, and verifies that the resulting identity matches the current user. Caller-supplied target IDs or email addresses cannot select another account. Five attempts per account are allowed in a 15-minute window. Google users must first set a password through the existing recovery flow.

Deletion removes the profile, owned listings, shared conversations involving the user or their listings, messages, related notification previews, offers, orders, favorites, listing activity, and badge requests. The sign-in identity is deleted through the server-only Supabase admin API. The database cleanup rolls back if that API reports failure. Successful remote deletion is not repeated when retrying a transient local commit error. Auth and PostgreSQL are separate services, so persistent infrastructure failures after remote deletion require support to reconcile any leftover local records.

A minimal UUID/timestamp deletion marker prevents old sessions and in-flight profile synchronization from recreating the account. No password is stored or logged. Private seller payment screenshots for that user are removed after successful deletion. Existing general `/public/uploads` images have no ownership registry and are not automatically purged; arbitrary user-supplied URLs are never used to delete files. User-facing warnings describe the permanent deletion of shared conversations and associated orders.

## Shop-first seller activation

New seller accounts start without listing permission. They must:

1. Create a complete shop: photo, name, description, address, city, phone, and CNIC.
2. Open “List a product” / “Activate seller account”.
3. Pay the one-time **PKR 5,000** activation fee using the displayed IBAN or JazzCash number.
4. Attach a JPG/PNG/WebP screenshot under 5 MB and submit it.
5. Wait for an admin to inspect the screenshot and approve the payment.

Approval unlocks unlimited listings. Rejected submissions can be replaced; pending submissions cannot be duplicated. Existing approved sellers are grandfathered by the migration. Regular buyers retain the existing backend's three-listing allowance; this change gates seller accounts and upgrades.

`GET /api/profile/seller-activation` returns the caller's status and payment instructions. `POST` accepts multipart `proof`, determines the fee/status on the server and never grants access from a submitted screenshot alone. Admin review uses `PATCH /api/admin/profiles/:id` with `approve_seller` or `reject_seller`; a complete shop and pending payment screenshot are required. The listing API rechecks current seller approval inside the locked database transaction, including legacy `/api/cars` writes. Republishing through the listing PATCH API also checks approval.

Screenshots are stored under **`private/seller-payments`**, outside the public directory. `GET /api/profile/seller-activation/proof?userId=...` authorizes only the owner or an admin, with non-cacheable responses. The app uses bearer-authenticated image downloads for admin inspection. Persist this directory on the production server; it must be shared if multiple backend instances serve uploads.

Both clients display live status changes through PostgreSQL realtime. The separate paid verification badge purchase/request/review flow remains disabled and retained in code. Seller activation does not grant a paid badge.

## Configuration and deployment

```sh
npx prisma migrate deploy
npx prisma generate
```

Migrations: `20261022000000_account_deletion` and `20261022010000_seller_activation`.

The existing **server-only** `SUPABASE_SERVICE_ROLE_KEY` is required for deleting Auth identities. Never expose it to Flutter/browser builds.

Configure real receiving details in the backend environment:

```dotenv
SELLER_PAYMENT_ACCOUNT_TITLE="Your account title"
SELLER_PAYMENT_IBAN="Your IBAN"
SELLER_PAYMENT_JAZZCASH_PHONE="Your JazzCash phone number"
```

For now, unset receiving details display clearly marked demo placeholders as requested. Replace them before accepting actual payments. There is no automatic payment charge or gateway transaction: the user transfers money and an admin manually verifies the receipt.

## Verification

Backend security and disposable-PostgreSQL tests cover deletion ownership/password failures, rollback, deletion markers, screenshot access, shop requirements, fixed fees, rejection/resubmission and approval unlocking a fourth listing. Authentication deletion is mocked in automated tests; real accounts and real payments are not deleted or charged by them.

Final verification: **109 Flutter tests**, **52 backend tests**, zero Dart analysis errors, and a successful webpack production build. The correct project's ARM64 debug APK was installed on the connected Pixel and launched at sign-in. The running local listings API matched PostgreSQL IDs. Real payments/account deletion were not performed during device verification.

Original changed files from the correct app and verification logs are archived at `C:/Users/No-Buddy/AppData/Local/Temp/sanatkar-account-seller-delivery-1ed80b52-b129-4cd5-b419-a12a57481280`. The app originals are in `correct-app-originals`.
