# 📧 Email Notification System Setup Guide

## Overview
The email notification system uses **NodeMailer** with Gmail SMTP to send automated emails for:
- ✉️ Welcome emails with credentials
- 🔐 Password reset notifications
- 🏪 Shop activation alerts
- ⚠️ Low stock warnings

---

## 🚀 Quick Setup (Gmail)

### Step 1: Enable Gmail SMTP

1. **Enable 2-Factor Authentication** on your Gmail account:
   - Go to: https://myaccount.google.com/security
   - Enable 2-Step Verification

2. **Generate App Password**:
   - Go to: https://myaccount.google.com/apppasswords
   - Select "Mail" and "Other (Custom name)"
   - Name it "Mr Mobile POS"
   - Click "Generate"
   - Copy the 16-character password (format: `xxxx xxxx xxxx xxxx`)

### Step 2: Configure Environment Variables

Add these variables to your `.env.local` file:

```bash
# Email Configuration
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-16-char-app-password"
SMTP_FROM_NAME="Mr. Mobile POS"
```

### Step 3: Restart Development Server

```bash
npm run dev
```

---

## 🔧 Alternative SMTP Providers

### SendGrid (Recommended for Production)
```bash
SMTP_HOST="smtp.sendgrid.net"
SMTP_PORT="587"
SMTP_USER="apikey"
SMTP_PASSWORD="your-sendgrid-api-key"
```

### Mailgun
```bash
SMTP_HOST="smtp.mailgun.org"
SMTP_PORT="587"
SMTP_USER="postmaster@your-domain.mailgun.org"
SMTP_PASSWORD="your-mailgun-password"
```

### AWS SES (Best for Scale)
```bash
SMTP_HOST="email-smtp.us-east-1.amazonaws.com"
SMTP_PORT="587"
SMTP_USER="your-ses-smtp-username"
SMTP_PASSWORD="your-ses-smtp-password"
```

---

## 📝 Email Templates Available

### 1. Welcome Email
**Trigger**: When a new shop owner or worker is created  
**Includes**: Login credentials, temporary password, getting started guide

### 2. Password Reset Email
**Trigger**: When admin/owner resets a user's password  
**Includes**: New temporary password, security warnings

### 3. Shop Activation Email
**Trigger**: When a new shop is created  
**Includes**: Shop details, code, next steps

### 4. Low Stock Alert
**Trigger**: When product inventory falls below threshold  
**Includes**: List of low-stock products, restock reminder

---

## 🧪 Testing Email System

### Test Email Configuration
```bash
# Run the email verification script
npm run test:email
```

### Manual Test via API
```bash
curl -X POST http://localhost:3001/api/test-email \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'
```

---

## 🔒 Security Best Practices

1. **Never commit `.env.local`** - Already in `.gitignore`
2. **Use App Passwords** - Never use your actual Gmail password
3. **Rotate credentials** - Change passwords every 3-6 months
4. **Monitor usage** - Check Gmail's sent folder regularly
5. **Rate limiting** - Gmail allows ~500 emails/day for free accounts

---

## 📊 Gmail Sending Limits

| Account Type | Daily Limit | Per Second |
|--------------|-------------|------------|
| Free Gmail | 500 emails | 100 recipients |
| Google Workspace | 2,000 emails | 100 recipients |

For higher volumes, consider SendGrid or AWS SES.

---

## 🐛 Troubleshooting

### Error: "Invalid login"
- ✅ Make sure you're using an **App Password**, not your Gmail password
- ✅ Check if 2FA is enabled on your Gmail account
- ✅ Verify the email and password in `.env.local`

### Error: "Connection timeout"
- ✅ Check your internet connection
- ✅ Verify SMTP_HOST and SMTP_PORT are correct
- ✅ Try changing SMTP_PORT to "465" and SMTP_SECURE to "true"

### Emails not received
- ✅ Check spam/junk folder
- ✅ Verify the recipient email is correct
- ✅ Check Gmail's sent folder to confirm sending
- ✅ Wait a few minutes (can take 1-5 minutes)

### "Daily sending limit exceeded"
- Gmail free accounts have 500 email/day limit
- Upgrade to Google Workspace or use SendGrid

---

## 📈 Monitoring

### Check Email Logs
```bash
# Development server logs will show:
✅ Email sent successfully: <message-id>
❌ Failed to send email: <error>
📧 Email System Not Configured (when SMTP not set)
```

### Track Email Delivery
- Gmail: Check "Sent" folder
- SendGrid: Dashboard → Activity
- AWS SES: CloudWatch Metrics

---

## 🚀 Production Deployment

### Recommended Setup for Production:

1. **Use Professional Email Service**
   - SendGrid (99.95% delivery rate)
   - AWS SES (cheapest, $0.10 per 1,000 emails)
   - Mailgun (good for international)

2. **Add Domain Authentication**
   - SPF records
   - DKIM signing
   - DMARC policy

3. **Monitor Deliverability**
   - Bounce rate < 5%
   - Complaint rate < 0.1%
   - Open rate tracking

4. **Implement Queuing**
   - Use Redis or BullMQ for email queue
   - Retry failed emails automatically
   - Rate limit to avoid spam flags

---

## 💡 Pro Tips

1. **Warm up new email domains** - Start with low volume, increase gradually
2. **Personalize emails** - Use recipient's name, business details
3. **Include unsubscribe link** - Legal requirement for commercial emails
4. **A/B test subject lines** - Improve open rates
5. **Keep emails short** - Mobile-friendly, scannable content

---

## 📞 Support

Need help? Contact the development team or refer to:
- NodeMailer Docs: https://nodemailer.com/
- Gmail SMTP Guide: https://support.google.com/mail/answer/7126229
- SendGrid Docs: https://docs.sendgrid.com/

---

**Last Updated**: January 2025  
**Version**: 1.0.0

