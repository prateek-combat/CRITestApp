# Email Notification System

The CRI Test Application includes a comprehensive email notification system that automatically sends detailed reports when candidates complete tests. This system provides real-time notifications with performance analytics and ranking information.

## 🌟 Features

### ✅ **Automated Test Completion Notifications**
- Automatically triggered when candidates complete tests (both invitation-based and public tests)
- Includes candidate information, scores, and completion status
- Professional HTML email templates with responsive design

### 📊 **Detailed Analytics & Ranking**
- **Performance Metrics**: Score, percentage, time taken
- **Comparative Analysis**: Rank among all test takers, percentile calculation
- **Difficulty Assessment**: Automatic difficulty rating based on average performance
- **Strength & Improvement Areas**: Basic performance analysis
- **Test Statistics**: Total attempts, average score, top score

### ⚙️ **Configurable Settings**
- **Per-Test Configuration**: Each test can have independent notification settings
- **Flexible Recipients**: Add/remove email addresses for each test
- **Analytics Toggle**: Choose whether to include detailed analytics
- **Easy Management**: User-friendly interface for managing notification settings

### 🎨 **Professional Email Design**
- Beautiful HTML email templates with modern styling
- Color-coded score badges (green for excellent, yellow for good, red for needs improvement)
- Organized information layout with clear sections
- Mobile-responsive design

## 🚀 Setup & Configuration

### 1. **Environment Variables**

Add the following variables to your `.env` file:

```bash
# Email Configuration for Test Completion Notifications
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
SMTP_FROM="noreply@combatrobotics.in"
```

### 2. **Gmail Setup (Recommended)**

For Gmail accounts:
1. Enable 2-factor authentication
2. Generate an App Password:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate password for "Mail"
   - Use this password in `SMTP_PASS`

### 3. **Database Schema**

The system automatically includes these fields in the Test model:
- `emailNotificationsEnabled`: Boolean flag to enable/disable notifications
- `notificationEmails`: Array of recipient email addresses
- `includeAnalytics`: Boolean flag to include detailed analytics

## 📧 Default Configuration

### **Pre-configured Recipients**
- `prateek@combatrobotics.in`
- `gaurav@combatrobotics.in`

These are set as default recipients for all new tests and can be modified through the admin interface.

### **Default Settings**
- **Notifications**: Enabled by default
- **Analytics**: Included by default
- **Recipients**: Pre-populated with default emails

## 🎯 Usage Guide

### **Managing Email Settings**

1. **Access Settings**:
   - Go to Admin Panel → Tests
   - Click the "Emails" button next to any test
   - This opens the Email Notification Settings modal

2. **Configure Recipients**:
   - View current email recipients
   - Add new email addresses using the input field
   - Remove recipients by clicking the X button
   - Validate email addresses automatically

3. **Toggle Features**:
   - Enable/disable email notifications entirely
   - Include/exclude detailed analytics
   - Preview email content before saving

### **Email Content Structure**

**Subject Line Format**:
```
Test Completion: [Test Title] - [Candidate Name] ([Score]%)
```

**Email Sections**:
1. **Header**: Test title and completion confirmation
2. **Candidate Information**: Name and email
3. **Test Results**: Score badge, time taken, completion status
4. **Performance Analytics** (if enabled):
   - Rank and percentile
   - Test difficulty and statistics
   - Strengths and improvement areas

## 🔧 Technical Details

### **API Endpoints**

#### **Get Notification Settings**
```http
GET /api/tests/[id]/notifications
```

#### **Update Notification Settings**
```http
PUT /api/tests/[id]/notifications
Content-Type: application/json

{
  "emailNotificationsEnabled": true,
  "notificationEmails": ["email1@example.com", "email2@example.com"],
  "includeAnalytics": true
}
```

### **Email Service Architecture**

**Components**:
- `EmailService`: Main service class handling email logic
- `NotificationSettings`: Type definitions for settings
- `TestAnalytics`: Performance calculation and analysis
- `EmailTemplate`: HTML email generation

**Features**:
- **Async Processing**: Email sending doesn't block test submission
- **Error Handling**: Failed emails don't affect test completion
- **Environment Detection**: Development mode uses test SMTP
- **Detailed Logging**: Comprehensive error logging and success tracking

### **Analytics Calculation**

**Ranking Algorithm**:
```typescript
const rank = betterScores.length + 1; // 1-based ranking
const percentile = (worseScores / (totalAttempts - 1)) * 100;
```

**Difficulty Assessment**:
- **Easy**: Average score ≥ 80%
- **Medium**: Average score 50-79%
- **Hard**: Average score < 50%

**Performance Areas** (Basic Implementation):
- **Strengths**: Identified based on score thresholds
- **Improvements**: Areas needing attention based on performance

## 🛠️ Development Mode

### **Testing Emails**

In development mode, the system uses Ethereal Email for testing:
- No real emails are sent
- Emails can be viewed in Ethereal's web interface
- Perfect for testing email templates and functionality

### **Email Preview**

The settings modal includes a preview section showing:
- Email subject format
- Number of recipients
- Content summary (with/without analytics)

## 🚨 Error Handling

### **Graceful Failures**
- Email sending failures don't prevent test completion
- Comprehensive error logging for debugging
- User experience remains unaffected by email issues

### **Validation**
- Email address format validation
- Required field validation
- Duplicate email prevention

## 📈 Monitoring & Logs

### **Success Logging**
```
Test completion notification sent for test [testId] to [count] recipients
```

### **Error Logging**
```
Failed to send test completion email notification: [error details]
Failed to send public test completion email notification: [error details]
```

## 🔮 Future Enhancements

### **Planned Features**
- **Email Templates**: Multiple template options
- **Scheduled Reports**: Weekly/monthly summary emails
- **Custom Analytics**: Advanced performance insights
- **Webhook Integration**: Integration with external systems
- **Email Tracking**: Delivery and open rate tracking
- **Multi-language Support**: Internationalized email content

### **Advanced Analytics Ideas**
- Category-wise performance breakdown
- Time-based performance trends
- Comparative industry benchmarks
- Detailed question-level analysis
- Learning recommendations

## 🔒 Security & Privacy

### **Data Protection**
- Candidate information is only shared with configured recipients
- Email addresses are validated and sanitized
- No sensitive data is logged in plain text

### **Access Control**
- Only admin users can configure email settings
- Role-based access to notification management
- Secure storage of SMTP credentials

## 🆘 Troubleshooting

### **Common Issues**

**No Emails Received**:
1. Check SMTP configuration in environment variables
2. Verify email addresses in notification settings
3. Check spam/junk folders
4. Review server logs for error messages

**Authentication Errors**:
1. Verify SMTP credentials
2. Check if 2FA is enabled for Gmail
3. Ensure App Password is correctly configured
4. Test SMTP connection independently

**Email Content Issues**:
1. Verify test completion is fully processed
2. Check analytics calculation logs
3. Ensure database has sufficient test attempt data
4. Validate email template rendering

### **Debug Steps**
1. Check server logs for email service errors
2. Verify environment variables are loaded
3. Test email settings with a simple test
4. Use development mode with Ethereal Email for testing

## 📞 Support

For issues with the email notification system:
1. Check the troubleshooting section above
2. Review server logs for specific error messages
3. Verify environment configuration
4. Test with a minimal setup to isolate issues

The email notification system is designed to be robust and user-friendly, providing valuable insights to test administrators while maintaining excellent user experience for candidates. 