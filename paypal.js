const axios = require('axios');
const { PLAN_PRICES_USD, PLAN_NAMES } = require('./momo');

const BASE = process.env.PAYPAL_BASE_URL || 'https://api-m.paypal.com';

// ── Get PayPal OAuth token ───────────────────────────────────────
async function getPayPalToken() {
  const credentials = Buffer.from(
    `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_SECRET}`
  ).toString('base64');

  const res = await axios.post(
    `${BASE}/v1/oauth2/token`,
    'grant_type=client_credentials',
    {
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    }
  );
  return res.data.access_token;
}

// ── Create a one-time PayPal order (for first payment) ──────────
async function createPayPalOrder(plan, userId) {
  const token = await getPayPalToken();
  const amount = PLAN_PRICES_USD[plan];

  const res = await axios.post(
    `${BASE}/v2/checkout/orders`,
    {
      intent: 'CAPTURE',
      purchase_units: [{
        reference_id: `${userId}_${plan}`,
        description: `NEXUS ${PLAN_NAMES[plan]} - 1 Month`,
        amount: {
          currency_code: 'USD',
          value: amount.toFixed(2)
        }
      }],
      application_context: {
        brand_name: 'NEXUS Platform',
        landing_page: 'BILLING',
        user_action: 'PAY_NOW',
        return_url: `${process.env.FRONTEND_URL}/pages/payment-success.html`,
        cancel_url: `${process.env.FRONTEND_URL}/pages/payment-cancel.html`
      }
    },
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }
  );

  return res.data; // { id: 'ORDER_ID', links: [...] }
}

// ── Capture (confirm) a PayPal order after user approves ────────
async function capturePayPalOrder(orderId) {
  const token = await getPayPalToken();

  const res = await axios.post(
    `${BASE}/v2/checkout/orders/${orderId}/capture`,
    {},
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }
  );

  return res.data; // { status: 'COMPLETED', ... }
}

// ── Get details of an existing order ────────────────────────────
async function getPayPalOrder(orderId) {
  const token = await getPayPalToken();
  const res = await axios.get(`${BASE}/v2/checkout/orders/${orderId}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return res.data;
}

module.exports = { createPayPalOrder, capturePayPalOrder, getPayPalOrder };
