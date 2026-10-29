# Clinic booking API + web page

Next.js (App Router) + MongoDB (Mongoose). One deployment serves the API (at the spec's root paths: `/reset`, `/slots`, `/bookings`, `/bookings/{id}`) and the booking web page (`/`).
Spec: https://koyaacademy.com/assessment-api

## Run locally

```bash
npm install
cp .env.example .env.local      # then fill MONGODB_URI and API_KEY
npm run dev
```

No Atlas yet? `npm run dev:db` starts an in-memory MongoDB on port 27018; use `MONGODB_URI=mongodb://127.0.0.1:27018/clinic`.
Seed demo slots: `BASE_URL=http://localhost:3000 API_KEY=... npm run seed` (this calls `/reset`, which wipes bookings).

## Checks

```bash
npx tsc --noEmit && npm run lint && npm test && npm run build
```

`npm test` runs 15 integration tests against a real (in-memory) MongoDB, including 25 simultaneous bookings for one slot, 10 simultaneous retries of one Idempotency-Key, and 20 simultaneous attempts against the rate limit.

## How each level works

| Level | Approach |
| --- | --- |
| 1 | Slots and bookings in MongoDB. `/slots` computes `available` from confirmed bookings. Original slot `start`/`end` strings are stored and returned untouched. |
| 2 | `X-API-Key` checked with a constant-time compare on every endpoint. Zod validates the body; name/email trimmed, email lower-cased. |
| 3 | A **partial unique index** on `bookings.slot_id` where `status = "confirmed"`. The database picks the winner, so simultaneous requests (even across serverless instances) cannot double-book. A duplicate-key error becomes 409. Cancelling flips status atomically, which frees the slot. |
| 4 | `Idempotency-Key`: the key is the primary key of a claims collection, so claiming is an atomic insert. Same key + same body replays the stored status and body; different body is 422; a concurrent duplicate waits for the first request. Pagination is cursor-based on `(created_at, _id)`. |
| 5 | Sliding window of 5 attempts per email per minute, kept in one document per email and updated with a single atomic pipeline update. Failed attempts count; rejected (429) ones do not. `Retry-After` is whole seconds. |

## Deploy (Vercel + MongoDB Atlas)

1. Atlas: create a free cluster and a database user. Network Access: allow `0.0.0.0/0` (Vercel has no fixed IPs).
2. Vercel: import the GitHub repo. Set env vars `MONGODB_URI` and `API_KEY` (a long random string) in the dashboard, then deploy.
3. Seed demo slots against the live URL: `BASE_URL=https://<your-app>.vercel.app API_KEY=... npm run seed`.
4. Submit: base URL `https://<your-app>.vercel.app`, API key, web page URL (same URL), repo URL.

## Known trade-offs

- The web page talks to keyless twins of the API under `/web/*` so the API key never reaches the browser. Those routes share the same controllers (same validation, idempotency and rate limit) but are unauthenticated; with real patients you would add sign-in and per-user ownership.
- Bookings are looked up by email with no email verification, as the spec describes.
