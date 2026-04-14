const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const subscriptionSchema = new mongoose.Schema({
  plan: { type: String, enum: ['none', 'basic', 'standard', 'premium'], default: 'none' },
  status: { type: String, enum: ['active', 'cancelled', 'expired', 'pending'], default: 'pending' },
  method: { type: String, enum: ['momo', 'paypal', 'admin'], default: 'admin' },
  paypalSubscriptionId: String,
  momoReferenceId: String,
  startDate: Date,
  endDate: Date,
  autoRenew: { type: Boolean, default: true },
  amountPaid: Number,
  currency: String
});

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  phone: { type: String, trim: true },
  password: { type: String },            // null if social login
  firebaseUid: { type: String },         // set if logged in via Firebase
  provider: { type: String, enum: ['email', 'google', 'phone', 'facebook'], default: 'email' },
  avatar: { type: String, default: '' },
  country: { type: String, default: 'GH' },
  isAdmin: { type: Boolean, default: false },
  isVerified: { type: Boolean, default: false },
  subscription: { type: subscriptionSchema, default: () => ({}) },
  createdAt: { type: Date, default: Date.now },
  lastLogin: { type: Date, default: Date.now }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password') || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password
userSchema.methods.comparePassword = async function(candidate) {
  if (!this.password) return false;
  return bcrypt.compare(candidate, this.password);
};

// Check if subscription is active
userSchema.methods.hasActiveSubscription = function() {
  const sub = this.subscription;
  if (!sub || sub.status !== 'active') return false;
  if (sub.endDate && new Date() > sub.endDate) return false;
  return true;
};

userSchema.methods.getPlan = function() {
  if (!this.hasActiveSubscription()) return 'none';
  return this.subscription.plan;
};

module.exports = mongoose.model('User', userSchema);
