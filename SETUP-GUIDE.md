# ============================================================
#  NEXUS PLATFORM v6 — SETUP GUIDE
#  By JoksonX | One STEM 6
# ============================================================

## HOW PAYMENTS WORK (NO API KEYS NEEDED)
Users pay to MTN MoMo number: 0245186449
They submit their transaction ID + screenshot on the Subscribe page.
You review and click APPROVE in the Admin Panel.
Their plan activates instantly.

---

## DEPLOY IN 3 STEPS

### STEP 1 — Get your MongoDB password
1. Go to: https://cloud.mongodb.com
2. Sign in → click your cluster (Cluster0)
3. Click "Database Access" in the left menu
4. Find your user "JokSon" → click Edit → Show password
5. Copy the real password

### STEP 2 — Deploy Backend to Render (free)
1. Go to: https://render.com — sign up free
2. Go to: https://github.com — create account, new repo called "nexus-backend" (Private)
3. Upload ONLY the backend/ folder contents to that repo
4. In Render: New → Web Service → Connect GitHub → select nexus-backend
5. Settings:
   - Runtime: Node
   - Build Command: npm install
   - Start Command: node server.js
6. Click "Environment Variables" and add:
   PORT = 5000
   NODE_ENV = production
   FRONTEND_URL = https://your-nexus.netlify.app   ← your Netlify URL
   JWT_SECRET = NexusJoksonX_SuperSecretKey_2025_MakeThisLong
   MONGODB_URI = mongodb+srv://JokSon:YOUR_REAL_PASSWORD@cluster0.grshdoq.mongodb.net/nexus?retryWrites=true&w=majority&appName=Cluster0
   ADMIN_EMAIL = your@email.com
7. Click "Create Web Service"
8. Wait 2–3 minutes → Render gives you a URL like:
   https://nexus-backend.onrender.com
   SAVE THIS URL

### STEP 3 — Connect Frontend to Backend
1. Open js/api.js
2. Find the line:  BASE_URL: '',
3. Change it to:   BASE_URL: 'https://nexus-backend.onrender.com',
4. Save and re-upload the frontend to Netlify

---

## HOW TO SET YOURSELF AS ADMIN
After registering on the site:
1. Go to MongoDB Atlas → Browse Collections → nexus → users
2. Find your account → Edit → change isAdmin to: true
3. Save
4. Now visit: https://your-nexus.netlify.app/admin.html

---

## HOW TO APPROVE PAYMENTS
1. Go to your-site.netlify.app/admin.html
2. Log in with your admin account
3. You see all pending payment submissions
4. Review the screenshot and transaction ID
5. Click APPROVE → their plan activates immediately

---

## PAYMENT FLOW FOR USERS
1. User goes to Subscribe page
2. Selects a plan (Basic GHS 30 / Standard GHS 60 / Premium GHS 100)
3. Clicks "Reveal Payment Number" → sees 0245186449
4. Sends money on their phone to that number
5. Comes back and fills in their name, phone, and MoMo transaction ID
6. Submits (optionally attaches screenshot)
7. You approve in admin panel → they get premium access

---

## SUBSCRIPTION PRICES
Basic:    GHS 30 / month  (~$2 USD)
Standard: GHS 60 / month  (~$4 USD)
Premium:  GHS 100 / month (~$7 USD)
To change prices: edit backend/routes/payments.js → PLANS object

---

## DEPLOY FRONTEND TO NETLIFY
1. Go to netlify.com → New site → Deploy manually
2. Drag and drop this zip (the frontend files — index.html must be at root)
3. Done! Site goes live in seconds.
