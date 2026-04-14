const nodemailer = require('nodemailer');

function getTransporter() {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
}

async function sendReceiptEmail({ to, name, plan, amount, currency, receiptNumber, method, date }) {
  const transporter = getTransporter();

  const planLabel = { basic: 'NEXUS Basic', standard: 'NEXUS Standard', premium: 'NEXUS Premium' }[plan] || plan;
  const methodLabel = method === 'momo' ? 'MTN Mobile Money' : 'PayPal';

  const html = `
  <div style="font-family:Arial,sans-serif;background:#050d18;color:#fff;padding:32px;max-width:520px;margin:0 auto;border-radius:16px;border:1px solid #00f5ff33;">
    <div style="text-align:center;margin-bottom:24px;">
      <div style="font-size:2rem;">⚡</div>
      <h1 style="font-family:monospace;color:#00f5ff;letter-spacing:4px;margin:8px 0;">NEXUS</h1>
      <p style="color:#00f5ff99;font-size:0.8rem;letter-spacing:2px;">SUBSCRIPTION RECEIPT</p>
    </div>
    <div style="background:#0a1628;border:1px solid #00f5ff22;border-radius:12px;padding:20px;font-size:0.88rem;line-height:2.2;">
      <div style="display:flex;justify-content:space-between;border-bottom:1px solid #ffffff11;padding-bottom:8px;margin-bottom:8px;">
        <span style="color:#ffffff66;">Receipt No.</span><span style="color:#00f5ff;">${receiptNumber}</span>
      </div>
      <div style="display:flex;justify-content:space-between;border-bottom:1px solid #ffffff11;padding-bottom:8px;margin-bottom:8px;">
        <span style="color:#ffffff66;">Name</span><span>${name}</span>
      </div>
      <div style="display:flex;justify-content:space-between;border-bottom:1px solid #ffffff11;padding-bottom:8px;margin-bottom:8px;">
        <span style="color:#ffffff66;">Plan</span><span style="color:#ffd700;">${planLabel}</span>
      </div>
      <div style="display:flex;justify-content:space-between;border-bottom:1px solid #ffffff11;padding-bottom:8px;margin-bottom:8px;">
        <span style="color:#ffffff66;">Method</span><span>${methodLabel}</span>
      </div>
      <div style="display:flex;justify-content:space-between;border-bottom:1px solid #ffffff11;padding-bottom:8px;margin-bottom:8px;">
        <span style="color:#ffffff66;">Amount</span><span style="color:#00ff88;font-size:1.1rem;">${currency} ${amount}</span>
      </div>
      <div style="display:flex;justify-content:space-between;border-bottom:1px solid #ffffff11;padding-bottom:8px;margin-bottom:8px;">
        <span style="color:#ffffff66;">Date</span><span>${date}</span>
      </div>
      <div style="display:flex;justify-content:space-between;">
        <span style="color:#ffffff66;">Status</span><span style="color:#00ff88;">✅ ACTIVE</span>
      </div>
    </div>
    <p style="text-align:center;color:#ffffff55;font-size:0.75rem;margin-top:20px;">Your subscription is now active. Enjoy unlimited access to NEXUS movies and music.<br>Thank you for subscribing — JoksonX / One STEM 6</p>
    <div style="text-align:center;margin-top:16px;">
      <a href="${process.env.FRONTEND_URL}" style="background:linear-gradient(135deg,#00f5ff,#ff00ff);color:#000;padding:10px 28px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:0.85rem;">GO TO NEXUS →</a>
    </div>
  </div>`;

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject: `✅ NEXUS Subscription Confirmed — ${receiptNumber}`,
    html
  });
}

module.exports = { sendReceiptEmail };
