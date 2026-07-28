# Sarabo Client

Sarabo is a home-repair-service platform: customers request a repair visit for
a device, an admin assigns an approved technician, the technician carries the
repair through to completion, and the customer pays and tracks progress
throughout. This is the React frontend; it talks to a separate Express/MongoDB
API (`sarabo-server`).

## Stack

- React 19 + Vite 7
- Tailwind CSS 4 + DaisyUI 5
- TanStack Query 5 (server-state/data fetching)
- React Router 7
- Firebase Authentication (email/password + Google sign-in)
- Axios (a "secure" instance attaches the signed-in user's Firebase ID token)

## Local installation

```bash
npm install
```

Then create a `.env` file in the project root (see **Environment variables**
below) before running the dev server.

## Commands

| Command | Purpose |
|---|---|
| `npm run dev` | Start the Vite dev server (default `http://localhost:5173`) |
| `npm run lint` | Run ESLint |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview the production build locally |

## Environment variables

Copy `.env.example` to `.env` and fill in real values - `.env` is gitignored
and must never be committed. Firebase's web client config is not a server
secret (it's meant to be visible to the browser), but it should still come
from environment variables rather than being hardcoded, so different
environments (local/staging/production) can point at different Firebase
projects without a code change.

| Variable | Purpose | Required | Secret? |
|---|---|---|---|
| `VITE_API_BASE_URL` | Base URL of the `sarabo-server` API this client talks to. | No - defaults to `http://localhost:3000` if unset (a console warning is shown in dev mode) | No |
| `VITE_apiKey` | Firebase web app API key. | Yes | No (public client config) |
| `VITE_authDomain` | Firebase Auth domain. | Yes | No (public client config) |
| `VITE_projectId` | Firebase project ID. | Yes | No (public client config) |
| `VITE_storageBucket` | Firebase Storage bucket. | Yes | No (public client config) |
| `VITE_messagingSenderId` | Firebase Cloud Messaging sender ID. | Yes | No (public client config) |
| `VITE_appId` | Firebase app ID. | Yes | No (public client config) |
| `VITE_measurementId` | Firebase Analytics measurement ID. | Yes | No (public client config) |
| `VITE_image_host_key` | API key for the image-hosting service (imgbb) used to upload profile/registration photos. | Yes - registration and profile-photo upload fail without it | Yes - treat as a secret even though it ships to the browser; don't reuse a key you also use for anything else |

**`VITE_image_host_key` matters more than it looks**: the customer
registration flow uploads a profile photo to imgbb *before* creating the
Firebase account, so if this variable is missing, registration fails at the
photo-upload step with no account created. Make sure it's set for any
environment where registration or profile-photo editing needs to work.

## Roles

- **Customer** (`user`) - creates repair requests, pays, tracks progress,
  cancels before a technician is assigned or payment completes.
- **Technician** (`rider`) - becomes eligible via a technician application
  that an admin approves; works assigned repair requests through to
  completion.
- **Admin** - approves/rejects technician applications, assigns technicians
  to pending requests, manages user roles.

## Main MVP workflows

- **Repair request lifecycle**: `pending-pickup` -> `driver_assigned` ->
  `rider_arriving` -> `parcel_picked_up` -> `parcel_delivered`, or
  `cancelled` (customer-initiated, only before assignment/payment).
- **Payment**: fixed stored USD cost per request, paid via Stripe Checkout;
  the server's Stripe webhook is the authoritative source of "paid" status,
  independent of whether the browser ever reaches the success page.
- **Public tracking**: anyone with a request's tracking code can view a
  sanitized, unauthenticated progress timeline at `/track-request/:trackingId`
  - no customer/technician identity or payment data is exposed there.
- **Technician assignment, approval, and completion** are all
  transaction-safe on the server: each is a single atomic operation, so a
  partial failure never leaves the request, the technician, and the tracking
  log inconsistent with each other.
