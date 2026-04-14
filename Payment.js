const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  user:            { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  plan:            { type: String, enum: ['basic','standard','premium'], required: true },
  amount:          { type: Number, required: true },
  currency:        { type: String, default: 'GHS' },
  method:          { type: String, default: 'momo_manual' },
  senderPhone:     { type: String },   // phone number user sent from
  senderName:      { type: String },   // name user entered
  transactionId:   { type: String },   // reference user got from MoMo
  screenshotUrl:   { type: String },   // uploaded screenshot path
  screenshotBase64:{ type: String },   // base64 if no file storage
  status:          { type: String, enum: ['pending','approved','rejected'], default: 'pending' },
  adminNote:       { type: String },
  receiptNumber:   { type: String, default: () => 'NX-' + Date.now().toString(36).toUpperCase() },
  submittedAt:     { type: Date, default: Date.now },
  reviewedAt:      { type: Date },
  reviewedBy:      { type: String }
});

module.exports = mongoose.model('Payment', paymentSchema);
