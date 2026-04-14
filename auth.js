const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

function signToken(id) {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone, country } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'Name, email and password are required' });
    if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });

    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ error: 'Email already registered' });

    const user = await User.create({ name, email, password, phone, country: country || 'GH', provider: 'email' });
    const token = signToken(user._id);

    res.status(201).json({
      token,
      user: { id: user._id, name: user.name, email: user.email, plan: user.getPlan() }
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    const user = await User.findOne({ email });
    if (!user || !await user.comparePassword(password)) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    user.lastLogin = new Date();
    await user.save();

    const token = signToken(user._id);
    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, plan: user.getPlan(), isAdmin: user.isAdmin }
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/auth/firebase — login/register via Firebase token (Google, Phone)
router.post('/firebase', async (req, res) => {
  try {
    const { firebaseToken, name, email, phone, provider } = req.body;
    // In production: verify firebaseToken with Firebase Admin SDK
    // For now we trust the decoded fields sent from the client
    // TO ENABLE VERIFICATION: npm install firebase-admin and uncomment below
    /*
    const admin = require('firebase-admin');
    const decoded = await admin.auth().verifyIdToken(firebaseToken);
    const uid = decoded.uid;
    const email = decoded.email;
    const name = decoded.name;
    */

    if (!email && !phone) return res.status(400).json({ error: 'Email or phone required' });

    const query = email ? { email } : { phone };
    let user = await User.findOne(query);

    if (!user) {
      user = await User.create({
        name: name || 'NEXUS User',
        email: email || `${phone}@nexus.app`,
        phone,
        provider: provider || 'google',
        isVerified: true
      });
    }

    user.lastLogin = new Date();
    await user.save();

    const token = signToken(user._id);
    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, plan: user.getPlan() }
    });
  } catch (err) {
    console.error('Firebase auth error:', err);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

// GET /api/auth/me — get current user
router.get('/me', protect, async (req, res) => {
  const user = req.user;
  res.json({
    id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    plan: user.getPlan(),
    subscription: user.subscription,
    isAdmin: user.isAdmin
  });
});

module.exports = router;
