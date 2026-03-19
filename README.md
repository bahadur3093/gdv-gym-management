# 🏋️ Society Gym App

A free, mobile-first gym management app for housing society gyms.
Attendance tracking, UPI payments, and maintenance reporting — all in one PWA.

**Monthly cost: ₹0**

---

## Stack

| Layer        | Technology                        | Why                          |
|-------------|-----------------------------------|------------------------------|
| Frontend    | React PWA + Vite                  | Installs on phone, no app store |
| Backend     | Node.js + Express                 | Simple, fast, free on Render |
| Database    | Supabase (PostgreSQL)             | Free forever, 500MB          |
| Payments    | UPI Deep Link + UTR verification  | Zero fees                    |
| Notif.      | Firebase FCM                      | Free push notifications      |
| Hosting     | Render                            | Free tier, Docker support    |
| Dev env     | Docker + docker-compose           | Identical local + production |

---

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed
- A [Supabase](https://supabase.com) account (free)
- A [Firebase](https://firebase.google.com) project (free)
- A [Render](https://render.com) account (free)

---

## Local development

### 1. Clone and set up environment

```bash
git clone https://github.com/your-username/society-gym.git
cd society-gym

# Copy env file and fill in your values
cp .env.example .env
```

Open `.env` and fill in:
- `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` from supabase.com
- `JWT_SECRET` — run `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- `SOCIETY_UPI_ID` — the Jupiter UPI ID of the gym account
- Firebase credentials from Firebase console

### 2. Start everything with one command

```bash
docker-compose -f docker-compose.dev.yml up
```

This starts:
- **Frontend** at http://localhost:5173 (hot reload — changes reflect instantly)
- **Backend** at http://localhost:4000 (nodemon — restarts on file save)

That's it. No installing Node, no version conflicts, no "works on my machine".

### 3. Verify it's running

```bash
curl http://localhost:4000/health
# → { "status": "ok", "timestamp": "..." }
```

---

## Project structure

```
society-gym/
├── docker-compose.yml          ← production
├── docker-compose.dev.yml      ← local development
├── .env.example                ← copy to .env
│
├── frontend/
│   ├── Dockerfile              ← builds React → serves via nginx
│   ├── Dockerfile.dev          ← Vite dev server with HMR
│   ├── nginx.conf              ← serves PWA + proxies /api to backend
│   ├── vite.config.js          ← PWA plugin config
│   └── src/
│       ├── components/         ← reusable UI components
│       ├── pages/              ← Home, Attendance, Payments, Maintenance, Profile
│       ├── hooks/              ← useAuth, useAttendance, usePayments etc.
│       └── utils/
│           └── api.js          ← axios instance with JWT interceptor
│
└── backend/
    ├── Dockerfile              ← production (2-stage, non-root user)
    ├── Dockerfile.dev          ← nodemon dev server
    ├── server.js               ← Express app entry point
    └── src/
        ├── config/
        │   └── supabase.js     ← Supabase client
        ├── middleware/
        │   ├── auth.js         ← JWT verify, requireAdmin
        │   └── errorHandler.js ← global error handler
        ├── routes/             ← auth, attendance, payments, maintenance
        ├── controllers/        ← business logic for each route
        └── services/
            ├── upiService.js   ← UPI deep link generator
            └── notificationService.js ← Firebase FCM
```

---

## API endpoints

```
POST   /api/auth/register           Register new member
POST   /api/auth/login              Login → returns JWT
GET    /api/auth/me                 Get current user
PATCH  /api/auth/:id/approve        [Admin] Approve member

POST   /api/attendance/checkin      Check in via QR scan
GET    /api/attendance/me           My attendance history
GET    /api/attendance/today        [Admin] All check-ins today

GET    /api/payments/upi-link       Get UPI deep link for payment
POST   /api/payments/submit         Submit UTR after paying
GET    /api/payments/me             My payment history
GET    /api/payments/pending        [Admin] All pending payments
PATCH  /api/payments/:id/approve    [Admin] Approve or reject

POST   /api/maintenance             Report a new issue
GET    /api/maintenance             List all issues
PATCH  /api/maintenance/:id         [Admin] Update issue status

GET    /health                      Health check (for cron-job.org ping)
```

---

## Deploying to Render

### Backend
1. Go to render.com → New → Web Service
2. Connect your GitHub repo
3. Set **Root directory**: `backend`
4. Set **Docker** as the environment — Render detects the Dockerfile automatically
5. Add all environment variables from `.env.example`
6. Deploy

### Frontend
1. Go to render.com → New → Static Site
2. Connect the same repo
3. Set **Root directory**: `frontend`
4. **Build command**: `npm install && npm run build`
5. **Publish directory**: `dist`
6. Set `VITE_API_URL` to your backend Render URL
7. Deploy

### Keep backend alive (free tier fix)
1. Go to [cron-job.org](https://cron-job.org) → Create cronjob
2. URL: `https://your-backend.onrender.com/health`
3. Interval: every 5 minutes
4. Save — your server now never sleeps

---

## Database setup

Run the SQL schema in Supabase → SQL Editor.
Schema file coming next: `supabase/schema.sql`

---

## How payments work

1. Member taps "Pay ₹500 for June" in the app
2. App calls `/api/payments/upi-link` → gets a deep link like:
   `upi://pay?pa=societygym@jupiter&pn=SocietyGym&am=500&tn=GYM-FLAT203-JUN2025`
3. Deep link opens GPay/PhonePe with everything pre-filled
4. Member pays and enters the 12-digit UTR number in the app
5. App calls `/api/payments/submit` with the UTR
6. Admin gets a push notification
7. Admin cross-checks UTR against Jupiter bank statement, approves
8. Member gets a push notification: "Payment approved"
9. **Zero fees. Zero third-party gateway.**
