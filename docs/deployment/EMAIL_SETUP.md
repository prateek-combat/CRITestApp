# Google Workspace Email Integration Setup Guide

## 🚀 **Quick Setup with Google Workspace**

### 1. Create Dedicated Email (Recommended)

1. Go to your Google Admin Console
2. Navigate to "Users" section
3. Create a new user like `testplatform@yourdomain.com` or `noreply@yourdomain.com`
4. This will be your dedicated sending email

### 2. Generate App Password

1. Sign in to the dedicated email account
2. Go to Google Account settings
3. Navigate to "Security" → "2-Step Verification" (enable if not already)
4. Scroll down to "App passwords"
5. Select "Mail" and "Other (custom name)"
6. Enter "Test Platform" as the name
7. Copy the 16-character app password (e.g., `abcd efgh ijkl mnop`)

### 3. Environment Variables

Add these to your `.env.local` file:

```bash
# Google Workspace Configuration
GMAIL_USER=testplatform@yourdomain.com
GMAIL_APP_PASSWORD=abcd efgh ijkl mnop
NEXTAUTH_URL=https://yourdomain.com

# Optional: Test email for configuration testing
TEST_EMAIL=admin@yourdomain.com
```

### 4. Test Configuration

```bash
# Test the email setup
curl -X POST http://localhost:3000/api/test-email
```

---

## 📧 **Email Templates Included**

### ✨ **Invitation Email Features**

- 🎨 **Beautiful HTML Design**: Professional, mobile-responsive templates
- 📋 **Test Information**: Clear test details and instructions
- ⏰ **Expiry Warnings**: Prominent deadline information
- 🎯 **Call-to-Action**: Large, clear "Start Test" button
- 💬 **Custom Messages**: Support for personalized messages
- 📱 **Mobile Optimized**: Looks great on all devices
- 🏢 **Google Workspace Branding**: Clean, professional look

### 🔔 **Reminder Email Types**

- **First Reminder** (⏰): Friendly reminder with helpful tone
- **Second Reminder** (⚠️): More urgent, emphasizes deadline
- **Final Notice** (🚨): Last chance, high urgency styling

---

## 🛠 **API Endpoints**

### Send Single Invitation

```javascript
POST /api/invitations
{
  "email": "candidate@example.com",
  "testId": "test-uuid",
  "sendEmail": true,
  "customMessage": "Good luck with your assessment!"
}
```

### Send Bulk Invitations

```javascript
POST /api/invitations
{
  "emailText": "user1@example.com\nuser2@example.com,user3@example.com",
  "testId": "test-uuid",
  "sendEmail": true,
  "customMessage": "Welcome to our assessment process!"
}
```

### Send Reminders

```javascript
POST /api/invitations/send-reminders
{
  "invitationIds": ["inv1", "inv2"],
  "reminderType": "first",
  "daysBeforeExpiry": 7
}
```

---

## 🎛 **UI Features**

### **Enhanced Invitation Form**

- ✅ Single email input with real-time validation
- ✅ Bulk email textarea (comma or newline separated)
- ✅ Custom message field
- ✅ Email preview functionality
- ✅ Send immediately or save as draft options

### **Bulk Operations**

- ✅ CSV upload for bulk invitations
- ✅ Email validation and error handling
- ✅ Progress tracking for bulk sends
- ✅ Detailed results reporting

### **Email Management**

- ✅ Resend individual invitations
- ✅ Send reminder emails (first, second, final)
- ✅ Email delivery status tracking
- ✅ Google Workspace integration

---

## 🔧 **Google Workspace Setup Details**

### **Why Google Workspace?**

- ✅ **Already Available**: You already have it
- ✅ **No Additional Costs**: Use existing subscription
- ✅ **High Deliverability**: Google's excellent reputation
- ✅ **Unlimited Sending**: No daily limits (within reasonable use)
- ✅ **Professional Appearance**: Emails from your domain
- ✅ **Familiar Interface**: Manage from Gmail/Admin Console

### **App Password Setup**

App passwords are required because:

- More secure than using your main password
- Can be revoked independently
- Designed for applications like this
- Don't expire with password changes

### **Email Limits**

- **Daily**: 2000 emails per day (generous for most use cases)
- **Per minute**: 250 recipients per minute
- **Per message**: 500 recipients per email

---

## 🧪 **Testing Email Configuration**

### Test API Endpoint

```javascript
POST / api / test - email;
```

### Manual Test from Code

```javascript
import { testEmailConfiguration } from '@/lib/email';

const result = await testEmailConfiguration();
if (result.success) {
  console.log('✅ Google Workspace email working!');
} else {
  console.log('❌ Error:', result.error);
}
```

### Check Gmail Sent Items

- Log into the dedicated email account
- Check "Sent" folder to verify emails are being sent
- Check delivery status in Gmail

---

## 📊 **Email Analytics & Tracking**

### **Built-in Tracking**

- ✅ Email delivery status
- ✅ Bounce and error handling
- ✅ Send success/failure rates
- ✅ Invitation response tracking

### **Gmail Integration**

- 📈 View sent emails in Gmail
- 📧 Track delivery status
- 🔍 Search sent invitations
- 📋 Access email history

---

## 🛡 **Security & Best Practices**

### **Security Features**

- ✅ App passwords (not main account password)
- ✅ Email validation and sanitization
- ✅ Dedicated sending account
- ✅ Error handling and logging
- ✅ Gmail's anti-spam protection

### **Best Practices**

- 🎯 Use a dedicated email account (not personal)
- ✅ Set up SPF, DKIM records for your domain
- 📝 Monitor sent items in Gmail
- ⚖️ Comply with email regulations (GDPR, CAN-SPAM)
- 🔐 Regularly rotate app passwords

---

## 🚨 **Troubleshooting**

### **Common Issues**

1. **"Gmail credentials not configured"**

   - Add `GMAIL_USER` and `GMAIL_APP_PASSWORD` to `.env.local`
   - Restart your development server

2. **"Authentication failed"**

   - Check your app password is correct (16 characters, no spaces)
   - Ensure 2-Step Verification is enabled
   - Try generating a new app password

3. **"Invalid login"**

   - Verify the email address is correct
   - Check if the account has Gmail access
   - Ensure account is not suspended

4. **Emails not being delivered**

   - Check spam folder
   - Verify recipient email addresses
   - Check Gmail "Sent" folder to confirm sending

5. **"Less secure app access"**
   - This should NOT be needed with app passwords
   - Use app passwords instead of enabling less secure access

### **Testing Steps**

1. Test API endpoint: `POST /api/test-email`
2. Check Gmail sent folder
3. Verify test email received
4. Send a real invitation to yourself

---

## 💡 **Pro Tips**

1. **Dedicated Account Benefits**

   - Separates business emails from personal
   - Easier to track invitation emails
   - Can have multiple team members access

2. **Monitoring**

   - Check Gmail regularly for bounced emails
   - Monitor delivery reports
   - Set up email forwarding to admin account

3. **Template Customization**

   - Modify templates in `/lib/email.ts`
   - Test changes with preview functionality
   - Keep your company branding consistent

4. **Performance**
   - Google handles 2000 emails/day easily
   - No additional costs beyond existing workspace
   - Excellent delivery rates due to Google's reputation

---

## 🎯 **Next Steps**

1. **Set up the dedicated email account**
2. **Generate app password**
3. **Add environment variables**
4. **Test with the API endpoint**
5. **Send your first invitation!**

Your Google Workspace email integration is now ready for production use!
