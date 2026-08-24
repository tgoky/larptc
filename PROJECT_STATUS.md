# Larp Tools Project Status

Last updated: June 15, 2026

## Current Decision

Real payments are deliberately disabled until a hosted provider is selected.

The Telegram bot can select plans and create provider-neutral pending orders, but it will not display wallet addresses, accept transaction hashes, or mark anything paid. Admin-generated activation codes are available for testing the complete access flow.

Do not sell access until a provider adapter and signed webhook flow pass sandbox or low-value production tests.

## Repositories

- Frontend: `C:\Users\onlin\Documents\wallets-main`
- Backend: `C:\Users\onlin\Documents\larp-tools-backend`

Both are independent Git repositories with GitHub remotes and deployed services.

## Implemented

### Frontend

- Redesigned landing page, terms, activation page, categorized tools console, Phantom and Trust simulators.
- Same-domain, route-specific install manifests for Phantom and Trust.
- Fixed per-tool install documents avoid iOS falling back to the root Larp Tools manifest.
- A short, single-use pairing code adds isolated iOS app storage as an approved client of the existing device.
- Backend session validation on protected routes.
- Generated browser device secret and browser fingerprint.
- One-device credentials sent with activation and every session validation.
- Server-side logout revocation.
- Wallet tools split into lazy-loaded chunks.
- Paid JavaScript chunks removed from PWA precaching.
- Simulator values remain local to the browser.

### Access Control

- 128-bit random activation codes.
- Activation codes stored as hashes for lookup.
- Recoverable encrypted copy stored with AES-256-GCM.
- Atomic, serializable code redemption.
- Subscription starts when its activation code is issued; redemption only binds the first device.
- One active device per activation-code subscription.
- Device secret and fingerprint hashes stored in Postgres.
- Session, device, subscription, expiry, and revocation validation.
- Administrator device inspection, session inspection, reset, and access revocation.

### Telegram And Administration

- Registration and referral deep links.
- Plan selection and provider-neutral pending orders.
- Payments-disabled checkout message.
- Admin authorization by immutable numeric Telegram IDs.
- Admin commands restricted to private Telegram chats.
- Telegram webhook secret required in production.
- Telegram update deduplication.
- Admin audit records for critical actions.
- Confirmed, throttled broadcasts to active opted-in subscribers.
- Discounts retained for future payment-provider integration.

### Database And Operations

- Users, plans, provider-neutral orders, webhook events.
- Active subscriptions begin at code issuance; legacy pending status remains in the schema.
- Hashed/encrypted activation codes.
- Devices and revocable sessions.
- Short-lived, single-use install handoffs.
- Referrals, discounts, broadcasts, Telegram update deduplication, admin audit logs.
- Versioned initial Prisma migration.
- Expiry maintenance and old Telegram-update cleanup.
- Production startup fails when critical environment variables are missing.
- Railway-aware proxy configuration for API rate limiting.

## Payment Placeholder

The backend defines the provider contract:

```text
createCheckout(order)
verifyWebhook(rawBody, headers)
getPayment(providerPaymentId)
refundPayment(providerPaymentId, amount)
```

Future provider work must:

1. Create checkout for an existing internal order.
2. Verify signed webhook payloads.
3. store each provider event once.
4. mark the order paid.
5. call idempotent atomic fulfilment.
6. deliver the existing encrypted activation code safely on retries.

Candidate providers: Billgang, HoodPay, Whop, or another reviewed hosted gateway.

## Remaining Launch Blockers

1. Select and approve a payment provider.
2. Implement its checkout and signed webhook adapter.
3. Test real payment, duplicate webhook, refund, failure, and fulfilment retry behavior.
4. Move protected dashboard assets behind a server-side authenticated delivery boundary. Lazy chunks reduce casual copying but are not true access control.
5. Test Railway Postgres backup and restore.
6. Perform full browser/device and webhook stress tests.
7. Review trademark, acceptable-use, and anti-misrepresentation controls.

## Required Backend Environment

```text
NODE_ENV=production
DATABASE_URL
PORT
BOT_TOKEN
BOT_WEBHOOK_URL
BOT_WEBHOOK_SECRET
ADMIN_TELEGRAM_IDS
APP_BASE_URL
REFERRAL_RATE
PAYMENTS_ENABLED=false
ACTIVATION_CODE_ENCRYPTION_KEY
```

`ACTIVATION_CODE_ENCRYPTION_KEY` must be 64 hexadecimal characters. Generate it locally:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Frontend:

```text
VITE_API_BASE_URL
```

## Test Flow Without Payments

1. Start Postgres and the backend.
2. Start the Telegram bot webhook.
3. Send `/start`.
4. As admin, send `/code <telegramId> MONTHLY`.
5. Redeem the received code in `/enter`.
6. Confirm the tools work.
7. Try the same code in another browser; it must fail.
8. Run `/device <code>` and `/sessions <code>`.
9. Run `/device_reset <code>`.
10. Confirm the old browser loses access and the replacement code activates one new browser.
