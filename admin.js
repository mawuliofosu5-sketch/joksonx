const express = require('express');
const router  = express.Router();
const { protect } = require('../middleware/auth');
const User    = require('../models/User');
const Payment = require('../models/Payment');

// All routes require admin
router.use(protect);
router.use((req, res, next) => {
  if (!req.user.isAdmin) return res.status(403).json({ error: 'Admin only' });
  next();
});

// GET /api/admin/stats
router.get('/stats', async (req, res) => {
  try {
    const [totalUsers, activeSubscriptions, pendingPayments, totalPayments] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ 'subscription.status': 'active' }),
      Payment.countDocuments({ status: 'pending' }),
      Payment.countDocuments({ status: 'approved' })
    ]);
    res.json({ totalUsers, activeSubscriptions, pendingPayments, totalPayments });
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

// GET /api/admin/users
router.get('/users', async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 }).select('-password').limit(100);
    res.json(users);
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

// POST /api/admin/grant/:userId — manually grant a plan
router.post('/grant/:userId', async (req, res) => {
  try {
    const { plan } = req.body;
    const now = new Date(), end = new Date(now);
    end.setMonth(end.getMonth() + 1);
    await User.findByIdAndUpdate(req.params.userId, {
      'subscription.plan': plan,
      'subscription.status': 'active',
      'subscription.method': 'admin',
      'subscription.startDate': now,
      'subscription.endDate': end
    });
    res.json({ success: true, message: `Plan ${plan} granted to user` });
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

module.exports = router;
