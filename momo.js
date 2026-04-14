const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

// Plan prices in GHS (Ghana Cedis)
// Adjust these to whatever you want to charge
const PLAN_PRICES_GHS = {
  basic:    30,   // GHS 30/month  (~$2 USD)
  standard: 60,   // GHS 60/month  (~$4 USD)
  premium:  100   // GHS 100/month (~$7 USD)
};

const PLAN_PRICES_USD = {
  basic:    2.99,
  standard: 4.99,
  premium:  7.99
};

const PLAN_NAMES = {
  basic:    'NEXUS Basic',
  standard: 'NEXUS Standard',
  premium:  'NEXUS Premium'
};

// ── Get access token from MTN MoMo ──────────────────────────────
async function getMoMoToken() {
  const credentials = Buffer.from(
    `${process.env.MOMO_API_USER}:${process.env.MOMO_API_KEY}`
  ).toString('base64');

  const response = await axios.post(
    `${process.env.MOMO_BASE_URL}/collection/token/`,
    {},
    {
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Ocp-Apim-Subscription-Key': process.env.MOMO_COLLECTIONS_PRIMARY_KEY
      }
    }
  );
  return response.data.access_token;
}

// ── Request payment from user's MoMo number ─────────────────────
async function requestMoMoPayment({ phone, amount, plan, externalId }) {
  const token = await getMoMoToken();
  const referenceId = uuidv4();

  await axios.post(
    `${process.env.MOMO_BASE_URL}/collection/v1_0/requesttopay`,
    {
      amount: String(amount),
      currency: process.env.MOMO_CURRENCY || 'GHS',
      externalId: externalId,
      payer: {
        partyIdType: 'MSISDN',
        partyId: phone.replace(/\D/g, '') // strip non-digits
      },
      payerMessage: `NEXUS ${PLAN_NAMES[plan]} subscription`,
      payeeNote: `NEXUS subscription payment - ${plan}`
    },
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-Reference-Id': referenceId,
        'X-Target-Environment': process.env.MOMO_ENVIRONMENT || 'production',
        'Ocp-Apim-Subscription-Key': process.env.MOMO_COLLECTIONS_PRIMARY_KEY,
        'Content-Type': 'application/json'
      }
    }
  );

  return referenceId;
}

// ── Check status of a MoMo payment ──────────────────────────────
async function checkMoMoStatus(referenceId) {
  const token = await getMoMoToken();

  const response = await axios.get(
    `${process.env.MOMO_BASE_URL}/collection/v1_0/requesttopay/${referenceId}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-Target-Environment': process.env.MOMO_ENVIRONMENT || 'production',
        'Ocp-Apim-Subscription-Key': process.env.MOMO_COLLECTIONS_PRIMARY_KEY
      }
    }
  );

  return response.data; // { status: 'SUCCESSFUL'|'FAILED'|'PENDING', financialTransactionId, ... }
}

module.exports = {
  PLAN_PRICES_GHS,
  PLAN_PRICES_USD,
  PLAN_NAMES,
  requestMoMoPayment,
  checkMoMoStatus
};
