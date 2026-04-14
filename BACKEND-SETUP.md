# NEXUS PLATFORM — BACKEND SETUP GUIDE
### By JoksonX | One STEM 6

---

## What's included in this ZIP (frontend only)
All HTML/CSS/JS pages are complete and fully functional as a static site.
Login, payment forms, receipts, 1M click counter — all working in the browser.

---

## To make REAL payments work, you need these accounts:

### 1. MTN MoMo Developer (Ghana)
- Register at: https://momodeveloper.mtn.com
- Get API Key + Secret for "Disbursements" (to send money TO users)
- Sandbox first, then switch to production with your merchant account

### 2. PayPal Developer
- Register at: https://developer.paypal.com
- Create an App → get Client ID + Secret
- Use Payouts API to send money to user emails

### 3. Google Firebase (for real login)
- Go to: https://console.firebase.google.com
- Create project → Enable Authentication
- Turn on: Google, Phone Number, Facebook, Twitter providers
- Copy your Firebase config (apiKey, projectId, etc.)
- Replace the login.html social buttons with Firebase SDK calls

### 4. A Backend Server (Node.js recommended)
- Host on: Render.com (free) or Railway.app (free tier)
- The server handles: payment API calls, user database, withdrawal approvals

---

## Recommended Backend Stack

```
nexus-backend/
├── server.js          ← Express.js main server
├── routes/
│   ├── auth.js        ← Login / signup / JWT tokens
│   ├── payments.js    ← MoMo, PayPal, Bank APIs
│   └── withdrawals.js ← Withdrawal queue & admin approval
├── models/
│   ├── User.js        ← MongoDB user model
│   └── Withdrawal.js  ← Withdrawal records
├── middleware/
│   └── auth.js        ← JWT verification middleware
└── .env               ← API keys (never commit this)
```

## .env file you'll need:
```
MOMO_API_KEY=your_mtn_momo_key
MOMO_API_SECRET=your_mtn_secret
MOMO_SUBSCRIPTION_KEY=your_subscription_key
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_SECRET=your_paypal_secret
FIREBASE_PROJECT_ID=your_firebase_project
JWT_SECRET=any_long_random_string
MONGODB_URI=mongodb+srv://...
ADMIN_EMAIL=your@email.com
```

---

## Deployment Steps (Render.com)
1. Push backend to GitHub
2. Go to render.com → New Web Service → connect GitHub
3. Add all .env variables in Render's Environment settings
4. Deploy — you get a live URL like: https://nexus-api.onrender.com
5. Update all fetch() calls in the HTML files to point to that URL

---

## Admin Panel Access
To approve/reject withdrawals, open:
`/admin.html` (not included — build separately with password protection)

Or use MongoDB Atlas dashboard to manually update withdrawal records.

---

*This frontend is 100% ready. You just need the backend server + API keys to make real transfers.*
