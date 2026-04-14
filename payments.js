const express  = require('express');
const router   = express.Router();
const multer   = require('multer');
const path     = require('path');
const { protect } = require('../middleware/auth');
const Payment  = require('../models/Payment');
const User     = require('../models/User');

// ── Plan config ──────────────────────────────────────────────────
const PLANS = {
  basic:    { name: 'NEXUS Basic',    price: 30,  usd: 2.99 },
  standard: { name: 'NEXUS Standard', price: 60,  usd: 4.99 },
  premium:  { name: 'NEXUS Premium',  price: 100, usd: 7.99 }
};

// ── Multer: store screenshots as base64 in DB (no disk needed) ──
const storage = multer.memoryStorage();
const upload  = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const ok = /image\/(jpeg|jpg|png|webp|gif)/.test(file.mimetype);
    cb(ok ? null : new Error('Only image files allowed'), ok);
  }
});

// ── Helper: activate subscription ───────────────────────────────
async function activateSubscription(userId, plan) {
  const now = new Date();
  const end = new Date(now);
  end.setMonth(end.getMonth() + 1);
  await User.findByIdAndUpdate(userId, {
    'subscription.plan':      plan,
    'subscription.status':    'active',
    'subscription.method':    'momo_manual',
    'subscription.startDate': now,
    'subscription.endDate':   end,
  });
}

// ═══════════════════════════════════════════════════════════════
// GET /api/payments/plans — return plan info
// ═══════════════════════════════════════════════════════════════
router.get('/plans', (req, res) => res.json(PLANS));

// ═══════════════════════════════════════════════════════════════
// POST /api/payments/submit
// Body (multipart/form-data):
//   plan, senderPhone, senderName, transactionId
//   screenshot (optional image file)
// ═══════════════════════════════════════════════════════════════
router.post('/submit', protect, upload.single('screenshot'), async (req, res) => {
  try {
    const { plan, senderPhone, senderName, transactionId } = req.body;

    if (!plan || !PLANS[plan])
      return res.status(400).json({ error: 'Invalid plan selected' });
    if (!senderPhone)
      return res.status(400).json({ error: 'Sender phone number is required' });
    if (!senderName)
      return res.status(400).json({ error: 'Your name is required' });
    if (!transactionId)
      return res.status(400).json({ error: 'MoMo transaction ID/reference is required' });

    // Check for duplicate transaction ID
    const exists = await Payment.findOne({ transactionId });
    if (exists)
      return res.status(409).json({ error: 'This transaction ID has already been submitted' });

    const payment = new Payment({
      user:          req.user._id,
      plan,
      amount:        PLANS[plan].price,
      currency:      'GHS',
      senderPhone,
      senderName,
      transactionId,
      status:        'pending'
    });

    // Store screenshot as base64 if uploaded
    if (req.file) {
      payment.screenshotBase64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    }

    await payment.save();

    res.status(201).json({
      success: true,
      message: '✅ Payment submitted! We will verify and activate your plan within 1–24 hours.',
      receiptNumber: payment.receiptNumber,
      paymentId: payment._id
    });
  } catch (err) {
    console.error('Payment submit error:', err);
    res.status(500).json({ error: 'Failed to submit payment. Please try again.' });
  }
});

// ═══════════════════════════════════════════════════════════════
// GET /api/payments/status/:paymentId — check your payment
// ═══════════════════════════════════════════════════════════════
router.get('/status/:paymentId', protect, async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.paymentId);
    if (!payment) return res.status(404).json({ error: 'Payment not found' });
    if (payment.user.toString() !== req.user._id.toString())
      return res.status(403).json({ error: 'Forbidden' });

    res.json({
      status:        payment.status,
      plan:          payment.plan,
      amount:        payment.amount,
      receiptNumber: payment.receiptNumber,
      submittedAt:   payment.submittedAt,
      message: {
        pending:  '⏳ Payment is under review. Usually approved within 1–24 hours.',
        approved: '✅ Payment approved! Your plan is now active.',
        rejected: '❌ Payment was rejected. ' + (payment.adminNote || 'Please contact support.')
      }[payment.status]
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ═══════════════════════════════════════════════════════════════
// GET /api/payments/history — user's payment history
// ═══════════════════════════════════════════════════════════════
router.get('/history', protect, async (req, res) => {
  try {
    const payments = await Payment.find({ user: req.user._id })
      .sort({ submittedAt: -1 })
      .limit(20)
      .select('-screenshotBase64 -__v');
    res.json(payments);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ═══════════════════════════════════════════════════════════════
// ADMIN: GET /api/payments/admin/pending
// ═══════════════════════════════════════════════════════════════
router.get('/admin/pending', protect, async (req, res) => {
  if (!req.user.isAdmin) return res.status(403).json({ error: 'Admin only' });
  try {
    const payments = await Payment.find({ status: 'pending' })
      .populate('user', 'name email phone')
      .sort({ submittedAt: 1 });
    res.json(payments);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ═══════════════════════════════════════════════════════════════
// ADMIN: POST /api/payments/admin/approve/:id
// ═══════════════════════════════════════════════════════════════
router.post('/admin/approve/:id', protect, async (req, res) => {
  if (!req.user.isAdmin) return res.status(403).json({ error: 'Admin only' });
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) return res.status(404).json({ error: 'Payment not found' });

    payment.status     = 'approved';
    payment.reviewedAt = new Date();
    payment.reviewedBy = req.user.email;
    await payment.save();

    await activateSubscription(payment.user, payment.plan);

    res.json({ success: true, message: `✅ Payment approved. ${payment.plan} plan activated for user.` });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ═══════════════════════════════════════════════════════════════
// ADMIN: POST /api/payments/admin/reject/:id
// ═══════════════════════════════════════════════════════════════
router.post('/admin/reject/:id', protect, async (req, res) => {
  if (!req.user.isAdmin) return res.status(403).json({ error: 'Admin only' });
  try {
    const { reason } = req.body;
    const payment = await Payment.findById(req.params.id);
    if (!payment) return res.status(404).json({ error: 'Payment not found' });

    payment.status     = 'rejected';
    payment.adminNote  = reason || 'Payment could not be verified';
    payment.reviewedAt = new Date();
    payment.reviewedBy = req.user.email;
    await payment.save();

    res.json({ success: true, message: 'Payment rejected.' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
