# Stampworks — Artisan Finder

Find and book trusted local tradespeople (plumbers, electricians, carpenters, and more).

Built for the brief: **Profiles · Search · Booking · Deploy**

- **Stack:** Node.js + Express (backend/API) · Vanilla HTML/CSS/JS (frontend) · SQLite via Sequelize (database)
- **Auth:** JWT (bcrypt-hashed passwords)
- **Single deployable service:** Express serves both the API (`/api/*`) and the static frontend, so it ships as one app.

---

## Features

| Requirement | Where it lives |
|---|---|
| **Profiles** | Artisans sign up, then create/edit a profile (trade, state, city, area, bio, years of experience, price range) via "List Your Trade". Public profile page shows rating, experience, and reviews. |
| **Search** | Browse tab: filter by trade, state, city, free-text search (name/bio/area/city/trade), sort by rating/experience/newest. |
| **Booking** | Any logged-in user can send a booking request with a message + optional preferred date. Artisans accept/decline/complete requests from "My Bookings". Contact info is only revealed server-side once a booking exists — this is enforced in the API, not just hidden in the UI. |
| **Ratings** | Once a booking is marked completed, the customer can leave a star rating + optional comment right from "My Bookings". The artisan's aggregate rating recalculates automatically and shows up on their profile alongside recent reviews. |
| **Forgot password** | "Forgot password?" on the login modal → emails a reset link (or logs it to the server console if no SMTP is configured, so it's testable without a real mail provider) → link opens the app with a "set new password" prompt. |
| **Account emails & verification** | Signup requires verifying a 6-digit code emailed to the address given — login is blocked until verified (seeded demo accounts are pre-verified, so they're unaffected). A welcome email follows successful verification. Artisans get emailed when a new booking comes in; customers get emailed when their booking is accepted. All fire-and-forget — a slow/misconfigured mail provider never blocks the underlying action. |
| **Custom trade** | The trade dropdown includes "Other (specify)" — typing a custom trade (e.g. "Dog Grooming") stores and indexes it like any other trade, so it's searchable even though it's not in the fixed list. |
| **Response modal** | Every action outcome (saving a listing, sending/accepting a booking, submitting a rating, signing up) shows a consistent success/error modal instead of scattered inline text. |
| **Deploy** | `render.yaml` included for one-click Render deployment (see below). |

Bonus beyond the brief: a review system — customers can rate a completed booking, and the artisan's aggregate rating recalculates automatically.

---

## Project structure

```
stampworks-app/
├── backend/                Node/Express API + SQLite database
│   ├── src/
│   │   ├── app.js           Express app (also serves ../frontend as static files)
│   │   ├── config/
│   │   │   ├── db.js          Sequelize/SQLite connection
│   │   │   └── mail.config.js SMTP transporter + boot-time connection check
│   │   ├── services/
│   │   │   └── email.service.js  generic sender + one function per email type
│   │   ├── templates/         otp, welcome, password-reset, booking-request, booking-accepted
│   │   ├── models/            User, Artisan, Booking, Review + associations
│   │   ├── middleware/        auth (JWT), validate (Zod), errorHandler
│   │   ├── controllers/       route handlers
│   │   ├── routes/
│   │   ├── validators/        Zod schemas
│   │   ├── utils/              AppError, catchAsync, escapeHtml, otp (generate/hash)
│   │   └── seed.js            demo data loader (accounts pre-verified)
│   ├── server.js
│   └── package.json
├── frontend/                Plain HTML/CSS/JS, talks to the API via fetch()
│   ├── index.html
│   ├── style.css
│   └── app.js
└── render.yaml              one-click Render deploy config
```

---

## Run it locally

```bash
cd backend
npm install
cp .env.example .env        # defaults work out of the box for local dev
npm run seed                # creates database.sqlite + 8 demo artisans + 1 demo customer
npm run dev                 # http://localhost:5000
```

Open `http://localhost:5000` — the frontend and API are served from the same origin.

**Demo login:** `customer@demo.com` / `password123` (every seeded account uses this password — e.g. `marcus.odum@demo.com` for an artisan account).

**⚠️ If you have an existing `database.sqlite` from before this update:** delete it before running `npm run seed` again. Both the `Artisan` table (`state`/`city` added, `trade` changed to free text) and the `User` table (email verification fields added) changed shape, and Sequelize's `sync()` doesn't alter existing tables — it'll error on old data. This only matters for local dev; a fresh Render deploy always starts clean.

**Email notifications:** welcome emails (signup), new-booking emails (to the artisan), and booking-accepted emails (to the customer) all use the same SMTP setup as password reset — see the SMTP note above. With no SMTP configured, every send just logs to the terminal instead of failing, so all three flows are fully testable locally without a real mail provider.

**Forgot password without setting up email:** leave `SMTP_HOST` blank in `.env` (the default). The reset link will be printed to your terminal running `npm run dev`, and also returned directly in the API response in non-production — copy either one into a browser to continue the flow. To send real emails, fill in `SMTP_HOST`/`SMTP_PORT`/`SMTP_USER`/`SMTP_PASS`/`EMAIL_FROM` in `.env` (any SMTP provider works — Gmail with an app password, Mailtrap, Resend, etc.).

---

## Deploy to Render

1. Push this repo to GitHub.
2. In Render: **New → Blueprint**, point it at the repo. Render will read `render.yaml` and configure the service automatically (build runs `npm install && npm run seed`, so the deployed app has demo data immediately).
3. Once deployed, Render gives you a public URL — that's your deployed link.

**Note on SQLite + Render's free tier:** the filesystem is ephemeral, so data can reset on redeploys. That's fine for a demo (the seed step refills it automatically on every deploy), but for a real production deployment you'd want either a Render persistent disk (paid) or to switch the database to Postgres - the codebase only touches SQLite in `src/config/db.js`, so swapping the dialect there (and the connection string) is the only change needed since everything else goes through Sequelize.

---

## API reference

| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/signup` | — | Create account (`role`: `customer` or `artisan`). Does **not** return a token — emails a 6-digit code instead. |
| POST | `/api/auth/verify-email` | — | `{ email, otp }` — verifies the code, returns a JWT on success (this is what actually logs the new user in) |
| POST | `/api/auth/resend-otp` | — | Re-sends a fresh code if the previous one expired |
| POST | `/api/auth/login` | — | Get a JWT. Returns `403 { needsVerification: true, email }` instead of a token if the account hasn't verified its email yet |
| POST | `/api/auth/forgot-password` | — | Request a reset link (always returns a generic success message, even for unknown emails) |
| POST | `/api/auth/reset-password/:token` | — | Set a new password using the token from the reset link |
| GET | `/api/artisans` | optional | List/search/filter artisans (`?trade=&state=&city=&search=&sort=`) |
| GET | `/api/artisans/meta` | — | Valid trades + states, for populating dropdowns |
| GET | `/api/artisans/:id` | optional | Profile (phone included only if you've booked them) |
| POST | `/api/artisans/me` | artisan | Create/update your own listing |
| POST | `/api/bookings` | any user | Send a booking request |
| GET | `/api/bookings/mine` | any user | Bookings you've sent (includes `Review` if you've already rated one) |
| GET | `/api/bookings/received` | artisan | Bookings sent to you |
| PATCH | `/api/bookings/:id` | artisan | Accept / decline / complete |
| POST | `/api/reviews` | any user | Review a completed booking |
| GET | `/api/reviews/artisan/:id` | — | Public reviews for an artisan |

---

## Recording the demo video (2–3 min)

Suggested flow, since this maps directly to the brief:
1. **Search** — show the Browse tab, filter by a trade, search a keyword.
2. **Profiles** — click an artisan card, show the profile (note the phone number is hidden).
3. **Booking** — sign up/log in as a customer, send a booking request, show the phone number unlock immediately after.
4. Switch accounts (or use a second seeded artisan login) and show **My Bookings → Received**, accept the request.
5. Mention the **deploy** — show the live Render URL loading the same app.

---

## What's not included (flagged, not hidden)

- File uploads for profile photos
- Real-time notifications (would add Socket.io)
- Automated tests (Jest/Supertest) — the flows above were verified manually end-to-end during development
