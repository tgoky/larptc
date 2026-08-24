# Launch Remediation Plan

Last updated: June 14, 2026

## Completed In Code

- [x] Remove unsafe customer-submitted transaction-hash checkout from Telegram.
- [x] Disable real payments behind an explicit configuration flag.
- [x] Add provider-neutral orders and webhook-event storage.
- [x] Add an idempotent, atomic order-fulfilment service.
- [x] Generate 128-bit activation codes.
- [x] Store activation-code hashes and encrypted recovery copies.
- [x] Make redemption atomic and race-safe.
- [x] Start subscriptions immediately when access is issued.
- [x] Bind each activation-code subscription to one browser device.
- [x] Validate session token, device secret, fingerprint, subscription, and expiry.
- [x] Add server-side logout and administrator device reset.
- [x] Revoke pending codes, active devices, and sessions together.
- [x] Require production secrets and configure proxy-aware rate limiting.
- [x] Deduplicate Telegram updates.
- [x] Restrict admin commands to private chats.
- [x] Add critical administrator audit records.
- [x] Move wallet screens into lazy chunks and remove them from PWA precaching.
- [x] Replace production `prisma db push` with versioned migrations.

## Deferred Payment Integration

- [ ] Select Billgang, HoodPay, Whop, or another reviewed provider.
- [ ] Confirm product-category acceptance in writing.
- [ ] Confirm settlement, custody, KYC, fees, refunds, and account-hold rules.
- [ ] Implement checkout creation.
- [ ] Verify webhook signatures and timestamps.
- [ ] Deduplicate provider webhook events.
- [ ] Mark orders paid only from trusted provider events.
- [ ] Invoke atomic fulfilment and retry code delivery safely.
- [ ] Test successful, failed, expired, refunded, duplicate, and out-of-order events.
- [ ] Keep `PAYMENTS_ENABLED=false` until all tests pass.

## Remaining Security Work

- [ ] Put protected dashboard assets behind authenticated server-side delivery.
- [ ] Add a strict frontend Content Security Policy.
- [ ] Add automated integration tests using a temporary Postgres database.
- [ ] Add structured logging and production error alerts.
- [ ] Configure and test Railway database backups and restoration.
- [ ] Add provider reconciliation and stuck-order monitoring after payment selection.
- [ ] Review terms, trademarks, disclaimers, and abuse-reporting procedures.

## Deployment Sequence

1. Create initial commits and private GitHub repositories.
2. Provision Railway Postgres and backend staging.
3. Run versioned migrations and seed plans.
4. Configure Telegram webhook and production secrets.
5. Deploy the frontend with the backend URL.
6. Test admin-generated codes and one-device enforcement.
7. Complete authenticated protected-asset delivery.
8. Integrate and test the selected payment provider.
9. Run a private beta.
10. Enable payments only after reconciliation and recovery tests pass.
